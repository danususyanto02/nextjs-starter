"use client";

import { FormEvent, useEffect, useState } from "react";

type ExternalObject = { id: string; name: string; data?: Record<string, unknown> };

function providerMessage(status: number, fallback: string) {
  if (status === 504) return "External provider timeout. Try again.";
  if (status === 502) return "External provider error. Check provider availability and server configuration.";
  return fallback;
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

  async function load() {
    setLoading(true);
    setErrorMessage("");
    try {
      const [objectsResponse, accessResponse] = await Promise.all([
        fetch("/api/v1/integrations/restful-api-dev/objects"),
        fetch("/api/v1/me/access")
      ]);
      const objectsBody = await objectsResponse.json();
      const accessBody = await accessResponse.json();
      if (!objectsResponse.ok) throw new Error(providerMessage(objectsResponse.status, objectsBody.error?.message ?? "Unable to load objects"));
      setObjects(objectsBody.data ?? []);
      setPermissions(new Set(accessBody.data?.permissions ?? []));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load objects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function startCreate() {
    setEditing({ id: "", name: "", data: {} });
    setName("");
    setDataText("{}");
    setErrorMessage("");
  }

  function startEdit(object: ExternalObject) {
    setEditing(object);
    setName(object.name);
    setDataText(JSON.stringify(object.data ?? {}, null, 2));
    setErrorMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    let data: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(dataText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Data must be a JSON object");
      data = parsed as Record<string, unknown>;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Data must contain valid JSON");
      setSaving(false);
      return;
    }
    try {
      const response = await fetch(editing?.id ? `/api/v1/integrations/restful-api-dev/objects/${encodeURIComponent(editing.id)}` : "/api/v1/integrations/restful-api-dev/objects", {
        method: editing?.id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, data })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(providerMessage(response.status, body.error?.message ?? "Unable to save object"));
      setEditing(null);
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save object");
    } finally {
      setSaving(false);
    }
  }

  async function remove(object: ExternalObject) {
    if (!window.confirm(`Delete ${object.name}?`)) return;
    setErrorMessage("");
    try {
      const response = await fetch(`/api/v1/integrations/restful-api-dev/objects/${encodeURIComponent(object.id)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(providerMessage(response.status, body.error?.message ?? "Unable to delete object"));
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete object");
    }
  }

  const canAdd = permissions.has("AD0000007");
  const canEdit = permissions.has("ED0000007");
  const canRemove = permissions.has("DD0000007");

  return <section className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Integration workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">External API Demo</h1><p className="mt-2 text-[#6b6962]">CRUD through the internal proxy. Provider credentials never reach browser.</p></div>
      {canAdd && <button className="rounded-lg bg-[#5a5a40] px-4 py-3 text-sm font-bold text-white hover:bg-[#3d3d2b]" onClick={startCreate}>+ Create object</button>}
    </div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="panel p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a7870]">Provider</p><div className="mt-3 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2b9a66]" /><span className="font-bold">restful-api.dev</span></div></div><div className="panel p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a7870]">Objects loaded</p><p className="mt-2 text-3xl font-bold">{objects.length}</p></div><div className="panel p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a7870]">Transport</p><p className="mt-2 font-bold text-[#5a5a40]">Internal proxy only</p></div></div>
    {errorMessage && <p className="rounded-lg border-l-4 border-[#dc2626] bg-[#fff4f2] p-4 text-sm font-medium text-[#a53b36]">{errorMessage}</p>}
    {editing && <form className="panel grid gap-5 border-[#c9c6aa] bg-[#fbfaf6] p-5" onSubmit={submit}>
      <div><p className="eyebrow">Object editor</p><h2 className="mt-1 text-xl font-bold">{editing.id ? "Edit object" : "Create object"}</h2></div>
      <label className="grid gap-1 text-sm font-bold">Name<input value={name} onChange={(event) => setName(event.target.value)} required className="input-base" /></label>
      <label className="grid gap-1 text-sm font-bold">Data JSON<textarea value={dataText} onChange={(event) => setDataText(event.target.value)} rows={8} className="input-base font-mono text-sm" /></label>
      <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-[#5a5a40] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save object"}</button><button type="button" className="rounded-lg border border-[#d4d1cb] bg-white px-4 py-3 text-sm font-bold" onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
    <div className="panel overflow-hidden">
      {loading ? <div className="space-y-3 p-6"><div className="h-4 w-1/3 animate-pulse rounded bg-[#f1f0ea]" /><div className="h-20 animate-pulse rounded bg-[#f7f6f2]" /><div className="h-20 animate-pulse rounded bg-[#f7f6f2]" /></div> : objects.length === 0 ? <div className="p-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f1f0ea] text-xl text-[#8c7355]">↗</div><p className="mt-3 font-bold">No provider objects found</p><p className="mt-1 text-sm text-[#7a7870]">Create an object to start testing the integration.</p></div> : <table className="min-w-full text-left text-sm"><thead className="border-b border-[#ebe9e4] bg-[#fbfaf7]"><tr><th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a7870]">ID</th><th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a7870]">Name</th><th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a7870]">Data</th><th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a7870]">Actions</th></tr></thead><tbody>{objects.map((object) => <tr className="border-b align-top last:border-0 hover:bg-[#fbfaf7]" key={object.id}><td className="px-5 py-4 font-mono text-xs text-[#7a7870]">{object.id}</td><td className="px-5 py-4 font-bold text-[#1a1a1a]">{object.name}</td><td className="max-w-md whitespace-pre-wrap px-5 py-4 font-mono text-xs text-[#6b6962]">{JSON.stringify(object.data ?? {}, null, 2)}</td><td className="flex gap-2 px-5 py-3">{canEdit && <button className="rounded-md border border-[#d4d1cb] bg-white px-3 py-2 text-xs font-bold hover:border-[#5a5a40]" onClick={() => startEdit(object)}>Edit</button>}{canRemove && <button className="rounded-md border border-[#ead0ca] bg-[#fffaf9] px-3 py-2 text-xs font-bold text-[#a53b36]" onClick={() => void remove(object)}>Delete</button>}</td></tr>)}</tbody></table>}
    </div>
  </section>;
}
