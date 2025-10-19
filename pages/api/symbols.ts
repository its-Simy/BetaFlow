// /pages/api/symbols.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { searchStocks } from "../../lib/services/multiSourceStockService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.status(200).json({ results: [] });

    console.log(`🔍 Multi-source search for: "${q}"`);
    
    // Use the new multi-source search service
    const results = await searchStocks(q);
    
    console.log(`✅ Multi-source search returned ${results.length} results`);
    
    return res.status(200).json({ 
      results: results.map(r => ({
        symbol: r.symbol,
        name: r.name,
        primaryExchange: r.primaryExchange,
        locale: r.locale,
        type: r.type,
        source: r.source // Include source for debugging
      }))
    });
  } catch (err: any) {
    console.error('❌ Multi-source search error:', err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
