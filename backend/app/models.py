from flask_login import UserMixin
from app import db
from sqlalchemy.schema import CheckConstraint

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    borrows = db.relationship('Borrow', backref='borrower', lazy='dynamic')
    is_active = db.Column(db.Boolean, default=True)  

    def __repr__(self):
        return f'<User {self.username}>'

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    author = db.Column(db.String(100))
    isbn = db.Column(db.String(13), unique=True)
    total_copies = db.Column(db.Integer, default=1)  
    rental_price = db.Column(db.Float, default=0.0)  
    borrows = db.relationship('Borrow', backref='book', lazy='dynamic')
    cover_source = db.Column(db.Text, default='')

    def __repr__(self):
        return f'<Book {self.title}>'

class Borrow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'))
    borrow_date = db.Column(db.DateTime)
    return_date = db.Column(db.DateTime)
    returned = db.Column(db.Boolean, default=False)
    payment_status = db.Column(db.String(50), default='pending')
    payment_id = db.Column(db.String)
    payment_url = db.Column(db.String)
    return_by_date = db.Column(db.DateTime)

    def __repr__(self):
        return f'<Borrow {self.id} {self.user_id}>'
    
class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    borrow_id = db.Column(db.Integer, db.ForeignKey('borrow.id'))
    payment_date = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<Invoice {self.id} {self.payment_date} {self.borrow_id}>'
    
class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    content = db.Column(db.Text)
    rating = db.Column(db.Integer)  
    timestamp = db.Column(db.DateTime, index=True)

    def __repr__(self):
        return f'<Review {self.content[:20]}... by {self.author.username} for {self.book.title}>'

    __table_args__ = (
        db.UniqueConstraint('book_id', 'user_id', name='unique_review'),
        CheckConstraint('rating >= 1 AND rating <= 5', name='rating_range')
    )