from datetime import datetime, timedelta
import hashlib
import hmac
import sys
from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import func

from pydifact.segmentcollection import Interchange
from pydifact.segments import Segment

from app import app, db, bcrypt, database_initialized
from app.models import Invoice, User, Book, Borrow, Review
from app.schemas import BorrowSchema, BookSchema, InvoiceSchema
from app.constants import PAYMENT_SERVICE_SECRET, PUBLIC_HOSTNAME, PAYMENT_HOSTNAME
from app.utils import *

import requests
        
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()

    if user and bcrypt.check_password_hash(user.password_hash, data.get('password')):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token), 200

    return '', 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email=data.get('email') 

    if not is_valid_username(username) or not is_valid_password(password):
        return jsonify({'invalid_credentials': 'true'}), 400
    
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'already_exist': 'true'}), 400

    user = User(
        username=username, 
        email=email, 
        password_hash=bcrypt.generate_password_hash(data.get('password')).decode('utf-8')
    )
    db.session.add(user)
    db.session.commit()

    return '', 201

@app.route('/books', methods=['GET'])
def get_books():
    query = request.args.get('query')
    author = request.args.get('author')
    isbn = request.args.get('isbn')
    price_from = request.args.get('priceFrom', type=float)
    price_to = request.args.get('priceTo', type=float)
    sort_field = request.args.get('sortField', 'title') 
    sort_order = request.args.get('sortOrder', 'asc')
    is_available = request.args.get('isAvailable', 'false') == 'true'
    
    base_query = Book.query

    if is_available:
        borrows_subquery = db.session.query(
            Borrow.book_id,
            func.count('*').label('num_borrows')
        ).filter_by(returned=False).group_by(Borrow.book_id).subquery()

        base_query = db.session.query(Book).outerjoin(
            borrows_subquery, borrows_subquery.c.book_id == Book.id)
        base_query = base_query.filter(
            (Book.total_copies > borrows_subquery.c.num_borrows) |
            (borrows_subquery.c.num_borrows == None) 
        )

    if query:
        base_query = base_query.filter(Book.title.ilike(f'%{query}%'))
    if author:
        base_query = base_query.filter(Book.author.ilike(f'%{author}%'))
    if isbn:
        base_query = base_query.filter(Book.isbn.ilike(f'%{isbn}%'))
    if price_from is not None:
        base_query = base_query.filter(Book.rental_price >= price_from)
    if price_to is not None:
        base_query = base_query.filter(Book.rental_price <= price_to)

    if sort_order == 'asc':
        base_query = base_query.order_by(getattr(Book, sort_field).asc())
    else:
        base_query = base_query.order_by(getattr(Book, sort_field).desc())

    books = base_query.all()

    book_schema = BookSchema()
    books_data = []
    for book in books:
        book_dict = book_schema.dump(book)
        book_dict['currently_available'] = book.total_copies - book.borrows.filter_by(returned=False).count()
        book_dict['average_rating'] = get_book_average_rating(book.id)
        books_data.append(book_dict)

    return jsonify(books_data)

@app.route('/books/<int:book_id>', methods=['GET'])
def get_book_by_id(book_id):
    book = Book.query.get_or_404(book_id)
    book_schema = BookSchema()
    book_data = book_schema.dump(book)
    book_data['currently_available'] = book.total_copies - book.borrows.filter_by(returned=False).count()
    book_data['average_rating'] = get_book_average_rating(book_id)

    return jsonify(book_data)

