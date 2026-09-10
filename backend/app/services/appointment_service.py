from datetime import date, time
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.models import Appointment
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
)


def get_appointments(
    db: Session,
    appointment_date: Optional[date] = None,
    status: Optional[str] = None,
):
    """
    Fetch appointments with optional date and status filters.
    """

    query = db.query(Appointment)

    # Filter by date if provided
    if appointment_date is not None:
        query = query.filter(
            Appointment.appointment_date == appointment_date
        )

    # Filter by status if provided
    if status is not None:
        valid_statuses = {
            "scheduled",
            "completed",
            "cancelled",
        }

        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. "
                    "Use scheduled, completed, or cancelled."
                ),
            )

        query = query.filter(
            Appointment.status == status
        )

    # Sort by date and then start time
    return (
        query
        .order_by(
            Appointment.appointment_date,
            Appointment.start_time
        )
        .all()
    )


def get_appointment_by_id(
    db: Session,
    appointment_id: int,
):
    """
    Get a single appointment by ID.
    """

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id
        )
        .first()
    )

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    return appointment


def check_time_conflict(
    db: Session,
    appointment_date: date,
    start_time: time,
    end_time: time,
    exclude_appointment_id: Optional[int] = None,
):
    """
    Check whether the requested time overlaps
    with an existing appointment.

    Overlap condition:

        existing.start < new.end
        AND
        existing.end > new.start

    Cancelled appointments are ignored.

    exclude_appointment_id is used while editing an
    appointment so that the appointment doesn't
    conflict with itself.
    """

    query = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date == appointment_date,

            # Cancelled appointments don't block the slot
            Appointment.status != "cancelled",

            # Overlap condition
            Appointment.start_time < end_time,
            Appointment.end_time > start_time,
        )
    )

    # When updating, don't compare the appointment
    # against itself.
    if exclude_appointment_id is not None:
        query = query.filter(
            Appointment.id != exclude_appointment_id
        )

    existing_appointment = query.first()

    return existing_appointment


def create_appointment(
    db: Session,
    appointment_data: AppointmentCreate,
):
    """
    Create a new appointment.
    """

    # -----------------------------------
    # 1. Validate time
    # -----------------------------------

    if appointment_data.end_time <= appointment_data.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    # -----------------------------------
    # 2. Check time conflict
    # -----------------------------------

    conflict = check_time_conflict(
        db=db,
        appointment_date=appointment_data.appointment_date,
        start_time=appointment_data.start_time,
        end_time=appointment_data.end_time,
    )

    if conflict is not None:
        raise HTTPException(
            status_code=409,
            detail="This time slot is already booked",
        )

    # -----------------------------------
    # 3. Create appointment
    # -----------------------------------

    new_appointment = Appointment(
        title=appointment_data.title.strip(),
        description=appointment_data.description,
        appointment_date=appointment_data.appointment_date,
        start_time=appointment_data.start_time,
        end_time=appointment_data.end_time,
        status="scheduled",
    )

    # -----------------------------------
    # 4. Save to database
    # -----------------------------------

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment


def update_appointment(
    db: Session,
    appointment_id: int,
    appointment_data: AppointmentUpdate,
):
    """
    Update an existing appointment.
    """

    # -----------------------------------
    # 1. Find appointment
    # -----------------------------------

    appointment = get_appointment_by_id(
        db,
        appointment_id,
    )

    # -----------------------------------
    # 2. Don't allow editing cancelled
    #    appointments
    # -----------------------------------

    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cancelled appointments cannot be edited",
        )

    # -----------------------------------
    # 3. Determine final values
    # -----------------------------------
    #
    # If a field isn't supplied in the PUT
    # request, keep the existing value.

    new_title = (
        appointment_data.title.strip()
        if appointment_data.title is not None
        else appointment.title
    )

    new_description = (
        appointment_data.description
        if appointment_data.description is not None
        else appointment.description
    )

    new_date = (
        appointment_data.appointment_date
        if appointment_data.appointment_date is not None
        else appointment.appointment_date
    )

    new_start_time = (
        appointment_data.start_time
        if appointment_data.start_time is not None
        else appointment.start_time
    )

    new_end_time = (
        appointment_data.end_time
        if appointment_data.end_time is not None
        else appointment.end_time
    )

    # -----------------------------------
    # 4. Validate title
    # -----------------------------------

    if not new_title:
        raise HTTPException(
            status_code=400,
            detail="Title cannot be empty",
        )

    # -----------------------------------
    # 5. Validate time
    # -----------------------------------

    if new_end_time <= new_start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    # -----------------------------------
    # 6. Check time conflict
    # -----------------------------------

    conflict = check_time_conflict(
        db=db,
        appointment_date=new_date,
        start_time=new_start_time,
        end_time=new_end_time,
        exclude_appointment_id=appointment_id,
    )

    if conflict is not None:
        raise HTTPException(
            status_code=409,
            detail="This time slot is already booked",
        )

    # -----------------------------------
    # 7. Update appointment
    # -----------------------------------

    appointment.title = new_title
    appointment.description = new_description
    appointment.appointment_date = new_date
    appointment.start_time = new_start_time
    appointment.end_time = new_end_time

    # -----------------------------------
    # 8. Save changes
    # -----------------------------------

    db.commit()
    db.refresh(appointment)

    return appointment


def complete_appointment(
    db: Session,
    appointment_id: int,
):
    """
    Mark an appointment as completed.
    """

    appointment = get_appointment_by_id(
        db,
        appointment_id,
    )

    # A cancelled appointment shouldn't become completed
    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cancelled appointment cannot be completed",
        )

    # Already completed
    if appointment.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Appointment is already completed",
        )

    appointment.status = "completed"

    db.commit()
    db.refresh(appointment)

    return appointment


def cancel_appointment(
    db: Session,
    appointment_id: int,
):
    """
    Cancel an appointment.

    The appointment is NOT deleted from the database.
    Its status is changed to cancelled.
    """

    appointment = get_appointment_by_id(
        db,
        appointment_id,
    )

    # Already cancelled
    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Appointment is already cancelled",
        )

    appointment.status = "cancelled"

    db.commit()
    db.refresh(appointment)

    return appointment