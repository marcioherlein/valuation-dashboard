"use client";
import { useState } from "react";
import Link from "next/link";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CompanyDetail, ForecastRow } from "@/types";

const FONT = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', monospace";
const C = { blue:"var(--blue)", green:"var(--green)", red:"var(--red)", amber:"var(--amber)", t1:"var(--t1)", t2:"var(--t2)", t3:"var(--t3)", t4:"var(--t4)" };

const TT = {
  contentStyle: { background:"rgba(20,20,30,0.95)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, fontSize:11, fontFamily:FONT, color:C.t1, boxShadow:"0 8px 32px rgba(0,0,0,0.6)" },
  labelStyle: { color:C.t3, fontSize:10 },
};

function Panel({ title, children, style={} }: { title:string; children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div className="glass" style={{ overflow:"hidden", ...style }}>
      <div style={{ padding:"12px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:3, height:13, background:C.blue, borderRadius:2, boxShadow:`0 0 8px ${C.blue}` }} />
        <span style={{ fontSize:11, fontWeight:700, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase" }}>{title}</span>
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );
}

function Metric({ label, value, color, large }: { label:string; value:string; color?:string; large?:boolean }) {
  return (
    <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, minWidth:0 }}>
      <div style={{ fontSize:9, fontWeight:600, color:C.t4, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:large?22:14, fontWeight:700, color:color||C.t1, fontFamily:MONO, letterSpacing:"-0.02em", lineHeight:1, wordBreak:"break-all" }}>{value}</div>
    </div>
  );
}

function RecTag({ rec }: { rec:string }) {
  const s: Record<string,{c:string;bg:string;b:string}> = {
    BUY:  {c:C.green, bg:"var(--green-bg)", b:"rgba(48,209,88,0.3)"},
    HOLD: {c:C.amber, bg:"var(--amber-bg)", b:"rgba(255,214,10,0.3)"},
    AVOID:{c:C.red,   bg:"var(--red-bg)",   b:"rgba(255,69,58,0.3)" },
    SELL: {c:C.red,   bg:"var(--red-bg)",   b:"rgba(255,69,58,0.3)" },
  };
  const {c,bg,b} = s[rec]||s.HOLD;
  return <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.07em", color:c, background:bg, border:`1px solid ${b}`, borderRadius:20, padding:"4px 14px" }}>{rec}</span>;
}

function Toggle({ value, onChange, options }: { value:string; onChange:(v:"base"|"upside")=>void; options:{id:"base"|"upside";label:string;color:string}[] }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {options.map(o => {
        const active = value===o.id;
        return <button key={o.id} onClick={()=>onChange(o.id)} style={{ fontSize:11, fontWeight:600, padding:"5px 14px", borderRadius:20, cursor:"pointer", fontFamily:FONT, border:`1px solid ${active?o.color+"55":"rgba(255,255,255,0.1)"}`, background:active?o.color+"20":"transparent", color:active?o.color:C.t3, transition:"all 0.15s" }}>{o.label}</button>;
      })}
    </div>
  );
}

function SummarySection({ data }: { data:CompanyDetail }) {
  const max = data.valuation.upside*1.15;
  const pct = (v:number) => `${Math.min((v/max)*100,100).toFixed(1)}%`;
  const markers = [
    {label:"Current Price", value:data.price,            color:C.amber, sub:"Market"},
    {label:"Base IV",       value:data.valuation.base,   color:C.green, sub:"Base case"},
    {label:"Upside IV",     value:data.valuation.upside, color:C.blue,  sub:"Bull case"},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="Key Metrics">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
          <Metric label="Current Price"       value={`$${data.price.toFixed(2)}`}                                 color={C.amber} />
          <Metric label="Base Intrinsic Val." value={`$${data.valuation.base.toFixed(2)}`}                        color={C.green} />
          <Metric label="Upside Intrinsic"    value={`$${data.valuation.upside.toFixed(2)}`}                      color={C.blue}  />
          <Metric label="Market Cap"          value={`$${(data.marketCap/1e9).toFixed(2)}B`}                                      />
          <Metric label="Upside to Base"      value={`+${data.valuation.upsideToBase.toFixed(1)}%`}               color={C.green} />
          <Metric label="Upside to Bull"      value={`+${data.valuation.upsideToBull.toFixed(1)}%`}               color={C.blue}  />
          <Metric label="Method"              value={data.valuation.method}                                                       />
          <Metric label="Horizon"             value={`${data.valuation.horizon}Y + terminal`}                                     />
        </div>
      </Panel>

      <Panel title="Valuation Spectrum">
        <div style={{ position:"relative", height:64, marginBottom:12 }}>
          <div style={{ position:"absolute", top:26, left:0, right:0, height:8, background:"rgba(255,255,255,0.07)", borderRadius:6 }} />
          <div style={{ position:"absolute", top:26, left:0, width:pct(data.valuation.base), height:8, background:"linear-gradient(90deg, rgba(10,132,255,0.4), var(--green))", borderRadius:6 }} />
          {markers.map(m => (
            <div key={m.label} style={{ position:"absolute", top:16, left:pct(m.value), transform:"translateX(-50%)", zIndex:3 }}>
              <div style={{ width:2, height:28, background:m.color, margin:"0 auto", borderRadius:2, boxShadow:`0 0 8px ${m.color}` }} />
              <div style={{ fontSize:9, color:m.color, fontWeight:700, textAlign:"center", marginTop:3, whiteSpace:"nowrap", fontFamily:MONO }}>${m.value.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {markers.map(m => (
            <div key={m.label} style={{ padding:"10px 12px", background:"rgba(255,255,255,0.04)", border:`1px solid ${m.color}25`, borderLeft:`3px solid ${m.color}`, borderRadius:12 }}>
              <div style={{ fontSize:9, color:C.t4, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{m.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:m.color, fontFamily:MONO }}>${m.value.toFixed(2)}</div>
              <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Reverse DCF — Market Implied">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          {[
            {label:"Implied Terminal EBIT Margin", value:`${data.reverseDCF.impliedTerminalEBITMargin.toFixed(2)}%`, sub:"Holding Base growth path"},
            {label:"Implied Delivery Scale Factor", value:`${data.reverseDCF.impliedScaleFactor.toFixed(3)}×`, sub:"Holding Base margin path"},
          ].map(item => (
            <div key={item.label} style={{ padding:"12px 14px", background:"var(--amber-bg)", border:"1px solid rgba(255,214,10,0.2)", borderLeft:`3px solid ${C.amber}`, borderRadius:12 }}>
              <div style={{ fontSize:9, color:C.t3, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>{item.label}</div>
              <div style={{ fontSize:22, fontWeight:700, color:C.amber, fontFamily:MONO }}>{item.value}</div>
              <div style={{ fontSize:10, color:C.t4, marginTop:3 }}>{item.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:"10px 14px", background:"rgba(255,214,10,0.05)", border:"1px solid rgba(255,214,10,0.15)", borderRadius:10, fontSize:12, color:C.t2, lineHeight:1.7 }}>
          <span style={{ fontWeight:700, color:C.amber }}>Market read: </span>{data.reverseDCF.interpretation}
        </div>
      </Panel>

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
    </div>
  );
}

function ForecastSection({ data }: { data:CompanyDetail }) {
  const [sc, setSc] = useState<"base"|"upside">("base");
  const scenario = sc==="base" ? data.scenarios.base : data.scenarios.upside;
  const color = sc==="base" ? C.green : C.blue;
  const chartData = scenario.forecast.map((r:ForecastRow) => ({ year:r.year, revenue:r.revenue, ebit:r.ebit, fcff:r.fcff }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <Toggle value={sc} onChange={setSc} options={[{id:"base",label:"Base",color:C.green},{id:"upside",label:"Upside",color:C.blue}]} />
        <span style={{ fontSize:13, fontWeight:700, color, fontFamily:MONO }}>IV: ${scenario.intrinsicValue.toFixed(2)}</span>
      </div>
      <Panel title="Revenue Forecast ($B)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
            <defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.25}/><stop offset="95%" stopColor={color} stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="year" tick={{fontSize:9}}/>
            <YAxis tick={{fontSize:9}} tickFormatter={v=>`$${v}B`}/>
            <Tooltip {...TT} formatter={(v:number)=>[`$${v.toFixed(2)}B`,"Revenue"]}/>
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
              <YAxis tick={{fontSize:9}} tickFormatter={v=>`$${v}B`}/>
              <Tooltip {...TT} formatter={(v:number)=>[`$${v.toFixed(3)}B`,"EBIT"]}/>
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
              <YAxis tick={{fontSize:9}} tickFormatter={v=>`$${v}B`}/>
              <Tooltip {...TT} formatter={(v:number)=>[`$${v.toFixed(3)}B`,"FCFF"]}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>
              <Bar dataKey="fcff" fill="rgba(10,132,255,0.3)" stroke={C.blue} strokeWidth={1} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel title="Forecast Table">
        <Toggle value={sc} onChange={setSc} options={[{id:"base",label:"Base",color:C.green},{id:"upside",label:"Upside",color:C.blue}]}/>
        <div style={{ overflowX:"auto" }}>
          <table className="val-table">
            <thead><tr><th>Year</th><th>Vehicles</th><th>Rev ($B)</th><th>EBIT ($B)</th><th>Margin</th><th>FCFF ($B)</th><th>PV(FCFF)</th></tr></thead>
            <tbody>
              {scenario.forecast.map((r:ForecastRow) => {
                const m = (r.ebit/r.revenue)*100;
                return <tr key={r.year}><td>{r.year}</td><td>{(r.deliveries/1000).toFixed(0)}K</td><td>${r.revenue.toFixed(2)}</td><td className={r.ebit<0?"neg":"pos"}>${r.ebit.toFixed(3)}</td><td className={m<0?"neg":"pos"}>{m.toFixed(1)}%</td><td className={r.fcff<0?"neg":"pos"}>${r.fcff.toFixed(3)}</td><td className={r.pvFCFF<0?"neg":"pos"}>${r.pvFCFF.toFixed(3)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function DriversSection({ data }: { data:CompanyDetail }) {
  const kd = data.keyDrivers;
  const quarterly = data.financials.quarterly.map(q=>({ period:q.period.replace(" 2025","").replace(" 2025E","E"), revenue:q.revenue/1e9 }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="Volume & Growth Drivers — 2025">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
          {[
            {l:"FY2025 Deliveries",    v:kd.deliveries2025.toLocaleString(),              c:C.green},
            {l:"YoY Growth",           v:`+${kd.deliveriesGrowthYoY}%`,                   c:C.green},
            {l:"Q4 Record",            v:kd.q4Deliveries.toLocaleString(),                 c:C.blue},
            {l:"Jan 2026",             v:kd.jan2026Deliveries.toLocaleString(),            c:C.blue},
            {l:"Jan 2026 YoY",         v:`+${kd.jan2026GrowthYoY}%`,                      c:C.green},
            {l:"Rev/Vehicle",          v:`$${kd.revenuePerVehicle2025E.toLocaleString()}`, c:C.t1},
            {l:"FY2025 Rev Proxy",     v:`$${(kd.fy2025RevenueProxy/1e9).toFixed(2)}B`,   c:C.t1},
            {l:"Q3 Positive Op CF",    v:"Yes ✓",                                         c:C.green},
          ].map(item=><Metric key={item.l} label={item.l} value={item.v} color={item.c}/>)}
        </div>
      </Panel>
      <Panel title="Quarterly Revenue — 2025">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={quarterly} margin={{top:4,right:4,bottom:0,left:0}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="period" tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${v.toFixed(1)}B`}/>
            <Tooltip {...TT} formatter={(v:number)=>[`$${v.toFixed(2)}B`,"Revenue"]}/>
            <Bar dataKey="revenue" fill="rgba(10,132,255,0.3)" stroke={C.blue} strokeWidth={1.5} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Breakeven Evidence — Q3/Q4 2025">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
          {[
            {l:"Q3 Positive Op CF",    v:"Yes ✓",       c:C.green},
            {l:"Q3 Pos CF Net Capex",  v:"Yes ✓",       c:C.green},
            {l:"Q4 GAAP Op Profit",    v:"$29M–$100M",  c:C.amber},
            {l:"Q4 Non-GAAP Profit",   v:"$100M–$172M", c:C.green},
          ].map(item=><Metric key={item.l} label={item.l} value={item.v} color={item.c}/>)}
        </div>
      </Panel>
    </div>
  );
}

function DCFSection({ data }: { data:CompanyDetail }) {
  const dr = data.discountRate;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="CAPM Build">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
          {[
            {l:"Risk-Free Rate",  v:`${dr.rf.toFixed(2)}%`,          c:C.t1},
            {l:"Beta",            v:dr.beta.toFixed(2),               c:C.t1},
            {l:"China ERP",       v:`${dr.erp.toFixed(2)}%`,          c:C.t1},
            {l:"Cost of Equity",  v:`${dr.costOfEquity.toFixed(3)}%`, c:C.blue},
            {l:"Terminal Growth", v:`${dr.terminalGrowth.toFixed(1)}%`,c:C.amber},
          ].map(item=><Metric key={item.l} label={item.l} value={item.v} color={item.c}/>)}
        </div>
        <div style={{ padding:"10px 14px", background:"var(--blue-bg)", border:"1px solid rgba(10,132,255,0.2)", borderRadius:10, fontSize:12, fontFamily:MONO, color:C.t2 }}>
          CoE = {dr.rf}% + {dr.beta} × {dr.erp}% = <span style={{color:C.blue,fontWeight:700}}>{dr.costOfEquity.toFixed(3)}%</span>
        </div>
      </Panel>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {(["base","upside"] as const).map(s => {
          const sc = data.scenarios[s];
          const color = s==="base" ? C.green : C.blue;
          return (
            <Panel key={s} title={`${sc.label} Case`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                <Metric label="Intrinsic Value" value={`$${sc.intrinsicValue.toFixed(2)}`} color={color}/>
                <Metric label="Sales/Capital"   value={`${sc.salestoCapital}×`}/>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, color:C.t4, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontWeight:600 }}>Delivery Growth</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {sc.deliveryGrowthPath.map((g,i)=><span key={i} style={{ fontSize:11, padding:"2px 7px", fontFamily:MONO, background:color+"15", border:`1px solid ${color}30`, borderRadius:6, color, fontWeight:600 }}>{g}%</span>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize:9, color:C.t4, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontWeight:600 }}>EBIT Margin Path</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {sc.ebitMarginPath.map((m,i)=><span key={i} style={{ fontSize:11, padding:"2px 7px", fontFamily:MONO, background:"rgba(10,132,255,0.12)", border:"1px solid rgba(10,132,255,0.25)", borderRadius:6, color:C.blue, fontWeight:600 }}>{m}%</span>)}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function RisksSection({ data }: { data:CompanyDetail }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Panel title="Risk Register">
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {data.risks.map(r=>(
            <div key={r.rank} style={{ display:"flex", gap:12, padding:"10px 12px", background:"rgba(255,69,58,0.04)", border:"1px solid rgba(255,69,58,0.12)", borderLeft:`3px solid ${C.red}`, borderRadius:12 }}>
              <div style={{ flexShrink:0, width:22, height:22, background:"var(--red-bg)", border:"1px solid rgba(255,69,58,0.3)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.red, fontFamily:MONO }}>{r.rank}</div>
              <div><div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:2 }}>{r.title}</div><div style={{ fontSize:11, color:C.t2, lineHeight:1.6 }}>{r.detail}</div></div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Management Questions">
        {data.managementQuestions.map((q,i)=>(
          <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<data.managementQuestions.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
            <span style={{ flexShrink:0, fontSize:10, fontWeight:700, color:C.blue, fontFamily:MONO, background:"var(--blue-bg)", border:"1px solid rgba(10,132,255,0.25)", borderRadius:6, padding:"2px 7px", height:"fit-content" }}>Q{i+1}</span>
            <span style={{ fontSize:11, color:C.t2, lineHeight:1.6 }}>{q}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

const TABS = [{id:"summary",l:"Summary"},{id:"forecast",l:"Forecast"},{id:"drivers",l:"Drivers"},{id:"dcf",l:"DCF"},{id:"risks",l:"Risks"}];

export default function CompanyReport({ data }: { data:CompanyDetail }) {
  const [tab, setTab] = useState("summary");
  return (
    <div style={{ maxWidth:1360, margin:"0 auto", paddingBottom:60 }}>
      {/* Header */}
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{ fontSize:11, color:C.t3, marginBottom:10 }}>
          <Link href="/" style={{ color:C.blue }}>← Coverage</Link>{" / "}{data.ticker}
        </div>
        <div className="glass" style={{ padding:"18px 18px 0", marginBottom:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12, flexWrap:"wrap" }}>
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap", marginBottom:4 }}>
                <span style={{ fontSize:26, fontWeight:700, color:C.t1, letterSpacing:"-0.03em" }}>{data.ticker}</span>
                <span style={{ fontSize:14, color:C.t2 }}>{data.name}</span>
              </div>
              <div style={{ fontSize:11, color:C.t2, lineHeight:1.6, maxWidth:560 }}>
                <span style={{ fontWeight:700, color:C.blue }}>Thesis: </span>{data.thesis}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:C.t4, marginBottom:1 }}>As of {data.asOfDate}</div>
                <div style={{ fontSize:24, fontWeight:700, color:C.amber, fontFamily:MONO, letterSpacing:"-0.03em" }}>${data.price.toFixed(2)}</div>
              </div>
              <RecTag rec={data.recommendation}/>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:2, overflowX:"auto", paddingBottom:0, borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:10, scrollbarWidth:"none" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ fontSize:12, fontWeight:tab===t.id?700:400, padding:"6px 14px", borderRadius:20, cursor:"pointer", border:"none", fontFamily:FONT, background:tab===t.id?"rgba(10,132,255,0.2)":"transparent", color:tab===t.id?C.blue:C.t3, whiteSpace:"nowrap", transition:"all 0.15s", flexShrink:0 }}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
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
