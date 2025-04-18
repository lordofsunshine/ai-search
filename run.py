import os
from hypercorn.config import Config
from hypercorn.asyncio import serve
import asyncio
from app import app

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8000))
    config = Config()
    config.bind = [f"0.0.0.0:{port}"]
    print(f"Сервер запущен на http://0.0.0.0:{port}")
    asyncio.run(serve(app, config)) 