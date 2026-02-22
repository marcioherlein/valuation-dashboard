"use client";
import { useState } from "react";
import Link from "next/link";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CompanyDetail, ForecastRow } from "@/types";

const FONT = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', monospace";
const C = { blue:"var(--blue)", green:"var(--green)", red:"var(--red)", amber:"var(--amber)", purple:"var(--purple)", t1:"var(--t1)", t2:"var(--t2)", t3:"var(--t3)", t4:"var(--t4)" };

const TT = {
  contentStyle: { background:"rgba(16,16,26,0.97)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, fontSize:11, fontFamily:FONT, color:C.t1, boxShadow:"0 8px 32px rgba(0,0,0,0.7)" },
  labelStyle: { color:C.t3, fontSize:10 },
};

/* ── primitives ─────────────────────────────────────────────────────────── */
function Panel({ title, children, style={} }: { title:string; children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div className="glass" style={{ overflow:"hidden", ...style }}>
      <div style={{ padding:"11px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:3, height:13, background:C.blue, borderRadius:2, boxShadow:`0 0 8px ${C.blue}60` }} />
        <span style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase" }}>{title}</span>
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );
}

function Metric({ label, value, color, sub }: { label:string; value:string; color?:string; sub?:string }) {
  return (
    <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
      <div style={{ fontSize:9, fontWeight:600, color:C.t4, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:700, color:color||C.t1, fontFamily:MONO, letterSpacing:"-0.02em", lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:9, color:C.t4, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function RecTag({ rec }: { rec:string }) {
  const s: Record<string,{c:string;bg:string;b:string}> = {
    BUY:  {c:C.green, bg:"var(--green-bg)", b:"rgba(48,209,88,0.3)"},
    HOLD: {c:C.amber, bg:"var(--amber-bg)", b:"rgba(255,214,10,0.3)"},
    AVOID:{c:C.red,   bg:"var(--red-bg)",   b:"rgba(255,69,58,0.3)"},
    SELL: {c:C.red,   bg:"var(--red-bg)",   b:"rgba(255,69,58,0.3)"},
  };
  const {c,bg,b} = s[rec]||s.HOLD;
  return <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.07em", color:c, background:bg, border:`1px solid ${b}`, borderRadius:20, padding:"4px 14px" }}>{rec}</span>;
}

function Toggle({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; color: string }[];
}) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {options.map(o => {
        const active = value===o.id;
        return <button key={o.id} onClick={()=>onChange(o.id)} style={{ fontSize:11, fontWeight:600, padding:"5px 14px", borderRadius:20, cursor:"pointer", fontFamily:FONT, border:`1px solid ${active?o.color+"55":"rgba(255,255,255,0.1)"}`, background:active?o.color+"20":"transparent", color:active?o.color:C.t3, transition:"all 0.15s", flexShrink:0 }}>{o.label}</button>;
      })}
    </div>
  );
}

/* ── Summary ─────────────────────────────────────────────────────────────── */
function SummarySection({ data }: { data:CompanyDetail }) {
  const v = data.valuation;
  const max = (v.upside || v.base) * 1.15;
  const pct = (val:number) => `${Math.min((val/max)*100,100).toFixed(1)}%`;
  const hasBear = !!v.bear;

  const markers = [
    { label:"Current Price", value:data.price, color:C.amber,  sub:"Market" },
    { label:"Base IV",       value:v.base,     color:C.green,  sub:"Base case" },
    { label:"Bull IV",       value:v.upside,   color:C.blue,   sub:"Bull case" },
    ...(hasBear ? [{ label:"Bear IV", value:v.bear!, color:C.red, sub:"Bear case" }] : []),
  ];

  // Key metrics — adapt to what's available
  const metrics = [
    { l:"Current Price",   v:`$${data.price.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`, c:C.amber },
    { l:"Base Intrinsic",  v:`$${v.base.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2})}`,     c:C.green },
    { l:"Bull Intrinsic",  v:`$${v.upside.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2})}`,   c:C.blue  },
    ...(hasBear ? [{ l:"Bear Intrinsic", v:`$${v.bear!.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2})}`, c:C.red }] : []),
    { l:"Upside to Base",  v:`${v.upsideToBase >= 0 ? "+" : ""}${v.upsideToBase.toFixed(1)}%`, c:v.upsideToBase >= 0 ? C.green : C.red },
    { l:"Upside to Bull",  v:`+${v.upsideToBull.toFixed(1)}%`,   c:C.blue  },
    { l:"Method",          v:v.method || "FCFF DCF",              c:C.t1    },
    { l:"Horizon",         v:v.horizon ? `${v.horizon}Y + terminal` : "10Y + terminal", c:C.t1 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="Key Metrics">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
          {metrics.map(m => <Metric key={m.l} label={m.l} value={m.v} color={m.c} />)}
        </div>
      </Panel>

      {/* Spectrum */}
      <Panel title="Valuation Spectrum">
        <div style={{ position:"relative", height:68, marginBottom:14 }}>
          <div style={{ position:"absolute", top:28, left:0, right:0, height:8, background:"rgba(255,255,255,0.07)", borderRadius:6 }} />
          <div style={{ position:"absolute", top:28, left:0, width:pct(v.base), height:8, background:"linear-gradient(90deg,rgba(10,132,255,0.4),var(--green))", borderRadius:6 }} />
          {markers.map(m => (
            <div key={m.label} style={{ position:"absolute", top:18, left:pct(m.value), transform:"translateX(-50%)", zIndex:3 }}>
              <div style={{ width:2, height:28, background:m.color, margin:"0 auto", borderRadius:2, boxShadow:`0 0 8px ${m.color}` }} />
              <div style={{ fontSize:9, color:m.color, fontWeight:700, textAlign:"center", marginTop:3, whiteSpace:"nowrap", fontFamily:MONO }}>
                {m.value >= 1000 ? `$${(m.value/1000).toFixed(1)}k` : `$${m.value.toFixed(2)}`}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${markers.length},1fr)`, gap:8 }}>
          {markers.map(m => (
            <div key={m.label} style={{ padding:"10px 10px", background:"rgba(255,255,255,0.04)", border:`1px solid ${m.color}25`, borderLeft:`3px solid ${m.color}`, borderRadius:12 }}>
              <div style={{ fontSize:9, color:C.t4, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.label}</div>
              <div style={{ fontSize:16, fontWeight:700, color:m.color, fontFamily:MONO }}>
                {m.value >= 1000 ? `$${m.value.toLocaleString("en-US",{maximumFractionDigits:0})}` : `$${m.value.toFixed(2)}`}
              </div>
              <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Reverse DCF */}
      {data.reverseDCF && (
        <Panel title="Reverse DCF — Market Implied">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {data.reverseDCF.impliedTerminalEBITMargin != null && (
              <Metric label="Implied Terminal EBIT Margin" value={`${data.reverseDCF.impliedTerminalEBITMargin.toFixed(2)}%`} color={C.amber} sub="Holding Base growth path" />
            )}
            {data.reverseDCF.impliedScaleFactor != null && (
              <Metric label="Implied Growth Scale Factor" value={`${data.reverseDCF.impliedScaleFactor.toFixed(3)}×`} color={C.amber} sub="Holding Base margin path" />
            )}
            {data.reverseDCF.impliedGrowthMultiplier != null && (
              <Metric label="Implied Growth Multiplier" value={`${data.reverseDCF.impliedGrowthMultiplier.toFixed(3)}×`} color={C.amber} sub="vs Base growth path" />
            )}
            {data.reverseDCF.impliedEBITMarginMultiplier != null && (
              <Metric label="Implied EBIT Margin Multiplier" value={`${data.reverseDCF.impliedEBITMarginMultiplier.toFixed(3)}×`} color={C.amber} sub="vs Base margin path" />
            )}
          </div>
          <div style={{ padding:"10px 14px", background:"rgba(255,214,10,0.05)", border:"1px solid rgba(255,214,10,0.15)", borderRadius:10, fontSize:12, color:C.t2, lineHeight:1.7 }}>
            <span style={{ fontWeight:700, color:C.amber }}>Market read: </span>{data.reverseDCF.interpretation}
          </div>
        </Panel>
      )}

      {/* Catalysts */}
      {data.catalysts && data.catalysts.length > 0 && (
        <Panel title="Catalysts">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.catalysts.map((c,i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"8px 10px", background:"rgba(48,209,88,0.05)", border:"1px solid rgba(48,209,88,0.15)", borderRadius:10 }}>
                <span style={{ color:C.green, fontSize:12, flexShrink:0 }}>→</span>
                <span style={{ fontSize:12, color:C.t2, lineHeight:1.5 }}>{c}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── Forecast ────────────────────────────────────────────────────────────── */
function ForecastSection({ data }: { data:CompanyDetail }) {
  const hasDownside = !!data.scenarios.downside;
  const [sc, setSc] = useState<string>("base");

  const scenarioMap: Record<string, typeof data.scenarios.base> = {
    base: data.scenarios.base,
    upside: data.scenarios.upside,
    ...(hasDownside ? { downside: data.scenarios.downside! } : {}),
  };
  const scenario = scenarioMap[sc] || data.scenarios.base;
  const scColors: Record<string, string> = { base: C.green, upside: C.blue, downside: C.red };
  const color = scColors[sc] || C.green;

  // Determine if revenue is in billions already (>100 = already B like MELI) or sub-10 (like NIO/PGY in B)
  const firstRev = scenario.forecast[0]?.revenue || 1;
  const revUnit = firstRev > 100 ? "B" : "B"; // both in B, just different scales
  const revFormat = (v: number) => v >= 100 ? `$${v.toFixed(0)}B` : `$${v.toFixed(2)}B`;
  const ebitFormat = (v: number) => v >= 10 ? `$${v.toFixed(2)}B` : `$${v.toFixed(3)}B`;

  const chartData = scenario.forecast.map((r: ForecastRow) => ({ year: r.year, revenue: r.revenue, ebit: r.ebit, fcff: r.fcff }));

  const toggleOpts = [
    { id:"base",   label:"Base",    color:C.green },
    { id:"upside", label:"Upside",  color:C.blue  },
    ...(hasDownside ? [{ id:"downside", label:"Downside", color:C.red }] : []),
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <Toggle value={sc} onChange={setSc} options={toggleOpts} />
        <span style={{ fontSize:13, fontWeight:700, color, fontFamily:MONO }}>
          IV: ${scenario.intrinsicValue.toLocaleString("en-US",{maximumFractionDigits:2})}
        </span>
      </div>

      <Panel title="Revenue Forecast ($B)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
            <defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.25}/><stop offset="95%" stopColor={color} stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="year" tick={{fontSize:9}}/>
            <YAxis tick={{fontSize:9}} tickFormatter={v => firstRev > 10 ? `$${v.toFixed(0)}B` : `$${v.toFixed(1)}B`}/>
            <Tooltip {...TT} formatter={(v:number) => [revFormat(v), "Revenue"]}/>
            <Area type="monotone" dataKey="revenue" stroke={color} fill="url(#rG)" strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Panel title="EBIT ($B)">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:9}} tickFormatter={v => ebitFormat(v)}/>
              <Tooltip {...TT} formatter={(v:number) => [ebitFormat(v), "EBIT"]}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>
              <Bar dataKey="ebit" fill={color+"40"} stroke={color} strokeWidth={1} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="FCFF ($B)">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:9}} tickFormatter={v => ebitFormat(v)}/>
              <Tooltip {...TT} formatter={(v:number) => [ebitFormat(v), "FCFF"]}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>
              <Bar dataKey="fcff" fill="rgba(10,132,255,0.3)" stroke={C.blue} strokeWidth={1} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Forecast Table">
        <Toggle value={sc} onChange={setSc} options={toggleOpts} />
        <div style={{ overflowX:"auto" }}>
          <table className="val-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Revenue ($B)</th>
                <th>EBIT ($B)</th>
                <th>EBIT Margin</th>
                <th>FCFF ($B)</th>
                <th>PV(FCFF) ($B)</th>
              </tr>
            </thead>
            <tbody>
              {scenario.forecast.map((r: ForecastRow) => {
                const m = (r.ebit/r.revenue)*100;
                return (
                  <tr key={r.year}>
                    <td>{r.year}</td>
                    <td>{revFormat(r.revenue)}</td>
                    <td className={r.ebit<0?"neg":"pos"}>{ebitFormat(r.ebit)}</td>
                    <td className={m<0?"neg":"pos"}>{m.toFixed(1)}%</td>
                    <td className={r.fcff<0?"neg":"pos"}>{ebitFormat(r.fcff)}</td>
                    <td className={r.pvFCFF<0?"neg":"pos"}>{ebitFormat(r.pvFCFF)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ── Financials / Drivers ────────────────────────────────────────────────── */
function DriversSection({ data }: { data:CompanyDetail }) {
  const quarterly = data.financials?.quarterly?.map(q => ({
    period: q.period.replace(" 2024","'24").replace(" 2025","'25").replace("Q","Q"),
    revenue: q.revenue >= 1e9 ? q.revenue/1e9 : q.revenue,
  })) || [];

  const revFormat = (v:number) => v >= 100 ? `$${v.toFixed(0)}B` : (v >= 1 ? `$${v.toFixed(2)}B` : `$${(v*1000).toFixed(0)}M`);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {quarterly.length > 0 && (
        <Panel title="Quarterly Revenue Trend">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quarterly} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="period" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v => revFormat(v)}/>
              <Tooltip {...TT} formatter={(v:number) => [revFormat(v), "Revenue"]}/>
              <Bar dataKey="revenue" fill="rgba(10,132,255,0.3)" stroke={C.blue} strokeWidth={1.5} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {data.financials?.fy2024 && (
        <Panel title="FY2024 Financials">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
            {[
              { l:"Revenue",      v:data.financials.fy2024.revenue      ? `$${(data.financials.fy2024.revenue/1e9).toFixed(2)}B` : "—", c:C.t1 },
              { l:"Gross Profit", v:data.financials.fy2024.grossProfit  ? `$${(data.financials.fy2024.grossProfit/1e9).toFixed(2)}B` : "—", c:C.green },
              { l:"EBIT",         v:data.financials.fy2024.ebit         ? `$${(data.financials.fy2024.ebit/1e9).toFixed(2)}B` : "—", c:C.green },
              { l:"R&D",          v:data.financials.fy2024.rd           ? `$${(data.financials.fy2024.rd/1e9).toFixed(2)}B` : "—", c:C.t1 },
            ].map(item => <Metric key={item.l} label={item.l} value={item.v} color={item.c}/>)}
          </div>
        </Panel>
      )}

      {data.multiples && Object.values(data.multiples).some(v => v != null) && (
        <Panel title="Market Multiples">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {[
              { l:"EV/Sales 2025E", v:data.multiples?.evSales2025E ? `${data.multiples.evSales2025E.toFixed(1)}×` : "—" },
              { l:"P/Sales 2025E",  v:data.multiples?.pSales2025E  ? `${data.multiples.pSales2025E.toFixed(1)}×`  : "—" },
              { l:"P/Book",         v:data.multiples?.pBook        ? `${data.multiples.pBook.toFixed(1)}×`        : "—" },
            ].map(item => <Metric key={item.l} label={item.l} value={item.v} color={C.blue}/>)}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── DCF Inputs ──────────────────────────────────────────────────────────── */
function DCFSection({ data }: { data:CompanyDetail }) {
  const dr = data.discountRate;
  const [sc, setSc] = useState<string>("base");
  const scenarioMap: Record<string, typeof data.scenarios.base> = {
    base: data.scenarios.base,
    upside: data.scenarios.upside,
    ...(data.scenarios.downside ? { downside: data.scenarios.downside } : {}),
  };
  const scenario = scenarioMap[sc];
  const scColors: Record<string, string> = { base: C.green, upside: C.blue, downside: C.red };
  const color = scColors[sc] || C.green;

  if (!dr) return <Panel title="Discount Rate"><div style={{ color:C.t3, fontSize:12 }}>Discount rate data not available.</div></Panel>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="Discount Rate Build">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
          {[
            { l:"Risk-Free Rate",   v:`${dr.rf.toFixed(2)}%`,           c:C.t1 },
            { l:"Beta",             v:dr.beta.toFixed(2),                c:C.t1 },
            { l:"Equity Risk Prem.",v:`${dr.erp.toFixed(2)}%`,           c:C.t1 },
            { l:"Cost of Equity",   v:`${dr.costOfEquity.toFixed(2)}%`,  c:C.blue },
            ...(dr.wacc != null ? [{ l:"WACC", v:`${dr.wacc.toFixed(2)}%`, c:C.purple }] : []),
            { l:"Terminal Growth",  v:`${dr.terminalGrowth.toFixed(1)}%`, c:C.amber },
            ...(dr.preTaxCostOfDebt != null ? [{ l:"Pre-Tax Cost of Debt", v:`${dr.preTaxCostOfDebt.toFixed(2)}%`, c:C.t1 }] : []),
            ...(dr.taxRate != null ? [{ l:"Tax Rate", v:`${dr.taxRate.toFixed(1)}%`, c:C.t1 }] : []),
          ].map(item => <Metric key={item.l} label={item.l} value={item.v} color={item.c}/>)}
        </div>
        <div style={{ padding:"10px 14px", background:"var(--blue-bg)", border:"1px solid rgba(10,132,255,0.2)", borderRadius:10, fontSize:12, fontFamily:MONO, color:C.t2 }}>
          CoE = {dr.rf}% + {dr.beta} × {dr.erp}% = <span style={{color:C.blue,fontWeight:700}}>{dr.costOfEquity.toFixed(2)}%</span>
          {dr.wacc != null && <span style={{marginLeft:20,color:C.purple,fontWeight:700}}>WACC = {dr.wacc.toFixed(2)}%</span>}
        </div>
      </Panel>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <Toggle value={sc} onChange={setSc} options={[
          { id:"base",   label:"Base",    color:C.green },
          { id:"upside", label:"Upside",  color:C.blue  },
          ...(data.scenarios.downside ? [{ id:"downside", label:"Downside", color:C.red }] : []),
        ]} />
        <div className="glass" style={{ padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.t2 }}>{scenario.label} Case Assumptions</span>
            <span style={{ fontSize:16, fontWeight:700, color, fontFamily:MONO }}>${scenario.intrinsicValue.toLocaleString("en-US",{maximumFractionDigits:2})} IV</span>
          </div>
          {(scenario.revenueGrowthPath || scenario.deliveryGrowthPath) && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, color:C.t4, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontWeight:600 }}>
                {scenario.revenueGrowthPath ? "Revenue Growth Path" : "Delivery Growth Path"}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {(scenario.revenueGrowthPath || scenario.deliveryGrowthPath || []).map((g,i) => (
                  <span key={i} style={{ fontSize:11, padding:"2px 8px", fontFamily:MONO, background:color+"15", border:`1px solid ${color}30`, borderRadius:6, color, fontWeight:600 }}>{g}%</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize:9, color:C.t4, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontWeight:600 }}>EBIT Margin Path</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {scenario.ebitMarginPath.map((m,i) => (
                <span key={i} style={{ fontSize:11, padding:"2px 8px", fontFamily:MONO, background:"rgba(10,132,255,0.12)", border:"1px solid rgba(10,132,255,0.25)", borderRadius:6, color:C.blue, fontWeight:600 }}>{m}%</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Risks ───────────────────────────────────────────────────────────────── */
function RisksSection({ data }: { data:CompanyDetail }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {data.risks && data.risks.length > 0 && (
        <Panel title="Risk Register">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.risks.map((r,i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"10px 12px", background:"rgba(255,69,58,0.04)", border:"1px solid rgba(255,69,58,0.12)", borderLeft:`3px solid ${C.red}`, borderRadius:12 }}>
                <div style={{ flexShrink:0, width:22, height:22, background:"var(--red-bg)", border:"1px solid rgba(255,69,58,0.3)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.red, fontFamily:MONO }}>
                  {r.rank || i+1}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:2 }}>{r.title || r.risk}</div>
                  {(r.detail || r.modelLine) && <div style={{ fontSize:11, color:C.t2, lineHeight:1.6 }}>{r.detail || `Model line: ${r.modelLine}`}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {data.managementQuestions && data.managementQuestions.length > 0 && (
        <Panel title="Management Questions">
          {data.managementQuestions.map((q,i) => (
            <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<(data.managementQuestions||[]).length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <span style={{ flexShrink:0, fontSize:10, fontWeight:700, color:C.blue, fontFamily:MONO, background:"var(--blue-bg)", border:"1px solid rgba(10,132,255,0.25)", borderRadius:6, padding:"2px 7px", height:"fit-content" }}>Q{i+1}</span>
              <span style={{ fontSize:11, color:C.t2, lineHeight:1.6 }}>{q}</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
const TABS = [
  {id:"summary",  l:"Summary"},
  {id:"forecast", l:"Forecast"},
  {id:"drivers",  l:"Financials"},
  {id:"dcf",      l:"DCF Inputs"},
  {id:"risks",    l:"Risks"},
];

export default function CompanyReport({ data }: { data:CompanyDetail }) {
  const [tab, setTab] = useState("summary");
  const up = data.valuation.upsideToBase >= 0;

  return (
    <div style={{ maxWidth:1360, margin:"0 auto", paddingBottom:60 }}>
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{ fontSize:11, color:C.t3, marginBottom:10 }}>
          <Link href="/" style={{ color:C.blue }}>← Coverage</Link>{" / "}{data.ticker}
        </div>
        <div className="glass" style={{ padding:"18px 18px 0" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12, flexWrap:"wrap" }}>
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap", marginBottom:6 }}>
                <span style={{ fontSize:26, fontWeight:700, color:C.t1, letterSpacing:"-0.03em" }}>{data.ticker}</span>
                <span style={{ fontSize:14, color:C.t2 }}>{data.name}</span>
                {data.exchange && (
                  <span style={{ fontSize:10, background:"var(--blue-bg)", color:C.blue, border:"1px solid rgba(10,132,255,0.25)", borderRadius:6, padding:"2px 8px", fontWeight:600 }}>{data.exchange}</span>
                )}
              </div>
              {data.thesis && (
                <div style={{ fontSize:11, color:C.t2, maxWidth:580, lineHeight:1.6 }}>
                  <span style={{ fontWeight:700, color:C.blue }}>Thesis: </span>{data.thesis}
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:C.t4, marginBottom:1 }}>As of {data.asOfDate}</div>
                <div style={{ fontSize:22, fontWeight:700, color:C.amber, fontFamily:MONO, letterSpacing:"-0.03em" }}>
                  ${data.price.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color: up ? C.green : C.red, fontFamily:MONO }}>
                  {up ? "+" : ""}{data.valuation.upsideToBase.toFixed(1)}% to base
                </div>
              </div>
              <RecTag rec={data.recommendation}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:2, overflowX:"auto", borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:10, scrollbarWidth:"none" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ fontSize:12, fontWeight:tab===t.id?700:400, padding:"6px 14px", borderRadius:20, cursor:"pointer", border:"none", fontFamily:FONT, background:tab===t.id?"rgba(10,132,255,0.2)":"transparent", color:tab===t.id?C.blue:C.t3, whiteSpace:"nowrap", transition:"all 0.15s", flexShrink:0 }}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 16px" }} key={tab} className="fade-up">
        {tab==="summary"  && <SummarySection  data={data}/>}
        {tab==="forecast" && <ForecastSection data={data}/>}
        {tab==="drivers"  && <DriversSection  data={data}/>}
        {tab==="dcf"      && <DCFSection       data={data}/>}
        {tab==="risks"    && <RisksSection     data={data}/>}
      </div>
    </div>
  );
}
