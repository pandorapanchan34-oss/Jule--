// ─────────────────────────────────────────────
// ΔH': Extended Entropy Reduction
// ΔH' = ΔH × (useful_tokens / energy_consumed)
// ─────────────────────────────────────────────

// .js 拡張子を削除（ビルド環境のパス解決エラーを回避）
import type { L2Evaluation } from '../types/index';

export function calculateDeltaHPrime(
  evals:  L2Evaluation[],
  sigma:  number
): number {
  if (evals.length === 0) return 0;

  const mean_dh = evals.reduce((a, e) => a + e.delta_h_raw, 0)
                / evals.length;

  const h_redundancy = Math.max(0, 1 - sigma);

  const mean_useful = evals.reduce((a, e) => a + e.useful_ratio, 0)
                    / evals.length;

  const delta_h_prime = mean_dh * (1 - h_redundancy) * mean_useful;

  return Math.min(1, Math.max(0, delta_h_prime));
}

export function calculateEnergySaved(
  evals:    L2Evaluation[],
  baseline: number = 1.0
): number {
  if (evals.length === 0) return 0;

  const mean_useful = evals.reduce((a, e) => a + e.useful_ratio, 0)
                    / evals.length;

  return Math.max(0, mean_useful - baseline + 1);
}

export function exceedsThreshold(
  delta_h_prime: number,
  theta_sat:     number
): boolean {
  return delta_h_prime > theta_sat;
}
