from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    appointment_date = Column(Date, nullable=False)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="scheduled"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )