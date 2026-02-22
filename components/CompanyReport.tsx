"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { CompanyDetail, ForecastRow } from "@/types";
import AssumptionEditor from "./AssumptionEditor";

const FONT = "'Geist', -apple-system, sans-serif";
const MONO = "'Geist Mono', monospace";
const C = {
  blue:"var(--blue)", green:"var(--green)", red:"var(--red)",
  amber:"var(--amber)", purple:"var(--purple)",
  t1:"var(--t1)", t2:"var(--t2)", t3:"var(--t3)", t4:"var(--t4)"
};

const TT = {
  contentStyle:{ background:"rgba(13,17,23,0.97)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:11, fontFamily:FONT, color:C.t1 },
  labelStyle:{ color:C.t3, fontSize:10 },
};

/* ── shared primitives ─────────────────────────────────────────────────── */
function Panel({ title, accent=C.blue, children, style={} }: {
  title:string; accent?:string; children:React.ReactNode; style?:React.CSSProperties;
}) {
  return (
    <div className="glass" style={{ overflow:"hidden", ...style }}>
      <div style={{ padding:"11px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:3, height:13, background:accent, borderRadius:2, boxShadow:`0 0 6px ${accent}60` }} />
        <span style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase", fontFamily:FONT }}>{title}</span>
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );
}

function Metric({ label, value, color, sub }: { label:string; value:string; color?:string; sub?:string }) {
  return (
    <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
      <div style={{ fontSize:9, fontWeight:600, color:C.t4, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4, fontFamily:FONT }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:700, color:color||C.t1, fontFamily:MONO, letterSpacing:"-0.02em", lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:9, color:C.t4, marginTop:3, fontFamily:FONT }}>{sub}</div>}
    </div>
  );
}

function RecTag({ rec }: { rec:string }) {
  const s: Record<string,{c:string;bg:string;b:string}> = {
    BUY:  {c:C.green, bg:"var(--green-bg)", b:"var(--green-border)"},
    HOLD: {c:C.amber, bg:"var(--amber-bg)", b:"var(--amber-border)"},
    AVOID:{c:C.red,   bg:"var(--red-bg)",   b:"var(--red-border)"},
    SELL: {c:C.red,   bg:"var(--red-bg)",   b:"var(--red-border)"},
  };
  const {c,bg,b} = s[rec]||s.HOLD;
  return <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.07em", color:c, background:bg, border:`1px solid ${b}`, borderRadius:20, padding:"4px 14px", fontFamily:FONT }}>{rec}</span>;
}

function Toggle({ value, onChange, options }: {
  value:string; onChange:(v:string)=>void;
  options:{id:string;label:string;color:string}[];
}) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {options.map(o => {
        const active = value===o.id;
        return <button key={o.id} onClick={()=>onChange(o.id)} style={{
          fontSize:11, fontWeight:600, padding:"5px 14px", borderRadius:20, cursor:"pointer",
          fontFamily:FONT, border:`1px solid ${active?o.color+"66":"rgba(255,255,255,0.1)"}`,
          background:active?o.color+"22":"transparent", color:active?o.color:C.t3, transition:"all 0.15s", flexShrink:0
        }}>{o.label}</button>;
      })}
    </div>
  );
}

/* ── helpers ───────────────────────────────────────────────────────────── */
function fmtV(v:number) {
  if (v >= 1000) return `$${v.toLocaleString("en-US",{maximumFractionDigits:0})}`;
  if (v >= 10) return `$${v.toFixed(1)}B`;
  return `$${v.toFixed(3)}B`;
}
function fmtPrice(v:number) {
  return v >= 1000
    ? `$${v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`
    : `$${v.toFixed(2)}`;
}

