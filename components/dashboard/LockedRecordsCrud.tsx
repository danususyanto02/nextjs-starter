"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn, type DataTablePage, type DataTableSort } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";

type Lock = { id: string; resourceType: string; resourceId: string; expiresAt: string; ownerUser?: { username?: string; displayName?: string } };
type ListResponse<T> = { data?: T[]; meta?: DataTablePage; error?: { message?: string } };
type ListState = { search: string; sort: DataTableSort; page: DataTablePage };

function makeListUrl(state: ListState) {
  const params = new URLSearchParams({ limit: String(state.page.limit), offset: String(state.page.offset), sortBy: state.sort.columnId, sortDirection: state.sort.direction });
  if (state.search) params.set("search", state.search);
  return `/api/v1/locks?${params}`;
}

export function LockedRecordsCrud() {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [canForce, setCanForce] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingLock, setPendingLock] = useState<Lock | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [listState, setListState] = useState<ListState>({ search: "", sort: { columnId: "acquiredAt", direction: "desc" }, page: { limit: 25, offset: 0, total: 0 } });
  const requestIdRef = useRef(0);

  async function load(state = listState) {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setMessage("");
    try {
      const [lockResponse, accessResponse] = await Promise.all([fetch(makeListUrl(state)), fetch("/api/v1/me/access")]);
      const lockBody = await lockResponse.json() as ListResponse<Lock>;
      const accessBody = await accessResponse.json();
      if (!lockResponse.ok) throw new Error(lockBody.error?.message ?? "Unable to load locks");
      if (!lockBody.meta) throw new Error("Invalid list response");
      if (requestId !== requestIdRef.current) return;
      if (lockBody.meta.total > 0 && state.page.offset >= lockBody.meta.total) {
        const offset = Math.floor((lockBody.meta.total - 1) / state.page.limit) * state.page.limit;
        setListState((current) => ({ ...current, page: { ...lockBody.meta!, offset } }));
        return;
      }
      setLocks(lockBody.data ?? []);
      setCanForce((accessBody.data?.permissions ?? []).includes("DD0000006"));
      setListState((current) => ({ ...current, page: lockBody.meta! }));
    } catch (error) {
      if (requestId === requestIdRef.current) setMessage(error instanceof Error ? error.message : "Unable to load locks");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [listState.search, listState.page.limit, listState.page.offset, listState.sort.columnId, listState.sort.direction]);

  async function forceUnlock() {
    if (!pendingLock) return;
    setUnlocking(true);
    const response = await fetch(`/api/v1/locks/${pendingLock.id}/force`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) setMessage(body.error?.message ?? "Unable to force unlock");
    else { setPendingLock(null); await load(); }
    setUnlocking(false);
  }

  const columns: DataTableColumn<Lock>[] = [
    { id: "resourceType", label: "Resource", cell: (lock) => <span className="font-semibold">{lock.resourceType}</span> },
    { id: "resourceId", label: "Resource ID", cell: (lock) => <span className="font-mono text-xs text-[var(--muted)]">{lock.resourceId}</span> },
    { id: "owner", label: "Owner", sortable: false, cell: (lock) => lock.ownerUser?.displayName ?? lock.ownerUser?.username ?? "-" },
    { id: "expiresAt", label: "Expires", cell: (lock) => new Date(lock.expiresAt).toLocaleString() }
  ];
  const emptyState = <div className="empty-state"><span className="empty-state-icon text-[var(--success)]"><Icon name="check" /></span><p className="mt-3 font-semibold">No active locks</p><p className="mt-1 text-sm text-[var(--muted)]">All records are available for editing.</p></div>;
  function setSearch(search: string) { setListState((current) => ({ ...current, search, page: { ...current.page, offset: 0 } })); }
  function setSort(sort: DataTableSort) { setListState((current) => ({ ...current, sort, page: { ...current.page, offset: 0 } })); }
  function setLimit(limit: number) { setListState((current) => ({ ...current, page: { ...current.page, limit, offset: 0 } })); }
  function setOffset(offset: number) { setListState((current) => ({ ...current, page: { ...current.page, offset } })); }

  return <section className="space-y-6"><header className="document-header"><div className="document-title-row"><span className="page-icon"><Icon name="lock" /></span><div><p className="eyebrow">Concurrency control</p><h1 className="document-title mt-1">Locked Records</h1></div></div><p className="document-description">Active locks prevent concurrent mutations. Force unlock removes only lock state.</p></header>{message && <p className="notice notice-warning" role="status"><Icon name="warning" />{message}</p>}<section className="panel overflow-hidden">{loading ? <div className="space-y-3 p-5"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-11" /><div className="skeleton h-11" /></div> : <DataTable actionsLabel="Actions" caption="Active record locks" columns={columns} emptyState={emptyState} onLimitChange={setLimit} onOffsetChange={setOffset} onSearchChange={setSearch} onSortChange={setSort} page={listState.page} renderActions={(lock) => canForce ? <Button onClick={() => setPendingLock(lock)} size="compact" variant="danger"><Icon name="unlock" />Force unlock</Button> : null} rows={locks} search={listState.search} searchPlaceholder="Search locks..." sort={listState.sort} />}</section><ConfirmDialog confirmLabel="Force unlock" description={`Remove lock for ${pendingLock?.resourceType ?? "this record"}? Other editor may still be working.`} onCancel={() => setPendingLock(null)} onConfirm={() => void forceUnlock()} open={Boolean(pendingLock)} pending={unlocking} title="Force unlock record" /></section>;
}
