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

interface Props {
  name: string;
  phone: string;
  bio: string;
  timezone: string;
  skills: string[];
  timeOffRequests: TimeOffRequest[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  approved: "text-green-700 bg-green-50 border-green-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
};

export default function ProfileForm({ name, phone, bio, timezone, skills, timeOffRequests }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formPhone, setFormPhone] = useState(phone);
  const [formBio, setFormBio] = useState(bio);
  const [formTimezone, setFormTimezone] = useState(timezone);
  const [profileMsg, setProfileMsg] = useState("");

  // Time off state
  const [toStart, setToStart] = useState("");
  const [toEnd, setToEnd] = useState("");
  const [toReason, setToReason] = useState("");
  const [toMsg, setToMsg] = useState("");
  const [toError, setToError] = useState("");
  const [toLoading, startToTransition] = useTransition();

  function handleProfileSave() {
    setProfileMsg("");
    startTransition(async () => {
      const res = await updateInstallerProfileAction(formBio, formPhone, formTimezone);
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
        setToMsg("Request submitted");
        setToStart("");
        setToEnd("");
        setToReason("");
        router.refresh();
      } else {
        setToError(res.error ?? "Error");
      }
    });
  }

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">
      {/* Profile card */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-5 space-y-4">
        <h2 className="font-semibold text-base">Profile</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name}
            disabled
            className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface-light)] text-[var(--color-text-muted)]"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Name changes are managed by an admin.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="+1 (780) 555-0100"
            className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            rows={3}
            placeholder="Brief description of your experience and specializations…"
            className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <div className="relative">
            <select
              value={formTimezone}
              onChange={(e) => setFormTimezone(e.target.value)}
              className="w-full appearance-none rounded-md border border-[var(--color-border)] pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            >
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
          <button
            onClick={handleProfileSave}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md bg-[var(--color-primary)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isPending ? "Saving…" : "Save Profile"}
          </button>
          {profileMsg && (
            <span className={`text-sm ${profileMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>
              {profileMsg}
            </span>
          )}
        </div>
      </section>

      {/* Time off requests */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-5 space-y-4">
        <h2 className="font-semibold text-base">Time Off Requests</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={toStart}
              onChange={(e) => setToStart(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={toEnd}
              onChange={(e) => setToEnd(e.target.value)}
              min={toStart || new Date().toISOString().split("T")[0]}
              className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reason (optional)</label>
          <input
            value={toReason}
            onChange={(e) => setToReason(e.target.value)}
            placeholder="Vacation, personal, medical…"
            className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>

        {toError && <p className="text-sm text-red-600">{toError}</p>}
        {toMsg && <p className="text-sm text-green-600">{toMsg}</p>}

        <button
          onClick={handleTimeOffRequest}
          disabled={toLoading}
          className="px-4 py-2 text-sm rounded-md bg-[var(--color-primary)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {toLoading ? "Submitting…" : "Request Time Off"}
        </button>

        {timeOffRequests.length > 0 && (
          <div className="space-y-2 pt-1">
            <h3 className="text-sm font-medium">Recent Requests</h3>
            {timeOffRequests.map((r) => (
              <div key={r.id} className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${STATUS_COLORS[r.status] ?? ""}`}>
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
