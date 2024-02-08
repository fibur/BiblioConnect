from app import app, db
from app.models import Book, Borrow, User, Review, Invoice
import requests

def get_book_info(isbn):
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    response = requests.get(url)
    data = response.json()
    
    if 'items' in data:
        book_info = data['items'][0]['volumeInfo']
        cover_link = book_info['imageLinks']['thumbnail'] if 'imageLinks' in book_info else 'Cover image not available'
        
        return cover_link
    return None

def seed_database():
    
    with app.app_context():
        Invoice.query.delete()
        Review.query.delete()
        Borrow.query.delete()
        Book.query.delete()
        User.query.delete()

        db.session.commit()

        books_data = [
            {'title': 'Harry Potter and the Philosopher\'s Stone', 'author': 'J.K. Rowling', 'isbn': '9780590353427',
            'total_copies': 1, 'rental_price': 10.99},
            {'title': 'To Kill a Mockingbird', 'author': 'Harper Lee', 'isbn': '9780061120084',
            'total_copies': 3, 'rental_price': 8.99},
            {'title': '1984', 'author': 'George Orwell', 'isbn': '9780451524935',
            'total_copies': 7, 'rental_price': 12.99},
            {'title': 'The Great Gatsby', 'author': 'F. Scott Fitzgerald', 'isbn': '9780743273565',
            'total_copies': 4, 'rental_price': 9.99},
            {'title': 'Pride and Prejudice', 'author': 'Jane Austen', 'isbn': '9780141439518',
            'total_copies': 6, 'rental_price': 11.99},
            {'title': 'The Catcher in the Rye', 'author': 'J.D. Salinger', 'isbn': '9780316769488',
            'total_copies': 2, 'rental_price': 7.99},
            {'title': 'To the Lighthouse', 'author': 'Virginia Woolf', 'isbn': '9780156907392',
            'total_copies': 8, 'rental_price': 13.99},
            {'title': 'Moby-Dick', 'author': 'Herman Melville', 'isbn': '9780142000083',
            'total_copies': 5, 'rental_price': 10.99},
            {'title': 'Brave New World', 'author': 'Aldous Huxley', 'isbn': '9780060850524',
            'total_copies': 3, 'rental_price': 8.99},
            {'title': 'The Hobbit', 'author': 'J.R.R. Tolkien', 'isbn': '9780618260300',
            'total_copies': 4, 'rental_price': 9.99}
        ]

        for book_data in books_data:
            book = Book.query.filter_by(isbn=book_data['isbn']).first()
            if not book:
                book_cover_src = get_book_info(book_data['isbn'])
                if book_cover_src is None:
                    book_cover_src = ''

                book = Book(title=book_data['title'], author=book_data['author'], isbn=book_data['isbn'], total_copies=book_data['total_copies'], rental_price=book_data['rental_price'], cover_source=book_cover_src)
                db.session.add(book)

        
        db.session.commit()

if __name__ == '__main__':
    seed_database()
