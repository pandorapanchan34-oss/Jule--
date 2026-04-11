// ─────────────────────────────────────────────
// Jule 6-Axis Fingerprint System (Complete)
// Pandora Theory Spec v1.0
// ─────────────────────────────────────────────

export type JuleFingerprint6 = {
  // ① 知性強度
  v_score: number;

  // ② 構造収束度
  sigma_singularity: number;

  // ③ 重複慣性
  phi_inertia: number;

  // ④ 情報進化量
  delta_h_prime: number;

  // ⑤ 文脈ジャンル
  gamma_genre: string;

  // ⑥ 実効ΔH（減衰・補正後）
  delta_h_effective: number;

  // 補助（状態系）
  repetition_count: number;
};

// ─────────────────────────────────────────────
// Φ：重複検出
// ─────────────────────────────────────────────
export function calculatePhi(hash: string, history: string[]): number {
  if (history.length === 0) return 0;

  const similarity = history.map(h => jaccard(hash, h));
  const avg = similarity.reduce((a, b) => a + b, 0) / history.length;

  return 1 - Math.exp(-2 * avg);
}

function jaccard(a: string, b: string): number {
  const A = new Set(a.split("_"));
  const B = new Set(b.split("_"));
  const inter = [...A].filter(x => B.has(x)).length;
  return inter / (A.size + B.size - inter);
}

// ─────────────────────────────────────────────
// Σ：収束度
// ─────────────────────────────────────────────
export function calculateSigma(vScores: number[]): number {
  const mean = vScores.reduce((a, b) => a + b, 0) / vScores.length;
  const variance = vScores.reduce((a, b) => a + (b - mean) ** 2, 0) / vScores.length;
  return Math.exp(-variance / 100);
}

// ─────────────────────────────────────────────
// γ：ジャンル検出
// ─────────────────────────────────────────────
export function detectGenre(text: string): string {
  const lower = text.toLowerCase();

  const map: Record<string, string[]> = {
    PHYSICS: ["quantum","spacetime","entropy","gravity"],
    MATH: ["proof","theorem","equation"],
    AI_SAFETY: ["alignment","audit","hallucination","shredder"],
    ECONOMICS: ["market","token","incentive"],
    CONSCIOUSNESS: ["qualia","awareness","mind"],
    ENGINEERING: ["code","api","system","architecture"],
  };

  const hits = Object.entries(map)
    .map(([k, v]) => [k, v.filter(w => lower.includes(w)).length]);

  const active = hits.filter(x => x[1] > 0);

  if (active.length === 0) return "OTHER";
  if (active.length >= 3) return "CROSS";

  return active.sort((a, b) => b[1] - a[1])[0][0];
}

// ─────────────────────────────────────────────
// ΔH'
// ─────────────────────────────────────────────
export function calculateDeltaHPrime(
  v: number,
  usefulRatio: number,
  sigma: number,
  k: number
): number {
  return (v / 100) * usefulRatio * sigma * k;
}

// ─────────────────────────────────────────────
// 減衰（γループ）
// ─────────────────────────────────────────────
export function applyDecay(
  deltaHPrime: number,
  repetition: number,
  genre: string
) {
  const decay = Math.pow(0.5, repetition);
  const genreBonus = genre === "CROSS" ? 1.2 : 1.0;

  return {
    delta_h_effective: deltaHPrime * decay * genreBonus,
    repetition_count: repetition,
  };
}

// ─────────────────────────────────────────────
// 🎯 6軸統合生成
// ─────────────────────────────────────────────
export function buildFingerprint6({
  text,
  v,
  usefulRatio,
  k,
  historyHashes,
  repetition,
}: {
  text: string;
  v: number;
  usefulRatio: number;
  k: number;
  historyHashes: string[];
  repetition: number;
}): JuleFingerprint6 {

  const hash = text.split(" ").slice(0, 5).join("_");

  const phi = calculatePhi(hash, historyHashes);

  const vScores = [v, Math.max(0, v - 8), Math.min(100, v + 5)];
  const sigma = calculateSigma(vScores);

  const genre = detectGenre(text);

  const deltaHPrime = calculateDeltaHPrime(v, usefulRatio, sigma, k);

  const decay = applyDecay(deltaHPrime, repetition, genre);

  return {
    v_score: v,
    sigma_singularity: sigma,
    phi_inertia: phi,
    delta_h_prime: deltaHPrime,
    gamma_genre: genre,
    delta_h_effective: decay.delta_h_effective,
    repetition_count: repetition,
  };
}
