import os
from dotenv import load_dotenv

load_dotenv()

# CRITICAL: Read from the Environment Variable "REDIS_URL"
# If it's missing, default to localhost (which fails on cloud but works locally)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

broker_url = REDIS_URL
result_backend = REDIS_URL

broker_connection_retry_on_startup = True