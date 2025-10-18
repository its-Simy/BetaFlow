// /pages/api/symbols.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { POLY_KEY } from "../../lib/env";

const POLYGON_BASE = "https://api.polygon.io";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.status(200).json({ results: [] });

    if (!POLY_KEY) return res.status(500).json({ error: "POLYGON_KEY not configured" });

    const makeUrl = (market: "stocks" | "etfs") => {
      const url = new URL(`${POLYGON_BASE}/v3/reference/tickers`);
      url.searchParams.set("market", market);
      url.searchParams.set("active", "true");
      url.searchParams.set("search", q);
      url.searchParams.set("limit", "25");
      url.searchParams.set("order", "asc");
      url.searchParams.set("sort", "ticker");
      url.searchParams.set("locale", "us");
      url.searchParams.set("apiKey", POLY_KEY);
      return url.toString();
    };

    const [stocksResp, etfsResp] = await Promise.all([
      fetch(makeUrl("stocks")),
      fetch(makeUrl("etfs")),
    ]);

    if (!stocksResp.ok && !etfsResp.ok) {
      const status = stocksResp.ok ? etfsResp.status : stocksResp.status;
      return res.status(status).json({ error: `Polygon error ${status}` });
    }

    const [stocksData, etfsData] = await Promise.all([
      stocksResp.ok ? stocksResp.json() : Promise.resolve({ results: [] }),
      etfsResp.ok ? etfsResp.json() : Promise.resolve({ results: [] }),
    ]);

    // Exact ticker fast path if it looks like a ticker
    let exactData: any = { results: [] };
    if (/^[A-Za-z\.]{1,6}$/.test(q)) {
      const exact = new URL(`${POLYGON_BASE}/v3/reference/tickers`);
      exact.searchParams.set("ticker", q.toUpperCase());
      exact.searchParams.set("active", "true");
      exact.searchParams.set("limit", "1");
      exact.searchParams.set("locale", "us");
      exact.searchParams.set("apiKey", POLY_KEY);
      const resp = await fetch(exact.toString());
      if (resp.ok) exactData = await resp.json();
    }

    const combined = [
      ...(stocksData.results ?? []),
      ...(etfsData.results ?? []),
      ...(exactData.results ?? []),
    ];

    const seen = new Set<string>();
    const deduped = combined.filter((t: any) => {
      const tick = t.ticker;
      if (!tick || seen.has(tick)) return false;
      seen.add(tick);
      return true;
    });

    const results = deduped.map((t: any) => ({
      symbol: t.ticker,
      name: t.name,
      primaryExchange: t.primary_exchange || t.primary_exchange_symbol,
      locale: t.locale,
      type: t.type,
    }));

    return res.status(200).json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
