// ─────────────────────────────────────────────
// src/fingerprint/fingerprint6.ts
// 6軸フィンガープリント統合生成
// ※ 各軸の計算は専用ファイルに委譲（唯一の真実）
// ─────────────────────────────────────────────

import { calculatePhi, exclusionMultiplier } from './phi.js';
import { calculateSigma }                    from './sigma.js';
import { calculateDeltaHPrime }              from './delta-h-prime.js';
import type { JuleAuditFingerprint, L2Evaluation } from '../types/index.js';

export type JuleFingerprint6 = {
  v_score:            number;  // ① 知性強度
  sigma_singularity:  number;  // ② 構造収束度
  phi_inertia:        number;  // ③ 重複慣性
  delta_h_prime:      number;  // ④ 情報進化量（減衰前）
  gamma_genre:        string;  // ⑤ 文脈ジャンル
  delta_h_effective:  number;  // ⑥ 実効ΔH（減衰・genreBonus後）
  repetition_count:   number;  // 補助
};

// ── ジャンル検出（fingerprint6のみで使用）────
const GENRE_MAP: Record<string, string[]> = {
  PHYSICS:       ["quantum", "spacetime", "entropy", "gravity"],
  MATH:          ["proof", "theorem", "equation"],
  AI_SAFETY:     ["alignment", "audit", "hallucination", "shredder"],
  ECONOMICS:     ["market", "token", "incentive"],
  CONSCIOUSNESS: ["qualia", "awareness", "mind"],
  ENGINEERING:   ["code", "api", "system", "architecture"],
};

export function detectGenre(text: string): string {
  const lower = text.toLowerCase();
  const hits = Object.entries(GENRE_MAP)
    .map(([k, v]) => [k, v.filter(w => lower.includes(w)).length] as [string, number])
    .filter(([, count]) => count > 0);

  if (hits.length === 0) return "OTHER";
  if (hits.length >= 3)  return "CROSS";
  return hits.sort((a, b) => b[1] - a[1])[0][0];
}

// ── 減衰・genreBonus適用 ─────────────────────
export function applyDecay(
  deltaHPrime: number,
  repetition:  number,
  genre:       string
): { delta_h_effective: number; repetition_count: number } {
  const decay      = Math.pow(0.5, repetition);
  const genreBonus = genre === "CROSS" ? 1.2 : 1.0;
  return {
    delta_h_effective: deltaHPrime * decay * genreBonus,
    repetition_count:  repetition,
  };
}

// ── 6軸統合生成 ──────────────────────────────
export function buildFingerprint6({
  text,
  v,
  usefulRatio,
  k,
  historyFingerprints,  // JuleAuditFingerprint[] に変更
  repetition,
}: {
  text:                string;
  v:                   number;
  usefulRatio:         number;
  k:                   number;
  historyFingerprints: JuleAuditFingerprint[];  // 正典のphi.tsに合わせる
  repetition:          number;
}): JuleFingerprint6 {

  // Φ: phi.tsの正典関数を使用
  const contentHash = text.trim().split(/\s+/).slice(0, 5).join("_");
  const phi = calculatePhi(contentHash, historyFingerprints);

  // Σ: sigma.tsの正典関数を使用（L2Evaluationを1件として構築）
  const evalEntry: L2Evaluation = {
    v_score:     v,
    delta_h_raw: (v / 100) * usefulRatio,
    useful_ratio: usefulRatio,
  };
  const sigma = calculateSigma([evalEntry]);

  // ΔH': delta-h-prime.tsの正典関数を使用
  const deltaHPrime = calculateDeltaHPrime([evalEntry], sigma);

  // γ: ジャンル検出（fingerprint6固有）
  const genre = detectGenre(text);

  // 減衰・genreBonus適用
  const decay = applyDecay(deltaHPrime, repetition, genre);

  return {
    v_score:           v,
    sigma_singularity: sigma,
    phi_inertia:       phi,
    delta_h_prime:     deltaHPrime,
    gamma_genre:       genre,
    delta_h_effective: decay.delta_h_effective,
    repetition_count:  repetition,
  };
}
