// /lib/swr-hooks.ts
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Request failed: ${r.status}`);
    return r.json();
  });

export function useSymbolsSearch(query: string) {
  const shouldFetch = query && query.length >= 1;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/symbols?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { keepPreviousData: true }
  );
  return {
    results: (data?.results || []) as { symbol: string; name: string }[],
    isLoading,
    isError: !!error,
  };
}

type Quote = {
  symbol: string;
  price: number | null;
  prevClose: number | null;
  change: number;
  changePercent: number;
};

export function useBatchQuotes(symbols: string[]) {
  const key = symbols.length ? `/api/quotes?symbols=${symbols.join(",")}` : null;
  const { data, error, isLoading } = useSWR(key, fetcher, { refreshInterval: 30000 });
  return {
    quotes: (data?.quotes || []) as Quote[],
    isLoading,
    isError: !!error,
  };
}

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

export function useChart(
  symbol: string | null,
  params?: { span?: string; timespan?: string; from?: string; to?: string }
) {
  const key = symbol
    ? `/api/chart?symbol=${encodeURIComponent(symbol)}${
        params?.span ? `&span=${params.span}` : ""
      }${params?.timespan ? `&timespan=${params.timespan}` : ""}${
        params?.from ? `&from=${params.from}` : ""
      }${params?.to ? `&to=${params.to}` : ""}`
    : null;

  const { data, error, isLoading } = useSWR(key, fetcher);
  return {
    candles: (data?.candles || []) as Candle[],
    isLoading,
    isError: !!error,
  };
}
