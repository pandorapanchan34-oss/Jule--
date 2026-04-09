// src/fingerprint/sigma.ts
import type { L2Evaluation } from '../types/index.js';

/**
 * Σ: Cognitive Singularity
 * L2エンジン間のv_score一致度。
 * 全AI一致 → sigma=1.0（高信頼）
 * バラバラ  → sigma低下
 */
export function calculateSigma(
  evals: L2Evaluation[]
): number {
  if (evals.length === 0) return 1.0;
  if (evals.length === 1) return 1.0;

  const scores = evals.map(e => e.v_score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce(
    (a, b) => a + (b - mean) ** 2, 0
  ) / scores.length;

  // variance=0（完全一致）→ 1.0
  // variance=625（max: 0と100が混在）→ exp(-6.25)≈0.002
  return Math.exp(-variance / 100);
}
