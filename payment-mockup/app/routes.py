from datetime import datetime
import json
import sys
from threading import Timer
from flask import Blueprint, Response, request, jsonify, render_template, url_for, redirect, current_app
from . import db
from .models import Payment
from app import PUBLIC_HOSTNAME, PAYMENT_SERVICE_SECRET
import hmac
import hashlib

import uuid
import requests
from pydifact.segments import Segment
from pydifact.segmentcollection import Interchange

main = Blueprint('main', __name__)

@main.route('/initiate_payment', methods=['POST'])
def initiate_payment():
    edifact_message = request.data.decode('utf-8')

    segments = Interchange.from_str(edifact_message).segments

    amount = None
    callback_url = None
    title = None
    
    for segment in segments:
        if segment.tag == 'FTX' and segment.elements[0][0] == 'AAI':
            title = segment.elements[0][2]
        elif segment.tag == 'MOA' and segment.elements[0][0] == 'ZZZ':
            amount = segment.elements[0][2]
        elif segment.tag == 'COM' and segment.elements[0][0] == 'Callback URL':
            callback_url = segment.elements[0][1]

    if not title or not amount or not callback_url:
        return jsonify({'message': 'Missing required information in EDIFACT message ' + edifact_message}), 400
    
    new_payment = Payment(
        payment_id=str(uuid.uuid4()),
        status='pending',
        amount=amount, 
        title=title,
        callback_url=callback_url 
    )
    db.session.add(new_payment)
    db.session.commit()

    payment_url = "http://" + url_for('main.payment_page', payment_id=new_payment.payment_id, _external=True).replace(request.host_url, f'{PUBLIC_HOSTNAME}/')
    app = current_app._get_current_object()
    Timer(600, cancel_payment, args=[new_payment.payment_id, app]).start()

    response_interchange = Interchange("PaymentMock", "Service", str(generate_short_numerical_id(new_payment.payment_id)), ("UNOC", 3))

    response_interchange.add_segment(Segment("FTX", ["AAI", "", title]))
    response_interchange.add_segment(Segment("MOA", ["ZZZ", "", amount]))
    response_interchange.add_segment(Segment("PID", ["", "", new_payment.payment_id]))
    response_interchange.add_segment(Segment("UNT", ["4", "1"]))

    response_edifact = response_interchange.serialize()

    return jsonify({'edi': response_edifact, 'payment_url': payment_url})

@main.route('/payment_page/<string:payment_id>')
def payment_page(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    
    return render_template('payment_page.html', payment_id=payment.payment_id, book_title=payment.title, amount=payment.amount, status=payment.status)

def generate_short_numerical_id(payment_id):
    datetime_now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    
    combined_string = f"{payment_id}-{datetime_now}"

    hash_object = hashlib.sha256(combined_string.encode())
    hex_dig = hash_object.hexdigest()
    
    short_id = int(hex_dig[:8], 16)
    
    return short_id

@main.route('/process_payment/<string:payment_id>', methods=['POST'])
def process_payment(payment_id):
    action = request.form.get('action')
    payment = Payment.query.get_or_404(payment_id)

    if action == 'pay':
        payment.status = 'success'
    else:
        payment.status = 'canceled'
    
    db.session.commit()

    if payment.callback_url:
        edifact_message = Interchange("PaymentMock", "Service", str(generate_short_numerical_id(payment_id)), ("UNOC", 3))
        edifact_message.add_segment(Segment("BGM", ["353", "Payment Status"]))
        edifact_message.add_segment(Segment("DTM", ["137", datetime.utcnow().strftime("%Y%m%d"), "102"]))
        edifact_message.add_segment(Segment("STS", [payment.status]))
        edifact_message.add_segment(Segment("PID", ["", "", payment.payment_id]))

        edifact_str = edifact_message.serialize()
        
        secret = PAYMENT_SERVICE_SECRET
        signature = hmac.new(secret.encode(), edifact_str.encode(), hashlib.sha256).hexdigest()
        
        requests.post(payment.callback_url, data=edifact_str, headers={"Content-Type": "text/plain", "X-Signature": signature})

    return redirect(url_for('main.payment_result', payment_id=payment.payment_id))

@main.route('/payment_result/<string:payment_id>')
def payment_result(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    
    return render_template('payment_result.html', status=payment.status)

def cancel_payment(payment_id, app):
    with app.app_context():
        payment = Payment.query.get(payment_id)
        if payment and payment.status == 'pending':
            payment.status = 'canceled'
            db.session.commit()
            if payment.callback_url:
                payload = {'payment_id': payment_id, 'status': 'canceled'}
                secret = PAYMENT_SERVICE_SECRET
                signature = hmac.new(secret.encode(), json.dumps(payload).encode(), hashlib.sha256).hexdigest()
                headers = {'X-Signature': signature}
                requests.post(payment.callback_url, json=payload, headers=headers)
                
@main.route('/payment_status', methods=['GET'])
def receive_edi():
    edifact_message = request.data.decode('utf-8')
    segments = Interchange.from_str(edifact_message).segments

    payment_id = None

    for segment in segments:
        if segment.tag == 'PID':
            payment_id = segment.elements[0]

    if payment_id:
        payment = Payment.query.get(payment_id)
        
        edifact_message = Interchange("PaymentMock", "Service", str(generate_short_numerical_id(payment_id)), ("UNOC", 3))
        edifact_message.add_segment(Segment("BGM", ["353", "Payment Status"]))
        edifact_message.add_segment(Segment("DTM", ["137", datetime.utcnow().strftime("%Y%m%d"), "102"]))
        edifact_message.add_segment(Segment("STS", [payment.status]))
        edifact_message.add_segment(Segment("PID", ["", "", payment.payment_id]))

        secret = PAYMENT_SERVICE_SECRET
        edifact_str = edifact_message.serialize()
        signature = hmac.new(secret.encode(), edifact_str.encode(), hashlib.sha256).hexdigest()

        resp = Response(edifact_str, 200)
        resp.headers['X-Signature'] = signature
        
        return resp
    else:
        return '', 400