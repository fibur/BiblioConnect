
import os

PUBLIC_HOSTNAME = os.environ.get('PUBLIC_HOSTNAME', 'backend:5000')
PAYMENT_HOSTNAME = os.environ.get('PAYMENT_HOSTNAME', 'payment-mockup:5000')
PAYMENT_SERVICE_SECRET = os.environ.get('PAYMENT_SERVICE_SECRET', '09acfc5f3afe754c536a82f3ad8bbfd4')