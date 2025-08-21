import type { ServiceListResp, PolicyInstancesResp, RicInfo } from "./types";

const BASE = import.meta.env.VITE_RAPP_BASE ?? "http://localhost:8088";

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function text(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}: ${body}`);
  }
  return res.text();
}

export const getAppHealth = () =>
  json<{ ok: boolean }>("/healthz");

export const getAppVersion = () =>
  text("/version");

export const getServiceList = () =>
  json<ServiceListResp>("/api/services");

export const getPolicyInstances = () =>
  json<PolicyInstancesResp>("/api/policies");

//get policy types in general and for a ric
export const getPolicyTypes = (ricId?: string) => {
  const q = ricId ? `?ric_id=${encodeURIComponent(ricId)}` : "";
  return json<any[]>(`/api/policy-types${q}`);
};

//get rics
export const getRicList = () =>
  json<RicInfo[]>("/api/rics");

// update the policy limit
export const setPolicyLimit = (limit: number) =>
  json<{ ok: boolean }>("/api/policies/limit", {
    method: "POST",
    body: JSON.stringify({ limit }),
  });
