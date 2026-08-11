"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn, type DataTablePage, type DataTableSort } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";
import { useRecordLock } from "@/hooks/useRecordLock";

type Field = { name: string; label: string; type?: "text" | "password" | "email" | "number" | "select" | "checkbox"; required?: boolean; minLength?: number; options?: string[] };
type Column = { key: string; label: string };
type Resource = Record<string, unknown> & { id: string };
type AssignmentConfig = { label: string; endpointSuffix: string; permission: string; payloadKey: "roleIds" | "permissionIds" };
type AssignmentOption = { id: string; name: string; code: string; group?: string; routePath?: string };
type ListState = { search: string; sort: DataTableSort; page: DataTablePage };
type ListResponse<T> = { data?: T[]; meta?: DataTablePage; error?: { message?: string } };

function LockBanner({ checking, readOnly, ownerName }: { checking: boolean; readOnly: boolean; ownerName: string }) {
  const message = checking ? "Checking record availability..." : readOnly ? `Read-only: ${ownerName} is editing this record.` : "You have editing access to this record.";
  const tone = readOnly ? "notice-error" : checking ? "notice-warning" : "notice-success";
  const icon = readOnly ? "lock" : checking ? "spinner" : "unlock";
  return <div className={`notice ${tone}`}><Icon className={checking ? "animate-spin" : ""} name={icon} /><span>{message}</span></div>;
}

async function readResponseBody<T = unknown>(response: Response): Promise<{ error?: { message?: string }; data?: T }> {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as { error?: { message?: string }; data?: T }; } catch { return {}; }
}

function validateField(field: Field, value: string, isCreate: boolean) {
  const trimmed = value.trim();
  if (isCreate && field.required && !trimmed) return `${field.label} wajib diisi.`;
  if (!trimmed) return "";
  if (field.minLength && value.length < field.minLength) return `${field.label} minimal ${field.minLength} karakter.`;
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `${field.label} harus berupa email yang valid.`;
  if (field.type === "number" && Number.isNaN(Number(value))) return `${field.label} harus berupa angka.`;
  if (field.name === "routePath" && !value.startsWith("/")) return `${field.label} harus diawali dengan /.`;
  return "";
}

function makeListUrl(endpoint: string, state: ListState) {
  const params = new URLSearchParams({ limit: String(state.page.limit), offset: String(state.page.offset), sortBy: state.sort.columnId, sortDirection: state.sort.direction });
  if (state.search) params.set("search", state.search);
  return `${endpoint}?${params}`;
}

type Props = {
  title: string;
  description: string;
  endpoint: string;
  fields: Field[];
  columns: Column[];
  permissions: { add: string; edit: string; remove: string };
  resourceType: string;
  assignment?: AssignmentConfig;
};