@app.route('/borrow/<int:book_id>', methods=['POST'])
@jwt_required()
def borrow_book(book_id):
    book = Book.query.get_or_404(book_id)
    
    overdue_borrows = Borrow.query.filter(Borrow.user_id == get_jwt_identity(), Borrow.returned == False, Borrow.return_by_date < datetime.utcnow()).count()
    if overdue_borrows > 0:
        return '', 403

    if not is_book_available(book):
        return jsonify({'not_available': 'true'}), 400

    existing_borrow = Borrow.query.filter_by(book_id=book_id, user_id=get_jwt_identity(), returned=False).first()

    if existing_borrow:
        return jsonify({'already_borrowed': 'true'}), 400
    
    edifact_message = Interchange("BiblioConnectAPI", "PaymentMock", str(generate_short_numerical_id(get_jwt_identity(), book_id)), ("UNOC", 3))
    
    edifact_message.add_segment(Segment("BGM", ["351", "Borrowing"]))
    edifact_message.add_segment(Segment("DTM", ["137", datetime.utcnow().strftime("%Y%m%d"), "102"]))
    edifact_message.add_segment(Segment("NAD", ["BY", str(get_jwt_identity())]))
    edifact_message.add_segment(Segment("NAD", ["SU", str(book_id)]))
    edifact_message.add_segment(Segment("FTX", ["AAI", "Book Title", book.title]))
    edifact_message.add_segment(Segment("MOA", ["ZZZ", "Amount", str(book.rental_price)]))
    edifact_message.add_segment(Segment("COM", ["Callback URL", f'http://{PUBLIC_HOSTNAME}/update_payment_status']))

    edifact_str = edifact_message.serialize()

    response = requests.post(f'http://{PAYMENT_HOSTNAME}/initiate_payment', data=edifact_str, headers={"Content-Type": "text/plain"})
    
    if response.status_code == 200:
        json_response = response.json()
        edi_response = json_response['edi']

        interchange = Interchange.from_str(edi_response)

        payment_id, payment_url = None, json_response['payment_url']

        for segment in interchange.segments:
            if segment.tag == 'PID':
                payment_id = segment.elements[0][2]
                break

        if not payment_id or not payment_url:
            return '', 400

        borrow = Borrow(
            user_id=get_jwt_identity(),
            book_id=book_id,
            payment_status='pending',
            payment_id=payment_id,
            borrow_date=datetime.utcnow(),
            payment_url=payment_url,
            return_by_date=datetime.utcnow() - timedelta(days=3)
        )

        db.session.add(borrow)
        db.session.commit()

        return jsonify({'payment_url': borrow.payment_url}), 200
    else:
        return '', 400

@app.route('/update_payment_status', methods=['POST'])
def update_payment_status():
    received_signature = request.headers.get('X-Signature')

    expected_signature = hmac.new(PAYMENT_SERVICE_SECRET.encode(), msg=request.data, digestmod=hashlib.sha256).hexdigest()

    if not hmac.compare_digest(received_signature, expected_signature):
        return '', 401

    edifact_message = request.data.decode('utf-8')

    segments = Interchange.from_str(edifact_message).segments

    payment_id = None
    status = None

    for segment in segments:
        if segment.tag == 'PID':
            payment_id = segment.elements[0][2]
        elif segment.tag == 'STS':
            status = segment.elements[0]

    if not payment_id or not status:
        return '', 400

    borrow = Borrow.query.filter_by(payment_id=payment_id).first()
    if borrow:
        borrow.payment_status = status
        if status.lower() != 'success':
            borrow.returned = True
        else:
            existing_invoice = Invoice.query.filter_by(borrow_id=borrow.id).first()
    
            if not existing_invoice:
                invoice = Invoice(
                    borrow_id=borrow.id,
                    payment_date=datetime.utcnow()
                )

                db.session.add(invoice)
        
        db.session.commit()
        return '', 204
    else:
        return '', 404
    
