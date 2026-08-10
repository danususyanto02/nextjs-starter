export class ProviderTimeoutError extends Error {}
export class ProviderError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function providerFetch<T>(url: string, init: RequestInit = {}, timeoutMs = 10000, parse: (value: unknown) => T = (value) => value as T) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new ProviderError(response.status, "External provider request failed");
    return parse(await response.json());
  } catch (caught) { if (caught instanceof ProviderError) throw caught; if ((caught as { name?: string }).name === "AbortError") throw new ProviderTimeoutError("External provider timed out"); throw new ProviderError(502, "External provider unavailable"); }
  finally { clearTimeout(timer); }
}
