"use client";
import { useState, useMemo, useCallback } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { CompanyDetail } from "@/types";

const FONT = "'Geist', -apple-system, sans-serif";
const MONO = "'Geist Mono', monospace";
const C = { blue:"var(--blue)", green:"var(--green)", red:"var(--red)", amber:"var(--amber)", t1:"var(--t1)", t2:"var(--t2)", t3:"var(--t3)", t4:"var(--t4)" };

const TT = {
  contentStyle: { background:"rgba(13,17,23,0.97)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:11, fontFamily:FONT, color:C.t1 },
  labelStyle: { color:C.t3, fontSize:10 },
};

// ── DCF Engine (runs in browser) ─────────────────────────────────────────────
function runDCF(params: {
  baseRevenue: number;          // starting revenue ($B)
  growthRates: number[];        // % per year
  ebitMargins: number[];        // % per year
  discountRate: number;         // % (CoE or WACC)
  terminalGrowth: number;       // %
  horizon: number;
  shareCount: number;           // millions
  netDebtAdj: number;           // $B to subtract from EV to get equity (positive = net debt)
  salesToCapital: number;       // reinvestment ratio
}): { intrinsicValue: number; forecast: {year:number;revenue:number;ebit:number;fcff:number;pvFCFF:number}[]; terminalValue: number; sumPV: number } {
  const { baseRevenue, growthRates, ebitMargins, discountRate, terminalGrowth, horizon, shareCount, netDebtAdj, salesToCapital } = params;
  const dr = discountRate / 100;
  const tg = terminalGrowth / 100;

  let revenue = baseRevenue;
  let sumPV = 0;
  const forecast = [];
  const startYear = 2026;

  for (let i = 0; i < horizon; i++) {
    const g = (growthRates[i] ?? growthRates[growthRates.length - 1]) / 100;
    revenue = revenue * (1 + g);
    const margin = (ebitMargins[i] ?? ebitMargins[ebitMargins.length - 1]) / 100;
    const ebit = revenue * margin;
    const reinvestment = (growthRates[i] ?? growthRates[growthRates.length - 1]) > 0
      ? (revenue - (i === 0 ? baseRevenue : forecast[i-1]?.revenue ?? baseRevenue)) / salesToCapital
      : 0;
    const fcff = ebit * 0.77 - reinvestment; // ~23% tax shield approx
    const pv = fcff / Math.pow(1 + dr, i + 1);
    sumPV += pv;
    forecast.push({ year: startYear + i, revenue: +revenue.toFixed(3), ebit: +ebit.toFixed(3), fcff: +fcff.toFixed(3), pvFCFF: +pv.toFixed(3) });
  }

  const lastEBIT   = forecast[forecast.length - 1]?.ebit ?? 0;
  const lastRevenue= forecast[forecast.length - 1]?.revenue ?? 0;
  const lastMargin = (ebitMargins[ebitMargins.length-1] ?? ebitMargins[0]) / 100;
  const terminalFCFF = lastRevenue * lastMargin * 0.77 * (1 + tg);
  const terminalValue = terminalFCFF / (dr - tg);
  const terminalPV = terminalValue / Math.pow(1 + dr, horizon);

  const ev = sumPV + terminalPV;
  const equityValue = ev - netDebtAdj;
  const ivPerShare = (equityValue * 1000) / shareCount; // B→M / shares

  return { intrinsicValue: +ivPerShare.toFixed(2), forecast, terminalValue: +terminalPV.toFixed(2), sumPV: +sumPV.toFixed(2) };
}

// ── Slider ───────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, format, color="var(--blue)", onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v:number)=>string; color?: string; onChange: (v:number)=>void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:10, fontWeight:600, color:C.t3, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:FONT }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color, fontFamily:MONO }}>{format(value)}</span>
      </div>
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:0, height:4, width:`${pct}%`, background:color, borderRadius:4, pointerEvents:"none", zIndex:1, opacity:0.7 }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width:"100%", position:"relative", zIndex:2 }}
        />
      </div>
    </div>
  );
}

