"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInstallerProfileAction, requestTimeOffAction } from "@/app/actions/installer";
import { CANADIAN_TIMEZONES } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface TimeOffRequest {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  status: string;
}

interface WorkingHours {
  workStart: string;
  workEnd: string;
  lunchStart: string;
  lunchEnd: string;
}

interface Props {
  name: string;
  phone: string;
  bio: string;
  timezone: string;
  skills: string[];
  timeOffRequests: TimeOffRequest[];
  workingHours: WorkingHours | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:  "text-amber-600 bg-amber-50 border-amber-200",
  approved: "text-green-700 bg-green-50 border-green-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
};

export default function ProfileForm({
  name, phone, bio, timezone, skills, timeOffRequests, workingHours,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formPhone, setFormPhone] = useState(phone);
  const [formBio, setFormBio] = useState(bio);
  const [formTimezone, setFormTimezone] = useState(timezone);
  const [profileMsg, setProfileMsg] = useState("");

  // Working hours
  const [workStart,  setWorkStart]  = useState(workingHours?.workStart  ?? "09:00");
  const [workEnd,    setWorkEnd]    = useState(workingHours?.workEnd    ?? "17:00");
  const [lunchStart, setLunchStart] = useState(workingHours?.lunchStart ?? "12:00");
  const [lunchEnd,   setLunchEnd]   = useState(workingHours?.lunchEnd   ?? "13:00");

  // Time off state
  const [toStart,  setToStart]  = useState("");
  const [toEnd,    setToEnd]    = useState("");
  const [toReason, setToReason] = useState("");
  const [toMsg,    setToMsg]    = useState("");
  const [toError,  setToError]  = useState("");
  const [toLoading, startToTransition] = useTransition();

  function handleProfileSave() {
    setProfileMsg("");
    startTransition(async () => {
      const res = await updateInstallerProfileAction(
        formBio, formPhone, formTimezone,
        { workStart, workEnd, lunchStart, lunchEnd },
      );
      setProfileMsg(res.ok ? "Profile saved" : (res.error ?? "Error"));
      if (res.ok) setTimeout(() => setProfileMsg(""), 2500);
    });
  }

  function handleTimeOffRequest() {
    setToError("");
    setToMsg("");
    if (!toStart || !toEnd) { setToError("Please select start and end dates"); return; }
    if (toEnd < toStart) { setToError("End date must be after start date"); return; }
    startToTransition(async () => {
      const res = await requestTimeOffAction(toStart, toEnd, toReason);
      if (res.ok) {
        setToMsg("Request submitted — pending admin approval");
        setToStart(""); setToEnd(""); setToReason("");
        router.refresh();
      } else {
        setToError(res.error ?? "Error");
      }
    });
  }

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

  const inputCls = "w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30";

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">

      {/* ── Profile card ──────────────────────────────────────────── */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-base text-[var(--color-text)]">Profile</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input value={name} disabled className={inputCls + " bg-[var(--color-surface-light)] text-[var(--color-text-muted)]"} />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Name changes are managed by an admin.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+1 (780) 555-0100" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            rows={3}
            placeholder="Brief description of your experience and specializations…"
            className={inputCls + " resize-none"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <div className="relative">
            <select value={formTimezone} onChange={(e) => setFormTimezone(e.target.value)} className={inputCls + " appearance-none pr-8"}>
              {CANADIAN_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-3 pointer-events-none text-[var(--color-text-muted)]" />
          </div>
        </div>

        {skills.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Skills</label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 capitalize">
                  {s}
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Skills are managed by an admin.</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button onClick={handleProfileSave} disabled={isPending} className="btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-50">
            {isPending ? "Saving…" : "Save Profile"}
          </button>
          {profileMsg && (
            <span className={`text-sm ${profileMsg.includes("Error") || profileMsg.includes("error") ? "text-red-600" : "text-green-600"}`}>
              {profileMsg}
            </span>
          )}
        </div>
      </section>

      {/* ── Working Hours ──────────────────────────────────────────── */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-base text-[var(--color-text)]">Working Hours</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Shown on your schedule calendar as reference blocks.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Work Start</label>
            <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Work End</label>
            <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lunch Break</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Start</label>
              <input type="time" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">End</label>
              <input type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
          Your lunch break ({lunchStart} – {lunchEnd}) will appear as a block on your schedule.
        </div>
      </section>

      {/* ── Time Off Requests ──────────────────────────────────────── */}
      <section className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-base text-[var(--color-text)]">Time Off Requests</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Requests are reviewed by an admin before taking effect.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="date" value={toStart} onChange={(e) => setToStart(e.target.value)} min={new Date().toISOString().split("T")[0]} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="date" value={toEnd} onChange={(e) => setToEnd(e.target.value)} min={toStart || new Date().toISOString().split("T")[0]} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reason (optional)</label>
          <input value={toReason} onChange={(e) => setToReason(e.target.value)} placeholder="Vacation, personal, medical…" className={inputCls} />
        </div>

        {toError && <p className="text-sm text-red-600">{toError}</p>}
        {toMsg   && <p className="text-sm text-green-600">{toMsg}</p>}

        <button onClick={handleTimeOffRequest} disabled={toLoading} className="btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-50">
          {toLoading ? "Submitting…" : "Request Time Off"}
        </button>

        {timeOffRequests.length > 0 && (
          <div className="space-y-2 pt-1">
            <h3 className="text-sm font-medium">Recent Requests</h3>
            {timeOffRequests.map((r) => (
              <div key={r.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${STATUS_COLORS[r.status] ?? ""}`}>
                <span>{fmtDate(r.startDate)} – {fmtDate(r.endDate)}{r.reason ? ` · ${r.reason}` : ""}</span>
                <span className="font-medium capitalize ml-2 shrink-0">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
