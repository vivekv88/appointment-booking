export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

export interface Appointment {
  id: number;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  title: string;
  description?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
}

export interface AppointmentUpdate {
  title?: string;
  description?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
}