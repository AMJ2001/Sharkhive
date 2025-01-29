FROM python:3.12.8-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver_plus", "0.0.0.0:8000", "--cert-file=./localhost.pem", "--key-file=./localhost-key.pem"]