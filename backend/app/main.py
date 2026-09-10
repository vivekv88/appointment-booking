from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import Base, engine
from app.database import models
from app.routers import appointments


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Appointment Board API"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    appointments.router
)


@app.get("/")
def root():
    return {
        "message": "Appointment Board API"
    }