@app.route('/book/status/<int:book_id>', methods=['GET'])
@jwt_required()
def check_book_status(book_id):
    current_user_id = get_jwt_identity()
    Book.query.get_or_404(book_id)
    
    borrows = Borrow.query.filter_by(book_id=book_id, user_id=current_user_id).all()
    overdue_borrows = Borrow.query.filter(Borrow.user_id == get_jwt_identity(), Borrow.returned == False, Borrow.return_by_date < datetime.utcnow()).count()
    if overdue_borrows > 0:
        return '', 403
    
    if not borrows:
        return jsonify({'is_borrowed': False})

    for borrow in borrows:
        if borrow.payment_status == 'pending':
            return jsonify({'borrow_id': borrow.id, 'is_borrowed': True, 'payment_status': 'pending', 'payment_url': borrow.payment_url})
        
        if borrow.payment_status == 'success' and not borrow.returned:
            borrow_date = borrow.borrow_date.strftime('%d.%m.%Y')
            borrow_return_by_date = borrow.return_by_date.strftime('%d.%m.%Y')
            return jsonify({'borrow_id': borrow.id, 'is_borrowed': True, 'payment_status': 'success', 'is_returned': False, 'borrow_date': borrow_date, "return_by_date": borrow_return_by_date})

    return jsonify({'is_borrowed': False})

@app.route('/return/<int:borrow_id>', methods=['POST'])
@jwt_required()
def return_book(borrow_id):
    borrow = Borrow.query.get_or_404(borrow_id)
    if borrow.user_id != get_jwt_identity() or borrow.returned:
        return '', 400

    borrow.returned = True
    borrow.return_date = datetime.utcnow()
    db.session.commit()

    return '', 200

@app.route('/user/info', methods=['GET'])
@jwt_required()
def get_user_info():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    return jsonify({
        'username': user.username,
        'email': user.email
    })

@app.route('/authorize', methods=['GET'])
@jwt_required()
def authorize():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)

    upcoming_returns = Borrow.query.filter(Borrow.user_id == current_user_id, Borrow.returned == False, Borrow.return_by_date >= datetime.utcnow(), Borrow.return_by_date <= datetime.utcnow() + timedelta(days=5)).count()
    overdue_returns = Borrow.query.filter(Borrow.user_id == current_user_id, Borrow.returned == False, Borrow.return_by_date < datetime.utcnow()).count()

    notifications = []
    if upcoming_returns > 0:
        notifications.append({
            "severity": "warning",
            "type": "upcoming_returns",
            "value": upcoming_returns
        })
    if overdue_returns > 0:
        notifications.append({
            "severity": "error",
            "type": "overdue_returns",
            "value": overdue_returns
        })

    return jsonify({
        'username': user.username,
        'notifications': notifications
    })

@app.route('/user/borrows', methods=['GET'])
@jwt_required()
def get_user_borrows():
    current_user_id = get_jwt_identity()
    borrows = Borrow.query.filter_by(user_id=current_user_id).all()
    borrows_data = []

    for borrow in borrows:
        book = Book.query.get(borrow.book_id)
        book_schema = BookSchema()
        book_data = book_schema.dump(book)

        borrows_data.append({
            'borrow_id': borrow.id,
            'book': book_data,
            'payment_status': borrow.payment_status,
            'returned': borrow.returned,
            'borrow_date': borrow.borrow_date,
            'return_by_date': borrow.return_by_date,
            'return_date': borrow.return_date
        })

    return jsonify(borrows_data)

@app.route('/books/<int:book_id>/reviews', methods=['GET'])
def get_book_reviews(book_id):
    reviews = db.session.query(Review, User.username).join(User, Review.user_id == User.id).filter(Review.book_id == book_id).all()
    reviews_data = [{
        'username': username,
        'content': review.content,
        'rating': review.rating
    } for review, username in reviews]

    return jsonify(reviews_data)

