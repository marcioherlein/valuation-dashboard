import { NextResponse } from "next/server";

// Force this route to always run dynamically — never pre-rendered at build time
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYMBOLS = [
  { symbol: "SPY",   label: "S&P 500",      group: "indices" },
  { symbol: "QQQ",   label: "Nasdaq 100",   group: "indices" },
  { symbol: "DIA",   label: "Dow Jones",    group: "indices" },
  { symbol: "^VIX",  label: "VIX",          group: "indices" },
  { symbol: "XLK",   label: "Technology",   group: "sectors" },
  { symbol: "XLF",   label: "Financials",   group: "sectors" },
  { symbol: "XLE",   label: "Energy",       group: "sectors" },
  { symbol: "XLV",   label: "Healthcare",   group: "sectors" },
  { symbol: "XLY",   label: "Cons. Disc.",  group: "sectors" },
  { symbol: "XLI",   label: "Industrials",  group: "sectors" },
  { symbol: "XLC",   label: "Comm. Svcs.",  group: "sectors" },
  { symbol: "XLB",   label: "Materials",    group: "sectors" },
  { symbol: "^MERV", label: "Merval",       group: "global"  },
  { symbol: "EWZ",   label: "Brazil (EWZ)", group: "global"  },
  { symbol: "MCHI",  label: "China (MCHI)", group: "global"  },
  { symbol: "EEM",   label: "EM",           group: "global"  },
];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function getCookieAndCrumb(): Promise<{ cookie: string; crumb: string } | null> {
  try {
    // Step 1: hit Yahoo Finance homepage to get a session cookie
    const cookieRes = await fetch("https://finance.yahoo.com/", {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      redirect: "follow",
    });
    const setCookie = cookieRes.headers.get("set-cookie") ?? "";
    // Extract the A3 or similar cookie
    const cookie = setCookie
      .split(",")
      .map((c: string) => c.split(";")[0].trim())
      .filter((c: string) => c.includes("="))
      .join("; ");

    // Step 2: get crumb
    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: {
        "User-Agent": UA,
        "Cookie": cookie,
        "Accept": "text/plain",
      },
    });
    const crumb = (await crumbRes.text()).trim();
    if (!crumb || crumb.includes("<")) return null; // HTML = not authed

    return { cookie, crumb };
  } catch {
    return null;
  }
}

async function fetchWithCrumb(cookie: string, crumb: string) {
  const symbolList = SYMBOLS.map(s => encodeURIComponent(s.symbol)).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolList}&crumb=${encodeURIComponent(crumb)}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,regularMarketPreviousClose`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Cookie": cookie,
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Quote fetch ${res.status}`);
  return res.json();
}

async function fetchFallback() {
  // Fallback: v8 endpoint (sometimes doesn't need crumb)
  const symbolList = SYMBOLS.map(s => s.symbol).join(",");
  const url = `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbolList)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Fallback ${res.status}`);
  return res.json();
}

export async function GET() {
  let quotes: Record<string, unknown>[] = [];

  try {
    // Try crumb flow first
    const auth = await getCookieAndCrumb();
    let json;
    if (auth) {
      json = await fetchWithCrumb(auth.cookie, auth.crumb);
    } else {
      json = await fetchFallback();
    }
    quotes = json?.quoteResponse?.result ?? [];
  } catch {
    // Try fallback silently
    try {
      const json = await fetchFallback();
      quotes = json?.quoteResponse?.result ?? [];
    } catch {
      // Return empty — client shows error state
    }
  }

  const data = SYMBOLS.map(s => {
    const q = quotes.find((r) => (r as { symbol: string }).symbol === s.symbol) as Record<string, number> | undefined;
    return {
      symbol:    s.symbol,
      label:     s.label,
      group:     s.group,
      price:     q?.regularMarketPrice     ?? null,
      change:    q?.regularMarketChange    ?? null,
      changePct: q?.regularMarketChangePercent ?? null,
      prevClose: q?.regularMarketPreviousClose ?? null,
    };
  });

  return NextResponse.json(
    { data, timestamp: Date.now() },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
  );
}
