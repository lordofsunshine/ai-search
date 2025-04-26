import os
from hypercorn.config import Config
from hypercorn.asyncio import serve
import asyncio
from app import app

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8080))
    config = Config()
    config.bind = [f"127.0.0.1:{port}"]
    print(f"Сервер запущен на http://127.0.0.1:{port}")
    asyncio.run(serve(app, config)) 