@app.route('/books/<int:book_id>/reviews', methods=['POST'])
@jwt_required()
def add_book_review(book_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    content = data.get('content')
    rating = data.get('rating')

    overdue_borrows = Borrow.query.filter(Borrow.user_id == get_jwt_identity(), Borrow.returned == False, Borrow.return_by_date < datetime.utcnow()).count()
    if overdue_borrows > 0:
        return '', 403

    if not content or len(content) < 3 or len(content) > 200:
        return jsonify({'length': 'true'}), 400

    if not rating or rating < 1 or rating > 5:
        return jsonify({'range': 'true'}), 400

    if Review.query.filter_by(user_id=current_user_id, book_id=book_id).first():
        return jsonify({'already_added': 'true'}), 400

    borrow = Borrow.query.filter_by(user_id=current_user_id, book_id=book_id, returned=True).first()
    if not borrow:
        return jsonify({'not_borrowed': 'true'}), 400

    review = Review(user_id=current_user_id, book_id=book_id, content=content, rating=rating)
    db.session.add(review)
    db.session.commit()

    return '', 201

@app.route('/reviews/can_add/<int:book_id>', methods=['GET'])
@jwt_required()
def can_add_review(book_id):
    current_user_id = get_jwt_identity()

    overdue_borrows = Borrow.query.filter(Borrow.user_id == get_jwt_identity(), Borrow.returned == False, Borrow.return_by_date < datetime.utcnow()).count()
    if overdue_borrows > 0:
        return jsonify({'canAddReview': False, 'forbidden': 'true'}), 200
    
    existing_review = Review.query.filter_by(user_id=current_user_id, book_id=book_id).first()
    if existing_review:
        return jsonify({'canAddReview': False, 'already_added': 'true'}), 200

    borrowed_and_returned = Borrow.query.filter_by(user_id=current_user_id, book_id=book_id, returned=True, payment_status='success').first()
    if not borrowed_and_returned:
        return jsonify({'canAddReview': False, 'not_borrowed': 'true'}), 200
    
    return jsonify({'canAddReview': True}), 200

@app.route('/borrow/info/<int:borrow_id>', methods=['GET'])
@jwt_required()
def get_borrow_info(borrow_id):
    current_user_id = get_jwt_identity()
    borrow = Borrow.query.filter_by(id=borrow_id, user_id=current_user_id).first()
    
    if not borrow:
        return '', 404

    borrow_schema = BorrowSchema()
    borrow_data = borrow_schema.dump(borrow)

    return jsonify(borrow_data), 200

@app.route('/invoice/<int:borrow_id>', methods=['GET'])
@jwt_required()
def get_invoice(borrow_id):
    current_user_id = get_jwt_identity()
    
    borrow = Borrow.query.filter_by(id=borrow_id, user_id=current_user_id).first_or_404()
    book = borrow.book
    user = borrow.borrower
    
    existing_invoice = Invoice.query.filter_by(borrow_id=borrow_id).first()
    if not existing_invoice:
        return '', 404

    invoice_schema = InvoiceSchema()
    invoice_data = invoice_schema.dump(existing_invoice)

    invoice_data.update({
        'seller': "BiblioConnect",
        'NIP': "1234567890",
        'user': {
            'username': user.username,
            'email': user.email
        },
        'book': {
            'title': book.title,
            'author': book.author,
        },
        'price': book.rental_price
    })

    return jsonify(invoice_data), 201

@app.before_request
def update_payment_statuses():
    global database_initialized
    if database_initialized:
        pass
    database_initialized = True
    borrows = Borrow.query.all()
    for borrow in borrows:
        edifact_message = Interchange("BiblioConnectAPI", "PaymentMock", str(borrow.payment_id), ("UNOC", 3))
        edifact_message.add_segment(Segment("PID", [str(borrow.payment_id)]))
        edifact_str = edifact_message.serialize()
        response = requests.get(f'http://{PAYMENT_HOSTNAME}/payment_status', data=edifact_str)

        if response.status_code == 200:
            edifact_response = response.text
            segments = Interchange.from_str(edifact_response).segments

            payment_id = None
            status = None

            for segment in segments:
                if segment.tag == 'PID':
                    payment_id = segment.elements[0]
                elif segment.tag == 'STS':
                    status = segment.elements[0]

            if payment_id and status:
                secret = PAYMENT_SERVICE_SECRET
                calculated_signature = hmac.new(secret.encode(), edifact_response.encode(), hashlib.sha256).hexdigest()
                
                request_signature = response.headers["X-Signature"]
                
                if request_signature == calculated_signature:
                    borrow.payment_status = status

    db.session.commit()