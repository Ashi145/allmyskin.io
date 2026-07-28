import { Appointment, AppointmentStatus, Clinic } from "../data";

function statusTone(status: AppointmentStatus): string {
  switch (status) {
    case "confirmed": return "bg-emerald-50 text-emerald-700";
    case "declined": case "cancelled": return "bg-[var(--color-accent-coral)]/10 text-[var(--color-accent-coral)]";
    case "completed": return "bg-[var(--color-primary-container)]/30 text-[var(--color-primary)]";
    case "rescheduled": return "bg-amber-50 text-amber-700";
    default: return "bg-[var(--color-surface-cream)] text-[var(--color-on-surface-variant)]";
  }
}

export default function ClinicPortal({ clinicId, clinics, appointments, setAppointments }: {
  clinicId: string;
  clinics: Clinic[];
  appointments: Appointment[];
  setAppointments: (updater: (prev: Appointment[]) => Appointment[]) => void;
}) {
  const clinic = clinics.find(c => c.id === clinicId);
  const mine = appointments.filter(a => a.clinicId === clinicId).sort((a, b) => b.createdAt - a.createdAt);
  const pending = mine.filter(a => a.status === "requested").length;

  const setStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Private Clinic Portal</span>
      <h1 className="font-display text-[clamp(28px,5vw,40px)] text-[var(--color-primary)] mt-2 mb-1 font-semibold">{clinic?.name || "Clinic"}</h1>
      <p className="text-[13px] text-[var(--color-on-surface-variant)] mb-8">
        {pending > 0 ? `${pending} request${pending !== 1 ? "s" : ""} awaiting your response.` : "You're all caught up — no pending requests."}
      </p>

      {mine.length === 0 ? (
        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-10 text-center">
          <span className="material-symbols-outlined text-[36px] text-[var(--color-primary)]">inbox</span>
          <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-3">No referral or appointment requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mine.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-[var(--color-outline-variant)]/40 soft-shadow p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-[14px] font-semibold text-[var(--color-primary)]">{a.name}</div>
                  <div className="text-[11px] text-[var(--color-on-surface-variant)]">{new Date(a.createdAt).toLocaleString()} · Contact: {a.contact}</div>
                </div>
                <span className={`text-[11px] font-semibold px-3 py-1 rounded-full capitalize ${statusTone(a.status)}`}>{a.status.replace("_", " ")}</span>
              </div>
              <p className="text-[13px] text-[var(--color-on-surface)] mb-1"><span className="text-[var(--color-on-surface-variant)]">Reason: </span>{a.reason}</p>
              <p className="text-[13px] text-[var(--color-on-surface)] mb-4"><span className="text-[var(--color-on-surface-variant)]">Preferred date: </span>{a.preferredDate}</p>

              {a.status === "requested" && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setStatus(a.id, "confirmed")} className="text-[11px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full bg-[var(--color-primary)] text-white">
                    Confirm
                  </button>
                  <button onClick={() => setStatus(a.id, "rescheduled")} className="text-[11px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full border border-[var(--color-outline-variant)] text-[var(--color-primary)]">
                    Propose new time
                  </button>
                  <button onClick={() => setStatus(a.id, "declined")} className="text-[11px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-accent-coral)] hover:text-[var(--color-accent-coral)] transition">
                    Decline
                  </button>
                </div>
              )}
              {a.status === "confirmed" && (
                <button onClick={() => setStatus(a.id, "completed")} className="text-[11px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full border border-[var(--color-outline-variant)] text-[var(--color-primary)]">
                  Mark as completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
