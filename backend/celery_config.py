import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# 1. Get the URL
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# 2. FIX: Automatically add SSL parameters if using a secure connection
if REDIS_URL.startswith("rediss://") and "ssl_cert_reqs" not in REDIS_URL:
    REDIS_URL += "?ssl_cert_reqs=none"

# 3. Create the Celery App with the fixed URL
celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# 4. Settings
celery_app.conf.update(
    broker_connection_retry_on_startup=True,
    task_track_started=True,
)