import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Appointment,
  AppointmentCreate,
  AppointmentStatus,
  AppointmentUpdate,
} from "../types/appointment";
import {
  cancelAppointment,
  completeAppointment,
  createAppointment,
  getAppointments,
  updateAppointment,
} from "../services/appointmentApi";
import AppointmentCard from "./AppointmentCard";
import AppointmentModal from "./AppointmentModal";
import Toast, { type ToastMessage } from "./Toast";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
      <div className="skeleton h-1 w-full" />
      <div className="px-5 pt-5 pb-4 bg-slate-50">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="skeleton h-4 rounded-lg w-2/5" />
          <div className="skeleton h-6 rounded-full w-24" />
        </div>
        <div className="skeleton h-3 rounded w-3/4 mb-2" />
        <div className="skeleton h-3 rounded w-1/2" />
      </div>
      <div className="px-5 py-4">
        <div className="flex gap-2 mb-3">
          <div className="skeleton h-7 rounded-lg w-36" />
          <div className="skeleton h-7 rounded-lg w-28" />
        </div>
        <div className="skeleton h-px w-full mb-3" />
        <div className="flex gap-2">
          <div className="skeleton h-7 rounded-lg w-16" />
          <div className="skeleton h-7 rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({
  filtered,
  onAdd,
}: {
  filtered: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-24 text-center px-6 animate-fade-up">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center shadow-inner">
          <svg
            className="w-12 h-12 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        {!filtered && (
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-slate-800 font-bold text-xl mb-2">
        {filtered ? "No appointments match" : "Your board is empty"}
      </h3>
      <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-6">
        {filtered
          ? "Try adjusting or clearing your filters to see more appointments."
          : "Get started by adding your first appointment. It only takes a few seconds."}
      </p>
      {!filtered && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:shadow-lg hover:-translate-y-px active:translate-y-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add First Appointment
        </button>
      )}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  count,
  label,
  active,
  onClick,
  colorClasses,
  icon,
}: {
  count: number;
  label: string;
  active: boolean;
  onClick: () => void;
  colorClasses: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start gap-1 rounded-2xl px-5 py-4 border text-left transition-all duration-200 group
        ${colorClasses}
        ${active
          ? "ring-2 ring-offset-2 shadow-md scale-[1.02]"
          : "hover:shadow-md hover:-translate-y-0.5"
        }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-3xl font-black tracking-tight">{count}</span>
        <span className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center">
          {icon}
        </span>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</span>
      {active && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current opacity-60 animate-pulse-dot" />
      )}
    </button>
  );
}

// ─── Main Board ──────────────────────────────────────────────────────────────
export default function AppointmentBoard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Appointment | undefined>();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastId = useRef(0);

  function addToast(type: ToastMessage["type"], message: string) {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAppointments(
        selectedDate || undefined,
        status || undefined
      );
      setAppointments(data);
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to load appointments."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, status]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function handleAdd(data: AppointmentCreate | AppointmentUpdate) {
    await createAppointment(data as AppointmentCreate);
    addToast("success", "Appointment added successfully.");
    await loadAppointments();
  }

  async function handleEdit(data: AppointmentCreate | AppointmentUpdate) {
    if (!editTarget) return;
    await updateAppointment(editTarget.id, data as AppointmentUpdate);
    addToast("success", "Appointment updated.");
    await loadAppointments();
  }

  async function handleComplete(id: number) {
    try {
      await completeAppointment(id);
      addToast("success", "Appointment marked as completed! ✓");
      await loadAppointments();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Could not complete appointment.");
    }
  }

  async function handleCancel(id: number) {
    try {
      await cancelAppointment(id);
      addToast("success", "Appointment cancelled.");
      await loadAppointments();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Could not cancel appointment.");
    }
  }

  function openEdit(appointment: Appointment) {
    setEditTarget(appointment);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(undefined);
  }

  const isFiltered = !!(selectedDate || status);
  const counts = appointments.reduce(
    (acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  const statConfig = [
    {
      key: "scheduled" as const,
      label: "Scheduled",
      color: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-400",
      icon: (
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "completed" as const,
      label: "Completed",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-400",
      icon: (
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "cancelled" as const,
      label: "Cancelled",
      color: "bg-rose-50 text-rose-600 border-rose-200 ring-rose-400",
      icon: (
        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)" }}>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ══ Header ════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-white/60 shadow-sm" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[15px] font-bold text-slate-900 leading-none">Appointment Board</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Team scheduling made simple</p>
            </div>
            <h1 className="sm:hidden text-[15px] font-bold text-slate-900">Appointments</h1>
          </div>

          {/* Add button */}
          <button
            onClick={() => setModalMode("add")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold
              hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-200/70
              hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-px active:translate-y-0
              transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Appointment</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ══ Stats ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statConfig.map(({ key, label, color, icon }) => (
            <StatCard
              key={key}
              count={counts[key] ?? 0}
              label={label}
              active={status === key}
              onClick={() => setStatus(status === key ? "" : key)}
              colorClasses={color}
              icon={icon}
            />
          ))}
        </div>

        {/* ══ Filters ══════════════════════════════════════════════ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm px-4 sm:px-5 py-3.5 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2 shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter
          </div>

          <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 outline-none hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus | "")}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 outline-none hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
              >
                <option value="">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {isFiltered && (
              <button
                onClick={() => { setSelectedDate(""); setStatus(""); }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ══ Result count ════════════════════════════════════════ */}
        {!loading && appointments.length > 0 && (
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">
            {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
            {isFiltered ? " matching filters" : " total"}
          </p>
        )}

        {/* ══ Content ═════════════════════════════════════════════ */}
        <div className="grid gap-4 sm:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : appointments.length === 0 ? (
            <EmptyState filtered={isFiltered} onAdd={() => setModalMode("add")} />
          ) : (
            appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onEdit={openEdit}
                onComplete={handleComplete}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      </main>

      {/* ══ Footer ══════════════════════════════════════════════ */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 mt-4">
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>Appointment Board — small team scheduling tool</p>
          <p>Time-slot conflicts are prevented automatically by the server.</p>
        </div>
      </footer>

      {/* ══ Modals ══════════════════════════════════════════════ */}
      {modalMode === "add" && (
        <AppointmentModal mode="add" onClose={closeModal} onSubmit={handleAdd} />
      )}
      {modalMode === "edit" && editTarget && (
        <AppointmentModal
          mode="edit"
          appointment={editTarget}
          onClose={closeModal}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
