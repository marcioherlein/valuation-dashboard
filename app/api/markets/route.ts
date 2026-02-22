import { NextResponse } from "next/server";

const SYMBOLS = [
  // US Indices & Macro
  { symbol: "SPY",   label: "S&P 500",     group: "indices" },
  { symbol: "QQQ",   label: "Nasdaq 100",  group: "indices" },
  { symbol: "DIA",   label: "Dow Jones",   group: "indices" },
  { symbol: "^VIX",  label: "VIX",         group: "indices" },
  // US Sectors (SPDR ETFs)
  { symbol: "XLK",   label: "Technology",  group: "sectors" },
  { symbol: "XLF",   label: "Financials",  group: "sectors" },
  { symbol: "XLE",   label: "Energy",      group: "sectors" },
  { symbol: "XLV",   label: "Healthcare",  group: "sectors" },
  { symbol: "XLY",   label: "Cons. Disc.", group: "sectors" },
  { symbol: "XLI",   label: "Industrials", group: "sectors" },
  { symbol: "XLC",   label: "Comm. Svcs.", group: "sectors" },
  { symbol: "XLB",   label: "Materials",   group: "sectors" },
  // Global
  { symbol: "^MERV", label: "Merval",      group: "global" },
  { symbol: "EWZ",   label: "Brazil (EWZ)",group: "global" },
  { symbol: "MCHI",  label: "China (MCHI)",group: "global" },
  { symbol: "EEM",   label: "EM",          group: "global" },
];

export async function GET() {
  try {
    const symbolList = SYMBOLS.map(s => s.symbol).join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolList)}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,regularMarketPreviousClose,shortName`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
      next: { revalidate: 60 }, // cache 60s
    });

    if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);

    const json = await res.json();
    const quotes = json?.quoteResponse?.result ?? [];

    const data = SYMBOLS.map(s => {
      const q = quotes.find((r: { symbol: string }) => r.symbol === s.symbol);
      return {
        symbol:  s.symbol,
        label:   s.label,
        group:   s.group,
        price:   q?.regularMarketPrice ?? null,
        change:  q?.regularMarketChange ?? null,
        changePct: q?.regularMarketChangePercent ?? null,
        prevClose: q?.regularMarketPreviousClose ?? null,
      };
    });

    return NextResponse.json({ data, timestamp: Date.now() });
  } catch (err) {
    console.error("Market fetch error:", err);
    return NextResponse.json({ data: [], timestamp: Date.now(), error: "fetch_failed" }, { status: 200 });
  }
}
