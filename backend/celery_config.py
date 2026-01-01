import os
from celery import Celery  # <--- This was missing
from dotenv import load_dotenv

load_dotenv()

# 1. Get the Redis URL from Render (or localhost if testing)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# 2. Create the Celery App (This is what was missing!)
celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# 3. precise settings
celery_app.conf.update(
    broker_connection_retry_on_startup=True,
    task_track_started=True,
)