"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRecordLock } from "@/hooks/useRecordLock";

type Field = { name: string; label: string; type?: "text" | "password" | "email" | "number" | "select" | "checkbox"; required?: boolean; options?: string[] };
type Column = { key: string; label: string };
type Resource = Record<string, unknown> & { id: string };

async function readResponseBody<T = unknown>(response: Response): Promise<{ error?: { message?: string }; data?: T }> {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as { error?: { message?: string }; data?: T }; } catch { return {}; }
}

type Props = {
  title: string;
  description: string;
  endpoint: string;
  fields: Field[];
  columns: Column[];
  permissions: { add: string; edit: string; remove: string };
  resourceType: string;
};

export function ResourceCrud({ title, description, endpoint, fields, columns, permissions, resourceType }: Props) {
  const [rows, setRows] = useState<Resource[]>([]);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [access, setAccess] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const lock = useRecordLock(resourceType, editing?.id ?? "", Boolean(editing?.id));

  async function load() {
    setLoading(true);
    setErrorMessage("");
    try {
      const [resourceResponse, accessResponse] = await Promise.all([fetch(endpoint), fetch("/api/v1/me/access")]);
      const resourceBody = await resourceResponse.json();
      const accessBody = await accessResponse.json();
      if (!resourceResponse.ok) throw new Error(resourceBody.error?.message ?? "Unable to load records");
      setRows(resourceBody.data ?? []);
      setAccess(new Set(accessBody.data?.permissions ?? []));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [endpoint]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = form.get(field.name);
      if (field.type === "checkbox") payload[field.name] = value === "on";
      else if (field.type === "number") payload[field.name] = value === "" ? undefined : Number(value);
      else if (value !== null && value !== "") payload[field.name] = value;
    }
    try {
      if (editing?.id && lock.readOnly) throw new Error("Record is locked by another editor");
      const resourceId = editing?.id;
      const isEditing = Boolean(resourceId);
      const response = await fetch(isEditing ? `${endpoint}/${resourceId}` : endpoint, { method: isEditing ? "PATCH" : "POST", headers: { "content-type": "application/json", ...(isEditing && lock.token ? { "X-Record-Lock-Token": lock.token } : {}) }, body: JSON.stringify(payload) });
      const body = await readResponseBody(response);
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to save record");
      setEditing(null);
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save record");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Resource) {
    if (!window.confirm(`Delete ${String(row.name ?? row.username ?? row.code ?? row.id)}?`)) return;
    setErrorMessage("");
    const acquired = await fetch("/api/v1/locks/acquire", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resourceType, resourceId: row.id }) });
    const acquiredBody = await readResponseBody<{ token: string; lock: { id: string } }>(acquired);
    if (!acquired.ok || !acquiredBody.data?.token) { setErrorMessage(acquiredBody.error?.message ?? "Unable to acquire record lock"); return; }
    const response = await fetch(`${endpoint}/${row.id}`, { method: "DELETE", headers: { "X-Record-Lock-Token": acquiredBody.data.token } });
    const body = await readResponseBody(response);
    await fetch(`/api/v1/locks/${acquiredBody.data.lock.id}`, { method: "DELETE", headers: { "X-Record-Lock-Token": acquiredBody.data.token }, keepalive: true });
    if (!response.ok) setErrorMessage(body.error?.message ?? "Unable to delete record"); else await load();
  }

  const canAdd = access.has(permissions.add);
  const canEdit = access.has(permissions.edit);
  const canRemove = access.has(permissions.remove);
  const filteredRows = rows.filter((row) => query.trim() === "" || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase())));
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="eyebrow">Workspace directory</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1a1a1a]">{title}</h1><p className="mt-2 max-w-xl text-[#6b6962]">{description}</p></div>
        {canAdd && <button className="rounded-lg bg-[#5a5a40] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#3d3d2b]" onClick={() => setEditing({ id: "" })}>+ Add {title.slice(0, -1)}</button>}
      </div>
      {errorMessage && <p className="rounded-lg border-l-4 border-[#dc2626] bg-[#fff4f2] p-4 text-sm font-medium text-[#a53b36]">{errorMessage}</p>}
      {editing && <form className="panel grid gap-5 border-[#c9c6aa] bg-[#fbfaf6] p-5 sm:grid-cols-2" onSubmit={submit}>
        <div className="sm:col-span-2"><p className="eyebrow">Record editor</p><h2 className="mt-1 text-xl font-bold">{editing.id ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}</h2></div>
        {fields.map((field) => <label className="grid gap-1 text-sm font-medium" key={field.name}>{field.label}
          {field.type === "select" ? <select name={field.name} defaultValue={String(editing[field.name] ?? "")} required={field.required} className="input-base"><option value="">Select...</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === "checkbox" ? <input name={field.name} type="checkbox" defaultChecked={Boolean(editing[field.name])} className="h-5 w-5 accent-[#5a5a40]" /> : <input name={field.name} type={field.type ?? "text"} defaultValue={field.type === "password" ? "" : String(editing[field.name] ?? "")} required={!editing.id && field.required} className="input-base" />}
        </label>)}
        <div className="flex gap-2 sm:col-span-2"><button disabled={saving || Boolean(editing.id && lock.readOnly)} className="rounded-lg bg-[#5a5a40] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving..." : editing.id && lock.readOnly ? "Read-only" : "Save record"}</button><button type="button" className="rounded-lg border border-[#d4d1cb] bg-white px-4 py-3 text-sm font-bold text-[#4d4b43] hover:border-[#5a5a40]" onClick={() => setEditing(null)}>Cancel</button></div>
      </form>}
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#ebe9e4] p-4 sm:flex-row sm:items-center sm:justify-between"><div><span className="text-sm font-bold text-[#1a1a1a]">All records</span><span className="ml-2 rounded-full bg-[#f1f0ea] px-2 py-1 text-xs font-bold text-[#6b6962]">{filteredRows.length}</span></div><div className="relative w-full sm:w-72"><span className="pointer-events-none absolute left-3 top-2.5 text-[#9b988e]">⌕</span><input className="input-base w-full pl-9 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></div></div>
        {loading ? <div className="space-y-3 p-6"><div className="h-4 w-1/3 animate-pulse rounded bg-[#f1f0ea]" /><div className="h-12 animate-pulse rounded bg-[#f7f6f2]" /><div className="h-12 animate-pulse rounded bg-[#f7f6f2]" /></div> : filteredRows.length === 0 ? <div className="p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f1f0ea] text-xl text-[#8c7355]">⌁</div><p className="mt-3 font-bold text-[#1a1a1a]">No records found</p><p className="mt-1 text-sm text-[#7a7870]">Try another search or create your first record.</p></div> : <table className="min-w-full text-left text-sm"><thead className="border-b border-[#ebe9e4] bg-[#fbfaf7]"><tr>{columns.map((column) => <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a7870]" key={column.key}>{column.label}</th>)}<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a7870]">Actions</th></tr></thead><tbody>{filteredRows.map((row) => <tr className="border-b border-[#f1f0ea] transition last:border-0 hover:bg-[#fbfaf7]" key={row.id}>{columns.map((column) => <td className="px-5 py-4 text-[#4d4b43]" key={column.key}>{column.key === "status" ? <span className={`status-badge ${row[column.key] === "ACTIVE" ? "status-active" : row[column.key] === "DISABLED" ? "status-disabled" : "status-neutral"}`}>{String(row[column.key] ?? "UNKNOWN")}</span> : column.key === "recordLockEnabled" ? <span className={`status-badge ${row[column.key] ? "status-active" : "status-neutral"}`}>{row[column.key] ? "Enabled" : "Off"}</span> : String(row[column.key] ?? "-")}</td>)}<td className="flex gap-2 px-5 py-3">{canEdit && <button className="rounded-md border border-[#d4d1cb] bg-white px-3 py-2 text-xs font-bold text-[#4d4b43] hover:border-[#5a5a40] hover:text-[#5a5a40]" onClick={() => setEditing(row)}>Edit</button>}{canRemove && <button className="rounded-md border border-[#ead0ca] bg-[#fffaf9] px-3 py-2 text-xs font-bold text-[#a53b36] hover:bg-[#fff1ee]" onClick={() => void remove(row)}>Delete</button>}</td></tr>)}</tbody></table>}
      </div>
    </section>
  );
}