/* ── Summary ──────────────────────────────────────────────────────────── */
function SummarySection({ data }: { data:CompanyDetail }) {
  const v = data.valuation;
  const max = (v.upside||v.base)*1.18;
  const pct = (val:number) => `${Math.min((val/max)*100,100).toFixed(1)}%`;

  // Build a small IV comparison sparkline
  const ivSparkData = [
    { label:"Bear", iv: v.bear ?? v.base*0.6 },
    { label:"Base", iv: v.base },
    { label:"Bull", iv: v.upside },
  ];

  const markers = [
    { label:"Current Price", value:data.price, color:C.amber, sub:"Market" },
    { label:"Base IV",       value:v.base,     color:C.green,  sub:"Base case" },
    { label:"Bull IV",       value:v.upside,   color:C.blue,   sub:"Bull case" },
    ...(v.bear ? [{ label:"Bear IV", value:v.bear, color:C.red, sub:"Bear case" }] : []),
  ];

  const metrics = [
    { l:"Current Price",  v:fmtPrice(data.price), c:C.amber },
    { l:"Base IV",        v:fmtPrice(v.base),     c:C.green  },
    { l:"Bull IV",        v:fmtPrice(v.upside),   c:C.blue   },
    ...(v.bear ? [{ l:"Bear IV", v:fmtPrice(v.bear), c:C.red }] : []),
    { l:"Upside to Base", v:`${v.upsideToBase>=0?"+":""}${v.upsideToBase.toFixed(1)}%`, c:v.upsideToBase>=0?C.green:C.red },
    { l:"Upside to Bull", v:`+${v.upsideToBull.toFixed(1)}%`, c:C.blue },
    { l:"Method",         v:v.method||"FCFF DCF",             c:C.t1   },
    { l:"Horizon",        v:v.horizon?`${v.horizon}Y + TV`:"10Y + TV", c:C.t1 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="Key Metrics">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
          {metrics.map(m => <Metric key={m.l} label={m.l} value={m.v} color={m.c}/>)}
        </div>
      </Panel>

      {/* Valuation spectrum + IV bar chart side by side */}
      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:12 }}>
        <Panel title="Valuation Spectrum">
          <div style={{ position:"relative", height:64, marginBottom:14 }}>
            <div style={{ position:"absolute", top:26, left:0, right:0, height:8, background:"rgba(255,255,255,0.07)", borderRadius:6 }} />
            <div style={{ position:"absolute", top:26, left:0, width:pct(v.base), height:8, background:"linear-gradient(90deg,rgba(59,158,255,0.4),var(--green))", borderRadius:6 }} />
            {markers.map(m => (
              <div key={m.label} style={{ position:"absolute", top:16, left:pct(m.value), transform:"translateX(-50%)", zIndex:3 }}>
                <div style={{ width:2, height:28, background:m.color, margin:"0 auto", borderRadius:2, boxShadow:`0 0 8px ${m.color}` }} />
                <div style={{ fontSize:9, color:m.color, fontWeight:700, textAlign:"center", marginTop:3, whiteSpace:"nowrap", fontFamily:MONO }}>
                  {fmtPrice(m.value)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${markers.length},1fr)`, gap:8 }}>
            {markers.map(m => (
              <div key={m.label} style={{ padding:"8px 10px", background:"rgba(255,255,255,0.04)", border:`1px solid ${m.color}25`, borderLeft:`3px solid ${m.color}`, borderRadius:10 }}>
                <div style={{ fontSize:9, color:C.t4, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:m.color, fontFamily:MONO }}>{fmtPrice(m.value)}</div>
                <div style={{ fontSize:9, color:C.t3, marginTop:2, fontFamily:FONT }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="IV Scenario Chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ivSparkData} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="label" tick={{fontSize:10,fontFamily:FONT}}/>
              <YAxis tick={{fontSize:9,fontFamily:FONT}} tickFormatter={v=>fmtPrice(v)} width={55}/>
              <Tooltip {...TT} formatter={(v:number)=>[fmtPrice(v),"Intrinsic Value"]}/>
              <ReferenceLine y={data.price} stroke={C.amber} strokeDasharray="5 3" strokeWidth={2}
                label={{ value:"Price", position:"insideTopRight", fontSize:9, fill:C.amber, fontFamily:FONT }}/>
              <Bar dataKey="iv" radius={[6,6,0,0]} fill="transparent"
                background={false}
              >
                {ivSparkData.map((entry) => (
                  <rect key={entry.label} fill={
                    entry.label==="Bear"?"var(--red)":
                    entry.label==="Base"?"var(--green)":"var(--blue)"
                  }/>
                ))}
              </Bar>
              {/* Use individual bars via Cell */}
              {(() => {
                const { Cell } = require("recharts");
                return null; // handled below
              })()}
            </BarChart>
          </ResponsiveContainer>
          {/* Simpler approach - custom mini bars */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:120, padding:"0 8px", marginTop:-120 }}>
            {ivSparkData.map(s => {
              const maxIV = v.upside * 1.1;
              const h = Math.max((s.iv/maxIV)*100,4);
              const col = s.label==="Bear"?C.red:s.label==="Base"?C.green:C.blue;
              return (
                <div key={s.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:col, fontFamily:MONO }}>{fmtPrice(s.iv)}</div>
                  <div style={{ width:"100%", height:`${h}%`, background:col+"44", border:`1px solid ${col}66`, borderRadius:"6px 6px 0 0", position:"relative" }}>
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30%", background:col+"88", borderRadius:"4px 4px 0 0" }} />
                  </div>
                  <div style={{ fontSize:9, color:C.t3, fontFamily:FONT }}>{s.label}</div>
                </div>
              );
            })}
          </div>
          {/* Current price line */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
            <div style={{ height:1, flex:1, background:`repeating-linear-gradient(90deg,${C.amber} 0,${C.amber} 6px,transparent 6px,transparent 10px)` }} />
            <span style={{ fontSize:9, color:C.amber, fontFamily:FONT, whiteSpace:"nowrap" }}>Price {fmtPrice(data.price)}</span>
            <div style={{ height:1, flex:1, background:`repeating-linear-gradient(90deg,${C.amber} 0,${C.amber} 6px,transparent 6px,transparent 10px)` }} />
          </div>
        </Panel>
      </div>

      {/* Reverse DCF */}
      {data.reverseDCF && (
        <Panel title="Reverse DCF — What the Market Implies" accent={C.amber}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:12 }}>
            {data.reverseDCF.impliedTerminalEBITMargin!=null && (
              <Metric label="Implied Terminal EBIT Margin" value={`${data.reverseDCF.impliedTerminalEBITMargin.toFixed(2)}%`} color={C.amber} sub="Holding Base growth path"/>
            )}
            {data.reverseDCF.impliedScaleFactor!=null && (
              <Metric label="Implied Scale Factor" value={`${data.reverseDCF.impliedScaleFactor.toFixed(3)}×`} color={C.amber} sub="Holding Base margin path"/>
            )}
            {data.reverseDCF.impliedGrowthMultiplier!=null && (
              <Metric label="Implied Growth Multiplier" value={`${data.reverseDCF.impliedGrowthMultiplier.toFixed(3)}×`} color={C.amber} sub="vs Base growth path"/>
            )}
            {data.reverseDCF.impliedEBITMarginMultiplier!=null && (
              <Metric label="Implied EBIT Margin Mult." value={`${data.reverseDCF.impliedEBITMarginMultiplier.toFixed(3)}×`} color={C.amber} sub="vs Base margin path"/>
            )}
          </div>
          <div style={{ padding:"10px 14px", background:"rgba(255,202,58,0.06)", border:"1px solid rgba(255,202,58,0.18)", borderRadius:10, fontSize:12, color:C.t2, lineHeight:1.7, fontFamily:FONT }}>
            <span style={{ fontWeight:700, color:C.amber }}>Market read: </span>{data.reverseDCF.interpretation}
          </div>
        </Panel>
      )}

      {data.catalysts && data.catalysts.length > 0 && (
        <Panel title="Catalysts" accent={C.green}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.catalysts.map((cat,i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"8px 10px", background:"rgba(52,209,122,0.05)", border:"1px solid rgba(52,209,122,0.15)", borderRadius:10 }}>
                <span style={{ color:C.green, fontSize:12, flexShrink:0 }}>→</span>
                <span style={{ fontSize:12, color:C.t2, lineHeight:1.5, fontFamily:FONT }}>{cat}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── Forecast ─────────────────────────────────────────────────────────── */
function ForecastSection({ data }: { data:CompanyDetail }) {
  const hasDownside = !!data.scenarios.downside;
  const [sc, setSc] = useState("base");

  const scenarioMap: Record<string,typeof data.scenarios.base> = {
    base:   data.scenarios.base,
    upside: data.scenarios.upside,
    ...(hasDownside ? { downside:data.scenarios.downside! } : {}),
  };
  const scenario = scenarioMap[sc]||data.scenarios.base;
  const scColors: Record<string,string> = { base:C.green, upside:C.blue, downside:C.red };
  const color = scColors[sc]||C.green;

  const firstRev = scenario.forecast[0]?.revenue??1;
  const isLarge = firstRev >= 10;
  const fmtR = (v:number) => isLarge ? `$${v.toFixed(0)}B` : `$${v.toFixed(2)}B`;
  const fmtE = (v:number) => isLarge ? `$${v.toFixed(2)}B` : `$${v.toFixed(3)}B`;

  // Add prior year actuals (2024) for context
  const fy2024Rev  = data.financials?.fy2024?.revenue  ? data.financials.fy2024.revenue/1e9  : null;
  const fy2024EBIT = data.financials?.fy2024?.ebit     ? data.financials.fy2024.ebit/1e9     : null;

  const chartData = [
    ...(fy2024Rev ? [{ year:2024, revenue:+fy2024Rev.toFixed(isLarge?1:3), ebit:fy2024EBIT?+fy2024EBIT.toFixed(isLarge?2:3):null, fcff:null, isActual:true }] : []),
    ...scenario.forecast.map((r:ForecastRow) => ({ year:r.year, revenue:r.revenue, ebit:r.ebit, fcff:r.fcff, isActual:false })),
  ];

  const toggleOpts = [
    { id:"base",   label:"Base",     color:C.green },
    { id:"upside", label:"Upside",   color:C.blue  },
    ...(hasDownside ? [{ id:"downside", label:"Downside", color:C.red }] : []),
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <Toggle value={sc} onChange={setSc} options={toggleOpts}/>
        <span style={{ fontSize:13, fontWeight:700, color, fontFamily:MONO }}>
          IV: {fmtPrice(scenario.intrinsicValue)}
        </span>
      </div>

      <Panel title="Revenue Forecast — including FY2024 actual">
        <div style={{ fontSize:10, color:C.t4, marginBottom:8, fontFamily:FONT }}>
          <span style={{ color:C.t3 }}>■</span> Actual (2024) &nbsp;
          <span style={{ color }}>■</span> Projected ({sc} case)
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
            <defs>
              <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.28}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="year" tick={{fontSize:9,fontFamily:FONT}}/>
            <YAxis tick={{fontSize:9,fontFamily:FONT}} tickFormatter={v=>isLarge?`$${v.toFixed(0)}B`:`$${v.toFixed(1)}B`}/>
            <Tooltip {...TT} formatter={(v:number,name:string) => [fmtR(v), name==="revenue"?"Revenue":name]}
              labelFormatter={(label,payload) => `${label}${payload?.[0]?.payload?.isActual?" (Actual)":" (Projected)"}`}
            />
            <ReferenceLine x={2025} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4"
              label={{ value:"→ Forecasts", position:"insideTopRight", fontSize:9, fill:"var(--t4)", fontFamily:FONT }}/>
            <Area type="monotone" dataKey="revenue" stroke={color} fill="url(#rG)" strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Panel title="EBIT — Actual 2024 + Projected">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:9,fontFamily:FONT}}/>
              <YAxis tick={{fontSize:9,fontFamily:FONT}} tickFormatter={v=>fmtE(v)} width={48}/>
              <Tooltip {...TT} formatter={(v:number) => [fmtE(v),"EBIT"]}
                labelFormatter={(label,payload) => `${label}${payload?.[0]?.payload?.isActual?" (Actual)":" (Projected)"}`}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>
              <Bar dataKey="ebit" radius={[3,3,0,0]}>
                {chartData.map((entry, index) => (
                  <rect key={index} fill={entry.isActual ? "rgba(255,255,255,0.15)" : `${color}55`} stroke={entry.isActual ? "rgba(255,255,255,0.3)" : color} strokeWidth={1}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="FCFF — Projected">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData.filter(d=>d.fcff!==null)} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:9,fontFamily:FONT}}/>
              <YAxis tick={{fontSize:9,fontFamily:FONT}} tickFormatter={v=>fmtE(v)} width={48}/>
              <Tooltip {...TT} formatter={(v:number) => [fmtE(v),"FCFF"]}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>
              <Bar dataKey="fcff" fill="rgba(59,158,255,0.3)" stroke={C.blue} strokeWidth={1} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Forecast Table">
        <Toggle value={sc} onChange={setSc} options={toggleOpts}/>
        <div style={{ overflowX:"auto" }}>
          <table className="val-table">
            <thead><tr>
              <th>Year</th><th>Revenue</th><th>EBIT</th><th>Margin</th><th>FCFF</th><th>PV(FCFF)</th>
            </tr></thead>
            <tbody>
              {scenario.forecast.map((r:ForecastRow) => {
                const m = (r.ebit/r.revenue)*100;
                return <tr key={r.year}>
                  <td>{r.year}</td>
                  <td>{fmtR(r.revenue)}</td>
                  <td className={r.ebit<0?"neg":"pos"}>{fmtE(r.ebit)}</td>
                  <td className={m<0?"neg":"pos"}>{m.toFixed(1)}%</td>
                  <td className={r.fcff<0?"neg":"pos"}>{fmtE(r.fcff)}</td>
                  <td className={r.pvFCFF<0?"neg":"pos"}>{fmtE(r.pvFCFF)}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ── Financials ───────────────────────────────────────────────────────── */
function DriversSection({ data }: { data:CompanyDetail }) {
  const quarterly = data.financials?.quarterly?.map(q=>({
    period: q.period.replace("Q1 ","Q1'").replace("Q2 ","Q2'").replace("Q3 ","Q3'").replace("Q4 ","Q4'").replace("2024","24").replace("2025","25"),
    revenue: q.revenue>=1e9 ? q.revenue/1e9 : q.revenue,
  })) || [];

  const isLarge = quarterly.length>0 && quarterly[0].revenue>=1;
  const fmtR = (v:number) => isLarge ? `$${v.toFixed(1)}B` : `$${(v*1000).toFixed(0)}M`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {quarterly.length > 0 && (
        <Panel title="Quarterly Revenue — Last 5 Quarters">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={quarterly} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="period" tick={{fontSize:10,fontFamily:FONT}}/>
              <YAxis tick={{fontSize:10,fontFamily:FONT}} tickFormatter={v=>fmtR(v)} width={52}/>
              <Tooltip {...TT} formatter={(v:number)=>[fmtR(v),"Revenue"]}/>
              <Bar dataKey="revenue" fill="rgba(59,158,255,0.28)" stroke={C.blue} strokeWidth={1.5} radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {data.financials?.fy2024 && (
        <Panel title="FY2024 Financials">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
            {[
              {l:"Revenue",      v:data.financials.fy2024.revenue     ?`$${(data.financials.fy2024.revenue/1e9).toFixed(2)}B`    :"—", c:C.t1},
              {l:"Gross Profit", v:data.financials.fy2024.grossProfit ?`$${(data.financials.fy2024.grossProfit/1e9).toFixed(2)}B`:"—", c:C.green},
              {l:"EBIT",         v:data.financials.fy2024.ebit        ?`$${(data.financials.fy2024.ebit/1e9).toFixed(2)}B`       :"—", c:C.green},
              {l:"R&D Spend",    v:data.financials.fy2024.rd          ?`$${(data.financials.fy2024.rd/1e9).toFixed(2)}B`         :"—", c:C.t1},
            ].map(item=><Metric key={item.l} label={item.l} value={item.v} color={item.c}/>)}
          </div>
        </Panel>
      )}

      {data.multiples && Object.values(data.multiples).some(x=>x!=null) && (
        <Panel title="Market Multiples">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {[
              {l:"EV/Sales 2025E", v:data.multiples?.evSales2025E?`${data.multiples.evSales2025E.toFixed(1)}×`:"—"},
              {l:"P/Sales 2025E",  v:data.multiples?.pSales2025E ?`${data.multiples.pSales2025E.toFixed(1)}×` :"—"},
              {l:"P/Book",         v:data.multiples?.pBook        ?`${data.multiples.pBook.toFixed(1)}×`       :"—"},
            ].map(item=><Metric key={item.l} label={item.l} value={item.v} color={C.blue}/>)}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── DCF Inputs ───────────────────────────────────────────────────────── */
function DCFSection({ data }: { data:CompanyDetail }) {
  const dr = data.discountRate;
  const [sc, setSc] = useState("base");
  const scenarioMap: Record<string,typeof data.scenarios.base> = {
    base:data.scenarios.base, upside:data.scenarios.upside,
    ...(data.scenarios.downside?{downside:data.scenarios.downside}:{}),
  };
  const scenario = scenarioMap[sc]||data.scenarios.base;
  const scColors: Record<string,string> = {base:C.green,upside:C.blue,downside:C.red};
  const color = scColors[sc]||C.green;

  if (!dr) return <Panel title="Discount Rate"><div style={{color:C.t3,fontSize:12,fontFamily:FONT}}>Not available.</div></Panel>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="Discount Rate Build">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
          {[
            {l:"Risk-Free Rate",   v:`${dr.rf.toFixed(2)}%`,           c:C.t1},
            {l:"Beta",             v:dr.beta.toFixed(2),                c:C.t1},
            {l:"Equity Risk Prem.",v:`${dr.erp.toFixed(2)}%`,           c:C.t1},
            {l:"Cost of Equity",   v:`${dr.costOfEquity.toFixed(2)}%`,  c:C.blue},
            ...(dr.wacc!=null?[{l:"WACC",v:`${dr.wacc.toFixed(2)}%`,c:C.purple}]:[]),
            {l:"Terminal Growth",  v:`${dr.terminalGrowth.toFixed(1)}%`,c:C.amber},
            ...(dr.preTaxCostOfDebt!=null?[{l:"Pre-Tax Cost Debt",v:`${dr.preTaxCostOfDebt.toFixed(2)}%`,c:C.t1}]:[]),
            ...(dr.taxRate!=null?[{l:"Tax Rate",v:`${dr.taxRate.toFixed(1)}%`,c:C.t1}]:[]),
          ].map(item=><Metric key={item.l} label={item.l} value={item.v} color={item.c}/>)}
        </div>
        <div style={{ padding:"10px 14px", background:"var(--blue-bg)", border:"1px solid var(--blue-border)", borderRadius:10, fontSize:12, fontFamily:MONO, color:C.t2 }}>
          CoE = {dr.rf}% + {dr.beta} × {dr.erp}% = <span style={{color:C.blue,fontWeight:700}}>{dr.costOfEquity.toFixed(2)}%</span>
          {dr.wacc!=null&&<span style={{marginLeft:20,color:C.purple,fontWeight:700}}> · WACC = {dr.wacc.toFixed(2)}%</span>}
        </div>
      </Panel>

      <Toggle value={sc} onChange={setSc} options={[
        {id:"base",label:"Base",color:C.green},{id:"upside",label:"Upside",color:C.blue},
        ...(data.scenarios.downside?[{id:"downside",label:"Downside",color:C.red}]:[]),
      ]}/>

      <div className="glass" style={{ padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.t2, fontFamily:FONT }}>{scenario.label} Assumptions</span>
          <span style={{ fontSize:16, fontWeight:700, color, fontFamily:MONO }}>{fmtPrice(scenario.intrinsicValue)} IV</span>
        </div>
        {(scenario.revenueGrowthPath||scenario.deliveryGrowthPath) && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:9, color:C.t4, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontWeight:600, fontFamily:FONT }}>
              {scenario.revenueGrowthPath?"Revenue Growth":"Delivery Growth"} Path
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {(scenario.revenueGrowthPath||scenario.deliveryGrowthPath||[]).map((g,i)=>(
                <span key={i} style={{ fontSize:11, padding:"2px 8px", fontFamily:MONO, background:color+"18", border:`1px solid ${color}35`, borderRadius:6, color, fontWeight:600 }}>{g}%</span>
              ))}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize:9, color:C.t4, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontWeight:600, fontFamily:FONT }}>EBIT Margin Path</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {scenario.ebitMarginPath.map((m,i)=>(
              <span key={i} style={{ fontSize:11, padding:"2px 8px", fontFamily:MONO, background:"rgba(59,158,255,0.12)", border:"1px solid rgba(59,158,255,0.28)", borderRadius:6, color:C.blue, fontWeight:600 }}>{m}%</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Risks ────────────────────────────────────────────────────────────── */
function RisksSection({ data }: { data:CompanyDetail }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {data.risks && data.risks.length > 0 && (
        <Panel title="Risk Register" accent={C.red}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.risks.map((r,i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"10px 12px", background:"rgba(255,95,87,0.04)", border:"1px solid rgba(255,95,87,0.12)", borderLeft:`3px solid ${C.red}`, borderRadius:12 }}>
                <div style={{ flexShrink:0, width:22, height:22, background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.red, fontFamily:MONO }}>
                  {r.rank||i+1}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:2, fontFamily:FONT }}>{r.title||r.risk}</div>
                  {(r.detail||r.modelLine) && <div style={{ fontSize:11, color:C.t2, lineHeight:1.6, fontFamily:FONT }}>{r.detail||`Model line: ${r.modelLine}`}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {data.managementQuestions && data.managementQuestions.length > 0 && (
        <Panel title="Management Questions">
          {data.managementQuestions.map((q,i)=>(
            <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<(data.managementQuestions||[]).length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <span style={{ flexShrink:0, fontSize:10, fontWeight:700, color:C.blue, fontFamily:MONO, background:"var(--blue-bg)", border:"1px solid var(--blue-border)", borderRadius:6, padding:"2px 7px", height:"fit-content" }}>Q{i+1}</span>
              <span style={{ fontSize:11, color:C.t2, lineHeight:1.6, fontFamily:FONT }}>{q}</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
const TABS = [
  {id:"summary",    l:"Summary"},
  {id:"editor",     l:"✦ Assumption Editor"},
  {id:"forecast",   l:"Forecast"},
  {id:"financials", l:"Financials"},
  {id:"dcf",        l:"DCF Inputs"},
  {id:"risks",      l:"Risks"},
];

export default function CompanyReport({ data }: { data:CompanyDetail }) {
  const [tab, setTab] = useState("summary");
  const up = data.valuation.upsideToBase >= 0;

  return (
    <div style={{ maxWidth:1360, margin:"0 auto", paddingBottom:60 }}>
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{ fontSize:11, color:C.t3, marginBottom:10, fontFamily:FONT }}>
          <Link href="/" style={{ color:C.blue }}>← Coverage</Link>{" / "}{data.ticker}
        </div>
        <div className="glass" style={{ padding:"18px 18px 0" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:14, flexWrap:"wrap" }}>
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap", marginBottom:6 }}>
                <span style={{ fontSize:26, fontWeight:800, color:C.t1, letterSpacing:"-0.04em", fontFamily:FONT }}>{data.ticker}</span>
                <span style={{ fontSize:14, color:C.t2, fontFamily:FONT }}>{data.name}</span>
                {data.exchange && <span style={{ fontSize:10, background:"var(--blue-bg)", color:C.blue, border:"1px solid var(--blue-border)", borderRadius:6, padding:"2px 8px", fontWeight:600, fontFamily:FONT }}>{data.exchange}</span>}
              </div>
              {data.thesis && (
                <div style={{ fontSize:11, color:C.t2, maxWidth:600, lineHeight:1.65, fontFamily:FONT }}>
                  <span style={{ fontWeight:700, color:C.blue }}>Thesis: </span>{data.thesis}
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:C.t4, marginBottom:1, fontFamily:FONT }}>As of {data.asOfDate}</div>
                <div style={{ fontSize:24, fontWeight:800, color:C.amber, fontFamily:MONO, letterSpacing:"-0.04em" }}>
                  {fmtPrice(data.price)}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:up?C.green:C.red, fontFamily:MONO }}>
                  {up?"+":""}{data.valuation.upsideToBase.toFixed(1)}% to base
                </div>
              </div>
              <RecTag rec={data.recommendation}/>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:"flex", gap:2, overflowX:"auto", borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:10, paddingBottom:0, scrollbarWidth:"none" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                fontSize:12, fontWeight:tab===t.id?700:400,
                padding:"6px 14px", borderRadius:20, cursor:"pointer",
                border:"none", fontFamily:FONT, whiteSpace:"nowrap",
                background:t.id==="editor"
                  ? tab===t.id ? "rgba(199,125,255,0.22)" : "rgba(199,125,255,0.08)"
                  : tab===t.id ? "var(--blue-bg)" : "transparent",
                color:t.id==="editor"
                  ? tab===t.id ? C.purple : "rgba(199,125,255,0.7)"
                  : tab===t.id ? C.blue : C.t3,
                transition:"all 0.15s", flexShrink:0,
                borderTop: t.id==="editor" ? `1px solid ${tab===t.id?"rgba(199,125,255,0.4)":"rgba(199,125,255,0.2)"}` : "none",
              }}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 16px" }} key={tab} className="fade-up">
        {tab==="summary"    && <SummarySection    data={data}/>}
        {tab==="editor"     && <AssumptionEditor  data={data}/>}
        {tab==="forecast"   && <ForecastSection   data={data}/>}
        {tab==="financials" && <DriversSection    data={data}/>}
        {tab==="dcf"        && <DCFSection         data={data}/>}
        {tab==="risks"      && <RisksSection       data={data}/>}
      </div>
    </div>
  );
}
