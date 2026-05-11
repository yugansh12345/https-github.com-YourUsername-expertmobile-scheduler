"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  createServiceAction, updateServiceAction, toggleServiceActiveAction,
} from "@/app/actions/admin";

export type ServiceRow = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  basePrice: string;
  description: string | null;
  requiredSkills: string[];
  isActive: boolean;
  sortOrder: number;
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: "two_way_radio",      label: "Two-Way Radio" },
  { value: "poc_radio",          label: "POC Radio" },
  { value: "cell_booster",       label: "Cell Booster" },
  { value: "fleet_tracking_eld", label: "Fleet / ELD" },
  { value: "satellite",          label: "Satellite" },
];

const SKILLS: { value: string; label: string }[] = [
  { value: "radio",    label: "Radio" },
  { value: "booster",  label: "Booster" },
  { value: "eld",      label: "ELD" },
  { value: "satellite",label: "Satellite" },
  { value: "antenna",  label: "Antenna" },
  { value: "poc",      label: "POC" },
];

const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(({ value, label }) => [value, label])
);

export default function ServiceManagement({ initialServices }: { initialServices: ServiceRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogService, setDialogService] = useState<ServiceRow | "new" | null>(null);
  const [formError, setFormError] = useState("");

  function handleSubmit(formData: FormData) {
    setFormError("");
    startTransition(async () => {
      const isNew = dialogService === "new";
      const result = isNew
        ? await createServiceAction(formData)
        : await updateServiceAction(formData);
      if (result.success) {
        setDialogService(null);
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      await toggleServiceActiveAction(id, isActive);
      router.refresh();
    });
  }

  const editingService = dialogService !== "new" ? dialogService : null;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Services</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Manage your service catalog</p>
        </div>
        <Button onClick={() => { setDialogService("new"); setFormError(""); }}>
          <PlusCircle size={16} className="mr-2" /> New Service
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)]">
            <tr>
              {["Name", "Category", "Duration", "Base Price", "Skills", "Active", ""].map((h) => (
                <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {initialServices.map((s) => (
              <tr key={s.id} className="hover:bg-[var(--color-surface-light)] transition-colors">
                <td className="py-3 px-4 font-medium">{s.name}</td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">{CAT_LABEL[s.category] ?? s.category}</td>
                <td className="py-3 px-4">{s.durationMinutes} min</td>
                <td className="py-3 px-4">${parseFloat(s.basePrice).toFixed(2)}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {s.requiredSkills.length === 0 ? (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    ) : (
                      s.requiredSkills.map((sk) => (
                        <Badge key={sk} variant="muted">{sk}</Badge>
                      ))
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(checked) => handleToggle(s.id, checked)}
                    disabled={isPending}
                    aria-label={s.isActive ? "Deactivate service" : "Activate service"}
                  />
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => { setDialogService(s); setFormError(""); }}
                    className="p-1.5 rounded hover:bg-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {initialServices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                  No services yet. Create your first service above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogService !== null} onOpenChange={(o) => !o && setDialogService(null)}>
        <DialogContent>
          <form action={handleSubmit}>
            {editingService && (
              <input type="hidden" name="serviceId" value={editingService.id} />
            )}
            <DialogHeader>
              <DialogTitle>{dialogService === "new" ? "New Service" : "Edit Service"}</DialogTitle>
            </DialogHeader>
            {formError && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{formError}</p>
            )}
            <div className="space-y-3">
              <div>
                <Label>Service Name</Label>
                <Input name="name" required defaultValue={editingService?.name ?? ""} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select
                    name="category"
                    required
                    defaultValue={editingService?.category ?? "two_way_radio"}
                    className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    name="durationMinutes" type="number" min={15} step={15} required
                    defaultValue={editingService?.durationMinutes ?? 60}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Base Price ($)</Label>
                  <Input
                    name="basePrice" type="number" min={0} step={0.01} required
                    defaultValue={editingService ? parseFloat(editingService.basePrice).toFixed(2) : "0.00"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    name="sortOrder" type="number" min={0}
                    defaultValue={editingService?.sortOrder ?? 0}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  name="description" rows={2}
                  defaultValue={editingService?.description ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="block mb-2">Required Skills</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SKILLS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox" name="requiredSkills" value={value}
                        defaultChecked={editingService?.requiredSkills.includes(value) ?? false}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogService(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : dialogService === "new" ? "Create" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