// ── Path editor (array of per-year values) ───────────────────────────────────
function PathEditor({ label, values, min, max, step, format, color, onChange }: {
  label: string; values: number[]; min: number; max: number; step: number;
  format: (v:number)=>string; color: string;
  onChange: (vals: number[]) => void;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.t3, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:FONT }}>{label}</div>
      {values.map((v, i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"30px 1fr 52px", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:9, color:C.t4, fontFamily:MONO, textAlign:"right" }}>{2026 + i}</span>
          <input type="range" min={min} max={max} step={step} value={v}
            onChange={e => {
              const next = [...values];
              next[i] = parseFloat(e.target.value);
              onChange(next);
            }}
            style={{ width:"100%" }}
          />
          <span style={{ fontSize:11, fontWeight:700, color, fontFamily:MONO, textAlign:"right" }}>{format(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main editor component ─────────────────────────────────────────────────────
export default function AssumptionEditor({ data }: { data: CompanyDetail }) {
  const baseScenario = data.scenarios.base;

  // Extract base params from JSON data
  const baseRevenue = useMemo(() => {
    const firstRevRaw = baseScenario.forecast[0]?.revenue ?? 1.5;
    const growthRate  = (baseScenario.revenueGrowthPath?.[0] ?? baseScenario.deliveryGrowthPath?.[0] ?? 18) / 100;
    // Back out: forecast[0] = baseRevenue * (1 + g), so baseRevenue = forecast[0] / (1+g)
    return +(firstRevRaw / (1 + growthRate)).toFixed(3);
  }, [baseScenario]);

  const horizon = data.valuation.horizon ?? 10;
  const baseGrowth = baseScenario.revenueGrowthPath ?? baseScenario.deliveryGrowthPath ?? Array(horizon).fill(18);
  const baseMargins = baseScenario.ebitMarginPath ?? Array(horizon).fill(15);
  const baseDiscount = data.discountRate?.wacc ?? data.discountRate?.costOfEquity ?? 18;
  const baseTerminalG = data.discountRate?.terminalGrowth ?? 3;
  const shareCount = (data.sharesOutstanding ?? 80000000) / 1e6; // in millions

  // Net debt: borrowings - cash (positive = net debt)
  const netDebtAdj = data.bridge
    ? (((data.bridge.borrowings ?? 0) + (data.bridge.leases ?? 0) + (data.bridge.redeemablePreferred ?? 0) + (data.bridge.mezzanine ?? 0)) - (data.bridge.cash ?? 0)) / 1e9
    : 0;

  const salesToCapital = baseScenario.salestoCapital ?? 3.0;

  // Editor state — full per-year arrays
  const [growthRates, setGrowthRates] = useState<number[]>(() =>
    Array.from({ length: horizon }, (_, i) => baseGrowth[i] ?? baseGrowth[baseGrowth.length-1] ?? 18)
  );
  const [ebitMargins, setEbitMargins] = useState<number[]>(() =>
    Array.from({ length: horizon }, (_, i) => baseMargins[i] ?? baseMargins[baseMargins.length-1] ?? 15)
  );
  const [discountRate, setDiscountRate] = useState(baseDiscount);
  const [terminalG, setTerminalG]       = useState(baseTerminalG);

  const baseResult = useMemo(() => runDCF({
    baseRevenue, growthRates: baseGrowth as number[], ebitMargins: baseMargins as number[],
    discountRate: baseDiscount, terminalGrowth: baseTerminalG,
    horizon, shareCount, netDebtAdj, salesToCapital,
  }), [baseRevenue, baseGrowth, baseMargins, baseDiscount, baseTerminalG, horizon, shareCount, netDebtAdj, salesToCapital]);

  const userResult = useMemo(() => runDCF({
    baseRevenue, growthRates, ebitMargins,
    discountRate, terminalGrowth: terminalG,
    horizon, shareCount, netDebtAdj, salesToCapital,
  }), [baseRevenue, growthRates, ebitMargins, discountRate, terminalG, horizon, shareCount, netDebtAdj, salesToCapital]);

  const reset = useCallback(() => {
    setGrowthRates(Array.from({ length: horizon }, (_, i) => baseGrowth[i] ?? baseGrowth[baseGrowth.length-1] ?? 18));
    setEbitMargins(Array.from({ length: horizon }, (_, i) => baseMargins[i] ?? baseMargins[baseMargins.length-1] ?? 15));
    setDiscountRate(baseDiscount);
    setTerminalG(baseTerminalG);
  }, [baseGrowth, baseMargins, baseDiscount, baseTerminalG, horizon]);

  const ivDelta = userResult.intrinsicValue - data.price;
  const ivDeltaPct = (ivDelta / data.price) * 100;
  const isAbove = userResult.intrinsicValue > data.price;
  const vsBase = userResult.intrinsicValue - baseResult.intrinsicValue;

  // Combined chart data: base vs user
  const chartData = userResult.forecast.map((r, i) => ({
    year: r.year,
    yourRev: r.revenue,
    baseRev: baseResult.forecast[i]?.revenue ?? r.revenue,
    yourFCFF: r.fcff,
    baseFCFF: baseResult.forecast[i]?.fcff ?? r.fcff,
  }));

  const firstRevRaw = baseScenario.forecast[0]?.revenue ?? 1;
  const isLargeScale = firstRevRaw >= 10; // MELI vs NIO/PGY

  const fmtRev   = (v: number) => isLargeScale ? `$${v.toFixed(0)}B` : `$${v.toFixed(2)}B`;
  const fmtFCFF  = (v: number) => isLargeScale ? `$${v.toFixed(2)}B` : `$${v.toFixed(3)}B`;
  const fmtPrice = (v: number) => v >= 100 ? `$${v.toLocaleString("en-US",{maximumFractionDigits:0})}` : `$${v.toFixed(2)}`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Live IV banner */}
      <div className="glass" style={{ padding:"18px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:16, alignItems:"center" }}>
          {/* Your IV */}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.t4, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6, fontFamily:FONT }}>Your Intrinsic Value</div>
            <div style={{ fontSize:32, fontWeight:800, color: isAbove ? C.green : C.red, fontFamily:MONO, letterSpacing:"-0.04em", lineHeight:1 }}>
              {fmtPrice(userResult.intrinsicValue)}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color: isAbove ? C.green : C.red, fontFamily:MONO, marginTop:4 }}>
              {ivDeltaPct >= 0 ? "+" : ""}{ivDeltaPct.toFixed(1)}% vs market price
            </div>
          </div>

          {/* vs Base model */}
          <div style={{ textAlign:"center", padding:"0 12px", borderLeft:"1px solid rgba(255,255,255,0.08)", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.t4, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6, fontFamily:FONT }}>vs Base Model IV</div>
            <div style={{ fontSize:22, fontWeight:700, color: vsBase >= 0 ? C.green : C.red, fontFamily:MONO }}>
              {vsBase >= 0 ? "+" : ""}{fmtPrice(Math.abs(vsBase))}
            </div>
            <div style={{ fontSize:11, color:C.t3, fontFamily:FONT }}>Base: {fmtPrice(baseResult.intrinsicValue)}</div>
          </div>

          {/* Market price */}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.t4, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6, fontFamily:FONT }}>Market Price</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.amber, fontFamily:MONO }}>{fmtPrice(data.price)}</div>
            <div style={{ fontSize:11, color:C.t3, fontFamily:FONT }}>
              {isAbove ? "Below your IV — potential upside" : "Above your IV — priced for perfection"}
            </div>
          </div>

          {/* Terminal value */}
          <div style={{ textAlign:"center", borderLeft:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.t4, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6, fontFamily:FONT }}>Terminal Value (PV)</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.purple, fontFamily:MONO }}>{fmtRev(userResult.terminalValue)}</div>
            <div style={{ fontSize:11, color:C.t3, fontFamily:FONT }}>
              {((userResult.terminalValue / (userResult.terminalValue + userResult.sumPV)) * 100).toFixed(0)}% of total value
            </div>
          </div>
        </div>
      </div>

      {/* Charts — base vs your assumptions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div className="glass" style={{ padding:"14px 14px 10px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10, fontFamily:FONT, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:13, background:C.blue, borderRadius:2 }} /> Revenue Forecast vs Base ($B)
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
              <defs>
                <linearGradient id="yourRevG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:9, fontFamily:FONT}}/>
              <YAxis tick={{fontSize:9, fontFamily:FONT}} tickFormatter={v => isLargeScale ? `$${v.toFixed(0)}B` : `$${v.toFixed(1)}B`}/>
              <Tooltip {...TT} formatter={(v:number, name:string) => [fmtRev(v), name === "yourRev" ? "Your model" : "Base model"]}/>
              <Area type="monotone" dataKey="baseRev" stroke="rgba(255,255,255,0.2)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>
              <Area type="monotone" dataKey="yourRev" stroke="var(--blue)" fill="url(#yourRevG)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding:"14px 14px 10px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10, fontFamily:FONT, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:13, background:C.green, borderRadius:2 }} /> FCFF vs Base ($B)
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
              <defs>
                <linearGradient id="yourFCFFG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:9, fontFamily:FONT}}/>
              <YAxis tick={{fontSize:9, fontFamily:FONT}} tickFormatter={v => fmtFCFF(v)}/>
              <Tooltip {...TT} formatter={(v:number, name:string) => [fmtFCFF(v), name === "yourFCFF" ? "Your model" : "Base model"]}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>
              <Area type="monotone" dataKey="baseFCFF" stroke="rgba(255,255,255,0.2)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>
              <Area type="monotone" dataKey="yourFCFF" stroke="var(--green)" fill="url(#yourFCFFG)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, alignItems:"start" }}>

        {/* Growth path */}
        <div className="glass" style={{ padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:12, fontFamily:FONT, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:13, background:C.blue, borderRadius:2 }} /> Revenue Growth Path
          </div>
          <PathEditor
            label="" values={growthRates} min={-5} max={50} step={0.5}
            format={v => `${v.toFixed(1)}%`} color={C.blue}
            onChange={setGrowthRates}
          />
        </div>

        {/* Margin path */}
        <div className="glass" style={{ padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:12, fontFamily:FONT, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:13, background:C.green, borderRadius:2 }} /> EBIT Margin Path
          </div>
          <PathEditor
            label="" values={ebitMargins} min={0} max={40} step={0.5}
            format={v => `${v.toFixed(1)}%`} color={C.green}
            onChange={setEbitMargins}
          />
        </div>

        {/* Discount rate controls */}
        <div className="glass" style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4, fontFamily:FONT, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:13, background:C.amber, borderRadius:2 }} /> Discount Rate
          </div>
          <Slider label={data.discountRate?.wacc ? "WACC" : "Cost of Equity"} value={discountRate}
            min={6} max={35} step={0.1} format={v => `${v.toFixed(1)}%`} color={C.amber}
            onChange={setDiscountRate}
          />
          <Slider label="Terminal Growth Rate" value={terminalG}
            min={0} max={6} step={0.1} format={v => `${v.toFixed(1)}%`} color={C.purple}
            onChange={setTerminalG}
          />
          <div style={{ paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize:10, color:C.t4, marginBottom:8, fontFamily:FONT }}>Sensitivity: ±100bps on discount rate</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {[
                { label:"DR −1%", dr:discountRate-1 },
                { label:"DR +1%", dr:discountRate+1 },
              ].map(s => {
                const r = runDCF({ baseRevenue, growthRates, ebitMargins, discountRate:s.dr, terminalGrowth:terminalG, horizon, shareCount, netDebtAdj, salesToCapital });
                const diff = r.intrinsicValue - userResult.intrinsicValue;
                return (
                  <div key={s.label} style={{ padding:"8px 10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, textAlign:"center" }}>
                    <div style={{ fontSize:9, color:C.t4, marginBottom:3, fontFamily:FONT }}>{s.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color: diff >= 0 ? C.green : C.red, fontFamily:MONO }}>{fmtPrice(r.intrinsicValue)}</div>
                    <div style={{ fontSize:10, color: diff >= 0 ? C.green : C.red, fontFamily:MONO }}>{diff >= 0 ? "+" : ""}{fmtPrice(Math.abs(diff))}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={reset} style={{
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:10, padding:"8px 14px", color:"var(--t2)", fontSize:12, fontWeight:600,
            cursor:"pointer", fontFamily:FONT, width:"100%", transition:"all 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.10)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >↺ Reset to Base Model</button>
        </div>
      </div>

      {/* Forecast table */}
      <div className="glass" style={{ overflow:"hidden" }}>
        <div style={{ padding:"11px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:13, background:C.blue, borderRadius:2 }} />
            <span style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase", fontFamily:FONT }}>Your Forecast vs Base Model</span>
          </div>
          <div style={{ display:"flex", gap:16, fontSize:10, color:C.t3, fontFamily:FONT }}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:16, height:2, background:C.blue, display:"inline-block", borderRadius:1 }} /> Your model</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:16, height:2, background:"rgba(255,255,255,0.25)", display:"inline-block", borderRadius:1, borderTop:"1px dashed rgba(255,255,255,0.3)" }} /> Base model</span>
          </div>
        </div>
        <div style={{ padding:16, overflowX:"auto" }}>
          <table className="val-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Rev (Yours)</th><th>Rev (Base)</th>
                <th>EBIT% (Yours)</th><th>EBIT% (Base)</th>
                <th>FCFF (Yours)</th><th>FCFF (Base)</th>
                <th>PV(FCFF)</th>
              </tr>
            </thead>
            <tbody>
              {userResult.forecast.map((r, i) => {
                const base = baseResult.forecast[i];
                const myMargin = (r.ebit / r.revenue) * 100;
                const baseMargin = base ? (base.ebit / base.revenue) * 100 : 0;
                const revDiff = r.revenue - (base?.revenue ?? 0);
                return (
                  <tr key={r.year}>
                    <td>{r.year}</td>
                    <td className={revDiff >= 0 ? "pos" : "neg"}>{fmtRev(r.revenue)}</td>
                    <td style={{ color:"var(--t3)" }}>{base ? fmtRev(base.revenue) : "—"}</td>
                    <td className={myMargin >= (baseMargin-0.1) ? "pos" : "neg"}>{myMargin.toFixed(1)}%</td>
                    <td style={{ color:"var(--t3)" }}>{base ? `${baseMargin.toFixed(1)}%` : "—"}</td>
                    <td className={r.fcff >= 0 ? "pos" : "neg"}>{fmtFCFF(r.fcff)}</td>
                    <td style={{ color:"var(--t3)" }}>{base ? fmtFCFF(base.fcff) : "—"}</td>
                    <td className={r.pvFCFF >= 0 ? "pos" : "neg"}>{fmtFCFF(r.pvFCFF)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
