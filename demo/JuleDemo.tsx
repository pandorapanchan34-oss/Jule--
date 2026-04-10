import { useState, useEffect } from "react";

interface JuleSeed {
  id: string;
  anchor: string;
  fingerprint: string;
  logic_hash: string;
  entropy_pool: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  qualityScore: number;
  metadata: {
    topic: string;
    createdAt: string;
  };
}

interface Listing {
  id: string;
  seed: JuleSeed;
  price: number;
}

const STORAGE_KEY = "jule_ranking_v2";

const saveScore = (entry: { text: string; net: number }) => {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  data.push(entry);
  data.sort((a, b) => b.net - a.net);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, 20)));
};

const getRanking = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const encode = (obj: any) => btoa(JSON.stringify(obj));
const decode = (str: string) => {
  try { return JSON.parse(atob(str)); } catch { return null; }
};

const detectGenre = (text: string): string => {
  const t = text.toLowerCase();
  if (t.includes("ai") || t.includes("shredder") || t.includes("audit")) return "AI_SAFETY";
  if (t.includes("market") || t.includes("trade") || t.includes("jule")) return "ECONOMICS";
  if (t.includes("pandora") || t.includes("quantum")) return "PHYSICS";
  return "OTHER";
};

export default function JuleDemo() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [mySeeds, setMySeeds] = useState<JuleSeed[]>([]);
  const [market, setMarket] = useState<Listing[]>([]);
  const [jule, setJule] = useState(888);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-10), `> ${message}`]);
  };

  useEffect(() => {
    setRanking(getRanking());

    const params = new URLSearchParams(window.location.search);
    const sharedResult = params.get("s");
    if (sharedResult) {
      const decoded = decode(sharedResult);
      if (decoded) setResult(decoded);
    }

    const seedParam = params.get("seed");
    if (seedParam) {
      const seed = decode(seedParam);
      if (seed) {
        setMySeeds(prev => [...prev, seed]);
        addLog("外部から真理の種をインポートしました");
      }
    }
  }, []);

  const runAudit = () => {
    if (!text.trim()) return;

    const v = 55 + Math.random() * 45;
    const juleVal = Math.floor(Math.tanh(v / 50) * (v / 100) * 180);

    const res = {
      status: juleVal > 25 ? "ISSUED" : "BURN",
      jule: juleVal,
      net: juleVal - 10,
      genre: detectGenre(text),
      fp: { v, timestamp: Date.now() }
    };

    setResult(res);
    saveScore({ text: text.slice(0, 60), net: res.net });
    setRanking(getRanking());
    addLog(`AUDIT完了 → ${res.status} (${juleVal} JULE)`);
  };

  const mintSeed = () => {
    if (!result || result.status !== "ISSUED") {
      addLog("ISSUEDされた結果のみ種にできます");
      return;
    }

    const seed: JuleSeed = {
      id: "S-" + Math.random().toString(36).slice(2, 9).toUpperCase(),
      anchor: "Pandora_Ch10_n3",
      fingerprint: "6axis:" + result.fp.timestamp,
      logic_hash: "sha256:" + btoa(text.slice(0, 300)),
      entropy_pool: btoa(text + Date.now()).slice(0, 64),
      originalTokens: Math.floor(text.length * 2.8),
      compressedTokens: Math.floor(text.length * 0.38),
      compressionRatio: 0.62,
      qualityScore: result.jule,
      metadata: {
        topic: result.genre,
        createdAt: new Date().toISOString()
      }
    };

    setMySeeds(prev => [...prev, seed]);
    setResult(null);
    setText("");
    addLog(`真理の種をmint → ${seed.id}`);
  };

  const hydrateSeed = (seed: JuleSeed) => {
    const dream = seed.entropy_pool.slice(0, 40);
    const expanded = `【${seed.anchor} 展開】\n\n` +
      `トピック: ${seed.metadata.topic}\n` +
      `圧縮率: ${(seed.compressionRatio * 100).toFixed(1)}% | 品質: ${seed.qualityScore}\n\n` +
      `論理骨格: ${seed.logic_hash.slice(0, 50)}...\n` +
      `ゆらぎ注入: ${dream}...\n\n` +
      `── この種はあなたの文脈で再び花開きます ──`;

    alert(expanded);
    addLog(`HYDRATE完了 → ${seed.id}（ゆらぎを注入）`);
  };

  const listSeed = (seed: JuleSeed) => {
    const price = Math.max(20, Math.floor(seed.qualityScore * seed.compressionRatio * 0.8));

    const listing: Listing = { id: "L-" + Date.now(), seed, price };

    setMarket(prev => [...prev, listing]);
    setMySeeds(prev => prev.filter(s => s.id !== seed.id));
    addLog(`出品しました → ${seed.id} (${price} JULE)`);
  };

  const buy = (listing: Listing) => {
    if (jule < listing.price) return addLog("JULEが足りません…");

    if (!window.confirm(`${listing.price} JULEで購入しますか？`)) return;

    setJule(prev => prev - listing.price);
    setMySeeds(prev => [...prev, listing.seed]);
    setMarket(prev => prev.filter(l => l.id !== listing.id));
    addLog(`購入成功！ → ${listing.seed.id}`);
  };

  const shareSeed = (seed: JuleSeed) => {
    const url = `${window.location.origin}${window.location.pathname}?seed=${encode(seed)}`;
    navigator.clipboard.writeText(url);
    addLog(`共有URLをコピーしました → ${seed.id}`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", background: "#0a0a0a", color: "#0ff", minHeight: "100vh" }}>
      <h1 style={{ color: "#0f0" }}>JULE v2.0 — 真理の種市場</h1>
      <p>長いAIセッションを「真理の種」に圧縮して、Juleトークンで個人間取引できます</p>

      <div style={{ margin: "20px 0" }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="ここにAIとの会話やテキストを貼ってAUDIT → MINTしてください"
          style={{ width: "100%", height: "140px", background: "#111", color: "#0ff", border: "1px solid #0f0", padding: 10 }}
        />
        <br /><br />
        <button onClick={runAudit} style={{ padding: "10px 20px", marginRight: 10 }}>▶ AUDIT実行</button>
      </div>

      {result && (
        <div style={{ border: "2px solid #0f0", padding: 15, margin: "15px 0" }}>
          <strong>結果: {result.status}</strong><br />
          獲得 JULE: <strong>{result.jule}</strong> | NET: {result.net}<br />
          Genre: {result.genre}<br /><br />
          <button onClick={mintSeed} style={{ marginRight: 10 }}>🌱 MINT 真理の種</button>
        </div>
      )}

      <h3>私の真理の種 ({mySeeds.length})</h3>
      {mySeeds.length === 0 && <p style={{ color: "#555" }}>まだ種がありません。AUDIT → MINTしてみて</p>}
      {mySeeds.map(seed => (
        <div key={seed.id} style={{ border: "1px dashed #0f0", padding: 12, margin: "8px 0" }}>
          <strong>{seed.id}</strong> | {seed.metadata.topic} | 圧縮率 {(seed.compressionRatio * 100).toFixed(0)}%<br />
          <button onClick={() => listSeed(seed)} style={{ marginRight: 8 }}>SELL</button>
          <button onClick={() => hydrateSeed(seed)} style={{ marginRight: 8 }}>HYDRATE</button>
          <button onClick={() => shareSeed(seed)}>SHARE</button>
        </div>
      ))}

      <h3>MARKET（所持 JULE: {jule}）</h3>
      {market.length === 0 && <p style={{ color: "#555" }}>現在出品はありません</p>}
      {market.map(l => (
        <div key={l.id} style={{ border: "1px solid #0ff", padding: 12, margin: "8px 0" }}>
          {l.seed.id} | {l.seed.metadata.topic} | <strong>{l.price} JULE</strong><br />
          圧縮率: {(l.seed.compressionRatio * 100).toFixed(0)}%<br />
          <button onClick={() => buy(l)}>BUY</button>
        </div>
      ))}

      <h3>ランキング（過去20件）</h3>
      {ranking.map((r, i) => (
        <div key={i}>{i + 1}. {r.text} ({r.net})</div>
      ))}

      <div style={{ marginTop: 30, fontSize: "0.9em", color: "#0a0" }}>
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
