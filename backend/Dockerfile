FROM python:3.11.4

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY entrypoint.sh entrypoint.sh

RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]

ENV PYTHONUNBUFFERED=1

ENV FLASK_APP=run.py
ENV FLASK_RUN_HOST=0.0.0.0

CMD ["flask", "run"]
