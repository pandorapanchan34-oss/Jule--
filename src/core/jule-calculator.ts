// src/core/jule-calculator.ts

/**
 * J = tanh(V/50) × ΔH' × R × k
 *
 * 修正前: 引数7個バラバラ、sigma/phi/Aが独立乗算、×100ハードコード
 * 修正後: オブジェクト引数、仕様通りの4変数、×100は正規化として明記
 *
 * sigma/phiはdelta_hに事前畳み込み済み（delta-h-prime.tsで処理）
 * calculateJuleは純粋な仕様式のみ責務を持つ
 */
export interface JuleParams {
  v:          number;  // AI評価スコア (0-100)
  delta_h:    number;  // ΔH'（sigma畳み込み済み）(0-1)
  reputation: number;  // Rレピュテーション (0-1)
  k:          number;  // カテゴリ係数 (0/0.1/0.3/0.5/1.0)
}

export function calculateJule(params: JuleParams): number {
  const { v, delta_h, reputation, k } = params;

  // ×100: tanh最大値1.0 × delta_h最大値1.0 → J_max=100に正規化
  return Math.tanh(v / 50) * delta_h * reputation * k * 100;
}

export function calculateNet(jule: number): number {
  const POSTING_COST = 10;
  return jule - POSTING_COST;
}
