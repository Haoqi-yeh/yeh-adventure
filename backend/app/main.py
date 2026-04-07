from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import game
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="PADNE - Pixel-Art Dynamic Narrative Engine",
    description="文字冒險遊戲引擎 API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "PADNE v0.1"}
