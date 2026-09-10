import { useState } from "react";
import type { Appointment } from "../types/appointment";

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onComplete: (id: number) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
}

const STATUS_CONFIG = {
  scheduled: {
    label: "Scheduled",
    badgeBg: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-400 animate-pulse-dot",
    accent: "#f59e0b",
    headerBg: "rgba(255,251,235,0.8)",
  },
  completed: {
    label: "Completed",
    badgeBg: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-400",
    accent: "#10b981",
    headerBg: "rgba(236,253,245,0.8)",
  },
  cancelled: {
    label: "Cancelled",
    badgeBg: "bg-rose-100 text-rose-600 ring-1 ring-rose-200",
    dot: "bg-rose-400",
    accent: "#f43f5e",
    headerBg: "rgba(255,241,242,0.8)",
  },
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function duration(start: string, end: string): string {
  const [sh, sm] = start.slice(0, 5).split(":").map(Number);
  const [eh, em] = end.slice(0, 5).split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function AppointmentCard({
  appointment,
  onEdit,
  onComplete,
  onCancel,
}: AppointmentCardProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState<"complete" | "cancel" | null>(null);

  const cfg = STATUS_CONFIG[appointment.status];
  const isScheduled = appointment.status === "scheduled";
  const isCancelled = appointment.status === "cancelled";
  const dur = duration(appointment.start_time, appointment.end_time);

  async function handleComplete() {
    setBusy("complete");
    try { await onComplete(appointment.id); }
    finally { setBusy(null); }
  }

  async function handleCancelConfirmed() {
    setBusy("cancel");
    setConfirmCancel(false);
    try { await onCancel(appointment.id); }
    finally { setBusy(null); }
  }

  return (
    <div
      className={`group relative bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60
        animate-fade-up
        ${isCancelled ? "opacity-60" : ""}
      `}
    >
      {/* Colored top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ background: cfg.accent }}
      />

      {/* Card header */}
      <div className="px-5 pt-5 pb-4" style={{ background: cfg.headerBg }}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-bold text-slate-800 text-[15px] leading-snug flex-1 ${
              isCancelled ? "line-through text-slate-400" : ""
            }`}
          >
            {appointment.title}
          </h3>

          {/* Status badge */}
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${cfg.badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {appointment.description && (
          <p className={`mt-2 text-sm leading-relaxed ${isCancelled ? "text-slate-400" : "text-slate-500"}`}>
            {appointment.description}
          </p>
        )}
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Date + Time chips */}
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(appointment.appointment_date)}
          </div>

          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
            {dur && <span className="ml-1 text-slate-400">({dur})</span>}
          </div>
        </div>

        {/* Actions — only for scheduled */}
        {isScheduled && (
          <>
            {confirmCancel ? (
              /* Inline confirm strip */
              <div className="mt-1 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span className="flex-1 text-xs font-medium text-rose-700">Cancel this appointment?</span>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={handleCancelConfirmed}
                  disabled={busy === "cancel"}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 transition-colors"
                >
                  {busy === "cancel" ? "…" : "Yes, cancel"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                {/* Edit */}
                <button
                  onClick={() => onEdit(appointment)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>

                {/* Complete */}
                <button
                  onClick={handleComplete}
                  disabled={busy === "complete"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {busy === "complete" ? "Saving…" : "Complete"}
                </button>

                {/* Cancel */}
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 transition-all ml-auto"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
