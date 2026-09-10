import { useEffect, useRef, useState } from "react";
import type { Appointment, AppointmentCreate, AppointmentUpdate } from "../types/appointment";

interface AppointmentModalProps {
  mode: "add" | "edit";
  appointment?: Appointment;
  onClose: () => void;
  onSubmit: (data: AppointmentCreate | AppointmentUpdate) => Promise<void>;
}

interface FormState {
  title: string;
  description: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  appointment_date: "",
  start_time: "",
  end_time: "",
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none transition-all duration-150
    ${hasError
      ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/50 placeholder-rose-300"
      : "border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300"
    }`;
}

export default function AppointmentModal({
  mode,
  appointment,
  onClose,
  onSubmit,
}: AppointmentModalProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === "edit" && appointment) {
      return {
        title: appointment.title,
        description: appointment.description ?? "",
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time.slice(0, 5),
        end_time: appointment.end_time.slice(0, 5),
      };
    }
    return EMPTY_FORM;
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.title.trim())        e.title            = "Title is required.";
    if (!form.appointment_date)    e.appointment_date  = "Date is required.";
    if (!form.start_time)          e.start_time        = "Start time is required.";
    if (!form.end_time)            e.end_time          = "End time is required.";
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
                                   e.end_time          = "End time must be after start time.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        appointment_date: form.appointment_date,
        start_time: form.start_time,
        end_time: form.end_time,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function field(key: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
    if (submitError) setSubmitError("");
  }

  const isEdit = mode === "edit";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div className="animate-modal-in bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-slate-200/60">

        {/* ── Gradient header strip ── */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ background: isEdit
            ? "linear-gradient(135deg, #f5f3ff, #eef2ff)"
            : "linear-gradient(135deg, #eef2ff, #eff6ff)"
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Icon orb */}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isEdit ? "bg-violet-500" : "bg-indigo-500"
              }`}>
                {isEdit ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {isEdit ? "Edit Appointment" : "New Appointment"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEdit ? "Update the appointment details below." : "Schedule a new appointment for your team."}
                </p>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-all"
              aria-label="Close"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <FieldLabel required>Title</FieldLabel>
            <input
              ref={firstInputRef}
              type="text"
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
              placeholder="e.g. Team standup, Client review…"
              className={inputClass(!!errors.title)}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              placeholder="Optional agenda, notes or context…"
              rows={3}
              className="w-full rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none resize-none transition-all duration-150"
            />
          </div>

          {/* Date */}
          <div>
            <FieldLabel required>Date</FieldLabel>
            <input
              type="date"
              value={form.appointment_date}
              onChange={(e) => field("appointment_date", e.target.value)}
              className={inputClass(!!errors.appointment_date)}
            />
            {errors.appointment_date && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.appointment_date}
              </p>
            )}
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Start Time</FieldLabel>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => field("start_time", e.target.value)}
                className={inputClass(!!errors.start_time)}
              />
              {errors.start_time && (
                <p className="mt-1.5 text-xs text-rose-500">{errors.start_time}</p>
              )}
            </div>
            <div>
              <FieldLabel required>End Time</FieldLabel>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => field("end_time", e.target.value)}
                className={inputClass(!!errors.end_time)}
              />
              {errors.end_time && (
                <p className="mt-1.5 text-xs text-rose-500">{errors.end_time}</p>
              )}
            </div>
          </div>

          {/* API error banner */}
          {submitError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-2.5 text-sm text-rose-700">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {submitError}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all
                ${isEdit
                  ? "bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 shadow-violet-200"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-200"
                }
                disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-md`}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isEdit ? "Saving…" : "Adding…"}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Appointment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
