"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveTimeOffAction, rejectTimeOffAction, adminCreateTimeOffAction } from "@/app/actions/admin";
import { Check, X, Plus, ChevronDown, CalendarOff } from "lucide-react";

interface Installer {
  id: string;
  name: string;
}

interface TimeOffRecord {
  id: string;
  installerId: string;
  installerName: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  status: string;
  reviewedByName: string | null;
}

interface Props {
  installers: Installer[];
  records: TimeOffRecord[];
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "text-amber-700 bg-amber-50 border-amber-200",
  approved: "text-green-700 bg-green-50 border-green-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function TimeOffManager({ installers, records }: Props) {
  const router = useRouter();
  const [busy, startBusy] = useTransition();
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [selInstaller, setSelInstaller] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [createMsg, setCreateMsg] = useState("");
  const [createErr, setCreateErr] = useState("");

  const pending  = records.filter(r => r.status === "pending");
  const approved = records.filter(r => r.status === "approved");
  const rejected = records.filter(r => r.status === "rejected");

  function handleApprove(id: string) {
    startBusy(async () => {
      const res = await approveTimeOffAction(id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  }

  function handleReject(id: string) {
    startBusy(async () => {
      const res = await rejectTimeOffAction(id);
      if (!res.success) alert(res.error);
      else router.refresh();
    });
  }

  function handleCreate() {
    setCreateErr(""); setCreateMsg("");
    if (!selInstaller) { setCreateErr("Select an installer"); return; }
    if (!startDate || !endDate) { setCreateErr("Select start and end dates"); return; }
    if (endDate < startDate) { setCreateErr("End date must be on or after start date"); return; }
    startBusy(async () => {
      const res = await adminCreateTimeOffAction(selInstaller, startDate, endDate, reason);
      if (res.success) {
        setCreateMsg("Time off created and approved");
        setSelInstaller(""); setStartDate(""); setEndDate(""); setReason("");
        setShowCreate(false);
        router.refresh();
      } else {
        setCreateErr(res.error);
      }
    });
  }

  const inputCls = "w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30";

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Create time off ──────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowCreate(s => !s)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-light)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-[var(--color-primary)]" />
            <span className="font-semibold text-sm">Create Time Off (Admin)</span>
          </div>
          <ChevronDown size={16} className={`transition-transform text-[var(--color-text-muted)] ${showCreate ? "rotate-180" : ""}`} />
        </button>

        {showCreate && (
          <div className="px-5 pb-5 space-y-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] pt-3">
              Booking a day off here is automatically approved — no approval needed.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1">Installer</label>
              <div className="relative">
                <select value={selInstaller} onChange={(e) => setSelInstaller(e.target.value)} className={inputCls + " appearance-none pr-8"}>
                  <option value="">— Select installer —</option>
                  {installers.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-3 pointer-events-none text-[var(--color-text-muted)]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason (optional)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vacation, training, etc." className={inputCls} />
            </div>

            {createErr && <p className="text-sm text-red-600">{createErr}</p>}
            {createMsg && <p className="text-sm text-green-600">{createMsg}</p>}

            <button onClick={handleCreate} disabled={busy} className="btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-50">
              {busy ? "Creating…" : "Create & Approve"}
            </button>
          </div>
        )}
      </div>

      {/* ── Pending requests ─────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
          Pending Requests ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--color-text-muted)]">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="card p-4 flex items-center gap-4">
                <CalendarOff size={18} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.installerName}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                    {r.reason ? <span className="ml-1">· {r.reason}</span> : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={busy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={busy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── History ──────────────────────────────────────────────── */}
      {(approved.length > 0 || rejected.length > 0) && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
            Recent History
          </h2>
          <div className="card overflow-hidden divide-y divide-[var(--color-border)]">
            {[...approved, ...rejected].sort((a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            ).slice(0, 20).map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.installerName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                    {r.reason ? <span className="ml-1">· {r.reason}</span> : ""}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[r.status] ?? ""}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
