import type { ServiceListResp, PolicyInstancesResp, RicInfo, RicListResp } from "./types";

const BASE = import.meta.env.VITE_RAPP_BASE ?? "";

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}: ${body}`);
  }

  const data = (await res.json()) as T;
  if (path == "/api/rics") {
    console.log(data, "RICD")
  }
  return data;
}

async function text(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}: ${body}`);
  }
  return res.text();
}

export const getAppHealth        = () => json<{ ok: boolean }>("/healthz");
export const getAppVersion       = () => text("/version");
export const getServiceList      = () => json<ServiceListResp>("/api/services");
export const getPolicyInstances  = () => json<PolicyInstancesResp>("/api/policies");

export async function getPolicyTypes(ric?: string): Promise<string[]> {
  const url = ric ? `/api/policy-types?ric_id=${encodeURIComponent(ric)}` : "/api/policy-types";
  const raw = await json<any>(url);
  return Array.isArray(raw) ? raw : (raw?.policytype_ids ?? []);
}

export const getRicList = async (): Promise<RicInfo[]> => {
  const raw = await json<RicListResp | RicInfo[]>("/api/rics");
  return Array.isArray(raw) ? raw : (raw?.rics ?? []);
};

export const setPolicyLimit = (limit: number) =>
  json<{ ok: boolean }>("/api/policies/limit", {
    method: "POST",
    body: JSON.stringify({ limit }),
  });
