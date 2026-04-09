// Reputation Score (R)
// R_new = (1 - α) × R_old + α × (V_score / 100)
// ─────────────────────────────────────────────
import type { JuleAsset } from '../types/index.js';

const ALPHA        = 0.1;
const INITIAL_R    = 0.5;
const INITIAL_JULE = 500;

export function updateReputation(
  current_r: number,
  v_score:   number,
  alpha:     number = ALPHA
): number {
  const v_normalized = v_score / 100;
  return (1 - alpha) * current_r + alpha * v_normalized;
}

export function createNewAsset(user_id: string): JuleAsset {
  return {
    user_id,
    total_jule:              INITIAL_JULE,
    reputation_score:        INITIAL_R,
    entropy_reduction_total: 0,
    energy_saved_total:      0,
    last_updated:            Date.now(),
  };
}

export function applyJuleChange(
  asset:        JuleAsset,
  net:          number,
  delta_h:      number,
  energy_saved: number,
  v_score:      number
): JuleAsset {
  return {
    ...asset,
    total_jule:              Math.max(0, asset.total_jule + net),
    reputation_score:        updateReputation(asset.reputation_score, v_score),
    entropy_reduction_total: asset.entropy_reduction_total + delta_h,
    energy_saved_total:      asset.energy_saved_total + energy_saved,
    last_updated:            Date.now(),
  };
}
