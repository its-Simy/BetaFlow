// /lib/env.ts
export const POLY_KEY =
  process.env.POLYGON_KEY || process.env.POLYGON_API_KEY || "";

export function assertPolyKey() {
  if (!POLY_KEY) {
    throw new Error("POLYGON_KEY not configured");
  }
  return POLY_KEY;
}
