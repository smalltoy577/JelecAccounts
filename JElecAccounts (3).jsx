import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n || 0);
const fmtN = (n) => new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n || 0);
const uid  = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

// ─────────────────────────────────────────────
//  SEED DATA (used only to fill DB the first time)
// ─────────────────────────────────────────────
const FANS_SEED = [
  { id:"f1", type:"fan", name:"GFC Stand Fan",    spec:'24"', watt:null, stock:8,  price:4200, updated_at:null },
  { id:"f2", type:"fan", name:"Pak Fan Ceiling",  spec:'56"', watt:null, stock:3,  price:3800, updated_at:null },
  { id:"f3", type:"fan", name:"Royal Fan Table",  spec:'12"', watt:null, stock:0,  price:1800, updated_at:null },
  { id:"f4", type:"fan", name:"GFC Pedestal",     spec:'18"', watt:null, stock:12, price:5500, updated_at:null },
  { id:"f5", type:"fan", name:"Orient Bracket",   spec:'48"', watt:null, stock:2,  price:6200, updated_at:null },
  { id:"f6", type:"fan", name:"Super Asia Wall",  spec:'16"', watt:null, stock:7,  price:2900, updated_at:null },
];
const BULBS_SEED = [
  { id:"b1", type:"bulb", name:"Philips LED",     spec:null, watt:9,  stock:24, price:180,  updated_at:null },
  { id:"b2", type:"bulb", name:"Sogo LED",        spec:null, watt:12, stock:15, price:220,  updated_at:null },
  { id:"b3", type:"bulb", name:"Energy Saver",    spec:null, watt:18, stock:0,  price:310,  updated_at:null },
  { id:"b4", type:"bulb", name:"Philips Bright",  spec:null, watt:24, stock:9,  price:420,  updated_at:null },
  { id:"b5", type:"bulb", name:"Local LED Bulb",  spec:null, watt:9,  stock:40, price:120,  updated_at:null },
  { id:"b6", type:"bulb", name:"Vision LED",      spec:null, watt:12, stock:6,  price:195,  updated_at:null },
];

