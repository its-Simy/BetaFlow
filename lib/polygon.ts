// /lib/polygon.ts
import { POLY_KEY, assertPolyKey } from "./env";

const BASE = "https://api.polygon.io";

export async function poly(
  path: string,
  params: Record<string, string | number | boolean> = {}
) {
  assertPolyKey();
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set("apiKey", POLY_KEY);
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`Polygon error: ${r.status}`);
  return r.json();
}
