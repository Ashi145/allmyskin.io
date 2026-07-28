import { useState } from "react";
import { Clinic } from "../data";
import { Session } from "../auth";
import { SafeImage } from "./SafeImage";

type BookingPayload = { contact: string; reason: string; preferredDate: string };

export default function ClinicDirectory({ clinics, isGuest, session, onRequireUser, onSubmit }: {
  clinics: Clinic[];
  isGuest: boolean;
  session: Session;
  onRequireUser: () => boolean;
  onSubmit: (clinicId: string, payload: BookingPayload) => void;
}) {
  const [specialty, setSpecialty] = useState<"all" | "Dermatology" | "Cosmetology">("all");
  const [openClinic, setOpenClinic] = useState<Clinic | null>(null);
  const [mode, setMode] = useState<"referral" | "appointment" | null>(null);

  const filtered = clinics.filter(c => specialty === "all" || c.specialty === specialty);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Partner Clinics</span>
      <h1 className="font-display text-[clamp(28px,5vw,40px)] text-[var(--color-primary)] mt-2 mb-4 font-semibold">Find verified dermatology &amp; cosmetology care</h1>
      <p className="text-[14px] text-[var(--color-on-surface-variant)] max-w-2xl mb-8 leading-relaxed">
        These are independent, verified partner clinics — not All My Skin staff. Product guidance on this site is educational and commercial,
        not a medical diagnosis; a clinic visit is the right next step for anything persistent or uncertain.
      </p>

      <div className="flex gap-2 mb-8">
        {(["all", "Dermatology", "Cosmetology"] as const).map(s => (
          <button
            key={s}
            onClick={() => setSpecialty(s)}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold uppercase tracking-widest transition ${specialty === s ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-cream)] text-[var(--color-on-surface-variant)]"}`}
          >
            {s === "all" ? "All specialties" : s}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(clinic => (
          <button key={clinic.id} onClick={() => { setOpenClinic(clinic); setMode(null); }} className="text-left bg-white rounded-3xl soft-shadow border border-[var(--color-outline-variant)]/40 overflow-hidden group">
            <div className="relative aspect-[4/3]">
              <SafeImage src={clinic.image} alt={clinic.name} initials={clinic.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {clinic.verified && (
                <div className="absolute top-3 left-3 bg-[var(--color-primary)] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span> Verified
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-accent-coral)]">{clinic.specialty}</div>
              <h3 className="font-display text-[17px] text-[var(--color-primary)] font-semibold mt-1">{clinic.name}</h3>
              <p className="text-[12.5px] text-[var(--color-on-surface-variant)] mt-1">{clinic.area}</p>
              <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-2">{clinic.hours}</p>
            </div>
          </button>
        ))}
      </div>

      {openClinic && (
        <div className="fixed inset-0 z-[150] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeUp" onClick={() => setOpenClinic(null)}>
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="relative h-40 shrink-0">
              <SafeImage src={openClinic.image} alt={openClinic.name} initials={openClinic.name} className="w-full h-full object-cover" />
              <button onClick={() => setOpenClinic(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-[var(--color-primary)] shadow flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-accent-coral)]">{openClinic.specialty}</div>
              <h2 className="font-display text-[24px] text-[var(--color-primary)] font-semibold mt-1">{openClinic.name}</h2>

              <div className="grid sm:grid-cols-2 gap-3 mt-4 text-[13px]">
                <div className="flex items-start gap-2"><span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">location_on</span><span>{openClinic.address}</span></div>
                <div className="flex items-start gap-2"><span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">schedule</span><span>{openClinic.hours}</span></div>
                <div className="flex items-start gap-2"><span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">language</span><span>{openClinic.languages.join(", ")}</span></div>
                <div className="flex items-start gap-2"><span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">payments</span><span>{openClinic.fee}</span></div>
              </div>

              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-2">Services</div>
                <div className="flex flex-wrap gap-1.5">
                  {openClinic.services.map(s => (
                    <span key={s} className="text-[11px] px-2.5 py-1 bg-[var(--color-primary-container)]/30 text-[var(--color-on-primary-container)] rounded-full">{s}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <a href={`tel:${openClinic.phone.replace(/\s/g, "")}`} className="flex-1 text-center border border-[var(--color-primary)] text-[var(--color-primary)] py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary)] hover:text-white transition">
                  Call clinic
                </a>
                <button
                  onClick={() => { if (!onRequireUser()) return; setMode("referral"); }}
                  className="flex-1 bg-[var(--color-primary)] text-white py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold"
                >
                  Request referral
                </button>
              </div>
              <button
                onClick={() => { if (!onRequireUser()) return; setMode("appointment"); }}
                className="w-full mt-3 border border-[var(--color-outline-variant)] py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold text-[var(--color-primary)]"
              >
                Book an appointment
              </button>

              {mode && !isGuest && (
                <BookingForm
                  key={mode}
                  kind={mode}
                  defaultContact={session.email || session.name}
                  onCancel={() => setMode(null)}
                  onSubmit={(payload) => { onSubmit(openClinic.id, payload); setMode(null); setOpenClinic(null); }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingForm({ kind, defaultContact, onCancel, onSubmit }: {
  kind: "referral" | "appointment";
  defaultContact: string;
  onCancel: () => void;
  onSubmit: (payload: BookingPayload) => void;
}) {
  const [contact, setContact] = useState(defaultContact);
  const [reason, setReason] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [consent, setConsent] = useState(false);

  return (
    <div className="mt-5 bg-[var(--color-surface-cream)] rounded-2xl p-5">
      <h4 className="text-[13px] font-semibold text-[var(--color-primary)] mb-3">
        {kind === "referral" ? "Request a referral" : "Request an appointment"}
      </h4>
      <div className="space-y-2.5">
        <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Best contact (phone or email)" className="w-full rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={kind === "referral" ? "Briefly describe your concern" : "Reason for visit"} rows={2} className="w-full rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
        <input value={preferredDate} onChange={e => setPreferredDate(e.target.value)} type="date" className="w-full rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
        <label className="flex items-start gap-2 text-[11.5px] text-[var(--color-on-surface-variant)]">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
          I consent to sharing the information above with this clinic to request {kind === "referral" ? "a referral" : "an appointment"}. This is a request only — the clinic will confirm by contacting me.
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-semibold border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]">
          Cancel
        </button>
        <button
          disabled={!contact.trim() || !reason.trim() || !preferredDate || !consent}
          onClick={() => onSubmit({ contact: contact.trim(), reason: reason.trim(), preferredDate })}
          className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-semibold bg-[var(--color-primary)] text-white disabled:opacity-40"
        >
          Send request
        </button>
      </div>
    </div>
  );
}
