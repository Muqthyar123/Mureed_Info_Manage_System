from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, SessionLocal, engine
from .routers import auth, exports, mureeds, peers, reports, users
from .seed import seed_database


def create_app() -> FastAPI:
    settings = get_settings()
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)

    app = FastAPI(title="Mureed Information Management System API")
    cors_origins = list(dict.fromkeys(settings.cors_origins + [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8081", "http://127.0.0.1:8081",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:4173", "http://127.0.0.1:4173",
    ]))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?" if not settings.is_production else None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    app.include_router(auth.router, prefix="/api")
    app.include_router(mureeds.router, prefix="/api")
    app.include_router(peers.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(reports.router, prefix="/api")
    app.include_router(exports.router, prefix="/api")
    return app


app = create_app()
