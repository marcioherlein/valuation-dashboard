"use client";
import Link from "next/link";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { CompanyIndex } from "@/types";

const REC: Record<string, { color: string; bg: string; border: string }> = {
  BUY:   { color:"var(--green)", bg:"var(--green-bg)", border:"var(--green-border)" },
  HOLD:  { color:"var(--amber)", bg:"var(--amber-bg)", border:"var(--amber-border)" },
  AVOID: { color:"var(--red)",   bg:"var(--red-bg)",   border:"var(--red-border)"   },
  SELL:  { color:"var(--red)",   bg:"var(--red-bg)",   border:"var(--red-border)"   },
};

// Simulated price path anchored to real upside value
function buildPricePath(price: number, baseValue: number) {
  const pts: { v: number }[] = [];
  const n = 24;
  let v = baseValue * 0.85;
  for (let i = 0; i < n; i++) {
    const progress = i / (n - 1);
    // End at current price
    const target = price;
    const start  = baseValue * 0.85;
    const trend  = start + (target - start) * progress;
    const noise  = (Math.random() - 0.5) * price * 0.04;
    v = trend + noise;
    pts.push({ v: Math.max(v, 0) });
  }
  return pts;
}

export default function CompanyCard({ company }: { company: CompanyIndex }) {
  const rs  = REC[company.recommendation] || REC.HOLD;
  const up  = company.upsideToBase >= 0;
  const max = company.upsideValue * 1.18;
  const pricePct  = Math.min((company.price       / max) * 100, 100);
  const basePct   = Math.min((company.baseValue   / max) * 100, 100);
  const upsidePct = Math.min((company.upsideValue / max) * 100, 100);
  const sparkData = buildPricePath(company.price, company.baseValue);

  return (
    <Link href={`/company/${company.id}`} style={{ textDecoration:"none", display:"block" }}>
      <div className="glass" style={{ padding:"16px 16px 12px", cursor:"pointer" }}>
        {/* Top shine accent */}
        <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)", borderRadius:1 }} />

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.03em", lineHeight:1.1, fontFamily:"var(--font)" }}>{company.ticker}</div>
            <div style={{ fontSize:11, color:"var(--t3)", marginTop:2, fontFamily:"var(--font)" }}>{company.name}</div>
          </div>
          <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, color:rs.color, background:rs.bg, border:`1px solid ${rs.border}`, flexShrink:0, letterSpacing:"0.05em", fontFamily:"var(--font)" }}>
            {company.recommendation}
          </span>
        </div>

        {/* Tags */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          {[company.sector, company.country].map(t => (
            <span key={t} style={{ fontSize:9, padding:"2px 7px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:5, color:"var(--t3)", fontWeight:500, fontFamily:"var(--font)" }}>{t}</span>
          ))}
        </div>

        {/* Price + sparkline */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:9, color:"var(--t4)", marginBottom:3, fontFamily:"var(--font)", letterSpacing:"0.06em", textTransform:"uppercase" }}>Current Price</div>
            <div style={{ fontSize:22, fontWeight:700, color:"var(--amber)", fontFamily:"var(--mono)", letterSpacing:"-0.03em" }}>
              {company.price >= 100
                ? `$${company.price.toLocaleString("en-US",{maximumFractionDigits:0})}`
                : `$${company.price.toFixed(2)}`}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={sparkData} margin={{top:2,right:0,bottom:2,left:0}}>
              <Line type="monotone" dataKey="v" stroke={up ? "var(--green)" : "var(--red)"} strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spectrum bar */}
        <div style={{ position:"relative", height:6, background:"rgba(255,255,255,0.07)", borderRadius:6, marginBottom:10 }}>
          <div style={{ position:"absolute", top:0, left:`${pricePct}%`, width:`${Math.max(basePct-pricePct,0)}%`, height:"100%", background:"linear-gradient(90deg,rgba(59,158,255,0.4),var(--green))", borderRadius:6 }} />
          <div style={{ position:"absolute", top:"50%", left:`${pricePct}%`,  width:11, height:11, background:"var(--amber)", borderRadius:"50%", border:"2px solid rgba(0,0,0,0.5)", transform:"translate(-50%,-50%)", boxShadow:"0 0 8px var(--amber)", zIndex:3 }} />
          <div style={{ position:"absolute", top:"50%", left:`${basePct}%`,   width:11, height:11, background:"var(--green)", borderRadius:"50%", border:"2px solid rgba(0,0,0,0.5)", transform:"translate(-50%,-50%)", boxShadow:"0 0 8px var(--green)", zIndex:2 }} />
          <div style={{ position:"absolute", top:-3,    left:`${upsidePct}%`, width:2,  height:12, background:"var(--blue)", borderRadius:1, transform:"translateX(-50%)" }} />
        </div>

        {/* Value row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, marginBottom:10 }}>
          {[
            { l:"Base IV",  v:company.baseValue,  c:"var(--green)" },
            { l:"Bull IV",  v:company.upsideValue, c:"var(--blue)"  },
          ].map(item => (
            <div key={item.l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:9, color:"var(--t4)", marginBottom:2, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:"var(--font)" }}>{item.l}</div>
              <div style={{ fontSize:12, fontWeight:700, color:item.c, fontFamily:"var(--mono)" }}>
                {item.v >= 100 ? `$${item.v.toLocaleString("en-US",{maximumFractionDigits:0})}` : `$${item.v.toFixed(2)}`}
              </div>
            </div>
          ))}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:9, color:"var(--t4)", marginBottom:2, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:"var(--font)" }}>To Base</div>
            <div style={{ fontSize:12, fontWeight:700, color: up ? "var(--green)" : "var(--red)", fontFamily:"var(--mono)" }}>
              {up ? "+" : ""}{company.upsideToBase.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize:9, color:"var(--t4)", fontFamily:"var(--font)" }}>{company.asOfDate}</span>
          <span style={{ fontSize:9, color:"var(--t3)", fontFamily:"var(--font)" }}>{company.exchange}</span>
        </div>
      </div>
    </Link>
  );
}
