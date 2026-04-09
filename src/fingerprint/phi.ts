// src/fingerprint/phi.ts
import type { JuleAuditFingerprint } from '../types/index.js';
import { jaccard } from '../utils/jaccard.js';

/**
 * Φ: Phase Inertia（位相慣性）
 * 重複検出スコア。重複度高い → phi高い。
 * phi > PHI_BURN_LIMIT(0.95) でburn。
 *
 * 修正前: exp(-lambda×similarity) → 新規=1.0でburnされていた
 * 修正後: 1 - exp(-lambda×similarity) → 重複=高スコア
 */
export function calculatePhi(
  contentHash: string,
  history: JuleAuditFingerprint[]
): number {
  if (history.length === 0) return 0.0;

  // fingerprintのbucketキーとhashを比較
  const similarities = history.map(fp => {
    const bucket = `${fp.v_score}_${fp.delta_h_prime}_${fp.sigma_singularity}`;
    return jaccard(contentHash, bucket);
  });

  const avg = similarities.reduce((a, b) => a + b, 0)
              / similarities.length;

  const lambda = 2.0;
  // 重複度0 → 0.0（新規・burn対象外）
  // 重複度1 → 0.865（burn対象）
  return 1 - Math.exp(-lambda * avg);
}

export function exclusionMultiplier(phi: number): number {
  return 1 - phi;
}

export function hashContent(content: string): string {
  // 簡易ハッシュ（本番はcrypto.subtle推奨）
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}
