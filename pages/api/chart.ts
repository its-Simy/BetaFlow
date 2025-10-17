// /pages/api/chart.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { POLY_KEY } from "../../lib/env";

const POLYGON_BASE = "https://api.polygon.io";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const { symbol, span = "1", timespan = "day", from, to } = req.query;
    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ error: "symbol is required" });
    }

    if (!POLY_KEY) return res.status(500).json({ error: "POLYGON_KEY not configured" });

    const fromStr =
      typeof from === "string" && from ? from : "2024-01-01";
    const toStr =
      typeof to === "string" && to ? to : new Date().toISOString().slice(0, 10);

    const url = new URL(
      `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/range/${span}/${timespan}/${fromStr}/${toStr}`
    );
    url.searchParams.set("adjusted", "true");
    url.searchParams.set("sort", "asc");
    url.searchParams.set("limit", "5000");
    url.searchParams.set("apiKey", POLY_KEY);

    const resp = await fetch(url.toString());
    if (!resp.ok) return res.status(resp.status).json({ error: `Polygon error ${resp.status}` });

    const data = await resp.json();
    const candles = (data.results ?? []).map((r: any) => ({
      t: r.t, o: r.o, h: r.h, l: r.l, c: r.c, v: r.v,
    }));

    return res.status(200).json({ symbol, candles, delayed: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
