from datetime import date, time, datetime
from typing import Optional

from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None

    appointment_date: date
    start_time: time
    end_time: time


class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

    appointment_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class AppointmentResponse(BaseModel):
    id: int

    title: str
    description: Optional[str]

    appointment_date: date
    start_time: time
    end_time: time

    status: str

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True