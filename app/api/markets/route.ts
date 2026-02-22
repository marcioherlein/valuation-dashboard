import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYMBOLS = [
  { symbol: "SPY",   label: "S&P 500",      group: "indices", type: "stock" },
  { symbol: "QQQ",   label: "Nasdaq 100",   group: "indices", type: "stock" },
  { symbol: "DIA",   label: "Dow Jones",    group: "indices", type: "stock" },
  { symbol: "VIXY",  label: "VIX",          group: "indices", type: "stock" },
  { symbol: "XLK",   label: "Technology",   group: "sectors", type: "stock" },
  { symbol: "XLF",   label: "Financials",   group: "sectors", type: "stock" },
  { symbol: "XLE",   label: "Energy",       group: "sectors", type: "stock" },
  { symbol: "XLV",   label: "Healthcare",   group: "sectors", type: "stock" },
  { symbol: "XLY",   label: "Cons. Disc.",  group: "sectors", type: "stock" },
  { symbol: "XLI",   label: "Industrials",  group: "sectors", type: "stock" },
  { symbol: "XLC",   label: "Comm. Svcs.",  group: "sectors", type: "stock" },
  { symbol: "XLB",   label: "Materials",    group: "sectors", type: "stock" },
  { symbol: "ARGT",  label: "Merval (ETF)", group: "global",  type: "stock" },
  { symbol: "EWZ",   label: "Brazil",       group: "global",  type: "stock" },
  { symbol: "MCHI",  label: "China",        group: "global",  type: "stock" },
  { symbol: "EEM",   label: "Em. Markets",  group: "global",  type: "stock" },
];

async function fetchFromFinnhub(symbol: string): Promise<{ price: number | null; changePct: number | null; change: number | null }> {
  // Finnhub free tier — no API key needed for basic quotes via this endpoint
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`,
      { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { price: null, changePct: null, change: null };
    const j = await res.json();
    if (!j.c || j.c === 0) return { price: null, changePct: null, change: null };
    return {
      price: j.c,
      changePct: j.dp,
      change: j.d,
    };
  } catch {
    return { price: null, changePct: null, change: null };
  }
}

async function fetchFromStooq(symbol: string): Promise<{ price: number | null; changePct: number | null; change: number | null }> {
  // Stooq — free, no auth, supports ETFs well
  try {
    const res = await fetch(
      `https://stooq.com/q/l/?s=${symbol.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return { price: null, changePct: null, change: null };
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return { price: null, changePct: null, change: null };
    const cols = lines[1].split(",");
    const close = parseFloat(cols[6]);
    const open  = parseFloat(cols[4]);
    if (!close || isNaN(close)) return { price: null, changePct: null, change: null };
    const change = close - open;
    const changePct = (change / open) * 100;
    return { price: close, changePct, change };
  } catch {
    return { price: null, changePct: null, change: null };
  }
}

async function fetchQuote(symbol: string): Promise<{ price: number | null; changePct: number | null; change: number | null }> {
  // Try Stooq first (more reliable, no rate limits for ETFs)
  const stooq = await fetchFromStooq(symbol);
  if (stooq.price) return stooq;
  // Fallback to Finnhub demo
  return fetchFromFinnhub(symbol);
}

export async function GET() {
  // Fetch all in parallel with individual timeouts
  const results = await Promise.allSettled(
    SYMBOLS.map(async (s) => {
      const q = await fetchQuote(s.symbol);
      return { ...s, ...q };
    })
  );

  const data = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return { ...SYMBOLS[i], price: null, changePct: null, change: null };
  });

  return NextResponse.json(
    { data, timestamp: Date.now() },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } }
  );
}
