#!/bin/bash

# 1. Start Celery Worker in the background (using gevent for free tier compatibility)
celery -A worker.celery_app worker --loglevel=info --pool=gevent --concurrency=4 &

# 2. Start FastAPI Server
uvicorn main:app --host 0.0.0.0 --port 10000