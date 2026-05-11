"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import SignaturePad from "@/components/ui/SignaturePad";
import PhotoCapture from "@/components/ui/PhotoCapture";
import {
  updateJobStatusAction,
  addPhotoAction,
  deletePhotoAction,
  saveSignatureAction,
  saveInternalNoteAction,
} from "@/app/actions/installer";
import { MapPin, Phone, User, Wrench, FileText, PenLine, ImageIcon, Trash2, ChevronDown } from "lucide-react";

type PhotoType = "BEFORE" | "AFTER" | "ISSUE" | "EQUIPMENT_LABEL";

interface Photo {
  id: string;
  url: string;
  type: PhotoType;
  uploadedAt: Date;
}

interface Signature {
  signatureUrl: string;
  signerName: string | null;
  signedAt: Date;
}

interface JobDetailProps {
  booking: {
    id: string;
    status: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    timezone: string;
    notes: string | null;
    internalNotes: string | null;
    address: string | null;
    customer: { name: string; phone: string | null; address: string | null };
    vehicle: { vehicleType: string; year: number | null; make: string | null; model: string | null; color: string | null } | null;
    services: { id: string; service: { name: string } }[];
    photos: Photo[];
    signature: Signature | null;
  };
}

const STATUS_NEXT: Record<string, { label: string; next: string }> = {
  pending: { label: "Confirm Job", next: "confirmed" },
  confirmed: { label: "On My Way", next: "on_the_way" },
  on_the_way: { label: "Start Job", next: "in_progress" },
  in_progress: { label: "Complete Job", next: "completed" },
};

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending: "muted", confirmed: "default", on_the_way: "purple",
  in_progress: "warning", completed: "success", cancelled: "danger", no_show: "muted",
};

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: "BEFORE", label: "Before" },
  { value: "AFTER", label: "After" },
  { value: "ISSUE", label: "Issue" },
  { value: "EQUIPMENT_LABEL", label: "Equipment Label" },
];

export default function JobDetail({ booking }: JobDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [photoType, setPhotoType] = useState<PhotoType>("BEFORE");
  const [signerName, setSignerName] = useState("");
  const [note, setNote] = useState(booking.internalNotes ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState("");
  const [noShow, setNoShow] = useState(false);

  const nextAction = STATUS_NEXT[booking.status];

  function handleStatusUpdate(status: string) {
    setError("");
    startTransition(async () => {
      const res = await updateJobStatusAction(booking.id, status);
      if (!res.ok) setError(res.error ?? "Error");
      else router.refresh();
    });
  }

  async function handlePhoto(dataUrl: string) {
    const res = await addPhotoAction(booking.id, dataUrl, photoType);
    if (!res.ok) setError(res.error ?? "Error saving photo");
    else router.refresh();
  }

  async function handleDeletePhoto(photoId: string) {
    const res = await deletePhotoAction(photoId);
    if (!res.ok) setError(res.error ?? "Error deleting photo");
    else router.refresh();
  }

  async function handleSignature(dataUrl: string) {
    if (!signerName.trim()) { setError("Please enter the customer's name before saving signature"); return; }
    const res = await saveSignatureAction(booking.id, dataUrl, signerName.trim());
    if (!res.ok) setError(res.error ?? "Error saving signature");
    else router.refresh();
  }

  async function handleSaveNote() {
    setSavingNote(true);
    setNoteMsg("");
    const res = await saveInternalNoteAction(booking.id, note);
    setSavingNote(false);
    if (res.ok) setNoteMsg("Saved");
    else setNoteMsg(res.error ?? "Error");
    setTimeout(() => setNoteMsg(""), 2000);
  }

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: booking.timezone,
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">{fmt(booking.scheduledStart)} – {fmt(booking.scheduledEnd)}</p>
            <h1 className="text-xl font-bold text-[var(--color-primary)] mt-0.5">{booking.customer.name}</h1>
          </div>
          <Badge variant={STATUS_BADGE[booking.status] ?? "muted"} className="text-sm px-3 py-1">
            {booking.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {booking.address && (
          <p className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span>{booking.address}</span>
          </p>
        )}
        {booking.customer.phone && (
          <a href={`tel:${booking.customer.phone}`} className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
            <Phone size={15} />
            {booking.customer.phone}
          </a>
        )}
        {booking.vehicle && (
          <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <User size={15} />
            {[booking.vehicle.year, booking.vehicle.make, booking.vehicle.model, booking.vehicle.color].filter(Boolean).join(" ") || booking.vehicle.vehicleType.replace(/_/g, " ")}
          </p>
        )}
        {booking.services.length > 0 && (
          <div className="flex items-start gap-2">
            <Wrench size={15} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
            <div className="flex flex-wrap gap-1">
              {booking.services.map((bs) => (
                <Badge key={bs.id} variant="muted">{bs.service.name}</Badge>
              ))}
            </div>
          </div>
        )}
        {booking.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
            <span className="font-medium">Job note: </span>{booking.notes}
          </div>
        )}
      </div>

      {/* Status action */}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

      {nextAction && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-2">
          <button
            onClick={() => handleStatusUpdate(nextAction.next)}
            disabled={isPending}
            className="w-full py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Updating…" : nextAction.label}
          </button>
          {booking.status === "in_progress" && !noShow && (
            <button
              onClick={() => setNoShow(true)}
              className="w-full py-2 text-sm text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
            >
              Mark as No Show
            </button>
          )}
          {noShow && (
            <button
              onClick={() => handleStatusUpdate("no_show")}
              disabled={isPending}
              className="w-full py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Confirm No Show
            </button>
          )}
        </div>
      )}

      {/* Photos */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><ImageIcon size={16} /> Photos</h2>

        {booking.status !== "completed" && booking.status !== "cancelled" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--color-text-muted)]">Type:</label>
              <div className="relative">
                <select
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value as PhotoType)}
                  className="appearance-none pl-2 pr-7 py-1.5 text-sm rounded-md border border-[var(--color-border)] bg-white"
                >
                  {PHOTO_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2.5 pointer-events-none text-[var(--color-text-muted)]" />
              </div>
            </div>
            <PhotoCapture onCapture={handlePhoto} />
          </div>
        )}

        {booking.photos.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {booking.photos.map((p) => (
              <div key={p.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.type} className="w-full h-28 object-cover rounded-md border border-[var(--color-border)]" />
                <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                  {p.type.toLowerCase().replace(/_/g, " ")}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(p.id)}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Signature */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><PenLine size={16} /> Customer Signature</h2>

        {booking.signature ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-text-muted)]">
              Signed by <span className="font-medium text-[var(--color-text)]">{booking.signature.signerName ?? "Customer"}</span>
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={booking.signature.signatureUrl} alt="signature" className="h-20 border border-[var(--color-border)] rounded-md bg-white p-1" />
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Customer name"
              className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
            <SignaturePad onSave={handleSignature} disabled={booking.status === "cancelled"} />
          </div>
        )}
      </section>

      {/* Internal notes */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><FileText size={16} /> Internal Notes</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Notes visible only to your team…"
          className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveNote}
            disabled={savingNote}
            className="px-4 py-1.5 text-sm rounded-md bg-[var(--color-primary)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {savingNote ? "Saving…" : "Save Note"}
          </button>
          {noteMsg && <span className="text-sm text-green-600">{noteMsg}</span>}
        </div>
      </section>
    </div>
  );
}
