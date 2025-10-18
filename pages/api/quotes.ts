// /pages/api/quotes.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { POLY_KEY } from "../../lib/env";

const POLYGON_BASE = "https://api.polygon.io";

type QuoteOut = {
  symbol: string;
  price: number | null;
  prevClose: number | null;
  change: number;
  changePercent: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const symbols = typeof req.query.symbols === "string" ? req.query.symbols : "";
    if (!symbols) return res.status(400).json({ error: "symbols is required, comma separated" });

    if (!POLY_KEY) return res.status(500).json({ error: "POLYGON_KEY not configured" });

    const list = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (!list.length) return res.status(200).json({ quotes: [] });

    // prev close for baseline
    const prevClosePromises = list.map(async (sym) => {
      const r = await fetch(
        `${POLYGON_BASE}/v2/aggs/ticker/${sym}/prev?adjusted=true&apiKey=${POLY_KEY}`
      );
      return { sym, json: r.ok ? await r.json() : null };
    });

    // last trade (may be delayed or limited on free tier)
    const lastTradePromises = list.map(async (sym) => {
      const r = await fetch(`${POLYGON_BASE}/v2/last/trade/${sym}?apiKey=${POLY_KEY}`);
      return { sym, json: r.ok ? await r.json() : null };
    });

    const [prevs, lasts] = await Promise.all([
      Promise.all(prevClosePromises),
      Promise.all(lastTradePromises),
    ]);

    const lastMap = new Map(lasts.map(({ sym, json }) => [sym, json]));

    const quotes: QuoteOut[] = prevs.map(({ sym, json }) => {
      const prev = json?.results?.[0];
      const lt = lastMap.get(sym);
      const lastPrice = lt?.results?.p ?? null;
      const prevClose = prev?.c ?? null;
      const price = lastPrice ?? prevClose ?? null;
      const change = price != null && prevClose != null ? price - prevClose : 0;
      const changePercent =
        price != null && prevClose ? (change / prevClose) * 100 : 0;

      return { symbol: sym, price, prevClose, change, changePercent };
    });

    return res.status(200).json({ quotes });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
