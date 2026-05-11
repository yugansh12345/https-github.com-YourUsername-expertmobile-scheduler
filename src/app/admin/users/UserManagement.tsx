"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Pencil, KeyRound, LockOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createUserAction, updateUserAction } from "@/app/actions/admin";
import { adminResetPasswordAction, adminToggleLockAction } from "@/app/actions/auth";

export type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "ADMIN" | "BOOKER" | "INSTALLER";
  isActive: boolean;
  isLocked: boolean;
  phone: string | null;
  twoFactorRequired: boolean;
  lastLoginAt: string | null;
};

const ROLE_BADGE: Record<string, "default" | "purple" | "warning"> = {
  ADMIN: "default",
  BOOKER: "purple",
  INSTALLER: "warning",
};

export default function UserManagement({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Edit dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editError, setEditError] = useState("");

  // Reset password result
  const [resetResult, setResetResult] = useState<{ userName: string; pw: string } | null>(null);

  function handleCreate(formData: FormData) {
    setCreateError("");
    startTransition(async () => {
      const result = await createUserAction(formData);
      if (result.success) {
        setTempPassword(result.tempPassword);
        router.refresh();
      } else {
        setCreateError(result.error);
      }
    });
  }

  function handleUpdate(formData: FormData) {
    setEditError("");
    startTransition(async () => {
      const result = await updateUserAction(formData);
      if (result.success) {
        setEditUser(null);
        router.refresh();
      } else {
        setEditError(result.error);
      }
    });
  }

  function handleReset(userId: string, userName: string) {
    startTransition(async () => {
      const result = await adminResetPasswordAction(userId);
      if (result.success) {
        setResetResult({ userName, pw: result.tempPassword });
        router.refresh();
      }
    });
  }

  function handleToggleLock(userId: string, lock: boolean) {
    startTransition(async () => {
      await adminToggleLockAction(userId, lock);
      router.refresh();
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Users</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Manage system accounts</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); setTempPassword(null); setCreateError(""); }}>
          <PlusCircle size={16} className="mr-2" /> New User
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)]">
            <tr>
              {["Name", "Username", "Email", "Role", "Status", "2FA", "Last Login", ""].map((h) => (
                <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {initialUsers.map((u) => (
              <tr key={u.id} className="hover:bg-[var(--color-surface-light)] transition-colors">
                <td className="py-3 px-4 font-medium">{u.name}</td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">{u.username}</td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">{u.email}</td>
                <td className="py-3 px-4">
                  <Badge variant={ROLE_BADGE[u.role]}>{u.role}</Badge>
                </td>
                <td className="py-3 px-4">
                  {u.isLocked ? (
                    <Badge variant="danger">Locked</Badge>
                  ) : u.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="muted">Inactive</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {u.twoFactorRequired ? (
                    <Badge variant="success">On</Badge>
                  ) : (
                    <Badge variant="muted">Off</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-[var(--color-text-muted)] whitespace-nowrap">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleDateString("en-CA", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : "Never"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      title="Edit"
                      onClick={() => { setEditUser(u); setEditError(""); }}
                      className="p-1.5 rounded hover:bg-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title="Reset password"
                      onClick={() => handleReset(u.id, u.name)}
                      disabled={isPending}
                      className="p-1.5 rounded hover:bg-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:text-[var(--color-warning)] transition-colors"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      title={u.isLocked ? "Unlock account" : "Lock account"}
                      onClick={() => handleToggleLock(u.id, !u.isLocked)}
                      disabled={isPending}
                      className={`p-1.5 rounded hover:bg-[var(--color-surface-light)] transition-colors ${
                        u.isLocked
                          ? "text-red-500 hover:text-red-700"
                          : "text-[var(--color-text-muted)] hover:text-red-500"
                      }`}
                    >
                      {u.isLocked ? <LockOpen size={15} /> : <Lock size={15} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {initialUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[var(--color-text-muted)]">
                  No users yet. Create the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create User Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          {tempPassword ? (
            <>
              <DialogHeader>
                <DialogTitle>User Created</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                Share this temporary password with the user. They will be required to change it on first login.
              </p>
              <div className="bg-[var(--color-surface-light)] rounded-lg px-4 py-3 font-mono text-lg font-bold text-[var(--color-primary)] text-center select-all">
                {tempPassword}
              </div>
              <DialogFooter>
                <Button onClick={() => setCreateOpen(false)}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>
              {createError && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{createError}</p>
              )}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cu-name">Full Name</Label>
                  <Input id="cu-name" name="name" required className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cu-username">Username</Label>
                    <Input id="cu-username" name="username" required className="mt-1" placeholder="lowercase only" />
                  </div>
                  <div>
                    <Label htmlFor="cu-email">Email</Label>
                    <Input id="cu-email" name="email" type="email" required className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cu-role">Role</Label>
                    <select
                      id="cu-role"
                      name="role"
                      required
                      className="mt-1 flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="BOOKER">Booker</option>
                      <option value="INSTALLER">Installer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="cu-phone">Phone</Label>
                    <Input id="cu-phone" name="phone" type="tel" className="mt-1" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="twoFactorRequired" value="true" />
                  Require 2FA
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating…" : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ── */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          {editUser && (
            <form action={handleUpdate}>
              <input type="hidden" name="userId" value={editUser.id} />
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              {editError && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{editError}</p>
              )}
              <div className="space-y-3">
                <div>
                  <Label>Full Name</Label>
                  <Input name="name" required defaultValue={editUser.name} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email</Label>
                    <Input name="email" type="email" required defaultValue={editUser.email} className="mt-1" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input name="phone" type="tel" defaultValue={editUser.phone ?? ""} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox" name="isActive" value="true"
                      defaultChecked={editUser.isActive}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox" name="twoFactorRequired" value="true"
                      defaultChecked={editUser.twoFactorRequired}
                    />
                    Require 2FA
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Password Reset Result Dialog ── */}
      <Dialog open={!!resetResult} onOpenChange={(o) => !o && setResetResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            New temporary password for <strong>{resetResult?.userName}</strong>:
          </p>
          <div className="bg-[var(--color-surface-light)] rounded-lg px-4 py-3 font-mono text-lg font-bold text-[var(--color-primary)] text-center select-all">
            {resetResult?.pw}
          </div>
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
