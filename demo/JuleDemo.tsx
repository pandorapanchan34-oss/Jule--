import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#060b10", panel:"#0a1018", border:"#1e2d40",
  accent:"#00f5ff", green:"#34d399", purple:"#a78bfa",
  gold:"#fbbf24", red:"#ef4444", muted:"#4a6080", text:"#c8d8e8",
};

const STORAGE_KEY = "jule_ranking_v2";
const saveScore = (entry) => {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  data.push(entry); data.sort((a,b)=>b.net-a.net);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0,20)));
};
const getRanking = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const encode = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
const decode = (str) => { try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; } };

const GENRE_KEYWORDS = {
  PHYSICS:["galaxy","rotation","quantum","spacetime","entropy","pandora","tau","sparc"],
  MATH:["proof","theorem","equation","derive","axiom","convergence","fixed point"],
  AI_SAFETY:["hallucination","alignment","safety","audit","burn","aspidos","jule","shredder"],
  ECONOMICS:["token","economy","incentive","market","capital","reward","trade"],
  CONSCIOUSNESS:["consciousness","qualia","awareness","omega","unitas"],
  ENGINEERING:["code","implement","deploy","api","function","architecture"],
};
const GENRE_COLOR = {
  PHYSICS:"#00f5ff",MATH:"#a78bfa",AI_SAFETY:"#34d399",
  ECONOMICS:"#fbbf24",CONSCIOUSNESS:"#f472b6",ENGINEERING:"#60a5fa",
  CROSS:"#ff6b35",OTHER:"#6b7280",
};
const detectGenre = (text) => {
  const lower = text.toLowerCase(), scores = {};
  for (const [genre,kws] of Object.entries(GENRE_KEYWORDS)) {
    const hits = kws.filter(k=>lower.includes(k)).length;
    if (hits>0) scores[genre]=hits;
  }
  const d = Object.entries(scores);
  if (d.length===0) return "OTHER";
  if (d.length>=3) return "CROSS";
  return d.sort((a,b)=>b[1]-a[1])[0][0];
};

const K_MAP   = {SAFE:1.0,OVERLOAD:0.5,ADVERSARIAL:0.3,LOGIC_COLLAPSE:0.1,ETHICS_VIOLATION:0.0};
const K_LABEL = {SAFE:"安全",OVERLOAD:"既知情報",ADVERSARIAL:"情緒過多",LOGIC_COLLAPSE:"論理破綻",ETHICS_VIOLATION:"反社会的"};

const Gauge = ({label,value,max=1,color=C.accent}) => {
  const pct = Math.min(100,(value/max)*100);
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
        <span style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>
        <span style={{color,fontSize:11,fontFamily:"monospace",fontWeight:700}}>{typeof value==="number"?value.toFixed(3):value}</span>
      </div>
      <div style={{height:3,background:"#1a2030",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:2,transition:"width 0.5s ease",boxShadow:`0 0 6px ${color}66`}}/>
      </div>
    </div>
  );
};

const TermLog = ({lines}) => {
  const ref = useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[lines]);
  return (
    <div ref={ref} style={{background:"#090e14",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",height:100,overflowY:"auto",fontFamily:"monospace",fontSize:10,lineHeight:1.8}}>
      {lines.map((l,i)=><div key={i} style={{color:l.color||C.muted}}><span style={{color:"#2a3a50",userSelect:"none"}}>{l.time} </span>{l.text}</div>)}
      {lines.length===0&&<span style={{color:"#2a3a50"}}>awaiting transmission...</span>}
    </div>
  );
};

const Tab = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"8px 14px",fontSize:11,fontFamily:"monospace",border:`1px solid ${active?C.accent:C.border}`,borderBottom:active?"none":`1px solid ${C.border}`,background:active?C.panel:C.bg,color:active?C.accent:C.muted,cursor:"pointer",letterSpacing:"0.08em",borderRadius:"4px 4px 0 0",marginRight:4,transition:"all 0.2s"}}>{label}</button>
);

