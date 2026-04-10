import { useState, useEffect } from "react";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   Utils
───────────────────────────────────────── */
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
  if (t.includes("ai") || t.includes("audit") || t.includes("shredder")) return "AI_SAFETY";
  if (t.includes("market") || t.includes("jule") || t.includes("trade")) return "ECONOMICS";
  if (t.includes("quantum") || t.includes("physics") || t.includes("pandora")) return "PHYSICS";
  return "OTHER";
};

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function JuleDemo() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [mySeeds, setMySeeds] = useState<JuleSeed[]>([]);
  const [market, setMarket] = useState<Listing[]>([]);
  const [jule, setJule] = useState(500);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-8), `> ${message}`]);
  };

  /* INIT */
  useEffect(() => {
    setRanking(getRanking());

    const params = new URLSearchParams(window.location.search);
    const shared = params.get("s");
    if (shared) {
      const decoded = decode(shared);
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

  /* AUDIT */
  const runAudit = () => {
    if (!text.trim()) return;

    const v = 55 + Math.random() * 45;           // 価値スコア
    const delta = v / 100;
    const juleVal = Math.tanh(v / 50) * delta * 120;

    const res = {
      status: juleVal > 15 ? "ISSUED" : "BURN",
      jule: Math.floor(juleVal),
      net: Math.floor(juleVal - 10),
      genre: detectGenre(text),
      fp: { v, delta, timestamp: Date.now() }
    };

    setResult(res);
    saveScore({ text: text.slice(0, 50), net: res.net });
    setRanking(getRanking());
    addLog(`AUDIT完了 → ${res.status} (${res.jule.toFixed(0)} JULE)`);
  };

  /* MINT SEED（真理の種作成） */
  const mintSeed = () => {
    if (!result || result.status !== "ISSUED") {
      addLog("ISSUEDされた結果のみ種にできます");
      return;
    }

    const seed: JuleSeed = {
      id: "S-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      anchor: "Pandora_Ch10_n3",
      fingerprint: "6axis:" + result.fp.timestamp,
      logic_hash: "sha256:" + btoa(text.slice(0, 300)),
      entropy_pool: btoa(text + Date.now()).slice(0, 64),
      originalTokens: text.length * 3,
      compressedTokens: Math.floor(text.length * 0.35),
      compressionRatio: 0.65,
      qualityScore: result.jule,
      metadata: {
        topic: result.genre,
        createdAt: new Date().toISOString()
      }
    };

    setMySeeds(prev => [...prev, seed]);
    setResult(null);
    setText("");
    addLog(`真理の種をmintしました → ${seed.id}`);
  };

  /* HYDRATE（種の展開） */
  const hydrateSeed = (seed: JuleSeed) => {
    const dream = seed.entropy_pool.slice(0, 32);
    const expanded = `【${seed.anchor} 展開】\n\n` +
      `トピック: ${seed.metadata.topic}\n` +
      `圧縮率: ${(seed.compressionRatio * 100).toFixed(1)}%\n\n` +
      `論理の骨格: ${seed.logic_hash.slice(0, 40)}...\n` +
      `ゆらぎ（夢）注入: ${dream}...\n\n` +
      `── Reputation補正により、深みが増して展開されました ──\n\n` +
      text ? text.slice(0, 200) + "..." : "（この種のエッセンスが広がっています）";

    alert(expanded);
    addLog(`HYDRATE完了 → ${seed.id}（ゆらぎ注入）`);
  };

  /* MARKET */
  const listSeed = (seed: JuleSeed) => {
    if (jule < 10) return addLog("手数料が足りません");

    const price = Math.max(15, Math.floor(seed.qualityScore * seed.compressionRatio));

    const listing: Listing = {
      id: "L-" + Date.now(),
      seed,
      price
    };

    setMarket(prev => [...prev, listing]);
    setMySeeds(prev => prev.filter(s => s.id !== seed.id));
    addLog(`出品しました → ${seed.id} (${price} JULE)`);
  };

  const buy = (listing: Listing) => {
    if (jule < listing.price) {
      addLog("JULEが不足しています");
      return;
    }

    if (!window.confirm(`本当に ${listing.price} JULEで購入しますか？`)) return;

    setJule(prev => prev - listing.price);
    setMySeeds(prev => [...prev, listing.seed]);
    setMarket(prev => prev.filter(l => l.id !== listing.id));

    addLog(`購入完了！ → ${listing.seed.id} を手に入れました`);
  };

  const shareSeed = (seed: JuleSeed) => {
    const url = `${window.location.origin}${window.location.pathname}?seed=${encode(seed)}`;
    navigator.clipboard.writeText(url);
    addLog(`種の共有URLをコピーしました → ${seed.id}`);
  };

  return (
    <div style={{
      padding: "20px",
      fontFamily: "monospace",
      color: "#0ff",
      background: "#0a0a0a",
      minHeight: "100vh",
      lineHeight: 1.6
    }}>
      <h1 style={{ color: "#0f0" }}>JULE DEMO v2.0 - 真理の種市場</h1>
      <p>AIのセッションを「真理の種」に圧縮 → 個人間で取引できる未来のデモ</p>

      {/* INPUT */}
      <div style={{ margin: "20px 0" }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="ここにテキストや会話ログを貼ってAUDITしてみて..."
          style={{ width: "100%", height: "120px", background: "#111", color: "#0ff", border: "1px solid #0f0" }}
        />
        <button onClick={runAudit} style={{ marginRight: 10 }}>AUDIT実行</button>
      </div>

      {/* RESULT */}
      {result && (
        <div style={{ border: "1px solid #0f0", padding: 15, margin: "15px 0" }}>
          <strong>結果: {result.status}</strong><br />
          獲得JULE: {result.jule} | NET: {result.net}<br />
          Genre: {result.genre}<br /><br />
          <button onClick={mintSeed}>MINT 真理の種</button>
          <button onClick={() => {
            const url = `${window.location.origin}${window.location.pathname}?s=${encode(result)}`;
            navigator.clipboard.writeText(url);
            addLog("結果を共有URLとしてコピー");
          }}>
            SHARE RESULT
          </button>
        </div>
      )}

      {/* MY SEEDS */}
      <h3>私の真理の種 ({mySeeds.length})</h3>
      {mySeeds.length === 0 && <div style={{color:"#555"}}>まだ種がありません。AUDIT → MINTしてみてください</div>}
      {mySeeds.map(seed => (
        <div key={seed.id} style={{ border: "1px dashed #0f0", padding: 12, margin: "8px 0" }}>
          <strong>{seed.id}</strong> | {seed.metadata.topic} | 圧縮率 {(seed.compressionRatio*100).toFixed(0)}%<br />
          <button onClick={() => listSeed(seed)}>SELL（出品）</button>
          <button onClick={() => hydrateSeed(seed)}>HYDRATE（展開）</button>
          <button onClick={() => shareSeed(seed)}>SHARE</button>
        </div>
      ))}

      {/* MARKET */}
      <h3>MARKET（所持JULE: {jule}）</h3>
      {market.length === 0 && <div style={{color:"#555"}}>現在出品はありません</div>}
      {market.map(l => (
        <div key={l.id} style={{ border: "1px solid #0ff", padding: 12, margin: "8px 0" }}>
          {l.seed.id} | {l.seed.metadata.topic} | 価格: <strong>{l.price}</strong> JULE<br />
          圧縮率: {(l.seed.compressionRatio*100).toFixed(0)}%<br />
          <button onClick={() => buy(l)}>BUY（購入）</button>
        </div>
      ))}

      {/* RANKING */}
      <h3>ランキング（過去20件）</h3>
      {ranking.map((r, i) => (
        <div key={i}>{i + 1}. {r.text} ({r.net})</div>
      ))}

      {/* LOG */}
      <div style={{ marginTop: 30, fontSize: "0.9em", color: "#0a0" }}>
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
