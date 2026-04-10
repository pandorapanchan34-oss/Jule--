import { useState, useEffect } from "react";

/* ─────────────────────────────────────────
   Storage / Encode Utils
───────────────────────────────────────── */

const STORAGE_KEY = "jule_ranking_v1";

const saveScore = (entry) => {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  data.push(entry);
  data.sort((a, b) => b.net - a.net);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, 20)));
};

const getRanking = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const encode = (obj) => btoa(JSON.stringify(obj));
const decode = (str) => {
  try { return JSON.parse(atob(str)); } catch { return null; }
};

/* ───────────────────────────────────────── */

const detectGenre = (text) => {
  const t = text.toLowerCase();
  if (t.includes("ai") || t.includes("audit")) return "AI_SAFETY";
  if (t.includes("market")) return "ECONOMICS";
  if (t.includes("quantum")) return "PHYSICS";
  return "OTHER";
};

export default function JuleDemo() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [mySeeds, setMySeeds] = useState([]);
  const [market, setMarket] = useState([]);
  const [jule, setJule] = useState(500);
  const [log, setLog] = useState([]);

  const addLog = (t) => setLog(l => [...l.slice(-10), t]);

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  useEffect(() => {
    setRanking(getRanking());

    const p = new URLSearchParams(window.location.search);

    const shared = p.get("s");
    if (shared) {
      const d = decode(shared);
      if (d) setResult(d);
    }

    const seedParam = p.get("seed");
    if (seedParam) {
      const s = decode(seedParam);
      if (s) {
        setMySeeds(prev => [...prev, s]);
        addLog("SEED IMPORTED");
      }
    }
  }, []);

  /* ─────────────────────────────────────────
     AUDIT
  ───────────────────────────────────────── */
  const runAudit = () => {
    if (!text) return;

    const v = 60 + Math.random() * 40;
    const delta = v / 100;
    const juleVal = Math.tanh(v / 50) * delta * 0.5 * 100;

    const res = {
      status: juleVal > 10 ? "ISSUED" : "BURN",
      jule: juleVal,
      net: juleVal - 10,
      genre: detectGenre(text),
      fp: { v, delta }
    };

    setResult(res);

    saveScore({
      text: text.slice(0, 40),
      net: res.net
    });

    setRanking(getRanking());
    addLog("AUDIT DONE");
  };

  /* ─────────────────────────────────────────
     SEED
  ───────────────────────────────────────── */
  const mintSeed = () => {
    if (!result || result.status !== "ISSUED") return;

    const seed = {
      id: "S-" + Math.random().toString(36).slice(2, 6),
      fp: result.fp,
      content: text.slice(0, 50),
      evo: Math.random() + 0.5
    };

    setMySeeds([...mySeeds, seed]);
    setResult(null);
    setText("");
    addLog("SEED MINTED");
  };

  const shareSeed = (seed) => {
    const url = `${location.origin}?seed=${encode(seed)}`;
    navigator.clipboard.writeText(url);
    addLog("SEED URL COPIED");
  };

  /* ─────────────────────────────────────────
     MARKET
  ───────────────────────────────────────── */
  const listSeed = (seed) => {
    const listing = {
      id: "L-" + Date.now(),
      seed,
      price: Math.floor(seed.fp.v * seed.evo)
    };

    setMarket([...market, listing]);
    setMySeeds(mySeeds.filter(s => s.id !== seed.id));
    addLog("LISTED");
  };

  const buy = (l) => {
    if (jule < l.price) return addLog("NO JULE");

    setJule(jule - l.price);
    setMySeeds([...mySeeds, l.seed]);
    setMarket(market.filter(x => x.id !== l.id));

    addLog("BOUGHT");
  };

  /* ───────────────────────────────────────── */

  return (
    <div style={{padding:20, fontFamily:"monospace", color:"#0ff", background:"#000", minHeight:"100vh"}}>

      <h2>JULE DEMO</h2>

      {/* INPUT */}
      <textarea value={text} onChange={e=>setText(e.target.value)} />

      <button onClick={runAudit}>AUDIT</button>

      {/* RESULT */}
      {result && (
        <div>
          <div>{result.status}</div>
          <div>{result.jule.toFixed(2)}</div>

          <button onClick={mintSeed}>MINT</button>

          <button onClick={()=>{
            const url = `${location.origin}?s=${encode(result)}`;
            navigator.clipboard.writeText(url);
          }}>
            SHARE RESULT
          </button>
        </div>
      )}

      {/* RANK */}
      <h3>RANK</h3>
      {ranking.map((r,i)=>(
        <div key={i}>{i+1}: {r.text} ({r.net.toFixed(1)})</div>
      ))}

      {/* SEEDS */}
      <h3>MY SEEDS</h3>
      {mySeeds.map(s=>(
        <div key={s.id}>
          {s.id}
          <button onClick={()=>listSeed(s)}>SELL</button>
          <button onClick={()=>shareSeed(s)}>SHARE</button>
        </div>
      ))}

      {/* MARKET */}
      <h3>MARKET (J={jule})</h3>
      {market.map(l=>(
        <div key={l.id}>
          {l.seed.id} : {l.price}
          <button onClick={()=>buy(l)}>BUY</button>
        </div>
      ))}

      {/* LOG */}
      <div>
        {log.map((l,i)=><div key={i}>{l}</div>)}
      </div>

    </div>
  );
}