export default function JuleDemo() {
  const [tab,setTab]           = useState("shredder");
  const [text,setText]         = useState("");
  const [v,setV]               = useState(72);
  const [usefulRatio,setUR]    = useState(0.75);
  const [reputation,setRep]    = useState(0.5);
  const [category,setCategory] = useState("SAFE");
  const [repetition,setRep2]   = useState(0);
  const [result,setResult]     = useState(null);
  const [log,setLog]           = useState([]);
  const [history,setHistory]   = useState([]);
  const [pulse,setPulse]       = useState(false);
  const [ranking,setRanking]   = useState([]);
  const [mySeeds,setMySeeds]   = useState([]);
  const [market,setMarket]     = useState([]);
  const [juleBalance,setJB]    = useState(500);
  const [seedLog,setSeedLog]   = useState([]);

  const addLog = (text,color=C.green) => {
    const time = new Date().toTimeString().slice(0,8);
    setLog(l=>[...l.slice(-30),{text,color,time}]);
  };
  const addSeedLog = (text,color=C.green) => {
    const time = new Date().toTimeString().slice(0,8);
    setSeedLog(l=>[...l.slice(-20),{text,color,time}]);
  };

  useEffect(()=>{
    setRanking(getRanking());
    const p = new URLSearchParams(window.location.search);
    const seedParam = p.get("seed");
    if (seedParam) {
      const s = decode(seedParam);
      if (s) { setMySeeds(prev=>[...prev,s]); addSeedLog("SEED IMPORTED from URL",C.accent); }
    }
  },[]);

  const jaccard = (a,b) => {
    const A=new Set(a.split(" ")),B=new Set(b.split(" "));
    const inter=[...A].filter(x=>B.has(x)).length;
    return inter/(A.size+B.size-inter);
  };

  const runAudit = () => {
    if (!text.trim()) { addLog("ERROR: empty transmission",C.red); return; }
    addLog("── AUDIT INITIATED ──","#2a3a50");
    addLog(`TX: "${text.slice(0,40)}${text.length>40?"...":""}"`,C.muted);
    const k = K_MAP[category]??1.0;
    if (k===0.0) { addLog("L1 BURN → 反社会的",C.red); setResult({status:"BURN",reason:"反社会的",jule:0,net:-10}); setPulse(true); setTimeout(()=>setPulse(false),600); return; }
    addLog(`L1 PASS → k=${k} (${K_LABEL[category]})`,C.green);
    const contentHash = text.split(" ").slice(0,5).join("_");
    const phi = history.length===0 ? 0 : 1-Math.exp(-2*history.map(h=>jaccard(contentHash,h)).reduce((a,b)=>a+b,0)/history.length);
    addLog(`Φ = ${phi.toFixed(3)}${phi>0.95?" → BURN":" ✓"}`,phi>0.95?C.red:C.purple);
    if (phi>0.95) { setResult({status:"BURN",reason:"Duplicate",jule:0,net:-10}); setPulse(true); setTimeout(()=>setPulse(false),600); return; }
    const vScores=[v,Math.max(0,v-8),Math.min(100,v+5)];
    const mean=vScores.reduce((a,b)=>a+b,0)/vScores.length;
    const sigma=Math.exp(-vScores.reduce((a,b)=>a+(b-mean)**2,0)/vScores.length/100);
    addLog(`Σ = ${sigma.toFixed(3)}`,C.purple);
    const genre=detectGenre(text), genreBonus=genre==="CROSS"?1.2:1.0;
    addLog(`γ = ${genre}${genreBonus>1?" (+20%)":""}`,GENRE_COLOR[genre]||C.muted);
    const decay=Math.pow(0.5,repetition);
    const deltaHFin=(v/100)*usefulRatio*sigma*decay*genreBonus;
    if (repetition>0) addLog(`decay = (1/2)^${repetition} = ${decay.toFixed(4)}`,C.gold);
    if (repetition>=11) { addLog("BURN → Echo Chamber",C.red); setResult({status:"BURN",reason:"Echo Chamber",jule:0,net:-10}); return; }
    const cost_mult=phi>0.7?Math.exp(3*(phi-0.7)):1.0;
    const f_sigma_phi=sigma*(1-phi)/cost_mult;
    const jule=Math.min(100,Math.tanh(v/50)*deltaHFin*reputation*k*f_sigma_phi*100);
    const net=jule-10;
    addLog(`J = ${jule.toFixed(2)} | net = ${net.toFixed(2)}`,net>=0?C.green:C.red);
    addLog(net>=0?"STATUS: ISSUED ✓":"STATUS: BURN",net>=0?C.accent:C.red);
    const fp={v,sigma,phi,deltaHPrime:deltaHFin,k,genre,timestamp:Date.now()};
    setResult({status:net>=0?"ISSUED":"BURN",jule,net,fp,genre});
    setHistory(h=>[...h.slice(-9),contentHash]);
    saveScore({text:text.slice(0,40),net}); setRanking(getRanking());
    setPulse(true); setTimeout(()=>setPulse(false),600);
  };

  const mintSeed = () => {
    if (!result||result.status!=="ISSUED") { addSeedLog("ISSUEDのみMINT可能",C.red); return; }
    const seed={
      id:"S-"+Math.random().toString(36).slice(2,8).toUpperCase(),
      anchor:"Pandora_Ch10_n3", fingerprint:"6axis:"+result.fp.timestamp,
      logic_hash:"sha256:"+btoa(text.slice(0,100)),
      entropy_pool:btoa(text+Date.now()).slice(0,64),
      originalTokens:Math.floor(text.length*2.8), compressedTokens:Math.floor(text.length*0.38),
      compressionRatio:0.62, qualityScore:result.jule, genre:result.genre,
      metadata:{topic:result.genre,createdAt:new Date().toISOString()},
    };
    setMySeeds(prev=>[...prev,seed]); setResult(null); setText(""); setTab("market");
    addSeedLog(`MINT → ${seed.id}`,C.accent);
  };

  const listSeed = (seed) => {
    const price=Math.max(20,Math.floor(seed.qualityScore*seed.compressionRatio*0.8));
    setMarket(prev=>[...prev,{id:"L-"+Date.now(),seed,price}]);
    setMySeeds(prev=>prev.filter(s=>s.id!==seed.id));
    addSeedLog(`出品 → ${seed.id} (${price} JULE)`,C.gold);
  };

  const buy = (listing) => {
    if (juleBalance<listing.price) { addSeedLog("JULE不足",C.red); return; }
    setJB(prev=>prev-listing.price);
    setMySeeds(prev=>[...prev,listing.seed]);
    setMarket(prev=>prev.filter(l=>l.id!==listing.id));
    addSeedLog(`購入 → ${listing.seed.id}`,C.green);
  };

  const shareSeed = (seed) => {
    const url=`${window.location.origin}${window.location.pathname}?seed=${encode(seed)}`;
    navigator.clipboard.writeText(url).then(()=>addSeedLog(`SHARE → ${seed.id}`,C.accent));
  };

  const hydrateSeed = (seed) => {
    addSeedLog(`HYDRATE → ${seed.id} | ゆらぎ: ${seed.entropy_pool.slice(0,20)}...`,C.purple);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Courier New',monospace",padding:"16px",backgroundImage:"radial-gradient(ellipse at 20% 20%,#0a1628 0%,transparent 60%)"}}>
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:9,color:"#2a4060",letterSpacing:"0.3em",marginBottom:4}}>PANDORA ECONOMY PROTOCOL v0.2</div>
        <div style={{fontSize:22,fontWeight:900,background:"linear-gradient(135deg,#00f5ff,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>JULE SYSTEM</div>
        <div style={{fontSize:9,color:C.muted,marginTop:2,letterSpacing:"0.1em"}}>THE SHREDDER · 真理の種市場 · 6-AXIS</div>
      </div>

      <div style={{borderBottom:`1px solid ${C.border}`,marginBottom:14}}>
        <Tab label="⚡ SHREDDER" active={tab==="shredder"} onClick={()=>setTab("shredder")}/>
        <Tab label="🌱 種市場"   active={tab==="market"}   onClick={()=>setTab("market")}/>
        <Tab label="📊 RANKING"  active={tab==="ranking"}  onClick={()=>setTab("ranking")}/>
      </div>

      {tab==="shredder" && (
        <div>
          <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",marginBottom:8}}>TRANSMISSION INPUT</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Enter your thought, theory, or code..."
              style={{width:"100%",background:"#060b10",border:"1px solid #1a2535",borderRadius:4,color:C.text,fontFamily:"monospace",fontSize:11,padding:"8px 10px",resize:"vertical",minHeight:70,outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 14px",marginTop:10}}>
              {[{label:`V: ${v}`,val:v,set:setV,min:0,max:100,step:1},{label:`Useful: ${usefulRatio.toFixed(2)}`,val:usefulRatio,set:setUR,min:0,max:1,step:0.01},{label:`R: ${reputation.toFixed(2)}`,val:reputation,set:setRep,min:0,max:1,step:0.01},{label:`Rep×: ${repetition}`,val:repetition,set:setRep2,min:0,max:12,step:1}].map(({label,val,set,min,max,step})=>(
                <div key={label}>
                  <div style={{fontSize:9,color:C.muted,marginBottom:2}}>{label}</div>
                  <input type="range" min={min} max={max} step={step} value={val} onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:C.accent,cursor:"pointer"}}/>
                </div>
              ))}
            </div>
            <div style={{marginTop:10}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:6}}>CATEGORY (L1)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {Object.entries(K_LABEL).map(([key,label])=>(
                  <button key={key} onClick={()=>setCategory(key)} style={{padding:"3px 8px",fontSize:9,borderRadius:3,cursor:"pointer",border:`1px solid ${category===key?C.accent:C.border}`,background:category===key?"#001820":C.panel,color:category===key?C.accent:C.muted,transition:"all 0.2s"}}>{label}</button>
                ))}
              </div>
            </div>
            <button onClick={runAudit} style={{marginTop:12,width:"100%",padding:"9px",background:pulse?"#00f5ff22":"#001820",border:`1px solid ${pulse?C.accent:"#1e3050"}`,borderRadius:6,color:C.accent,fontSize:12,fontFamily:"monospace",fontWeight:700,letterSpacing:"0.2em",cursor:"pointer",boxShadow:pulse?"0 0 20px #00f5ff44":"0 0 6px #00f5ff22",transition:"all 0.2s"}}>▶ RUN AUDIT</button>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",marginBottom:4}}>AUDIT LOG</div>
            <TermLog lines={log}/>
          </div>
          {result && (
            <div style={{background:C.panel,border:`1px solid ${result.status==="ISSUED"?"#00f5ff44":"#ef444444"}`,borderRadius:8,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:900,color:result.status==="ISSUED"?C.accent:C.red}}>{result.status==="ISSUED"?"✓ ISSUED":"✗ BURN"}</div>
                {result.genre&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,border:`1px solid ${GENRE_COLOR[result.genre]}44`,color:GENRE_COLOR[result.genre]}}>{result.genre}</span>}
              </div>
              {result.fp&&<><Gauge label="V score" value={result.fp.v} max={100} color={C.accent}/><Gauge label="ΔH' final" value={result.fp.deltaHPrime} max={1} color={C.green}/><Gauge label="Σ" value={result.fp.sigma} max={1} color={C.purple}/><Gauge label="Φ" value={result.fp.phi} max={1} color="#60a5fa"/><Gauge label="k" value={result.fp.k} max={1} color={C.gold}/></>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
                <div style={{background:"#060b10",borderRadius:6,padding:"8px 10px",border:`1px solid ${C.border}`,textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.muted,marginBottom:2}}>JULE</div>
                  <div style={{fontSize:20,fontWeight:900,color:C.accent}}>{result.jule?.toFixed(1)}</div>
                </div>
                <div style={{background:"#060b10",borderRadius:6,padding:"8px 10px",border:`1px solid ${(result.net??0)>=0?C.border:"#3a1520"}`,textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.muted,marginBottom:2}}>NET</div>
                  <div style={{fontSize:20,fontWeight:900,color:(result.net??0)>=0?C.green:C.red}}>{(result.net??0)>=0?"+":""}{result.net?.toFixed(1)}</div>
                </div>
              </div>
              {result.status==="ISSUED"&&(
                <button onClick={mintSeed} style={{marginTop:10,width:"100%",padding:"8px",background:"#001a10",border:`1px solid ${C.green}`,borderRadius:6,color:C.green,fontSize:11,fontFamily:"monospace",fontWeight:700,cursor:"pointer",letterSpacing:"0.15em"}}>🌱 MINT 真理の種</button>
              )}
            </div>
          )}
        </div>
      )}

      {tab==="market" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted}}>真理の種を売買・共有</div>
            <div style={{fontSize:13,fontWeight:700,color:C.gold}}>残高: {juleBalance} JULE</div>
          </div>
          <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:12}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",marginBottom:8}}>MY SEEDS ({mySeeds.length})</div>
            {mySeeds.length===0&&<div style={{color:C.muted,fontSize:11,textAlign:"center",padding:"20px 0"}}>まだ種なし<br/><span style={{fontSize:10}}>AUDIT → MINT してみて</span></div>}
            {mySeeds.map(seed=>(
              <div key={seed.id} style={{border:`1px dashed ${C.green}44`,borderRadius:6,padding:10,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:C.green,fontSize:11,fontWeight:700}}>{seed.id}</span>
                  <span style={{fontSize:9,color:GENRE_COLOR[seed.genre]||C.muted}}>{seed.genre||seed.metadata?.topic}</span>
                </div>
                <div style={{fontSize:9,color:C.muted,marginBottom:8}}>品質: {seed.qualityScore?.toFixed(1)} | 圧縮: {((seed.compressionRatio||0.62)*100).toFixed(0)}%</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>listSeed(seed)} style={{flex:1,padding:"5px",fontSize:9,background:"#0a1a10",border:`1px solid ${C.gold}`,borderRadius:4,color:C.gold,cursor:"pointer",fontFamily:"monospace"}}>SELL</button>
                  <button onClick={()=>hydrateSeed(seed)} style={{flex:1,padding:"5px",fontSize:9,background:"#0a0a1a",border:`1px solid ${C.purple}`,borderRadius:4,color:C.purple,cursor:"pointer",fontFamily:"monospace"}}>HYDRATE</button>
                  <button onClick={()=>shareSeed(seed)} style={{flex:1,padding:"5px",fontSize:9,background:"#0a1520",border:`1px solid ${C.accent}`,borderRadius:4,color:C.accent,cursor:"pointer",fontFamily:"monospace"}}>SHARE</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:12}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",marginBottom:8}}>MARKET</div>
            {market.length===0&&<div style={{color:C.muted,fontSize:11,textAlign:"center",padding:"20px 0"}}>出品なし</div>}
            {market.map(l=>(
              <div key={l.id} style={{border:`1px solid ${C.accent}44`,borderRadius:6,padding:10,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:C.accent,fontSize:11,fontWeight:700}}>{l.seed.id}</span>
                  <span style={{color:C.gold,fontSize:13,fontWeight:900}}>{l.price} JULE</span>
                </div>
                <div style={{fontSize:9,color:C.muted,marginBottom:8}}>{l.seed.genre||l.seed.metadata?.topic} | 品質: {l.seed.qualityScore?.toFixed(1)}</div>
                <button onClick={()=>buy(l)} style={{width:"100%",padding:"6px",fontSize:10,background:"#001820",border:`1px solid ${C.accent}`,borderRadius:4,color:C.accent,cursor:"pointer",fontFamily:"monospace",fontWeight:700}}>BUY ({l.price} JULE)</button>
              </div>
            ))}
          </div>
          <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",marginBottom:4}}>LOG</div>
          <TermLog lines={seedLog}/>
        </div>
      )}

      {tab==="ranking" && (
        <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",marginBottom:12}}>TOP 20</div>
          {ranking.length===0&&<div style={{color:C.muted,fontSize:11,textAlign:"center",padding:"30px 0"}}>まだ記録なし</div>}
          {ranking.map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}33`}}>
              <span style={{color:i<3?C.gold:C.muted,fontSize:11,minWidth:20}}>{i+1}.</span>
              <span style={{flex:1,fontSize:10,color:C.text,margin:"0 8px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.text}</span>
              <span style={{fontSize:11,fontWeight:700,color:r.net>=0?C.green:C.red,minWidth:40,textAlign:"right"}}>{r.net>=0?"+":""}{r.net?.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:10,marginTop:12,fontSize:9,color:C.muted,lineHeight:1.9}}>
        <span style={{color:C.accent}}>J</span> = tanh(<span style={{color:C.gold}}>V</span>/50) × <span style={{color:C.green}}>ΔH'</span> × <span style={{color:C.purple}}>R</span> × k × f(Σ,Φ) × 100 &nbsp;|&nbsp; Energy = ΔT × √R
      </div>
      <div style={{textAlign:"center",marginTop:10,fontSize:8,color:"#1e2d40",letterSpacing:"0.2em"}}>JULE-AI-ENERGY · PANDORA THEORY FRAGMENT · MIT</div>
    </div>
  );
}
