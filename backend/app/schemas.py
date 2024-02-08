from app.models import Book, Borrow, Invoice
from app import ma

class BookSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Book
        include_fk = True

class BorrowSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Borrow
        include_fk = True
        
class InvoiceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Invoice
        include_fk = True