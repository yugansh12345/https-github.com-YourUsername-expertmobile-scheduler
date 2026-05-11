import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = { title: "Audit Log — Admin" };

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{ page?: string; action?: string; userId?: string }>;
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const { page: pageParam, action: actionFilter, userId: userFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const where = {
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(userFilter ? { userId: userFilter } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, username: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (actionFilter) params.set("action", actionFilter);
    if (userFilter) params.set("userId", userFilter);
    return `/admin/audit?${params.toString()}`;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Audit Log</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{total} total entries</p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)]">
            <tr>
              {["Timestamp", "User", "Action", "Entity", ""].map((h) => (
                <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[var(--color-surface-light)] transition-colors">
                <td className="py-3 px-4 text-[var(--color-text-muted)] whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="py-3 px-4 font-medium whitespace-nowrap">
                  {log.user.name ?? log.user.username}
                </td>
                <td className="py-3 px-4">
                  <Badge variant="muted">{log.action.replace(/_/g, " ")}</Badge>
                </td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">
                  {log.entityType ? `${log.entityType}` : "—"}
                </td>
                <td className="py-3 px-4 text-[var(--color-text-muted)] text-xs">
                  {log.metadata ? (
                    <span className="font-mono">{log.metadata.slice(0, 60)}</span>
                  ) : null}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                  No audit entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
                <ChevronLeft size={14} /> Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
                Next <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