// ─────────────────────────────────────────────
//  ICONS
// ─────────────────────────────────────────────
const Ic = ({d,size=18,stroke="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
const IEye    = ({off}) => off
  ? <Ic d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
  : <Ic d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z"/>;
const IMenu   = () => <Ic d="M3 12h18M3 6h18M3 18h18"/>;
const ILogout = () => <Ic d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;
const IChart  = () => <Ic d="M18 20V10M12 20V4M6 20v-6"/>;
const IBox    = () => <Ic d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>;
const ILedger = () => <Ic d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>;
const IPlus   = () => <Ic d="M12 5v14M5 12h14"/>;
const IClose  = () => <Ic d="M18 6L6 18M6 6l12 12"/>;
const ILog    = () => <Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>;
const ITrash  = () => <Ic d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>;

// ─────────────────────────────────────────────
//  STYLE TOKENS
// ─────────────────────────────────────────────
const card = {background:"#1e293b",border:"1px solid rgba(51,65,85,0.6)",borderRadius:14};
const inputSt = {
  width:"100%",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(51,65,85,0.8)",
  borderRadius:10,color:"#f1f5f9",fontSize:15,padding:"0 14px",height:48,
  fontFamily:"inherit",outline:"none",boxSizing:"border-box"
};
const labelSt = {display:"block",color:"#94a3b8",fontSize:12,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:7};

// ═════════════════════════════════════════════════════════════
//  LOGIN
// ═════════════════════════════════════════════════════════════
function LoginPage({onLogin}) {
  const [phone,setPhone]=useState(""); const [pass,setPass]=useState("");
  const [show,setShow]=useState(false); const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
 const go = () => {
    if (!phone||!pass){setErr("All fields required.");return;}
    if (phone.replace(/\s/g,"")!=="your phone"||pass!=="yourpass"){
      setErr("Invalid phone or password.");return;
    }
    setErr(""); setLoading(true);
    setTimeout(()=>{setLoading(false);onLogin();},1100);
  };
  return (
    <div style={{minHeight:"100vh",background:"#020617",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(37,99,235,0.16) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px)",backgroundSize:"44px 44px",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{background:"rgba(30,41,59,0.88)",backdropFilter:"blur(20px)",border:"1px solid rgba(37,99,235,0.25)",borderRadius:22,padding:"2.5rem 2.25rem"}}>
          <div style={{textAlign:"center",marginBottom:"2rem"}}>
            <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:16,background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",marginBottom:"1rem"}}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h1 style={{fontSize:28,fontWeight:800,color:"#f8fafc",margin:0,letterSpacing:-0.8}}>J<span style={{color:"#3b82f6"}}>Elec</span> Accounts</h1>
            <p style={{color:"#475569",fontSize:12,marginTop:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>Secure Management Access Only</p>
          </div>
          <div style={{marginBottom:"1rem"}}>
            <label style={labelSt}>Phone</label>
            <div style={{display:"flex",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(51,65,85,0.8)",borderRadius:10,overflow:"hidden"}}>
              <span style={{padding:"0 12px",color:"#3b82f6",fontSize:14,fontWeight:700,borderRight:"1px solid rgba(51,65,85,0.7)",height:48,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.4 1.13 2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                +88
              </span>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="1XX XXXXXXX" type="tel" style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#f1f5f9",fontSize:15,padding:"0 14px",height:48,fontFamily:"inherit"}}/>
            </div>
          </div>
          <div style={{marginBottom:"1.5rem"}}>
            <label style={labelSt}>Password</label>
            <div style={{display:"flex",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(51,65,85,0.8)",borderRadius:10,overflow:"hidden"}}>
              <span style={{padding:"0 12px",color:"#475569",height:48,display:"flex",alignItems:"center"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </span>
              <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type={show?"text":"password"} onKeyDown={e=>e.key==="Enter"&&go()} style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#f1f5f9",fontSize:15,height:48,fontFamily:"inherit"}}/>
              <button onClick={()=>setShow(s=>!s)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",padding:"0 14px",height:48,display:"flex",alignItems:"center"}}><IEye off={show}/></button>
            </div>
          </div>
          {err&&<p style={{color:"#f43f5e",fontSize:13,textAlign:"center",marginBottom:"1rem",marginTop:-8}}>{err}</p>}
          <button onClick={go} disabled={loading} style={{width:"100%",height:52,background:loading?"rgba(37,99,235,0.5)":"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",borderRadius:13,color:"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 24px rgba(37,99,235,0.3)",fontFamily:"inherit"}}>
            {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{animation:"spin .8s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Signing in…</span>:"Sign In →"}
          </button>
          <p style={{color:"#334155",fontSize:12,textAlign:"center",marginTop:"1.25rem"}}>Private access — no registration available</p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  DASHBOARD SHELL
// ═════════════════════════════════════════════════════════════
function Dashboard({onLogout}) {
  const [tab,setTab]       = useState("ledger");
  const [sideOpen,setSide] = useState(false);
  const [fans,setFans]     = useState([]);
  const [bulbs,setBulbs]   = useState([]);
  const [salesLog,setSLog] = useState([]);
  const [ledger,setLedger] = useState([]);
  const [loading,setLoading] = useState(true);
  const [dbError,setDbError] = useState("");

  // ── Load all data from Supabase on mount ──────────────────
  useEffect(() => {
    loadAll();
    setupRealtime();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setDbError("");
    try {
      const [prodRes, ledRes, logRes] = await Promise.all([
        supabase.from("products").select("*").order("id"),
        supabase.from("ledger").select("*").order("date", { ascending: false }),
        supabase.from("sales_log").select("*").order("ts", { ascending: false }),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (ledRes.error)  throw ledRes.error;
      if (logRes.error)  throw logRes.error;

      // If products table is empty, seed it with initial data
      if (prodRes.data.length === 0) {
        const seedData = [...FANS_SEED, ...BULBS_SEED];
        await supabase.from("products").upsert(seedData, { onConflict: "id" });
        setFans(FANS_SEED);
        setBulbs(BULBS_SEED);
      } else {
        setFans(prodRes.data.filter(p => p.type === "fan").map(dbToProduct));
        setBulbs(prodRes.data.filter(p => p.type === "bulb").map(dbToProduct));
      }

      setLedger(ledRes.data.map(dbToLedger));
      setSLog(logRes.data.map(dbToSalesLog));
    } catch (err) {
      console.error("Load error:", err);
      setDbError("Could not connect to database. Check your .env keys.");
    }
    setLoading(false);
  };

  // ── Real-time subscriptions ───────────────────────────────
  const setupRealtime = () => {
    try {
      supabase.channel("jelec-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
          supabase.from("products").select("*").order("id").then(({ data }) => {
            if (data) {
              setFans(data.filter(p => p.type === "fan").map(dbToProduct));
              setBulbs(data.filter(p => p.type === "bulb").map(dbToProduct));
            }
          });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "ledger" }, () => {
          supabase.from("ledger").select("*").order("date", { ascending: false }).then(({ data }) => {
            if (data) setLedger(data.map(dbToLedger));
          });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "sales_log" }, () => {
          supabase.from("sales_log").select("*").order("ts", { ascending: false }).then(({ data }) => {
            if (data) setSLog(data.map(dbToSalesLog));
          });
        })
        .subscribe((status, err) => {
          if (err) console.warn("Realtime warning (non-fatal):", err.message);
        });
    } catch(e) {
      console.warn("Realtime not available:", e.message);
    }
  };

  // ── DB row → app object converters ───────────────────────
  const dbToProduct = (r) => ({
    id: r.id, type: r.type, name: r.name, spec: r.spec, watt: r.watt,
    stock: r.stock, price: r.price,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : null
  });
  const dbToLedger = (r) => ({
    id: r.id, date: r.date,
    sell: Number(r.sell)||0, cost: Number(r.cost)||0,
    bill: Number(r.bill)||0,
    profit: Number(r.profit)||0,
    homePay: Number(r.home_pay)||0, homeWith: Number(r.home_with)||0,
    note: r.note||""
  });
  const dbToSalesLog = (r) => ({
    id: r.id, productId: r.product_id, productName: r.product_name,
    productType: r.product_type, spec: r.spec, watt: r.watt,
    qty: r.qty, priceEach: Number(r.price_each),
    buyPriceEach: Number(r.buy_price_each||r.price_each),
    profitEach: Number(r.profit_each||(r.price_each-r.price_each)||0),
    total: Number(r.total),
    profitTotal: Number(r.profit_total||0),
    date: r.date, monthKey: r.month_key, ts: r.ts
  });

  // ── Sale logging ──────────────────────────────────────────
  const logSale = async (product, qty=1) => {
    const now = new Date();
    const entry = {
      id: uid(),
      product_id: product.id,
      product_name: product.name,
      product_type: product.type,
      spec: product.spec || null,
      watt: product.watt || null,
      qty,
      price_each: product.price,
      total: product.price * qty,
      date: now.toISOString().slice(0,10),
      month_key: monthKey(now),
      ts: now.getTime(),
    };
    // Optimistic update
    setSLog(prev => [dbToSalesLog({...entry, product_id:entry.product_id, product_name:entry.product_name, product_type:entry.product_type, price_each:entry.price_each, month_key:entry.month_key}), ...prev]);
    await supabase.from("sales_log").insert(entry);
  };

  // ── Stock adjustment ──────────────────────────────────────
  const adjustStock = async (id, delta, isFan) => {
    const items   = isFan ? fans : bulbs;
    const setItems = isFan ? setFans : setBulbs;
    const product = items.find(p => p.id === id);
    if (!product) return;
    if (delta < 0 && product.stock <= 0) return;
    const newStock = Math.max(0, product.stock + delta);
    const now = new Date().toISOString();

    // Optimistic update
    setItems(list => list.map(p => p.id===id ? {...p, stock:newStock, updatedAt:Date.now()} : p));

    // Save to DB
    await supabase.from("products")
      .update({ stock: newStock, updated_at: now })
      .eq("id", id);

    if (delta < 0) await logSale(product, Math.abs(delta));
  };

  const navItems = [
    ["ledger",    "Ledger",    <ILedger/>],
    ["inventory", "Stock",     <IBox/>],
    ["saleslog",  "Sales Log", <ILog/>],
    ["reports",   "Reports",   <IChart/>],
  ];

  if (loading) {
    return (
      <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" style={{animation:"spin .8s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <p style={{color:"#64748b",fontSize:15}}>Loading from database…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (dbError) {
    return (
      <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.3)",borderRadius:18,padding:"2rem",maxWidth:440,textAlign:"center"}}>
          <p style={{fontSize:32,margin:"0 0 12px"}}>⚠️</p>
          <h2 style={{color:"#f43f5e",margin:"0 0 8px"}}>Database Error</h2>
          <p style={{color:"#94a3b8",fontSize:14,margin:"0 0 20px"}}>{dbError}</p>
          <button onClick={loadAll} style={{padding:"12px 28px",background:"#2563eb",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#0f172a",color:"#f1f5f9",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <header style={{background:"#1e293b",borderBottom:"1px solid rgba(51,65,85,0.7)",padding:"0 1.25rem",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSide(s=>!s)} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",padding:6,borderRadius:8,display:"flex"}}><IMenu/></button>
          <span style={{fontWeight:800,fontSize:18,color:"#f8fafc",letterSpacing:-0.5}}>J<span style={{color:"#3b82f6"}}>Elec</span></span>
        </div>
        <span style={{fontSize:12,color:"#475569"}}>{new Date().toLocaleDateString("en-BD",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</span>
        <button onClick={onLogout} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",padding:"6px 8px",borderRadius:8}}><ILogout/></button>
      </header>

      {sideOpen&&<div onClick={()=>setSide(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:40}}/>}
      <aside style={{position:"fixed",top:0,left:sideOpen?0:-260,width:240,height:"100vh",background:"#1e293b",borderRight:"1px solid rgba(51,65,85,0.7)",zIndex:45,transition:"left .25s",padding:"1.5rem 1rem",display:"flex",flexDirection:"column"}}>
        <div style={{marginBottom:"2rem"}}>
          <h2 style={{fontSize:18,fontWeight:800,color:"#f8fafc",margin:0}}>J<span style={{color:"#3b82f6"}}>Elec</span> Accounts</h2>
          <p style={{color:"#475569",fontSize:12,marginTop:4}}>Manager Portal</p>
        </div>
        {navItems.map(([id,label,icon])=>(
          <button key={id} onClick={()=>{setTab(id);setSide(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,marginBottom:6,background:tab===id?"rgba(37,99,235,0.2)":"transparent",border:tab===id?"1px solid rgba(37,99,235,0.35)":"1px solid transparent",color:tab===id?"#3b82f6":"#94a3b8",fontSize:15,fontWeight:tab===id?700:400,cursor:"pointer",textAlign:"left"}}>
            {icon} {label}
          </button>
        ))}
        <div style={{marginTop:"auto"}}>
          <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:"transparent",border:"1px solid rgba(244,63,94,0.3)",color:"#f43f5e",fontSize:15,cursor:"pointer"}}><ILogout/> Logout</button>
        </div>
      </aside>

      <main style={{flex:1,padding:"1.25rem",width:"100%",maxWidth:tab==="inventory"?"100%":860,margin:"0 auto",boxSizing:"border-box"}}>
        {tab==="ledger"    && <LedgerModule    ledger={ledger}   setLedger={setLedger}/>}
        {tab==="inventory" && <InventoryModule fans={fans} setFans={setFans} bulbs={bulbs} setBulbs={setBulbs} adjustStock={adjustStock} setSLog={setSLog}/>}
        {tab==="saleslog"  && <SalesLogModule  salesLog={salesLog}/>}
        {tab==="reports"   && <ReportsModule   ledger={ledger}/>}
      </main>

      <nav style={{background:"#1e293b",borderTop:"1px solid rgba(51,65,85,0.7)",display:"flex",position:"sticky",bottom:0,zIndex:30,minHeight:58}}>
        {navItems.map(([id,label,icon])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",color:tab===id?"#3b82f6":"#475569",borderTop:tab===id?"2px solid #3b82f6":"2px solid transparent",transition:"color .15s"}}>
            {icon}<span style={{fontSize:11,fontWeight:tab===id?700:400}}>{label}</span>
          </button>
        ))}
      </nav>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  PDF HELPER
// ═════════════════════════════════════════════════════════════
function downloadLedgerPDF(ledger, monthKey) {
  const [y,m] = monthKey.split("-");
  const monthName = MONTHS[parseInt(m)-1]+" "+y;
  const days = ledger.filter(d=>{
    const dd=new Date(d.date); return dd.getMonth()===(parseInt(m)-1)&&dd.getFullYear()===parseInt(y);
  }).sort((a,b)=>a.date.localeCompare(b.date));

  const fmt2=(n)=>new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(n||0);
  const totalSell=days.reduce((s,d)=>s+d.sell,0);
  const totalCost=days.reduce((s,d)=>s+d.cost,0);
  const totalBill=days.reduce((s,d)=>s+d.bill,0);
  const totalProfit=days.reduce((s,d)=>s+(d.profit||0),0);

  const rows = days.map(d=>`
    <tr>
      <td>${new Date(d.date+"T00:00:00").toLocaleDateString("en-BD",{weekday:"short",day:"numeric",month:"short"})}</td>
      <td style="color:#10b981">${fmt2(d.sell)}</td>
      <td style="color:#f59e0b">${fmt2(d.cost)}</td>
      <td style="color:#f43f5e">${fmt2(d.bill)}</td>
      <td style="color:#a78bfa;font-weight:700">${fmt2(d.profit||0)}</td>
      <td style="color:#64748b;font-size:11px">${d.note||"-"}</td>
    </tr>`).join("");

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ledger ${monthName}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px;}
    h1{color:#3b82f6;margin:0 0 4px;font-size:26px;}
    p.sub{color:#64748b;font-size:13px;margin:0 0 20px;}
    table{width:100%;border-collapse:collapse;font-size:13px;}
    th{background:#1e293b;color:#94a3b8;padding:10px 12px;text-align:left;border-bottom:1px solid #334155;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
    td{padding:9px 12px;border-bottom:1px solid #1e293b;}
    tr:hover td{background:rgba(37,99,235,.06);}
    .summary{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;}
    .box{background:#1e293b;border-radius:10px;padding:14px 18px;flex:1;min-width:110px;}
    .box .label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
    .box .val{font-size:20px;font-weight:800;}
    tfoot td{font-weight:800;background:#1e293b;padding:11px 12px;}
  </style></head><body>
  <h1>JElec Accounts</h1>
  <p class="sub">Ledger Report — ${monthName} · Generated ${new Date().toLocaleDateString()}</p>
  <div class="summary">
    <div class="box"><div class="label">Total Sell</div><div class="val" style="color:#10b981">৳${fmt2(totalSell)}</div></div>
    <div class="box"><div class="label">Total Cost</div><div class="val" style="color:#f59e0b">৳${fmt2(totalCost)}</div></div>
    <div class="box"><div class="label">Total Bill</div><div class="val" style="color:#f43f5e">৳${fmt2(totalBill)}</div></div>
    <div class="box"><div class="label">Total Profit</div><div class="val" style="color:#a78bfa">৳${fmt2(totalProfit)}</div></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Sell (৳)</th><th>Cost (৳)</th><th>Bill (৳)</th><th>Profit (৳)</th><th>Note</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td>TOTAL</td><td style="color:#10b981">৳${fmt2(totalSell)}</td><td style="color:#f59e0b">৳${fmt2(totalCost)}</td><td style="color:#f43f5e">৳${fmt2(totalBill)}</td><td style="color:#a78bfa">৳${fmt2(totalProfit)}</td><td></td></tr></tfoot>
  </table>
  </body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download=`JElec_Ledger_${monthName.replace(" ","_")}.html`; a.click();
}

function downloadSalesLogPDF(salesLog, selMonth) {
  const [y,m]=selMonth.split("-");
  const monthName=MONTHS[parseInt(m)-1]+" "+y;
  const entries=salesLog.filter(e=>e.monthKey===selMonth).sort((a,b)=>b.ts-a.ts);
  const fmt2=(n)=>new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(n||0);

  const byProduct={};
  entries.forEach(e=>{
    if(!byProduct[e.productId])byProduct[e.productId]={name:e.productName,type:e.productType,qty:0,rev:0};
    byProduct[e.productId].qty+=e.qty; byProduct[e.productId].rev+=e.total;
  });

  const summaryRows=Object.values(byProduct).sort((a,b)=>b.qty-a.qty).map(p=>`
    <tr><td>${p.type==="fan"?"🌀":"💡"} ${p.name}</td><td style="color:#3b82f6">${p.qty} pcs</td><td style="color:#10b981">৳${fmt2(p.rev)}</td></tr>`).join("");

  const logRows=entries.map(e=>`
    <tr>
      <td>${new Date(e.date+"T00:00:00").toLocaleDateString("en-BD",{weekday:"short",day:"numeric",month:"short"})}</td>
      <td>${e.productType==="fan"?"🌀":"💡"} ${e.productName}${e.watt?" "+e.watt+"W":""}${e.spec?" "+e.spec:""}</td>
      <td style="color:#f43f5e">−${e.qty} pc${e.qty!==1?"s":""}</td>
      <td style="color:#10b981">৳${fmt2(e.total)}</td>
    </tr>`).join("");

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sales ${monthName}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px;}
    h1{color:#3b82f6;margin:0 0 4px;font-size:26px;}h2{color:#94a3b8;font-size:15px;margin:24px 0 10px;}
    p.sub{color:#64748b;font-size:13px;margin:0 0 20px;}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px;}
    th{background:#1e293b;color:#94a3b8;padding:10px 12px;text-align:left;border-bottom:1px solid #334155;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
    td{padding:9px 12px;border-bottom:1px solid #1e293b;}
  </style></head><body>
  <h1>JElec Accounts</h1>
  <p class="sub">Sales Log — ${monthName} · Generated ${new Date().toLocaleDateString()}</p>
  <h2>Product Summary</h2>
  <table><thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead><tbody>${summaryRows}</tbody></table>
  <h2>Transaction Log</h2>
  <table><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead><tbody>${logRows}</tbody></table>
  </body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download=`JElec_Sales_${monthName.replace(" ","_")}.html`; a.click();
}

function downloadFansPDF(fans) {
  const fmt2=(n)=>new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(n||0);
  const totalValue=fans.reduce((s,p)=>s+p.stock*p.price,0);
  const totalUnits=fans.reduce((s,p)=>s+p.stock,0);
  const rows=fans.map((p,i)=>`
    <tr>
      <td style="color:#64748b;font-size:11px">${i+1}</td>
      <td style="font-weight:600">${p.name}</td>
      <td><span style="background:rgba(100,116,139,0.2);color:#94a3b8;padding:2px 8px;border-radius:5px;font-size:12px">${p.spec||"-"}</span></td>
      <td style="text-align:center;color:${p.stock===0?"#f43f5e":p.stock<=3?"#f59e0b":"#10b981"};font-weight:700">${p.stock}</td>
      <td style="text-align:right;color:#3b82f6;font-weight:700">৳${fmt2(p.price)}</td>
      <td style="text-align:right;color:#a78bfa;font-weight:700">৳${fmt2(p.stock*p.price)}</td>
    </tr>`).join("");

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>JElec — Fans Stock List</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:28px;}
    h1{color:#3b82f6;margin:0 0 4px;font-size:26px;} h1 span{color:#f8fafc;}
    p.sub{color:#64748b;font-size:13px;margin:0 0 24px;}
    .summary{display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap;}
    .box{background:#1e293b;border-radius:10px;padding:14px 20px;flex:1;min-width:120px;}
    .box .label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
    .box .val{font-size:22px;font-weight:800;}
    table{width:100%;border-collapse:collapse;font-size:13px;}
    th{background:#1e293b;color:#94a3b8;padding:10px 12px;text-align:left;border-bottom:1px solid #334155;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
    td{padding:10px 12px;border-bottom:1px solid rgba(51,65,85,0.5);}
    tr:hover td{background:rgba(37,99,235,.06);}
    tfoot td{font-weight:800;background:#1e293b;padding:11px 12px;font-size:13px;}
  </style></head><body>
  <h1>J<span>Elec</span> Accounts</h1>
  <p class="sub">🌀 Fans Stock List — Generated ${new Date().toLocaleDateString("en-BD",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
  <div class="summary">
    <div class="box"><div class="label">Total Products</div><div class="val" style="color:#60a5fa">${fans.length}</div></div>
    <div class="box"><div class="label">Total Units</div><div class="val" style="color:#10b981">${totalUnits}</div></div>
    <div class="box"><div class="label">Stock Value</div><div class="val" style="color:#a78bfa">৳${fmt2(totalValue)}</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Product Name</th><th>Size</th><th style="text-align:center">Stock</th><th style="text-align:right">Unit Price (৳)</th><th style="text-align:right">Total Value (৳)</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3">TOTAL</td><td style="text-align:center;color:#10b981">${totalUnits} units</td><td></td><td style="text-align:right;color:#a78bfa">৳${fmt2(totalValue)}</td></tr></tfoot>
  </table>
  </body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download=`JElec_Fans_Stock_${new Date().toISOString().slice(0,10)}.html`; a.click();
}

// ═════════════════════════════════════════════════════════════
//  LEDGER MODULE
// ═════════════════════════════════════════════════════════════
function LedgerModule({ledger,setLedger}) {
  const [sell,setSell]=useState(""); const [cost,setCost]=useState("");
  const [bill,setBill]=useState(""); const [note,setNote]=useState("");
  const [profit,setProfit]=useState("");
  const [homePay,setHomePay]=useState("");
  const [homeWith,setHomeWith]=useState("");
  const [saved,setSaved]=useState(false); const [saving,setSaving]=useState(false);
  const [histView,setHistView]=useState("monthly");
  const [editEntry,setEditEntry]=useState(null);
  const [delEntry,setDelEntry]=useState(null);
  const [entryDate,setEntryDate]=useState(todayKey());
  const now=new Date();

  // Monthly profit = sum of all profit fields from ledger entries
  const currentMonthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthlyDaysAll=ledger.filter(d=>{const dd=new Date(d.date);return dd.getMonth()===now.getMonth()&&dd.getFullYear()===now.getFullYear();});
  const monthTotalProfit=monthlyDaysAll.reduce((s,d)=>s+(d.profit||0),0);

  const saveEntry = async () => {
    setSaving(true);
    const entry = {
      id: uid(), date: entryDate,
      sell: parseFloat(sell)||0, cost: parseFloat(cost)||0,
      bill: parseFloat(bill)||0,
      profit: parseFloat(profit)||0,
      note,
      home_pay: parseFloat(homePay)||0,
      home_with: parseFloat(homeWith)||0,
    };
    const { error } = await supabase.from("ledger").insert(entry);
    if (!error) {
      setLedger(h => [{
        id:entry.id, date:entry.date,
        sell:entry.sell, cost:entry.cost, bill:entry.bill,
        profit:entry.profit, note:entry.note,
        homePay:entry.home_pay, homeWith:entry.home_with
      }, ...h]);
      setSell(""); setCost(""); setBill(""); setNote(""); setHomePay(""); setHomeWith(""); setProfit("");
      setEntryDate(todayKey());
      setSaved(true); setTimeout(()=>setSaved(false),2200);
    }
    setSaving(false);
  };

  const saveEdit = async (updated) => {
    const { error } = await supabase.from("ledger").update({
      sell: updated.sell, cost: updated.cost, bill: updated.bill,
      profit: updated.profit||0,
      note: updated.note,
      home_pay: updated.homePay, home_with: updated.homeWith,
    }).eq("id", updated.id);
    if (!error) {
      setLedger(h => h.map(e => e.id===updated.id ? updated : e));
      setEditEntry(null);
    }
  };

  const confirmDelete = async (id) => {
    await supabase.from("ledger").delete().eq("id", id);
    setLedger(h => h.filter(e => e.id !== id));
    setDelEntry(null);
  };

  const monthlyDays=ledger.filter(d=>{const dd=new Date(d.date);return dd.getMonth()===now.getMonth()&&dd.getFullYear()===now.getFullYear();}).sort((a,b)=>b.date.localeCompare(a.date));
  const monthHomePay  = monthlyDays.reduce((s,d)=>s+(d.homePay||0),0);
  const monthHomeWith = monthlyDays.reduce((s,d)=>s+(d.homeWith||0),0);

  const yearlyMonths=(()=>{
    const map={};
    ledger.filter(d=>new Date(d.date).getFullYear()===now.getFullYear()).forEach(d=>{
      const m=new Date(d.date).getMonth();
      if(!map[m])map[m]={month:m,sell:0,cost:0,bill:0,profit:0,days:0,homePay:0,homeWith:0};
      map[m].sell+=d.sell; map[m].cost+=d.cost; map[m].bill+=d.bill;
      map[m].profit+=(d.profit||0); map[m].days++;
      map[m].homePay+=(d.homePay||0); map[m].homeWith+=(d.homeWith||0);
    });
    return Object.values(map).sort((a,b)=>b.month-a.month);
  })();

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:22,fontWeight:800,color:"#f8fafc",margin:0,letterSpacing:-0.5}}>Daily Ledger</h2>
        <button onClick={()=>downloadLedgerPDF(ledger,currentMonthKey)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.35)",borderRadius:10,color:"#3b82f6",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          📄 Download PDF
        </button>
      </div>
      <p style={{color:"#475569",fontSize:13,marginBottom:"1.5rem"}}>{now.toLocaleDateString("en-BD",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>

      {/* Month Summary Banner */}
      {(()=>{
        const mSell=monthlyDaysAll.reduce((s,d)=>s+d.sell,0);
        const mCost=monthlyDaysAll.reduce((s,d)=>s+d.cost,0);
        const mBill=monthlyDaysAll.reduce((s,d)=>s+d.bill,0);
        const isP=monthTotalProfit>=0;
        return (
          <div style={{background:isP?"rgba(16,185,129,0.07)":"rgba(244,63,94,0.07)",border:`1px solid ${isP?"rgba(16,185,129,0.22)":"rgba(244,63,94,0.22)"}`,borderRadius:18,padding:"1.25rem 1.5rem",marginBottom:"1.5rem"}}>
            <p style={{color:"#64748b",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 12px"}}>📅 {MONTHS[now.getMonth()]} {now.getFullYear()} — {monthlyDaysAll.length} entries</p>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:100}}>
                <p style={{color:"#475569",fontSize:10,fontWeight:700,textTransform:"uppercase",margin:"0 0 3px"}}>Total Profit</p>
                <p style={{fontSize:38,fontWeight:900,color:isP?"#10b981":"#f43f5e",margin:0,letterSpacing:-1,lineHeight:1}}>{fmt(monthTotalProfit)}</p>
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {[["Sell",mSell,"#10b981"],["Cost",mCost,"#f59e0b"],["Bill",mBill,"#f43f5e"]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <p style={{color:"#475569",fontSize:10,fontWeight:600,textTransform:"uppercase",margin:"0 0 3px"}}>{l}</p>
                    <p style={{color:c,fontSize:17,fontWeight:800,margin:0}}>{fmt(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Date Picker */}
      <div style={{marginBottom:"1rem"}}>
        <label style={labelSt}>Entry Date</label>
        <input type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)} max={todayKey()}
          style={{...inputSt,colorScheme:"dark",cursor:"pointer"}}/>
        {entryDate!==todayKey()&&<p style={{color:"#f59e0b",fontSize:12,margin:"6px 0 0"}}>⚠️ Logging for past date: {new Date(entryDate+"T00:00:00").toLocaleDateString("en-BD",{weekday:"long",day:"numeric",month:"long"})}</p>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:"1rem",marginBottom:"1rem"}}>
        <CurrencyField label="Daily Sell"   value={sell} onChange={setSell} accent="#10b981" sym="+"/>
        <CurrencyField label="Daily Cost"   value={cost} onChange={setCost} accent="#f59e0b" sym="-"/>
        <CurrencyField label="Company Bill" value={bill} onChange={setBill} accent="#f43f5e" sym="B"/>
      </div>

      {/* Profit Input */}
      <div style={{...card,padding:"1rem 1.25rem",marginBottom:"1rem",border:"1px solid rgba(167,139,250,0.3)"}}>
        <p style={{fontSize:12,fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}>💜 Daily Profit Entry</p>
        <p style={{fontSize:12,color:"#64748b",margin:"0 0 12px"}}>Enter your daily profit directly if you want to record it separately (added on top of sell−cost−bill calculation).</p>
        <CurrencyField label="Today's Profit (direct input)" value={profit} onChange={setProfit} accent="#a78bfa" sym="₿"/>
      </div>

      <div style={{...card,padding:"1rem 1.25rem",marginBottom:"1rem"}}>
        <p style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 12px",display:"flex",alignItems:"center",gap:6}}>🏠 Home Money</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:"1rem"}}>
          <CurrencyField label="Took Home (Pay)" value={homePay} onChange={setHomePay} accent="#a78bfa" sym="🏠"/>
          <CurrencyField label="Home Withdraw"   value={homeWith} onChange={setHomeWith} accent="#fb923c" sym="↩"/>
        </div>
        {(monthHomePay>0||monthHomeWith>0)&&(
          <div style={{display:"flex",gap:"1.5rem",marginTop:14,paddingTop:12,borderTop:"1px solid rgba(51,65,85,0.4)"}}>
            <div>
              <p style={{fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",margin:"0 0 3px"}}>This Month — Took Home</p>
              <p style={{fontSize:16,fontWeight:800,color:"#a78bfa",margin:0}}>{fmt(monthHomePay)}</p>
            </div>
            <div style={{width:1,background:"rgba(51,65,85,0.5)"}}/>
            <div>
              <p style={{fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",margin:"0 0 3px"}}>This Month — Withdrawn</p>
              <p style={{fontSize:16,fontWeight:800,color:"#fb923c",margin:0}}>{fmt(monthHomeWith)}</p>
            </div>
            <div style={{width:1,background:"rgba(51,65,85,0.5)"}}/>
            <div>
              <p style={{fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",margin:"0 0 3px"}}>Net Home Balance</p>
              <p style={{fontSize:16,fontWeight:800,color:monthHomePay-monthHomeWith>=0?"#10b981":"#f43f5e",margin:0}}>{fmt(monthHomePay-monthHomeWith)}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{marginBottom:"1.5rem"}}>
        <label style={labelSt}>Note (optional)</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Sold 3 fans, supplier visited..." rows={2} style={{...inputSt,height:"auto",padding:"12px 14px",resize:"vertical",lineHeight:1.6}}/>
      </div>
      <button onClick={saveEntry} disabled={saving} style={{width:"100%",height:52,background:saved?"#10b981":saving?"rgba(37,99,235,0.5)":"#2563eb",border:"none",borderRadius:13,color:"#fff",fontSize:15,fontWeight:700,cursor:saving?"not-allowed":"pointer",transition:"background .3s",marginBottom:"2.5rem"}}>
        {saved?"✓ Entry Saved!":saving?"Saving…":entryDate===todayKey()?"Save Today's Entry":`Save Entry for ${new Date(entryDate+"T00:00:00").toLocaleDateString("en-BD",{day:"numeric",month:"short"})}`}
      </button>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"#94a3b8",margin:0}}>{histView==="monthly"?`${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()} — ${monthlyDays.length} entries`:`${now.getFullYear()} Overview`}</h3>
        <div style={{display:"flex",background:"#1e293b",borderRadius:10,padding:3,border:"1px solid rgba(51,65,85,0.6)"}}>
          {["monthly","yearly"].map(v=>(
            <button key={v} onClick={()=>setHistView(v)} style={{padding:"6px 16px",borderRadius:8,background:histView===v?"#2563eb":"transparent",border:"none",color:histView===v?"#fff":"#64748b",fontSize:12,fontWeight:histView===v?700:400,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
          ))}
        </div>
      </div>

      {histView==="monthly"?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {monthlyDays.length===0&&<Empty text="No entries this month yet."/>}
          {monthlyDays.map(d=>{
            const p=d.profit||0;
            return (
              <div key={d.id} style={{...card,padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,color:"#64748b",margin:"0 0 3px",fontWeight:600}}>{new Date(d.date+"T00:00:00").toLocaleDateString("en-BD",{weekday:"short",day:"numeric",month:"short"})}</p>
                    <p style={{fontSize:13,color:"#cbd5e1",margin:0}}>
                      <span style={{color:"#10b981"}}>{fmt(d.sell)}</span><span style={{color:"#334155"}}> · </span>
                      <span style={{color:"#f59e0b"}}>Cost {fmt(d.cost)}</span><span style={{color:"#334155"}}> · </span>
                      <span style={{color:"#f43f5e"}}>Bill {fmt(d.bill)}</span>
                    </p>
                    {((d.homePay||0)>0||(d.homeWith||0)>0)&&(
                      <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0"}}>
                        {(d.homePay||0)>0&&<span style={{color:"#a78bfa"}}>🏠 {fmt(d.homePay)} </span>}
                        {(d.homeWith||0)>0&&<span style={{color:"#fb923c"}}>↩ {fmt(d.homeWith)}</span>}
                      </p>
                    )}
                    {d.note&&<p style={{fontSize:12,color:"#475569",margin:"5px 0 0",fontStyle:"italic"}}>📝 {d.note}</p>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:18,fontWeight:800,color:p>=0?"#10b981":"#f43f5e",margin:0}}>{fmt(p)}</p>
                      <p style={{fontSize:10,color:"#475569",margin:"2px 0 0",textTransform:"uppercase"}}>profit</p>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setEditEntry({...d})} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"rgba(37,99,235,0.12)",border:"1px solid rgba(37,99,235,0.3)",borderRadius:8,color:"#3b82f6",fontSize:12,fontWeight:600,cursor:"pointer"}}>✏️ Edit</button>
                      <button onClick={()=>setDelEntry(d)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.28)",borderRadius:8,color:"#f43f5e",fontSize:12,fontWeight:600,cursor:"pointer"}}>🗑 Del</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {yearlyMonths.length===0&&<Empty text="No entries this year yet."/>}
          {yearlyMonths.map(m=>{
            const p=m.profit||0;
            return (
              <div key={m.month} style={{...card,padding:"16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div><p style={{fontSize:17,fontWeight:700,color:"#f1f5f9",margin:"0 0 2px"}}>{MONTHS[m.month]} {now.getFullYear()}</p><p style={{fontSize:12,color:"#475569",margin:0}}>{m.days} day{m.days!==1?"s":""} recorded</p></div>
                  <div style={{textAlign:"right"}}><p style={{fontSize:22,fontWeight:800,color:p>=0?"#10b981":"#f43f5e",margin:0}}>{fmt(p)}</p><p style={{fontSize:11,color:"#475569",margin:"2px 0 0"}}>net profit</p></div>
                </div>
                <div style={{display:"flex",height:7,borderRadius:99,overflow:"hidden",gap:2,marginBottom:10}}>
                  <div style={{flex:m.sell,background:"#10b981",opacity:0.7}}/><div style={{flex:m.cost,background:"#f59e0b",opacity:0.7}}/><div style={{flex:m.bill,background:"#f43f5e",opacity:0.7}}/>
                </div>
                <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap"}}>
                  {[["Sell",m.sell,"#10b981"],["Cost",m.cost,"#f59e0b"],["Bill",m.bill,"#f43f5e"],["🏠 Home",m.homePay,"#a78bfa"],["↩ Withdraw",m.homeWith,"#fb923c"]].map(([l,v,c])=>(
                    v>0&&<div key={l}><p style={{fontSize:10,color:"#475569",margin:"0 0 2px",fontWeight:600,textTransform:"uppercase"}}>{l}</p><p style={{fontSize:13,color:c,fontWeight:700,margin:0}}>{fmt(v)}</p></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editEntry&&<EditLedgerModal entry={editEntry} onSave={saveEdit} onClose={()=>setEditEntry(null)}/>}

      {delEntry&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <div style={{background:"#1e293b",border:"1px solid rgba(244,63,94,0.3)",borderRadius:20,padding:"2rem",maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{width:54,height:54,borderRadius:14,background:"rgba(244,63,94,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem",fontSize:26}}>🗑</div>
            <h3 style={{color:"#f8fafc",fontSize:18,fontWeight:700,margin:"0 0 8px"}}>Delete Entry?</h3>
            <p style={{color:"#64748b",fontSize:14,margin:"0 0 4px"}}>{new Date(delEntry.date+"T00:00:00").toLocaleDateString("en-BD",{weekday:"long",day:"numeric",month:"long"})}</p>
            <p style={{color:"#475569",fontSize:13,margin:"0 0 1.5rem"}}>This cannot be undone.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDelEntry(null)} style={{flex:1,height:48,background:"transparent",border:"1px solid rgba(51,65,85,0.7)",borderRadius:12,color:"#94a3b8",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>confirmDelete(delEntry.id)} style={{flex:1,height:48,background:"#f43f5e",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditLedgerModal({entry,onSave,onClose}) {
  const [sell,setSell]=useState(String(entry.sell));
  const [cost,setCost]=useState(String(entry.cost));
  const [bill,setBill]=useState(String(entry.bill));
  const [profit,setProfit]=useState(String(entry.profit||0));
  const [note,setNote]=useState(entry.note||"");
  const [homePay,setHomePay]=useState(String(entry.homePay||0));
  const [homeWith,setHomeWith]=useState(String(entry.homeWith||0));
  const profitVal=parseFloat(profit)||0;
  const isPos=profitVal>=0;

  const handleSave=()=>{
    onSave({...entry,sell:parseFloat(sell)||0,cost:parseFloat(cost)||0,bill:parseFloat(bill)||0,
      profit:profitVal, note,
      homePay:parseFloat(homePay)||0,homeWith:parseFloat(homeWith)||0});
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:"#1e293b",border:"1px solid rgba(37,99,235,0.25)",borderRadius:22,padding:"1.75rem",maxWidth:480,width:"100%",boxSizing:"border-box",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem"}}>
          <div>
            <h3 style={{color:"#f8fafc",fontSize:18,fontWeight:700,margin:0}}>Edit Entry</h3>
            <p style={{color:"#475569",fontSize:12,margin:"4px 0 0"}}>{new Date(entry.date+"T00:00:00").toLocaleDateString("en-BD",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          </div>
          <button onClick={onClose} style={{background:"rgba(51,65,85,0.5)",border:"none",borderRadius:9,color:"#94a3b8",cursor:"pointer",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✕</button>
        </div>
        <div style={{background:isPos?"rgba(16,185,129,0.08)":"rgba(244,63,94,0.08)",border:`1px solid ${isPos?"rgba(16,185,129,0.25)":"rgba(244,63,94,0.25)"}`,borderRadius:12,padding:"12px",marginBottom:"1.25rem",textAlign:"center"}}>
          <p style={{color:"#64748b",fontSize:11,fontWeight:600,textTransform:"uppercase",margin:"0 0 4px"}}>Stored Profit</p>
          <p style={{fontSize:28,fontWeight:800,color:isPos?"#10b981":"#f43f5e",margin:0}}>{fmt(profitVal)}</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <CurrencyField label="Daily Sell"   value={sell} onChange={setSell} accent="#10b981" sym="+"/>
          <CurrencyField label="Daily Cost"   value={cost} onChange={setCost} accent="#f59e0b" sym="-"/>
          <CurrencyField label="Company Bill" value={bill} onChange={setBill} accent="#f43f5e" sym="B"/>
          <CurrencyField label="Profit (direct)" value={profit} onChange={setProfit} accent="#a78bfa" sym="₿"/>
          <div style={{borderTop:"1px solid rgba(51,65,85,0.4)",paddingTop:"1rem"}}>
            <p style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 12px"}}>🏠 Home Money</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
              <CurrencyField label="Took Home" value={homePay} onChange={setHomePay} accent="#a78bfa" sym="🏠"/>
              <CurrencyField label="Withdrawn" value={homeWith} onChange={setHomeWith} accent="#fb923c" sym="↩"/>
            </div>
          </div>
          <div>
            <label style={labelSt}>Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} style={{...inputSt,height:"auto",padding:"12px 14px",resize:"vertical",lineHeight:1.6}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
          <button onClick={onClose} style={{flex:1,height:50,background:"transparent",border:"1px solid rgba(51,65,85,0.7)",borderRadius:13,color:"#94a3b8",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={handleSave} style={{flex:1,height:50,background:"#2563eb",border:"none",borderRadius:13,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function CurrencyField({label,value,onChange,accent,sym}) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{display:"flex",alignItems:"center",background:"#1e293b",border:"1px solid rgba(51,65,85,0.8)",borderRadius:12,overflow:"hidden"}}>
        <span style={{padding:"0 14px",color:accent,fontSize:16,fontWeight:800,borderRight:"1px solid rgba(51,65,85,0.6)",height:52,display:"flex",alignItems:"center",minWidth:40,justifyContent:"center"}}>{sym}</span>
        <span style={{padding:"0 8px",color:"#475569",fontSize:12,fontWeight:600}}>BDT</span>
        <input value={value} onChange={e=>onChange(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0" type="text" inputMode="numeric" style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#f1f5f9",fontSize:22,fontWeight:800,padding:"0 14px 0 0",height:52,fontFamily:"inherit",textAlign:"right"}}/>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  INVENTORY MODULE
// ═════════════════════════════════════════════════════════════
function InventoryModule({fans,setFans,bulbs,setBulbs,adjustStock,setSLog}) {
  const [subtab,setSubtab]=useState("fans");
  const [showAdd,setShowAdd]=useState(false);
  const [confirmDel,setConfirmDel]=useState(null);
  // pendingStocks: { [id]: newStockValue }
  const [pendingStocks,setPendingStocks]=useState({});
  const [saleDates,setSaleDates]=useState({});  // per-product sale date override
  const [sellPrices,setSellPrices]=useState({});  // per-product selling price override
  const [saving,setSaving]=useState({});
  const [saved,setSaved]=useState({});
  const [search,setSearch]=useState("");
  const [,tick]=useState(0);
  useEffect(()=>{const t=setInterval(()=>tick(n=>n+1),20000);return()=>clearInterval(t);},[]);

  const isFan=subtab==="fans";
  const items=isFan?fans:bulbs;
  const setItems=isFan?setFans:setBulbs;
  const filteredItems=search.trim()===""?items:items.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||(p.spec&&p.spec.toLowerCase().includes(search.toLowerCase()))||(p.watt&&String(p.watt).includes(search)));

  const deleteItem = async (id) => {
    await supabase.from("products").delete().eq("id", id);
    setItems(list => list.filter(p => p.id !== id));
    setConfirmDel(null);
  };

  const addItem = async (item) => {
    const newProd = {
      id: uid(),
      type: isFan ? "fan" : "bulb",
      name: item.name,
      spec: item.spec || null,
      watt: item.watt ? parseInt(item.watt) : null,
      stock: parseInt(item.stock)||0,
      price: parseInt(item.price)||0,
      updated_at: null,
    };
    const { error } = await supabase.from("products").insert(newProd);
    if (!error) {
      setItems(list => [...list, {...newProd, updatedAt: null}]);
      setShowAdd(false);
    }
  };

  // Save updated stock: log the difference as a sale if stock went down
  const saveStock = async (product) => {
    const newStock = parseInt(pendingStocks[product.id]);
    if (isNaN(newStock) || newStock < 0) return;
    const delta = newStock - product.stock;
    setSaving(s=>({...s,[product.id]:true}));

    const now = new Date().toISOString();
    await supabase.from("products").update({ stock: newStock, updated_at: now }).eq("id", product.id);
    setItems(list => list.map(p => p.id===product.id ? {...p, stock:newStock, updatedAt:Date.now()} : p));

    // If stock decreased, log the sold quantity with the chosen date
    if (delta < 0) {
      const soldQty = Math.abs(delta);
      const saleDate = saleDates[product.id] || new Date().toISOString().slice(0,10);
      const sellPrice = parseFloat(sellPrices[product.id]) || product.price;
      const saleDateObj = new Date(saleDate+"T00:00:00");
      const mk = `${saleDateObj.getFullYear()}-${String(saleDateObj.getMonth()+1).padStart(2,"0")}`;
      const entry = {
        id: uid(),
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        spec: product.spec || null,
        watt: product.watt || null,
        qty: soldQty,
        price_each: sellPrice,
        buy_price_each: product.price,
        profit_each: sellPrice - product.price,
        total: sellPrice * soldQty,
        profit_total: (sellPrice - product.price) * soldQty,
        date: saleDate,
        month_key: mk,
        ts: saleDateObj.getTime(),
      };
      await supabase.from("sales_log").insert(entry);
      if (setSLog) setSLog(prev=>[{
        id:entry.id, productId:entry.product_id, productName:entry.product_name,
        productType:entry.product_type, spec:entry.spec, watt:entry.watt,
        qty:entry.qty, priceEach:entry.price_each, buyPriceEach:entry.buy_price_each,
        profitEach:entry.profit_each, total:entry.total, profitTotal:entry.profit_total,
        date:entry.date, monthKey:entry.month_key, ts:entry.ts
      }, ...prev]);
    }

    setPendingStocks(s=>{const n={...s};delete n[product.id];return n;});
    setSaleDates(s=>{const n={...s};delete n[product.id];return n;});
    setSellPrices(s=>{const n={...s};delete n[product.id];return n;});
    setSaving(s=>({...s,[product.id]:false}));
    setSaved(s=>({...s,[product.id]:true}));
    setTimeout(()=>setSaved(s=>({...s,[product.id]:false})),2000);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100%"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
        <h2 style={{fontSize:22,fontWeight:800,color:"#f8fafc",margin:0,letterSpacing:-0.5}}>Warehouse</h2>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {isFan&&<button onClick={()=>downloadFansPDF(fans)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.35)",borderRadius:11,color:"#3b82f6",fontSize:13,fontWeight:700,cursor:"pointer"}}>📄 Fan List PDF</button>}
          <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#2563eb",border:"none",borderRadius:11,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            <IPlus/> Add {isFan?"Fan":"Bulb"}
          </button>
        </div>
      </div>

      <div style={{display:"flex",background:"#1e293b",borderRadius:12,padding:4,marginBottom:"1rem",border:"1px solid rgba(51,65,85,0.6)"}}>
        {[["fans","Fans",fans.length],["bulbs","LED Bulbs",bulbs.length]].map(([id,label,count])=>(
          <button key={id} onClick={()=>{setSubtab(id);setSearch("");}} style={{flex:1,padding:"11px",borderRadius:9,background:subtab===id?"#2563eb":"transparent",border:"none",color:subtab===id?"#fff":"#64748b",fontSize:14,fontWeight:subtab===id?700:400,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {id==="fans"?"🌀":"💡"} {label}
            <span style={{background:subtab===id?"rgba(255,255,255,0.18)":"rgba(51,65,85,0.5)",borderRadius:6,padding:"1px 7px",fontSize:12,fontWeight:700}}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{position:"relative",marginBottom:"1rem"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#475569",pointerEvents:"none"}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </span>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder={`Search ${isFan?"fans":"bulbs"} by name or ${isFan?"size":"wattage"}…`}
          style={{...inputSt,paddingLeft:40}}
        />
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:18,lineHeight:1,padding:0}}>✕</button>}
      </div>

      <p style={{color:"#64748b",fontSize:12,marginBottom:"1rem"}}>💡 Update stock numbers then press <strong style={{color:"#3b82f6"}}>Save</strong>. If stock goes down, a sale will be logged automatically.</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:"1.5rem"}}>
        {filteredItems.map(p=>(
          <ProductCard key={p.id} product={p} isBulb={!isFan}
            pendingStock={pendingStocks[p.id]}
            onStockChange={val=>setPendingStocks(s=>({...s,[p.id]:val}))}
            saleDate={saleDates[p.id]||todayKey()}
            onSaleDateChange={val=>setSaleDates(s=>({...s,[p.id]:val}))}
            sellPrice={sellPrices[p.id]??String(p.price)}
            onSellPriceChange={val=>setSellPrices(s=>({...s,[p.id]:val}))}
            onSave={()=>saveStock(p)}
            isSaving={saving[p.id]}
            isSaved={saved[p.id]}
            onDelete={()=>setConfirmDel({id:p.id,name:p.name})}/>
        ))}
        {filteredItems.length===0&&items.length>0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem",color:"#475569"}}>
            <p style={{fontSize:28,margin:"0 0 8px"}}>🔍</p>
            <p style={{fontSize:15,margin:0}}>No {isFan?"fans":"bulbs"} match "<span style={{color:"#94a3b8"}}>{search}</span>"</p>
            <button onClick={()=>setSearch("")} style={{marginTop:10,background:"none",border:"1px solid rgba(51,65,85,0.6)",borderRadius:8,color:"#3b82f6",fontSize:13,padding:"6px 14px",cursor:"pointer"}}>Clear search</button>
          </div>
        )}
        {items.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"3rem",color:"#475569"}}>
            <p style={{fontSize:32,margin:"0 0 8px"}}>{isFan?"🌀":"💡"}</p>
            <p style={{fontSize:15,margin:0}}>No {isFan?"fans":"bulbs"} yet. Click "Add" to start.</p>
          </div>
        )}
      </div>

      {(()=>{
        const fanQty = fans.reduce((s,p)=>s+p.stock,0);
        const bulbQty = bulbs.reduce((s,p)=>s+p.stock,0);
        const fanVal = fans.reduce((s,p)=>s+p.stock*p.price,0);
        const bulbVal = bulbs.reduce((s,p)=>s+p.stock*p.price,0);
        const D = ({label,val,qty,color}) => (
          <div style={{textAlign:"center"}}>
            <p style={{margin:"0 0 2px",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</p>
            <p style={{margin:0,fontSize:20,fontWeight:800,color,lineHeight:1}}>{fmt(val)}</p>
            <p style={{margin:"2px 0 0",fontSize:11,color:"#475569"}}>{qty} units</p>
          </div>
        );
        const Sep = () => <div style={{width:1,height:44,background:"rgba(51,65,85,0.5)",flexShrink:0}}/>;
        return (
          <div style={{width:"100%",background:"rgba(15,23,42,0.96)",border:"1px solid rgba(37,99,235,0.2)",borderRadius:14,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxSizing:"border-box",gap:16,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{textAlign:"center"}}>
                <p style={{margin:"0 0 2px",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>Total Units</p>
                <p style={{margin:0,fontSize:28,fontWeight:900,color:"#3b82f6",lineHeight:1}}>{fanQty+bulbQty}</p>
              </div>
              <Sep/>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:20}}>🌀</span>
                <D label="Fan Value" val={fanVal} qty={fanQty} color="#60a5fa"/>
              </div>
              <Sep/>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:20}}>💡</span>
                <D label="Bulb Value" val={bulbVal} qty={bulbQty} color="#a78bfa"/>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{margin:"0 0 2px",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>Total Stock Value</p>
              <p style={{margin:0,fontSize:24,fontWeight:900,color:"#10b981",lineHeight:1}}>{fmt(fanVal+bulbVal)}</p>
            </div>
          </div>
        );
      })()}

      {showAdd&&<AddModal isFan={isFan} onAdd={addItem} onClose={()=>setShowAdd(false)}/>}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <div style={{background:"#1e293b",border:"1px solid rgba(244,63,94,0.3)",borderRadius:20,padding:"2rem",maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{width:54,height:54,borderRadius:14,background:"rgba(244,63,94,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem",color:"#f43f5e"}}><ITrash/></div>
            <h3 style={{color:"#f8fafc",fontSize:18,fontWeight:700,margin:"0 0 8px"}}>Delete Product?</h3>
            <p style={{color:"#64748b",fontSize:14,margin:"0 0 1.5rem"}}>"{confirmDel.name}" will be removed permanently.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDel(null)} style={{flex:1,height:48,background:"transparent",border:"1px solid rgba(51,65,85,0.7)",borderRadius:12,color:"#94a3b8",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>deleteItem(confirmDel.id)} style={{flex:1,height:48,background:"#f43f5e",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({product,isBulb,pendingStock,onStockChange,saleDate,onSaleDateChange,sellPrice,onSellPriceChange,onSave,isSaving,isSaved,onDelete}) {
  const displayStock = pendingStock !== undefined ? parseInt(pendingStock)||0 : product.stock;
  const isZero=displayStock===0; const isLow=displayStock>0&&displayStock<=3;
  const isDirty = pendingStock !== undefined && parseInt(pendingStock) !== product.stock;
  const isReduction = isDirty && parseInt(pendingStock) < product.stock;
  const sellPriceNum = parseFloat(sellPrice)||0;
  const profit = isReduction ? sellPriceNum - product.price : 0;
  return (
    <div style={{background:isZero?"rgba(244,63,94,0.07)":"#1e293b",border:`1px solid ${isZero?"rgba(244,63,94,0.28)":isLow?"rgba(245,158,11,0.28)":"rgba(51,65,85,0.55)"}`,borderRadius:16,padding:"14px 13px",display:"flex",flexDirection:"column",gap:8,position:"relative"}}>
      <button onClick={onDelete} title="Delete" style={{position:"absolute",top:9,right:9,background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.18)",borderRadius:7,color:"#f43f5e",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
      </button>
      <div style={{paddingRight:34}}>
        <p style={{fontSize:13,fontWeight:700,color:"#cbd5e1",margin:"0 0 5px",lineHeight:1.3}}>{product.name}</p>
        {isBulb
          ?<span style={{background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",color:"#60a5fa",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6}}>{product.watt}W</span>
          :<span style={{background:"rgba(100,116,139,0.15)",border:"1px solid rgba(100,116,139,0.3)",color:"#94a3b8",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6}}>{product.spec}</span>}
      </div>

      {/* Editable stock input */}
      <div style={{textAlign:"center",padding:"4px 0"}}>
        <p style={{fontSize:10,color:"#475569",margin:"0 0 6px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{isZero?"Out of stock":isLow?"Low stock":"Current Stock"}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <button onClick={()=>onStockChange(String(Math.max(0,(parseInt(pendingStock??product.stock)||0)-1)))} style={{width:34,height:34,background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.28)",borderRadius:8,color:"#f43f5e",fontSize:22,fontWeight:700,cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <input
            value={pendingStock??product.stock}
            onChange={e=>onStockChange(e.target.value.replace(/\D/g,""))}
            type="text" inputMode="numeric"
            style={{width:64,textAlign:"center",background:"rgba(15,23,42,0.7)",border:`1px solid ${isDirty?"rgba(37,99,235,0.7)":"rgba(51,65,85,0.7)"}`,borderRadius:10,color:isZero?"#f43f5e":isLow?"#f59e0b":"#f1f5f9",fontSize:30,fontWeight:900,padding:"4px 0",outline:"none",fontFamily:"inherit"}}
          />
          <button onClick={()=>onStockChange(String((parseInt(pendingStock??product.stock)||0)+1))} style={{width:34,height:34,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.28)",borderRadius:8,color:"#10b981",fontSize:22,fontWeight:700,cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>
      </div>

      {/* Sale date picker — only shows when stock is going DOWN */}
      {isReduction&&(
        <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,padding:"8px 10px"}}>
          <p style={{fontSize:10,color:"#f59e0b",fontWeight:700,textTransform:"uppercase",margin:"0 0 5px",letterSpacing:"0.06em"}}>📅 Sale Date</p>
          <input type="date" value={saleDate} onChange={e=>onSaleDateChange(e.target.value)} max={todayKey()}
            style={{width:"100%",background:"rgba(15,23,42,0.6)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:7,color:"#fbbf24",fontSize:12,fontWeight:600,padding:"5px 8px",outline:"none",fontFamily:"inherit",colorScheme:"dark",boxSizing:"border-box"}}/>
          {saleDate!==todayKey()&&<p style={{fontSize:10,color:"#f59e0b",margin:"4px 0 0"}}>⚠️ Logging to past date</p>}
        </div>
      )}

      {/* Selling price — only shows when stock is going DOWN */}
      {isReduction&&(
        <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:10,padding:"8px 10px"}}>
          <p style={{fontSize:10,color:"#10b981",fontWeight:700,textTransform:"uppercase",margin:"0 0 5px",letterSpacing:"0.06em"}}>💰 Selling Price / unit</p>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:"#10b981",fontSize:13,fontWeight:700}}>৳</span>
            <input
              value={sellPrice}
              onChange={e=>onSellPriceChange(e.target.value.replace(/[^0-9.]/g,""))}
              type="text" inputMode="numeric" placeholder={String(product.price)}
              style={{flex:1,background:"rgba(15,23,42,0.6)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:7,color:"#f1f5f9",fontSize:15,fontWeight:700,padding:"5px 8px",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11}}>
            <span style={{color:"#475569"}}>Buy: ৳{fmtN(product.price)}</span>
            <span style={{color:profit>=0?"#10b981":"#f43f5e",fontWeight:700}}>Profit/unit: {profit>=0?"+":""}{fmtN(profit)}</span>
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={!isDirty||isSaving}
        style={{height:40,background:isSaved?"#10b981":isDirty?"#2563eb":"rgba(51,65,85,0.3)",border:"none",borderRadius:10,color:isDirty||isSaved?"#fff":"#475569",fontSize:13,fontWeight:700,cursor:isDirty&&!isSaving?"pointer":"not-allowed",transition:"background .2s"}}>
        {isSaved?"✓ Saved!":isSaving?"Saving…":isDirty?"💾 Save Stock":"No Changes"}
      </button>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <p style={{fontSize:11,color:"#3b82f6",margin:0,fontWeight:600}}>{fmt(product.price)}/unit</p>
        {product.updatedAt&&<p style={{fontSize:10,color:"#475569",margin:0}}>
          {(()=>{const s=Math.floor((Date.now()-product.updatedAt)/1000);return s<60?`${s}s ago`:s<3600?`${Math.floor(s/60)}m ago`:`${Math.floor(s/3600)}h ago`;})()}
        </p>}
      </div>
    </div>
  );
}

function AddModal({isFan,onAdd,onClose}) {
  const [form,setForm]=useState({name:"",spec:"",watt:"9",stock:"",price:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.name.trim()&&form.stock!==""&&form.price!=="";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:"#1e293b",border:"1px solid rgba(37,99,235,0.25)",borderRadius:22,padding:"1.75rem",maxWidth:420,width:"100%",boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
          <h3 style={{color:"#f8fafc",fontSize:18,fontWeight:700,margin:0}}>Add New {isFan?"Fan":"LED Bulb"}</h3>
          <button onClick={onClose} style={{background:"rgba(51,65,85,0.5)",border:"none",borderRadius:9,color:"#94a3b8",cursor:"pointer",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center"}}><IClose/></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div><label style={labelSt}>Product Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder={isFan?"e.g. GFC Pedestal Fan":"e.g. Philips LED Bulb"} style={inputSt}/></div>
          {isFan
            ?<div><label style={labelSt}>Size / Spec</label><input value={form.spec} onChange={e=>set("spec",e.target.value)} placeholder='e.g. 56"' style={inputSt}/></div>
            :<div>
               <label style={labelSt}>Wattage</label>
               <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                 {["7","9","12","18","24"].map(w=>(
                   <button key={w} onClick={()=>set("watt",w)} style={{flex:"1 1 60px",height:46,background:form.watt===w?"#2563eb":"#0f172a",border:`1px solid ${form.watt===w?"#2563eb":"rgba(51,65,85,0.7)"}`,borderRadius:10,color:form.watt===w?"#fff":"#64748b",fontSize:14,fontWeight:700,cursor:"pointer"}}>{w}W</button>
                 ))}
               </div>
             </div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
            <div><label style={labelSt}>Initial Stock *</label><input value={form.stock} onChange={e=>set("stock",e.target.value.replace(/\D/g,""))} placeholder="0" type="text" inputMode="numeric" style={inputSt}/></div>
            <div><label style={labelSt}>Price BDT *</label><input value={form.price} onChange={e=>set("price",e.target.value.replace(/\D/g,""))} placeholder="0" type="text" inputMode="numeric" style={inputSt}/></div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
          <button onClick={onClose} style={{flex:1,height:50,background:"transparent",border:"1px solid rgba(51,65,85,0.7)",borderRadius:13,color:"#94a3b8",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>valid&&onAdd(form)} disabled={!valid} style={{flex:1,height:50,background:valid?"#2563eb":"rgba(37,99,235,0.25)",border:"none",borderRadius:13,color:valid?"#fff":"#475569",fontSize:14,fontWeight:700,cursor:valid?"pointer":"not-allowed"}}>Add {isFan?"Fan":"Bulb"}</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  SALES LOG MODULE
// ═════════════════════════════════════════════════════════════
function SalesLogModule({salesLog}) {
  const now  = new Date();
  const [selMonth, setSelMonth] = useState(monthKey(now));
  const [filterType, setFilterType] = useState("all");

  const availableMonths = [...new Set(salesLog.map(e=>e.monthKey))].sort((a,b)=>b.localeCompare(a));

  const filtered = salesLog.filter(e => {
    const monthMatch = e.monthKey === selMonth;
    const typeMatch  = filterType==="all" || e.productType===filterType;
    return monthMatch && typeMatch;
  });

  const byProduct = {};
  filtered.forEach(e=>{
    if(!byProduct[e.productId]) byProduct[e.productId]={
      productId:e.productId, name:e.productName, type:e.productType,
      spec:e.spec, watt:e.watt, totalQty:0, totalRevenue:0, totalProfit:0, entries:[]
    };
    byProduct[e.productId].totalQty      += e.qty;
    byProduct[e.productId].totalRevenue  += e.total;
    byProduct[e.productId].totalProfit   += (e.profitTotal||0);
    byProduct[e.productId].entries.push(e);
  });
  const productRows = Object.values(byProduct).sort((a,b)=>b.totalQty-a.totalQty);

  const allMonthEntries = salesLog.filter(e=>e.monthKey===selMonth);
  const fanSales   = allMonthEntries.filter(e=>e.productType==="fan" ).reduce((s,e)=>s+e.total,0);
  const bulbSales  = allMonthEntries.filter(e=>e.productType==="bulb").reduce((s,e)=>s+e.total,0);
  const fanQty     = allMonthEntries.filter(e=>e.productType==="fan" ).reduce((s,e)=>s+e.qty,0);
  const bulbQty    = allMonthEntries.filter(e=>e.productType==="bulb").reduce((s,e)=>s+e.qty,0);
  const grossTotal = fanSales+bulbSales;

  const monthTotalQty     = filtered.reduce((s,e)=>s+e.qty,0);
  const monthTotalRevenue = filtered.reduce((s,e)=>s+e.total,0);
  const monthTotalProfit  = filtered.reduce((s,e)=>s+(e.profitTotal||0),0);

  const monthLabel = (key) => {
    const [y,m]=key.split("-"); return `${MONTHS[parseInt(m)-1]} ${y}`;
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.25rem",flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:22,fontWeight:800,color:"#f8fafc",margin:0,letterSpacing:-0.5}}>Sales Log</h2>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>downloadSalesLogPDF(salesLog,selMonth)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.35)",borderRadius:10,color:"#3b82f6",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            📄 PDF
          </button>
          <span style={{fontSize:12,color:"#475569",fontWeight:600}}>📅</span>
          <select value={selMonth} onChange={e=>setSelMonth(e.target.value)}
            style={{background:"#1e293b",border:"1px solid rgba(51,65,85,0.7)",borderRadius:9,color:"#f1f5f9",fontSize:13,fontWeight:600,padding:"7px 12px",cursor:"pointer",outline:"none"}}>
            {availableMonths.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
            {!availableMonths.includes(selMonth)&&<option value={selMonth}>{monthLabel(selMonth)}</option>}
          </select>
        </div>
      </div>
      <p style={{color:"#475569",fontSize:13,marginBottom:"1.25rem"}}>Every unit sold (−) is recorded here automatically.</p>

      <div style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(37,99,235,0.2)",borderRadius:16,padding:"1.25rem",marginBottom:"1.25rem"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 12px"}}>Total Sales — {monthLabel(selMonth)}</p>
        <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:140,background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:12,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:18}}>🌀</span><p style={{fontSize:12,fontWeight:700,color:"#60a5fa",margin:0,textTransform:"uppercase",letterSpacing:"0.05em"}}>Fans</p></div>
            <p style={{fontSize:24,fontWeight:800,color:"#60a5fa",margin:"0 0 2px"}}>{fmt(fanSales)}</p>
            <p style={{fontSize:11,color:"#475569",margin:0}}>{fanQty} unit{fanQty!==1?"s":""} sold</p>
          </div>
          <div style={{flex:1,minWidth:140,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:12,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:18}}>💡</span><p style={{fontSize:12,fontWeight:700,color:"#a78bfa",margin:0,textTransform:"uppercase",letterSpacing:"0.05em"}}>LED Bulbs</p></div>
            <p style={{fontSize:24,fontWeight:800,color:"#a78bfa",margin:"0 0 2px"}}>{fmt(bulbSales)}</p>
            <p style={{fontSize:11,color:"#475569",margin:0}}>{bulbQty} unit{bulbQty!==1?"s":""} sold</p>
          </div>
          <div style={{flex:1,minWidth:140,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:18}}>💰</span><p style={{fontSize:12,fontWeight:700,color:"#10b981",margin:0,textTransform:"uppercase",letterSpacing:"0.05em"}}>Total</p></div>
            <p style={{fontSize:24,fontWeight:800,color:"#10b981",margin:"0 0 2px"}}>{fmt(grossTotal)}</p>
            <p style={{fontSize:11,color:"#475569",margin:0}}>{fanQty+bulbQty} units sold</p>
          </div>
        </div>
        {grossTotal>0&&(
          <div>
            <div style={{display:"flex",height:8,borderRadius:99,overflow:"hidden",gap:2}}>
              <div style={{flex:fanSales,background:"#60a5fa",opacity:0.8}}/>
              <div style={{flex:bulbSales,background:"#a78bfa",opacity:0.8}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              <span style={{fontSize:11,color:"#60a5fa",fontWeight:600}}>🌀 {grossTotal>0?Math.round(fanSales/grossTotal*100):0}% fans</span>
              <span style={{fontSize:11,color:"#a78bfa",fontWeight:600}}>{grossTotal>0?Math.round(bulbSales/grossTotal*100):0}% bulbs 💡</span>
            </div>
          </div>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10,marginBottom:"1.5rem"}}>
        {[["Units Sold",fmtN(monthTotalQty),"#3b82f6"],["Total Sales",fmt(monthTotalRevenue),"#10b981"],["Profit",fmt(monthTotalProfit),"#a78bfa"],["Products",productRows.length,"#f59e0b"]].map(([l,v,c])=>(
          <div key={l} style={{...card,padding:"14px 12px",textAlign:"center"}}>
            <p style={{color:"#475569",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 6px"}}>{l}</p>
            <p style={{color:c,fontSize:18,fontWeight:800,margin:0}}>{v}</p>
          </div>
        ))}
      </div>

      <div style={{display:"flex",background:"#1e293b",borderRadius:10,padding:3,marginBottom:"1.5rem",border:"1px solid rgba(51,65,85,0.6)",width:"fit-content"}}>
        {[["all","All"],["fan","🌀 Fans"],["bulb","💡 Bulbs"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilterType(v)} style={{padding:"7px 16px",borderRadius:8,background:filterType===v?"#2563eb":"transparent",border:"none",color:filterType===v?"#fff":"#64748b",fontSize:13,fontWeight:filterType===v?700:400,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {productRows.length===0
        ? <Empty text={`No sales recorded for ${monthLabel(selMonth)} yet.`} sub="Press − on any product to log a sale."/>
        : (
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:"2rem"}}>
          {productRows.map((row,idx)=>(
            <ProductSaleRow key={row.productId} row={row} rank={idx+1}/>
          ))}
        </div>
      )}

      {filtered.length>0&&(
        <>
          <h3 style={{fontSize:15,fontWeight:700,color:"#64748b",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Transaction Log</h3>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.slice(0,50).map(e=>(
              <div key={e.id} style={{...card,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18}}>{e.productType==="fan"?"🌀":"💡"}</span>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",margin:"0 0 2px"}}>{e.productName}
                      {e.watt&&<span style={{marginLeft:6,background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",color:"#60a5fa",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:5}}>{e.watt}W</span>}
                      {e.spec&&<span style={{marginLeft:6,background:"rgba(100,116,139,0.15)",color:"#94a3b8",fontSize:10,padding:"1px 6px",borderRadius:5}}>{e.spec}</span>}
                    </p>
                    <p style={{fontSize:11,color:"#475569",margin:0}}>{new Date(e.date+"T00:00:00").toLocaleDateString("en-BD",{weekday:"short",day:"numeric",month:"short"})}</p>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{fontSize:14,fontWeight:700,color:"#f43f5e",margin:"0 0 1px"}}>−{e.qty} pc{e.qty!==1?"s":""}</p>
                  <p style={{fontSize:12,color:"#10b981",fontWeight:600,margin:0}}>{fmt(e.total)}</p>
                  {e.profitTotal!==undefined&&e.profitTotal!==0&&<p style={{fontSize:11,color:e.profitTotal>=0?"#a78bfa":"#f43f5e",margin:"1px 0 0"}}>profit {fmt(e.profitTotal)}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProductSaleRow({row,rank}) {
  const [expanded,setExpanded]=useState(false);
  const isFan=row.type==="fan";
  return (
    <div style={{...card,overflow:"hidden"}}>
      <div onClick={()=>setExpanded(e=>!e)} style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:32,height:32,borderRadius:9,background:rank===1?"rgba(245,158,11,0.15)":rank===2?"rgba(148,163,184,0.1)":"rgba(51,65,85,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:rank===1?"#f59e0b":rank===2?"#94a3b8":"#64748b",flexShrink:0}}>{rank}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontSize:16}}>{isFan?"🌀":"💡"}</span>
            <p style={{fontSize:14,fontWeight:700,color:"#f1f5f9",margin:0}}>{row.name}</p>
            {row.watt&&<span style={{background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",color:"#60a5fa",fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:5}}>{row.watt}W</span>}
            {row.spec&&<span style={{background:"rgba(100,116,139,0.15)",color:"#94a3b8",fontSize:11,padding:"1px 7px",borderRadius:5}}>{row.spec}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:"1.5rem",alignItems:"center",flexShrink:0}}>
          <div style={{textAlign:"center"}}>
            <p style={{fontSize:22,fontWeight:900,color:"#3b82f6",margin:0,lineHeight:1}}>{row.totalQty}</p>
            <p style={{fontSize:10,color:"#475569",margin:"2px 0 0",fontWeight:600,textTransform:"uppercase"}}>sold</p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{fontSize:15,fontWeight:800,color:"#10b981",margin:0}}>{fmt(row.totalRevenue)}</p>
            <p style={{fontSize:10,color:"#475569",margin:"2px 0 0",fontWeight:600,textTransform:"uppercase"}}>Total Sales</p>
          </div>
          <span style={{color:"#475569",fontSize:18}}>{expanded?"▲":"▼"}</span>
        </div>
      </div>
      {expanded&&(
        <div style={{borderTop:"1px solid rgba(51,65,85,0.4)",padding:"10px 16px 14px",background:"rgba(15,23,42,0.4)"}}>
          <p style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 8px"}}>Daily breakdown</p>
          {row.entries.sort((a,b)=>b.ts-a.ts).map(e=>(
            <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(51,65,85,0.3)"}}>
              <span style={{fontSize:13,color:"#94a3b8"}}>{new Date(e.date+"T00:00:00").toLocaleDateString("en-BD",{weekday:"short",day:"numeric",month:"short"})}</span>
              <div style={{display:"flex",gap:"1.5rem",alignItems:"center"}}>
                <span style={{fontSize:13,color:"#f43f5e",fontWeight:700}}>−{e.qty} pc{e.qty!==1?"s":""}</span>
                <span style={{fontSize:13,color:"#10b981",fontWeight:600}}>{fmt(e.total)}</span>
              </div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0 0",marginTop:2}}>
            <span style={{fontSize:12,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Total</span>
            <div style={{display:"flex",gap:"1.5rem"}}>
              <span style={{fontSize:14,color:"#3b82f6",fontWeight:800}}>{row.totalQty} pcs</span>
              <span style={{fontSize:14,color:"#10b981",fontWeight:800}}>{fmt(row.totalRevenue)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  REPORTS MODULE
// ═════════════════════════════════════════════════════════════
function ReportsModule({ledger}) {
  const [view,setView]=useState("monthly");
  const canvasRef=useRef(null);
  const now=new Date();

  // Monthly = last 30 ledger entries
  const monthlyData = [...ledger]
    .filter(d=>new Date(d.date).getMonth()===now.getMonth()&&new Date(d.date).getFullYear()===now.getFullYear())
    .sort((a,b)=>a.date.localeCompare(b.date));

  const yearlyData = (()=>{
    const map={};
    ledger.filter(d=>new Date(d.date).getFullYear()===now.getFullYear()).forEach(d=>{
      const m=new Date(d.date).getMonth();
      if(!map[m])map[m]={month:m,sell:0,cost:0,bill:0,profit:0};
      map[m].sell+=d.sell; map[m].cost+=d.cost; map[m].bill+=d.bill; map[m].profit+=(d.profit||0);
    });
    return Array.from({length:12},(_,i)=>map[i]||{month:i,sell:0,cost:0,bill:0,profit:0});
  })();

  const data = view==="monthly" ? monthlyData : yearlyData;
  const totalSell   = data.reduce((s,d)=>s+d.sell,0);
  const totalCost   = data.reduce((s,d)=>s+d.cost,0);
  const totalBill   = data.reduce((s,d)=>s+d.bill,0);
  const totalProfit = data.reduce((s,d)=>s+(d.profit||0),0);
  const avgSell     = data.filter(d=>d.sell>0).length ? Math.round(totalSell/data.filter(d=>d.sell>0).length) : 0;

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const sells=data.map(d=>d.sell);
    const profits=data.map(d=>d.profit||0);
    if(sells.every(v=>v===0))return;
    const maxV=Math.max(...sells,...profits.map(v=>Math.max(v,0)));
    const minV=0;
    const pad={t:20,b:34,l:14,r:14};
    const cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
    const px=(i)=>pad.l+(i/(Math.max(data.length-1,1)))*cW;
    const py=(v)=>pad.t+cH-((v-minV)/(maxV-minV+1))*cH;
    // Fill under sell line
    const grad=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
    grad.addColorStop(0,"rgba(37,99,235,0.22)"); grad.addColorStop(1,"rgba(37,99,235,0)");
    ctx.beginPath();
    data.forEach((d,i)=>i===0?ctx.moveTo(px(i),py(d.sell)):ctx.lineTo(px(i),py(d.sell)));
    ctx.lineTo(px(data.length-1),H-pad.b); ctx.lineTo(px(0),H-pad.b); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();
    // Sell line
    ctx.beginPath();
    data.forEach((d,i)=>i===0?ctx.moveTo(px(i),py(d.sell)):ctx.lineTo(px(i),py(d.sell)));
    ctx.strokeStyle="#3b82f6"; ctx.lineWidth=2.5; ctx.lineJoin="round"; ctx.setLineDash([]); ctx.stroke();
    // Profit line
    ctx.beginPath();
    data.forEach((d,i)=>{const pv=Math.max(d.profit||0,minV);i===0?ctx.moveTo(px(i),py(pv)):ctx.lineTo(px(i),py(pv));});
    ctx.strokeStyle="#10b981"; ctx.lineWidth=2; ctx.setLineDash([5,3]); ctx.stroke(); ctx.setLineDash([]);
    // X axis labels
    ctx.fillStyle="#475569"; ctx.font="11px system-ui"; ctx.textAlign="center";
    if(view==="monthly") data.forEach((d,i)=>{if(i%Math.ceil(data.length/6)===0)ctx.fillText(new Date(d.date+"T00:00:00").getDate(),px(i),H-10);});
    else MONTHS_SHORT.forEach((m,i)=>ctx.fillText(m,px(i),H-10));
  },[data,view]);

  // Monthly breakdown for current year
  const monthlyBreakdown=(()=>{
    const map={};
    ledger.filter(d=>new Date(d.date).getFullYear()===now.getFullYear()).forEach(d=>{
      const mk=monthKey(new Date(d.date));
      if(!map[mk])map[mk]={mk,sell:0,cost:0,bill:0,profit:0,days:0};
      map[mk].sell+=d.sell; map[mk].cost+=d.cost; map[mk].bill+=d.bill;
      map[mk].profit+=(d.profit||0); map[mk].days++;
    });
    return Object.values(map).sort((a,b)=>b.mk.localeCompare(a.mk));
  })();

  return (
    <div>
      <h2 style={{fontSize:22,fontWeight:800,color:"#f8fafc",marginBottom:"1rem",letterSpacing:-0.5}}>Analytics</h2>
      <div style={{display:"flex",background:"#1e293b",borderRadius:12,padding:4,marginBottom:"1.5rem",border:"1px solid rgba(51,65,85,0.6)",width:"fit-content"}}>
        {["monthly","yearly"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{padding:"8px 24px",borderRadius:9,background:view===v?"#2563eb":"transparent",border:"none",color:view===v?"#fff":"#64748b",fontSize:13,fontWeight:view===v?700:400,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:"1.5rem"}}>
        {[["Total Sales",fmt(totalSell),"#3b82f6"],["Total Cost",fmt(totalCost),"#f59e0b"],["Bills",fmt(totalBill),"#f43f5e"],["Net Profit",fmt(totalProfit),"#10b981"],["Avg / Day",fmt(avgSell),"#a78bfa"]].map(([l,v,c])=>(
          <div key={l} style={{...card,padding:"16px 14px"}}>
            <p style={{color:"#475569",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px"}}>{l}</p>
            <p style={{color:c,fontSize:19,fontWeight:800,margin:0}}>{v}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{...card,padding:"1.25rem",marginBottom:"1.5rem"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <p style={{color:"#94a3b8",fontSize:13,fontWeight:700,margin:0}}>{view==="monthly"?`${MONTHS[now.getMonth()]} ${now.getFullYear()} — Daily Trend`:`${now.getFullYear()} — Monthly Trend`}</p>
          <div style={{display:"flex",gap:14,fontSize:11,color:"#64748b"}}>
            <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:16,height:3,background:"#3b82f6",display:"inline-block",borderRadius:2}}/>Sales</span>
            <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:16,height:0,borderTop:"2.5px dashed #10b981",display:"inline-block"}}/>Profit</span>
          </div>
        </div>
        <canvas ref={canvasRef} width={900} height={200} style={{width:"100%",height:"auto"}}/>
        {data.every(d=>d.sell===0)&&<p style={{color:"#475569",fontSize:13,textAlign:"center",margin:"1rem 0 0"}}>No ledger data for this period yet.</p>}
      </div>

      {/* Monthly breakdown table */}
      {monthlyBreakdown.length>0&&(
        <div style={{...card,padding:"1rem",marginBottom:"1.5rem"}}>
          <p style={{color:"#94a3b8",fontSize:13,fontWeight:700,margin:"0 0 12px"}}>📅 {now.getFullYear()} — Monthly Breakdown</p>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {monthlyBreakdown.map(m=>{
              const [y,mo]=m.mk.split("-");
              const label=`${MONTHS[parseInt(mo)-1]} ${y}`;
              const isPos=m.profit>=0;
              return (
                <div key={m.mk} style={{background:"rgba(15,23,42,0.5)",borderRadius:10,padding:"10px 14px",display:"flex",flexWrap:"wrap",gap:10,alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:"#cbd5e1",margin:"0 0 2px"}}>{label}</p>
                    <p style={{fontSize:11,color:"#475569",margin:0}}>{m.days} entries</p>
                  </div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {[["Sell",m.sell,"#60a5fa"],["Cost",m.cost,"#f59e0b"],["Bill",m.bill,"#f43f5e"]].map(([l,v,c])=>(
                      <div key={l} style={{textAlign:"right"}}>
                        <p style={{fontSize:10,color:"#475569",margin:"0 0 2px",textTransform:"uppercase",fontWeight:600}}>{l}</p>
                        <p style={{fontSize:13,fontWeight:700,color:c,margin:0}}>{fmt(v)}</p>
                      </div>
                    ))}
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:10,color:"#475569",margin:"0 0 2px",textTransform:"uppercase",fontWeight:600}}>Profit</p>
                      <p style={{fontSize:14,fontWeight:800,color:isPos?"#10b981":"#f43f5e",margin:0}}>{isPos?"+":""}{fmt(m.profit)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SHARED EMPTY STATE
// ─────────────────────────────────────────────
function Empty({text,sub}) {
  return (
    <div style={{textAlign:"center",padding:"3rem 1rem",color:"#475569"}}>
      <p style={{fontSize:36,margin:"0 0 8px"}}>📭</p>
      <p style={{fontSize:15,color:"#64748b",margin:0}}>{text}</p>
      {sub&&<p style={{fontSize:13,color:"#475569",margin:"4px 0 0"}}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [authed,setAuthed]=useState(false);
  return authed?<Dashboard onLogout={()=>setAuthed(false)}/>:<LoginPage onLogin={()=>setAuthed(true)}/>;
}
