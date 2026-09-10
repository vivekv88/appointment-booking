import type {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentStatus,
} from "../types/appointment";

const API_URL = "http://localhost:8000";


export async function getAppointments(
  date?: string,
  status?: AppointmentStatus
): Promise<Appointment[]> {

  const params = new URLSearchParams();

  if (date) {
    params.append("appointment_date", date);
  }

  if (status) {
    params.append("status", status);
  }

  const response = await fetch(
    `${API_URL}/appointments/?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to fetch appointments"
    );
  }

  return response.json();
}


export async function createAppointment(
  data: AppointmentCreate
): Promise<Appointment> {

  const response = await fetch(
    `${API_URL}/appointments/`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to create appointment"
    );
  }

  return response.json();
}


export async function updateAppointment(
  id: number,
  data: AppointmentUpdate
): Promise<Appointment> {

  const response = await fetch(
    `${API_URL}/appointments/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to update appointment"
    );
  }

  return response.json();
}


export async function completeAppointment(
  id: number
): Promise<Appointment> {

  const response = await fetch(
    `${API_URL}/appointments/${id}/complete`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to complete appointment"
    );
  }

  return response.json();
}


export async function cancelAppointment(
  id: number
): Promise<Appointment> {

  const response = await fetch(
    `${API_URL}/appointments/${id}/cancel`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to cancel appointment"
    );
  }

  return response.json();
}