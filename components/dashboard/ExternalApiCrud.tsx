"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn, type DataTablePage, type DataTableSort } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";

type ExternalObject = { id: string; name: string; data?: Record<string, unknown> };
type ListResponse<T> = { data?: T[]; meta?: DataTablePage; error?: { message?: string } };
type ListState = { search: string; sort: DataTableSort; page: DataTablePage };

function providerMessage(status: number, fallback: string) {
  if (status === 504) return "External provider timeout. Try again.";
  if (status === 502) return "External provider error. Check provider availability and server configuration.";
  return fallback;
}

function makeListUrl(state: ListState) {
  const params = new URLSearchParams({ limit: String(state.page.limit), offset: String(state.page.offset), sortBy: state.sort.columnId, sortDirection: state.sort.direction });
  if (state.search) params.set("search", state.search);
  return `/api/v1/integrations/restful-api-dev/objects?${params}`;
}

export function ExternalApiCrud() {
  const [objects, setObjects] = useState<ExternalObject[]>([]);
  const [editing, setEditing] = useState<ExternalObject | null>(null);
  const [name, setName] = useState("");
  const [dataText, setDataText] = useState("{}");
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; data?: string }>({});
  const [deleteObject, setDeleteObject] = useState<ExternalObject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listState, setListState] = useState<ListState>({ search: "", sort: { columnId: "id", direction: "asc" }, page: { limit: 25, offset: 0, total: 0 } });
  const requestIdRef = useRef(0);

  async function load(state = listState) {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrorMessage("");
    try {
      const [objectsResponse, accessResponse] = await Promise.all([fetch(makeListUrl(state)), fetch("/api/v1/me/access")]);
      const objectsBody = await objectsResponse.json() as ListResponse<ExternalObject>;
      const accessBody = await accessResponse.json();
      if (!objectsResponse.ok) throw new Error(providerMessage(objectsResponse.status, objectsBody.error?.message ?? "Unable to load objects"));
      if (!objectsBody.meta) throw new Error("Invalid list response");
      if (requestId !== requestIdRef.current) return;
      if (objectsBody.meta.total > 0 && state.page.offset >= objectsBody.meta.total) {
        const offset = Math.floor((objectsBody.meta.total - 1) / state.page.limit) * state.page.limit;
        setListState((current) => ({ ...current, page: { ...objectsBody.meta!, offset } }));
        return;
      }
      setObjects(objectsBody.data ?? []);
      setPermissions(new Set(accessBody.data?.permissions ?? []));
      setListState((current) => ({ ...current, page: objectsBody.meta! }));
    } catch (error) {
      if (requestId === requestIdRef.current) setErrorMessage(error instanceof Error ? error.message : "Unable to load objects");
    } finally { if (requestId === requestIdRef.current) setLoading(false); }
  }

  useEffect(() => { void load(); }, [listState.search, listState.page.limit, listState.page.offset, listState.sort.columnId, listState.sort.direction]);

  function startCreate() {
    setEditing({ id: "", name: "", data: {} });
    setName("");
    setDataText("{}");
    setErrorMessage("");
    setFieldErrors({});
  }

  function startEdit(object: ExternalObject) {
    setEditing(object);
    setName(object.name);
    setDataText(JSON.stringify(object.data ?? {}, null, 2));
    setErrorMessage("");
    setFieldErrors({});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    let data: Record<string, unknown>;
    const nextFieldErrors: { name?: string; data?: string } = {};
    if (!name.trim()) nextFieldErrors.name = "Name wajib diisi.";
    try {
      const parsed: unknown = JSON.parse(dataText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Data must be a JSON object");
      data = parsed as Record<string, unknown>;
    } catch (error) {
      nextFieldErrors.data = error instanceof Error ? error.message : "Data harus berupa JSON object yang valid.";
      setFieldErrors(nextFieldErrors);
      setSaving(false);
      return;
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) { setSaving(false); return; }
    try {
      const response = await fetch(editing?.id ? `/api/v1/integrations/restful-api-dev/objects/${encodeURIComponent(editing.id)}` : "/api/v1/integrations/restful-api-dev/objects", { method: editing?.id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, data }) });
      const body = await response.json();
      if (!response.ok) throw new Error(providerMessage(response.status, body.error?.message ?? "Unable to save object"));
      setEditing(null);
      await load();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Unable to save object"); } finally { setSaving(false); }
  }

  async function confirmRemove() {
    if (!deleteObject) return;
    setDeleting(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/v1/integrations/restful-api-dev/objects/${encodeURIComponent(deleteObject.id)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(providerMessage(response.status, body.error?.message ?? "Unable to delete object"));
      setDeleteObject(null);
      await load();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Unable to delete object"); } finally { setDeleting(false); }
  }

  const canAdd = permissions.has("AD0000007");
  const canEdit = permissions.has("ED0000007");
  const canRemove = permissions.has("DD0000007");
  const columns: DataTableColumn<ExternalObject>[] = [{ id: "id", label: "ID", cell: (object) => <span className="font-mono text-xs text-[var(--muted)]">{object.id}</span> }, { id: "name", label: "Name", cell: (object) => <span className="font-semibold">{object.name}</span> }, { id: "data", label: "Data", cell: (object) => <span className="block max-w-md whitespace-pre-wrap font-mono text-xs text-[var(--muted)]">{JSON.stringify(object.data ?? {}, null, 2)}</span> }];
  const emptyState = <div className="empty-state"><span className="empty-state-icon"><Icon name="empty" /></span><p className="mt-3 font-semibold">No provider objects found</p><p className="mt-1 text-sm text-[var(--muted)]">Create an object to start testing integration.</p></div>;
  function setSearch(search: string) { setListState((current) => ({ ...current, search, page: { ...current.page, offset: 0 } })); }
  function setSort(sort: DataTableSort) { setListState((current) => ({ ...current, sort, page: { ...current.page, offset: 0 } })); }
  function setLimit(limit: number) { setListState((current) => ({ ...current, page: { ...current.page, limit, offset: 0 } })); }
  function setOffset(offset: number) { setListState((current) => ({ ...current, page: { ...current.page, offset } })); }

  return <section className="space-y-6"><header className="document-header"><div className="toolbar"><div className="document-title-row"><span className="page-icon"><Icon name="api" /></span><div><p className="eyebrow">Integration workspace</p><h1 className="document-title mt-1">External API Demo</h1></div></div>{canAdd && <Button onClick={startCreate}><Icon name="add" />Create object</Button>}</div><p className="document-description">CRUD through internal proxy. Provider credentials never reach browser.</p></header><div className="grid divide-y divide-[var(--line)] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="p-4"><p className="text-xs font-medium text-[var(--muted)]">Provider</p><p className="mt-3 flex items-center gap-2 text-sm font-semibold"><Icon className="text-[var(--success)]" name="check" />restful-api.dev</p></div><div className="p-4"><p className="text-xs font-medium text-[var(--muted)]">Objects loaded</p><p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{listState.page.total}</p></div><div className="p-4"><p className="text-xs font-medium text-[var(--muted)]">Transport</p><p className="mt-3 text-sm font-semibold text-[var(--primary-deep)]">Internal proxy only</p></div></div>{errorMessage && <p className="notice notice-error" role="alert"><Icon name="warning" />{errorMessage}</p>}{editing && <form className="panel grid gap-4 p-5" onSubmit={submit}><div><p className="eyebrow">Object editor</p><h2 className="mt-1 text-lg font-semibold">{editing.id ? "Edit object" : "Create object"}</h2></div><label className="grid gap-1.5 text-sm font-semibold">Name<input className={`input-base ${fieldErrors.name ? "border-[var(--danger)]" : ""}`} onBlur={() => setFieldErrors((current) => ({ ...current, ...(name.trim() ? { name: undefined } : { name: "Name wajib diisi." }) }))} onChange={(event) => { setName(event.target.value); if (event.target.value.trim()) setFieldErrors((current) => ({ ...current, name: undefined })); }} required value={name} />{fieldErrors.name ? <span className="text-xs font-medium text-[var(--danger)]">{fieldErrors.name}</span> : <span className="text-xs font-normal text-[var(--muted)]">Wajib diisi.</span>}</label><label className="grid gap-1.5 text-sm font-semibold">Data JSON<textarea className={`input-base min-h-[180px] font-mono text-xs ${fieldErrors.data ? "border-[var(--danger)]" : ""}`} onBlur={() => { try { const parsed: unknown = JSON.parse(dataText); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Data harus berupa JSON object."); setFieldErrors((current) => ({ ...current, data: undefined })); } catch (error) { setFieldErrors((current) => ({ ...current, data: error instanceof Error ? error.message : "JSON tidak valid." })); } }} onChange={(event) => { setDataText(event.target.value); setFieldErrors((current) => ({ ...current, data: undefined })); }} rows={8} value={dataText} />{fieldErrors.data ? <span className="text-xs font-medium text-[var(--danger)]">{fieldErrors.data}</span> : <span className="text-xs font-normal text-[var(--muted)]">Harus berupa JSON object.</span>}</label><div className="flex flex-wrap gap-2"><Button disabled={saving} type="submit">{saving ? "Saving..." : "Save object"}</Button><Button onClick={() => setEditing(null)} variant="secondary">Cancel</Button></div></form>}<section className="panel overflow-hidden">{loading ? <div className="space-y-3 p-5"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-16" /><div className="skeleton h-16" /></div> : <DataTable actionsLabel="Actions" caption="External provider objects" columns={columns} emptyState={emptyState} onLimitChange={setLimit} onOffsetChange={setOffset} onSearchChange={setSearch} onSortChange={setSort} page={listState.page} renderActions={(object) => <>{canEdit && <Button aria-label={`Edit ${object.name}`} onClick={() => startEdit(object)} size="compact" variant="quiet"><Icon name="edit" /><span className="sr-only">Edit</span></Button>}{canRemove && <Button aria-label={`Delete ${object.name}`} onClick={() => setDeleteObject(object)} size="compact" variant="quiet"><Icon className="text-[var(--danger)]" name="delete" /><span className="sr-only">Delete</span></Button>}</>} rows={objects} search={listState.search} searchPlaceholder="Search provider objects..." sort={listState.sort} />}</section><ConfirmDialog confirmLabel="Delete object" description={`Delete ${deleteObject?.name ?? "this object"}? This action cannot be undone.`} onCancel={() => setDeleteObject(null)} onConfirm={() => void confirmRemove()} open={Boolean(deleteObject)} pending={deleting} title="Delete provider object" /></section>;
}
