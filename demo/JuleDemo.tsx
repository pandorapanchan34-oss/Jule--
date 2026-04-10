import { useState, useEffect, useRef } from "react";
// 理論ロジックをインポート
import { calculateDeltaHPrime } from '../fingerprint/delta-h-prime';

const C = {
  bg:"#060b10", panel:"#0a1018", border:"#1e2d40",
  accent:"#00f5ff", green:\"#34d399\", purple:\"#a78bfa\",
  gold:\"#fbbf24\", red:\"#ef4444\", muted:\"#4a6080\", text:\"#c8d8e8\",
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
  ECONOMICS:["token","energy","cost","utility","incentive","budget","efficiency"],
};

export default function JuleDemo() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [tab, setTab] = useState("main");
  const [verified, setVerified] = useState(false);

  useEffect(() => { setRanking(getRanking()); }, []);

  const runInference = () => {
    if(!input.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      // 1. 擬似的なエントロピーと有用性の抽出（デモ用）
      const h_raw = 0.4 + Math.random() * 0.5; // ΔH_raw
      const u_ratio = 0.3 + Math.random() * 0.6; // useful_ratio
      const sigma = 0.85; // 有限帯域 B の戦略定数 (n=3収束)

      // 2. delta-h-prime.ts の計算ロジックを適用
      // 内部で ΔH' = mean_dh * (1 - (1 - sigma)) * mean_useful が実行される
      const mockEval = [{
        delta_h_raw: h_raw,
        useful_ratio: u_ratio
      }];
      
      const dh_prime = calculateDeltaHPrime(mockEval, sigma);

      // 3. UI表示用にスケーリング (0.0~1.0 -> 0~10 Jule)
      const jVal = dh_prime * 10;
      const energy = 2.0 + Math.random() * 3.0;
      const net = jVal - (energy * 0.1);

      let genre = "GENERAL";
      for(const [g, keys] of Object.entries(GENRE_KEYWORDS)) {
        if(keys.some(k => input.toLowerCase().includes(k))) { genre = g; break; }
      }

      const res = {
        h: h_raw,
        u: u_ratio,
        j: jVal,
        e: energy,
        net: net,
        genre: genre,
        id: encode({t:Date.now(), i:input.slice(0,10)})
      };

      setResult(res);
      setVerified(true);
      saveScore({text:input.slice(0,30), net:net, genre:genre});
      setRanking(getRanking());
      setLoading(false);
    }, 1500);
  };

  // --- 以下、UIパーツは変更なし ---
  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',sans-serif",padding:20,display:"flex",flexDirection:"column",alignItems:"center"}}>
      {/* 既存のUI構造を維持 */}
      <div style={{width:"100%",maxWidth:480,display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:900,letterSpacing:"0.2em",color:C.accent}}>JULE <span style={{fontSize:10,fontWeight:400,opacity:0.6}}>v2.0.1</span></div>
        <div style={{display:"flex",gap:15}}>
          <button onClick={()=>setTab("main")} style={{background:"none",border:"none",color:tab==="main"?C.accent:C.muted,fontSize:10,cursor:"pointer"}}>DEMO</button>
          <button onClick={()=>setTab("rank")} style={{background:"none",border:"none",color:tab==="rank"?C.accent:C.muted,fontSize:10,cursor:"pointer"}}>RANK</button>
        </div>
      </div>

      {tab === "main" ? (
        <div style={{width:"100%",maxWidth:480}}>
          <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:20,boxShadow:"0 10px 30px rgba(0,0,0,0.5)"}}>
            <textarea 
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              placeholder="思考を入力してください..."
              style={{width:"100%",background:"none",border:"none",color:C.text,fontSize:14,minHeight:100,outline:"none",resize:"none",lineHeight:1.6}}
            />
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <div style={{fontSize:9,color:C.muted,display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:verified?C.green:C.border}}></div>
                {verified ? "VERIFIED BY ASPIDOS" : "READY"}
              </div>
              <button 
                onClick={runInference}
                disabled={loading || !input}
                style={{background:loading?C.border:C.accent,color:C.bg,border:"none",padding:"8px 24px",borderRadius:20,fontSize:11,fontWeight:900,cursor:"pointer",transition:"all 0.2s"}}
              >
                {loading ? "CALCULATING..." : "GO"}
              </button>
            </div>
          </div>

          {result && (
            <div style={{animation:"fadeIn 0.5s ease forwards"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{background:C.panel,border:`1px solid ${C.border}`,padding:12,borderRadius:8}}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:4}}>ENTROPY (H)</div>
                  <div style={{fontSize:16,fontWeight:700,color:C.purple}}>{result.h.toFixed(3)}</div>
                </div>
                <div style={{background:C.panel,border:`1px solid ${C.border}`,padding:12,borderRadius:8}}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:4}}>USEFUL RATIO (U)</div>
                  <div style={{fontSize:16,fontWeight:700,color:C.green}}>{result.u.toFixed(3)}</div>
                </div>
              </div>

              <div style={{background:C.panel,border:`1px solid ${C.border}`,padding:20,borderRadius:8,textAlign:"center",position:"relative",overflow:"hidden"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:8,letterSpacing:"0.1em"}}>JULE SCORE</div>
                <div style={{fontSize:48,fontWeight:900,color:C.accent,lineHeight:1}}>{result.j.toFixed(2)}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:10}}>GENRE: <span style={{color:C.text}}>{result.genre}</span></div>
                <div style={{position:"absolute",bottom:0,left:0,height:2,background:C.accent,width:`${result.j*10}%`}}></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:480,background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",marginBottom:12}}>TOP 20</div>
          {ranking.length===0&&<div style={{color:C.muted,fontSize:11,textAlign:"center",padding:"30px 0"}}>まだ記録なし</div>}
          {ranking.map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}33`}}>
              <span style={{color:i<3?C.gold:C.muted,fontSize:11,minWidth:20}}>{i+1}.</span>
              <span style={{flex:1,fontSize:10,color:C.text,margin:"0 8px",overflow:"hidden",textOverflow:\"ellipsis\",whiteSpace:\"nowrap\"}}>{r.text}</span>
              <span style={{fontSize:11,fontWeight:700,color:r.net>=0?C.green:C.red,minWidth:40,textAlign:\"right\"}}>{r.net>=0?\"+\":\"\"}{r.net?.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:10,marginTop:12,fontSize:9,color:C.muted,lineHeight:1.9,maxWidth:480,width:\"100%\"}}>
        <span style={{color:C.accent}}>J</span>... Jule. 単位時間あたりの有効情報密度。
        <br/>
        <span style={{color:C.accent}}>ΔH'</span>... 理論エントロピー削減量（B/有限帯域戦略）。
      </div>
    </div>
  );
}
