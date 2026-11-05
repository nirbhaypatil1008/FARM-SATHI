import os
from pathlib import Path

os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
if os.name == "nt" and "CUDA_VISIBLE_DEVICES" not in os.environ:
    os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import uvicorn
from dotenv import load_dotenv

SERVICE_DIRECTORY = Path(__file__).resolve().parent
load_dotenv(SERVICE_DIRECTORY / ".env")

host = os.getenv("HOST", "127.0.0.1")
try:
    port = int(os.getenv("PORT", "8000"))
except ValueError as error:
    raise ValueError("PORT must be an integer between 1 and 65535.") from error
if not 1 <= port <= 65535:
    raise ValueError("PORT must be an integer between 1 and 65535.")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=host, port=port)
