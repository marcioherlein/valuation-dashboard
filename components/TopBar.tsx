"use client";
import Link from "next/link";

export default function TopBar() {
  return (
    <header style={{
      background: "rgba(13,17,23,0.80)",
      backdropFilter: "blur(32px) saturate(160%)",
      WebkitBackdropFilter: "blur(32px) saturate(160%)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      height: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px",
      position: "sticky", top: 0, zIndex: 200,
    }}>
      <Link href="/" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{
          width:30, height:30,
          background: "linear-gradient(145deg, #3b9eff, #c77dff)",
          borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, fontWeight:800, color:"#fff",
          boxShadow:"0 4px 14px rgba(59,158,255,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
          fontFamily:"var(--font)",
        }}>V</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:1 }}>
          <span style={{ fontSize:16, fontWeight:700, color:"rgba(238,246,255,0.95)", letterSpacing:"-0.03em", fontFamily:"var(--font)" }}>VAL</span>
          <span style={{ fontSize:16, fontWeight:300, color:"rgba(180,205,230,0.40)", fontFamily:"var(--font)" }}>-X</span>
        </div>
      </Link>

      <div style={{ display:"flex", gap:2 }}>
        {[{label:"Markets",href:"#markets"},{label:"Coverage",href:"#coverage"}].map(item=>(
          <a key={item.label} href={item.href} style={{ fontSize:13, fontWeight:500, color:"var(--t3)", padding:"5px 12px", borderRadius:10, textDecoration:"none", transition:"all 0.15s", fontFamily:"var(--font)" }}
            onMouseEnter={e=>{const el=e.currentTarget; el.style.color="var(--t1)"; el.style.background="rgba(255,255,255,0.07)";}}
            onMouseLeave={e=>{const el=e.currentTarget; el.style.color="var(--t3)"; el.style.background="transparent";}}
          >{item.label}</a>
        ))}
      </div>

      <div style={{ fontSize:10, fontWeight:600, color:"var(--amber)", background:"var(--amber-bg)", border:"1px solid var(--amber-border)", borderRadius:8, padding:"3px 9px", letterSpacing:"0.03em", fontFamily:"var(--font)", whiteSpace:"nowrap" }}>
        <span className="hide-mobile">Educational · </span>Not Investment Advice
      </div>
    </header>
  );
}
