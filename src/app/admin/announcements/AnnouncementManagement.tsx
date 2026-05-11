"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/app/actions/admin";

export type AnnouncementRow = {
  id: string;
  message: string;
  audience: string;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string;
};

const AUDIENCE_BADGE: Record<string, "default" | "purple" | "warning"> = {
  ALL: "default",
  BOOKERS: "purple",
  INSTALLERS: "warning",
};

export default function AnnouncementManagement({
  initialAnnouncements,
}: {
  initialAnnouncements: AnnouncementRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState("");

  function handleCreate(formData: FormData) {
    setFormError("");
    startTransition(async () => {
      const result = await createAnnouncementAction(formData);
      if (result.success) {
        setCreateOpen(false);
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    startTransition(async () => {
      await deleteAnnouncementAction(id);
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Announcements</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Broadcast messages to your team</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); setFormError(""); }}>
          <PlusCircle size={16} className="mr-2" /> New Announcement
        </Button>
      </div>

      <div className="space-y-3">
        {initialAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] py-12 text-center text-[var(--color-text-muted)]">
            No announcements yet.
          </div>
        ) : (
          initialAnnouncements.map((a) => {
            const expired = a.expiresAt && new Date(a.expiresAt) < new Date();
            return (
              <div
                key={a.id}
                className={`bg-white rounded-xl border border-[var(--color-border)] p-4 ${expired ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant={AUDIENCE_BADGE[a.audience] ?? "default"}>
                        {a.audience}
                      </Badge>
                      {expired && <Badge variant="muted">Expired</Badge>}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(a.createdAt).toLocaleDateString("en-CA", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                        {" · "}by {a.createdBy}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{a.message}</p>
                    {a.expiresAt && !expired && (
                      <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                        Expires{" "}
                        {new Date(a.expiresAt).toLocaleDateString("en-CA", {
                          month: "short", day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={isPending}
                    className="shrink-0 p-1.5 rounded text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form action={handleCreate}>
            <DialogHeader>
              <DialogTitle>New Announcement</DialogTitle>
            </DialogHeader>
            {formError && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{formError}</p>
            )}
            <div className="space-y-3">
              <div>
                <Label>Audience</Label>
                <select
                  name="audience"
                  required
                  defaultValue="ALL"
                  className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="ALL">Everyone</option>
                  <option value="INSTALLERS">Installers only</option>
                  <option value="BOOKERS">Bookers only</option>
                </select>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea name="message" rows={4} required placeholder="What do you want to announce?" className="mt-1" />
              </div>
              <div>
                <Label>Expires On (optional)</Label>
                <input
                  type="date"
                  name="expiresAt"
                  className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Posting…" : "Post Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
