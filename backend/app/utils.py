import hashlib
import re

from datetime import datetime
from sqlalchemy import func

from app import db
from app.models import Review

def get_book_average_rating(book_id):
    avg_rating = db.session.query(func.avg(Review.rating)).filter(Review.book_id == book_id).scalar()
    return round(avg_rating, 2) if avg_rating else 0

def is_book_available(book):
    return book.total_copies > book.borrows.filter_by(returned=False).count()

def is_valid_username(username):
    return len(username) > 0

def is_valid_password(password):
    return bool(re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$', password))

def generate_short_numerical_id(user_id, book_id):
    datetime_now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    
    combined_string = f"{user_id}-{book_id}-{datetime_now}"

    hash_object = hashlib.sha256(combined_string.encode())
    hex_dig = hash_object.hexdigest()
    
    short_id = int(hex_dig[:8], 16)
    
    return short_id