import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYMBOLS = [
  { symbol: "SPY",   label: "S&P 500",      group: "indices" },
  { symbol: "QQQ",   label: "Nasdaq 100",   group: "indices" },
  { symbol: "DIA",   label: "Dow Jones",    group: "indices" },
  { symbol: "VIXY",  label: "VIX Proxy",    group: "indices" },
  { symbol: "XLK",   label: "Technology",   group: "sectors" },
  { symbol: "XLF",   label: "Financials",   group: "sectors" },
  { symbol: "XLE",   label: "Energy",       group: "sectors" },
  { symbol: "XLV",   label: "Healthcare",   group: "sectors" },
  { symbol: "XLY",   label: "Cons. Disc.",  group: "sectors" },
  { symbol: "XLI",   label: "Industrials",  group: "sectors" },
  { symbol: "XLC",   label: "Comm. Svcs.",  group: "sectors" },
  { symbol: "XLB",   label: "Materials",    group: "sectors" },
  { symbol: "ARGT",  label: "Merval ETF",   group: "global"  },
  { symbol: "EWZ",   label: "Brazil",       group: "global"  },
  { symbol: "MCHI",  label: "China",        group: "global"  },
  { symbol: "EEM",   label: "Em. Markets",  group: "global"  },
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// Fetch from Yahoo Finance with proper cookie/crumb handshake
async function fetchYahoo() {
  // Step 1: get cookie
  const cookieRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  const rawCookie = cookieRes.headers.get("set-cookie") ?? "";
  const cookie = rawCookie.split(";")[0];

  if (!cookie) throw new Error("No cookie");

  // Step 2: get crumb
  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, "Cookie": cookie },
    signal: AbortSignal.timeout(5000),
  });
  const crumb = (await crumbRes.text()).trim();
  if (!crumb || crumb.length > 20) throw new Error("Bad crumb");

  // Step 3: quote
  const syms = SYMBOLS.map(s => encodeURIComponent(s.symbol)).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${syms}&crumb=${encodeURIComponent(crumb)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Cookie": cookie },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = await res.json();
  return json?.quoteResponse?.result ?? [];
}

// Fallback: Stooq CSV for each symbol  
async function fetchStooqOne(symbol: string) {
  const url = `https://stooq.com/q/l/?s=${symbol.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;
  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;
  const cols = lines[1].split(",");
  const close = parseFloat(cols[6]);
  const open  = parseFloat(cols[4]);
  if (!close || isNaN(close) || close === 0) return null;
  const change    = close - open;
  const changePct = (change / open) * 100;
  return { price: close, change, changePct };
}

export async function GET() {
  let yahooQuotes: Record<string, unknown>[] = [];
  let yahooOk = false;

  try {
    yahooQuotes = await fetchYahoo();
    yahooOk = yahooQuotes.length > 0;
  } catch (e) {
    console.log("Yahoo failed:", e);
  }

  const data = await Promise.all(SYMBOLS.map(async (s) => {
    // Try Yahoo first
    if (yahooOk) {
      const q = yahooQuotes.find((r) => (r as Record<string,unknown>).symbol === s.symbol) as Record<string,number> | undefined;
      if (q?.regularMarketPrice) {
        return {
          symbol: s.symbol, label: s.label, group: s.group,
          price:     q.regularMarketPrice,
          change:    q.regularMarketChange,
          changePct: q.regularMarketChangePercent,
        };
      }
    }
    // Fallback to Stooq
    try {
      const q = await fetchStooqOne(s.symbol);
      if (q) return { symbol: s.symbol, label: s.label, group: s.group, ...q };
    } catch { /* ignore */ }
    return { symbol: s.symbol, label: s.label, group: s.group, price: null, change: null, changePct: null };
  }));

  return NextResponse.json(
    { data, timestamp: Date.now(), source: yahooOk ? "yahoo" : "stooq" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
