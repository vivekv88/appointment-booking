from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)

from app.services.appointment_service import (
    get_appointments,
    get_appointment_by_id,
    create_appointment,
    update_appointment,
    complete_appointment,
    cancel_appointment,
)


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


# =========================================================
# GET ALL APPOINTMENTS
# =========================================================

@router.get(
    "/",
    response_model=list[AppointmentResponse],
)
def get_all_appointments(
    appointment_date: Optional[date] = Query(
        default=None,
        description="Filter appointments by date",
    ),

    status: Optional[str] = Query(
        default=None,
        description="Filter by status",
    ),

    db: Session = Depends(get_db),
):
    """
    Get all appointments.

    Optional filters:

        GET /appointments

        GET /appointments?appointment_date=2026-09-10

        GET /appointments?status=scheduled

        GET /appointments?
            appointment_date=2026-09-10&
            status=scheduled
    """

    return get_appointments(
        db=db,
        appointment_date=appointment_date,
        status=status,
    )


# =========================================================
# GET APPOINTMENT BY ID
# =========================================================

@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_single_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a single appointment.
    """

    return get_appointment_by_id(
        db=db,
        appointment_id=appointment_id,
    )


# =========================================================
# CREATE APPOINTMENT
# =========================================================

@router.post(
    "/",
    response_model=AppointmentResponse,
    status_code=201,
)
def create_new_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new appointment.

    Example request:

    POST /appointments

    {
        "title": "Team Meeting",
        "description": "Discuss project progress",
        "appointment_date": "2026-09-10",
        "start_time": "10:00",
        "end_time": "11:00"
    }
    """

    return create_appointment(
        db=db,
        appointment_data=appointment,
    )


# =========================================================
# UPDATE APPOINTMENT
# =========================================================

@router.put(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def update_existing_appointment(
    appointment_id: int,

    appointment: AppointmentUpdate,

    db: Session = Depends(get_db),
):
    """
    Update an existing appointment.

    Example:

    PUT /appointments/1

    {
        "title": "Updated Meeting",
        "description": "Updated description",
        "appointment_date": "2026-09-10",
        "start_time": "14:00",
        "end_time": "15:00"
    }
    """

    return update_appointment(
        db=db,
        appointment_id=appointment_id,
        appointment_data=appointment,
    )


# =========================================================
# COMPLETE APPOINTMENT
# =========================================================

@router.patch(
    "/{appointment_id}/complete",
    response_model=AppointmentResponse,
)
def mark_appointment_completed(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    """
    Mark appointment as completed.
    """

    return complete_appointment(
        db=db,
        appointment_id=appointment_id,
    )


# =========================================================
# CANCEL APPOINTMENT
# =========================================================

@router.patch(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
)
def mark_appointment_cancelled(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    """
    Cancel an appointment.

    The appointment remains in the database.
    """

    return cancel_appointment(
        db=db,
        appointment_id=appointment_id,
    )