export function ResourceCrud({ title, description, endpoint, fields, columns, permissions, resourceType, assignment }: Props) {
  const [rows, setRows] = useState<Resource[]>([]);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [access, setAccess] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [assignmentRow, setAssignmentRow] = useState<Resource | null>(null);
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOption[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listState, setListState] = useState<ListState>({ search: "", sort: { columnId: "createdAt", direction: "desc" }, page: { limit: 25, offset: 0, total: 0 } });
  const requestIdRef = useRef(0);
  const lockResourceId = assignmentRow?.id ?? editing?.id ?? "";
  const lock = useRecordLock(resourceType, lockResourceId, Boolean(lockResourceId));

  async function load(state = listState) {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrorMessage("");
    try {
      const [resourceResponse, accessResponse] = await Promise.all([fetch(makeListUrl(endpoint, state)), fetch("/api/v1/me/access")]);
      const resourceBody = await resourceResponse.json() as ListResponse<Resource>;
      const accessBody = await accessResponse.json();
      if (!resourceResponse.ok) throw new Error(resourceBody.error?.message ?? "Unable to load records");
      if (!resourceBody.meta) throw new Error("Invalid list response");
      if (requestId !== requestIdRef.current) return;
      if (resourceBody.meta.total > 0 && state.page.offset >= resourceBody.meta.total) {
        const offset = Math.floor((resourceBody.meta.total - 1) / state.page.limit) * state.page.limit;
        setListState((current) => ({ ...current, page: { ...resourceBody.meta!, offset } }));
        return;
      }
      setRows(resourceBody.data ?? []);
      setAccess(new Set(accessBody.data?.permissions ?? []));
      setListState((current) => ({ ...current, page: resourceBody.meta! }));
    } catch (error) {
      if (requestId === requestIdRef.current) setErrorMessage(error instanceof Error ? error.message : "Unable to load records");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [endpoint, listState.search, listState.page.limit, listState.page.offset, listState.sort.columnId, listState.sort.direction]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    const nextFieldErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = form.get(field.name);
      const fieldValue = typeof value === "string" ? value : "";
      const validationMessage = validateField(field, fieldValue, !editing?.id);
      if (validationMessage) nextFieldErrors[field.name] = validationMessage;
      if (field.type === "checkbox") payload[field.name] = value === "on";
      else if (field.type === "number") payload[field.name] = value === "" ? undefined : Number(value);
      else if (value !== null && value !== "") payload[field.name] = value;
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) { setSaving(false); return; }
    try {
      if (editing?.id && lock.readOnly) throw new Error("Record is locked by another editor");
      const resourceId = editing?.id;
      const isEditing = Boolean(resourceId);
      const response = await fetch(isEditing ? `${endpoint}/${resourceId}` : endpoint, { method: isEditing ? "PATCH" : "POST", headers: { "content-type": "application/json", ...(isEditing && lock.token ? { "X-Record-Lock-Token": lock.token } : {}) }, body: JSON.stringify(payload) });
      const body = await readResponseBody(response);
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to save record");
      setEditing(null);
      await load();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Unable to save record"); } finally { setSaving(false); }
  }

  async function confirmRemove() {
    if (!deleteRow) return;
    setDeleting(true);
    setErrorMessage("");
    try {
      const acquired = await fetch("/api/v1/locks/acquire", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resourceType, resourceId: deleteRow.id }) });
      const acquiredBody = await readResponseBody<{ token: string; lock: { id: string } }>(acquired);
      if (!acquired.ok || !acquiredBody.data?.token) throw new Error(acquiredBody.error?.message ?? "Unable to acquire record lock");
      const response = await fetch(`${endpoint}/${deleteRow.id}`, { method: "DELETE", headers: { "X-Record-Lock-Token": acquiredBody.data.token } });
      const body = await readResponseBody(response);
      await fetch(`/api/v1/locks/${acquiredBody.data.lock.id}`, { method: "DELETE", headers: { "X-Record-Lock-Token": acquiredBody.data.token }, keepalive: true });
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to delete record");
      setDeleteRow(null);
      await load();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Unable to delete record"); } finally { setDeleting(false); }
  }

  function updateFieldError(field: Field, value: string) {
    const message = validateField(field, value, !editing?.id);
    setFieldErrors((current) => {
      const next = { ...current };
      if (message) next[field.name] = message;
      else delete next[field.name];
      return next;
    });
  }

  async function openAssignment(row: Resource) {
    if (!assignment) return;
    setErrorMessage("");
    setAssignmentRow(row);
    try {
      const response = await fetch(`${endpoint}/${row.id}/${assignment.endpointSuffix}`);
      const body = await readResponseBody<{ options: AssignmentOption[]; assignedRoleIds?: string[]; assignedPermissionIds?: string[] }>(response);
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to load assignments");
      setAssignmentOptions(body.data?.options ?? []);
      setAssignedIds(body.data?.assignedRoleIds ?? body.data?.assignedPermissionIds ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load assignments");
      setAssignmentRow(null);
    }
  }

  async function saveAssignment() {
    if (!assignment || !assignmentRow) return;
    if (lock.readOnly || !lock.token) { setErrorMessage("Record is locked by another editor"); return; }
    setAssignmentSaving(true);
    try {
      const response = await fetch(`${endpoint}/${assignmentRow.id}/${assignment.endpointSuffix}`, { method: "PUT", headers: { "content-type": "application/json", "X-Record-Lock-Token": lock.token }, body: JSON.stringify({ [assignment.payloadKey]: assignedIds }) });
      const body = await readResponseBody(response);
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to save assignments");
      setAssignmentRow(null);
      await load();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Unable to save assignments"); } finally { setAssignmentSaving(false); }
  }

  const canAdd = access.has(permissions.add);
  const canEdit = access.has(permissions.edit);
  const canRemove = access.has(permissions.remove);
  const canAssign = Boolean(assignment && access.has(assignment.permission));
  const tableColumns: DataTableColumn<Resource>[] = columns.map((column) => ({
    id: column.key,
    label: column.label,
    cell: (row) => column.key === "status" ? <span className={`status-badge ${row[column.key] === "ACTIVE" ? "status-active" : row[column.key] === "DISABLED" ? "status-disabled" : "status-neutral"}`}>{String(row[column.key] ?? "UNKNOWN")}</span> : column.key === "recordLockEnabled" ? <span className={`status-badge ${row[column.key] ? "status-active" : "status-neutral"}`}>{row[column.key] ? "Enabled" : "Off"}</span> : String(row[column.key] ?? "-")
  }));
  const lockOwnerName = lock.owner?.displayName || lock.owner?.username || "another user";
  const deleteName = String(deleteRow?.name ?? deleteRow?.username ?? deleteRow?.code ?? deleteRow?.id ?? "this record");

  function setSearch(search: string) { setListState((current) => ({ ...current, search, page: { ...current.page, offset: 0 } })); }
  function setSort(sort: DataTableSort) { setListState((current) => ({ ...current, sort, page: { ...current.page, offset: 0 } })); }
  function setLimit(limit: number) { setListState((current) => ({ ...current, page: { ...current.page, limit, offset: 0 } })); }
  function setOffset(offset: number) { setListState((current) => ({ ...current, page: { ...current.page, offset } })); }

  return <section className="space-y-6"><header className="document-header"><div className="toolbar"><div className="document-title-row"><span className="page-icon"><Icon name="archive" /></span><div><p className="eyebrow">Workspace directory</p><h1 className="document-title mt-1">{title}</h1></div></div>{canAdd && <Button onClick={() => { setFieldErrors({}); setEditing({ id: "" }); }}><Icon name="add" />Add {title.slice(0, -1)}</Button>}</div><p className="document-description">{description}</p></header>{errorMessage && <p className="notice notice-error" role="alert"><Icon name="warning" />{errorMessage}</p>}{assignmentRow && assignment && <section className="panel space-y-4 p-5"><div><p className="eyebrow">Access assignment</p><h2 className="mt-1 text-lg font-semibold">Assign {assignment.label.toLowerCase()} to {String(assignmentRow.username ?? assignmentRow.name ?? assignmentRow.displayName ?? assignmentRow.id)}</h2><p className="mt-1 text-sm text-[var(--muted)]">Choose one or more {assignment.label.toLowerCase()}. Changes replace direct assignments.</p></div><LockBanner checking={lock.checking} ownerName={lockOwnerName} readOnly={lock.readOnly} /><div className="grid gap-2 sm:grid-cols-2">{assignmentOptions.map((option) => <label className={`flex gap-3 rounded-[6px] border border-[var(--line)] p-3 text-sm ${lock.readOnly || lock.checking ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[var(--surface-hover)]"}`} key={option.id}><input checked={assignedIds.includes(option.id)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" disabled={lock.readOnly || lock.checking} onChange={(event) => setAssignedIds((current) => event.target.checked ? [...current, option.id] : current.filter((id) => id !== option.id))} type="checkbox" /><span><span className="block font-semibold">{option.name}</span><span className="font-mono text-xs text-[var(--muted)]">{option.code}</span>{option.routePath && <span className="block text-xs text-[var(--subtle)]">{option.routePath}</span>}</span></label>)}</div><div className="flex flex-wrap gap-2"><Button disabled={assignmentSaving || lock.readOnly || lock.checking} onClick={() => void saveAssignment()}>{assignmentSaving ? "Saving..." : lock.readOnly ? "Read-only" : lock.checking ? "Checking lock..." : `Save ${assignment.label.toLowerCase()}`}</Button><Button onClick={() => setAssignmentRow(null)} variant="secondary">Cancel</Button></div></section>}{editing && <form className="panel grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}><div className="sm:col-span-2"><p className="eyebrow">Record editor</p><h2 className="mt-1 text-lg font-semibold">{editing.id ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}</h2></div>{editing.id && <div className="sm:col-span-2"><LockBanner checking={lock.checking} ownerName={lockOwnerName} readOnly={lock.readOnly} /></div>}{fields.map((field) => <label className="grid gap-1.5 text-sm font-semibold" key={field.name}>{field.label}{field.type === "select" ? <select className={`input-base ${fieldErrors[field.name] ? "border-[var(--danger)]" : ""}`} defaultValue={String(editing[field.name] ?? "")} disabled={Boolean(editing.id && (lock.readOnly || lock.checking))} name={field.name} onBlur={(event) => updateFieldError(field, event.currentTarget.value)} onChange={(event) => updateFieldError(field, event.currentTarget.value)} required={field.required}><option value="">Select...</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === "checkbox" ? <input className="h-4 w-4 accent-[var(--primary)]" defaultChecked={Boolean(editing[field.name])} disabled={Boolean(editing.id && (lock.readOnly || lock.checking))} name={field.name} type="checkbox" /> : <input className={`input-base ${fieldErrors[field.name] ? "border-[var(--danger)]" : ""}`} defaultValue={field.type === "password" ? "" : String(editing[field.name] ?? "")} disabled={Boolean(editing.id && (lock.readOnly || lock.checking))} minLength={!editing.id ? field.minLength : undefined} name={field.name} onBlur={(event) => updateFieldError(field, event.currentTarget.value)} onChange={(event) => updateFieldError(field, event.currentTarget.value)} required={!editing.id && field.required} type={field.type ?? "text"} />}{fieldErrors[field.name] ? <span className="text-xs font-medium text-[var(--danger)]">{fieldErrors[field.name]}</span> : <span className="text-xs font-normal text-[var(--muted)]">{field.name === "password" ? "Minimal 8 karakter." : field.name === "username" ? "Minimal 3 karakter." : field.required ? "Wajib diisi." : "Opsional."}</span>}</label>)}<div className="flex flex-wrap gap-2 sm:col-span-2"><Button disabled={saving || Boolean(editing.id && (lock.readOnly || lock.checking))} type="submit">{saving ? "Saving..." : editing.id && lock.readOnly ? "Read-only" : editing.id && lock.checking ? "Checking lock..." : "Save record"}</Button><Button onClick={() => setEditing(null)} variant="secondary">Cancel</Button></div></form>}<section className="panel overflow-hidden">{loading ? <div className="space-y-3 p-5"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-11" /><div className="skeleton h-11" /></div> : <DataTable actionsLabel="Actions" caption={`${title} records`} columns={tableColumns} emptyState={<div className="empty-state"><span className="empty-state-icon"><Icon name="empty" /></span><p className="mt-3 font-semibold">No matching records</p><p className="mt-1 text-sm text-[var(--muted)]">Try another search term or create your first record.</p></div>} onLimitChange={setLimit} onOffsetChange={setOffset} onSearchChange={setSearch} onSortChange={setSort} page={listState.page} renderActions={(row) => <>{canAssign && assignment && <Button onClick={() => void openAssignment(row)} size="compact" variant="secondary">{assignment.label}</Button>}{canEdit && <Button aria-label={`Edit ${String(row.name ?? row.username ?? row.id)}`} onClick={() => { setFieldErrors({}); setEditing(row); }} size="compact" variant="quiet"><Icon name="edit" /><span className="sr-only">Edit</span></Button>}{canRemove && <Button aria-label={`Delete ${String(row.name ?? row.username ?? row.id)}`} onClick={() => setDeleteRow(row)} size="compact" variant="quiet"><Icon className="text-[var(--danger)]" name="delete" /><span className="sr-only">Delete</span></Button>}</>} rows={rows} search={listState.search} searchPlaceholder={`Search ${title.toLowerCase()}...`} sort={listState.sort} />}</section><ConfirmDialog confirmLabel="Delete record" description={`Delete ${deleteName}? This action cannot be undone.`} onCancel={() => setDeleteRow(null)} onConfirm={() => void confirmRemove()} open={Boolean(deleteRow)} pending={deleting} title="Delete record" /></section>;
}
