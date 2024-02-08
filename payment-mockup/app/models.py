from . import db

class Payment(db.Model):
    payment_id = db.Column(db.String, primary_key=True)
    status = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    callback_url = db.Column(db.String(255), nullable=True)
