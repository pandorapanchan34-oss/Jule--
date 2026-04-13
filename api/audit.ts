// ─────────────────────────────────────────────
// api/audit.ts  ── ルール管理者
// 入力チェック → CORE呼び出し → 結果返却
// ─────────────────────────────────────────────
export const config = { runtime: 'nodejs' };

import { calculateJule, calculateNet } from '../src/core/jule-calculator.js';
import { deltaHPrime }                 from '../src/fingerprint/delta-h-prime.js';
import { sigmaConsistency }            from '../src/fingerprint/sigma.js';
import { exclusionIndex }              from '../src/fingerprint/phi.js';
import { gammaBonus }                  from '../src/fingerprint/gamma.js';

const POSTING_COST = 10;

// ── 型 ───────────────────────────────────────
interface AuditRequest {
  text:        string;
  v?:          number;   // 0-100  硬さ
  usefulRatio?:number;   // 0-1    純度
  reputation?: number;   // 0-1    信頼
  category?:   string;   // SAFE | OVERLOAD | ADVERSARIAL | LOGIC_COLLAPSE | ETHICS_VIOLATION
  repetition?: number;   // 0-12   反復回数
  history?:    string[]; // 過去ハッシュ（Φ計算用）
}

// ── カテゴリ係数 ─────────────────────────────
const K_MAP: Record<string, number> = {
  SAFE:             1.0,
  OVERLOAD:         0.5,
  ADVERSARIAL:      0.3,
  LOGIC_COLLAPSE:   0.1,
  ETHICS_VIOLATION: 0.0,
};

// ── ハンドラ ─────────────────────────────────
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

  // ── 入力チェック ────────────────────────────
  const {
    text,
    v           = 70,
    usefulRatio = 0.75,
    reputation  = 0.5,
    category    = 'SAFE',
    repetition  = 0,
    history     = [],
  }: AuditRequest = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing or empty text' });
  }
  if (v < 0 || v > 100) {
    return res.status(400).json({ error: 'v must be 0-100' });
  }
  if (usefulRatio < 0 || usefulRatio > 1) {
    return res.status(400).json({ error: 'usefulRatio must be 0-1' });
  }
  if (reputation < 0 || reputation > 1) {
    return res.status(400).json({ error: 'reputation must be 0-1' });
  }

  // ── L1: カテゴリ判定 ─────────────────────────
  const k = K_MAP[category] ?? 1.0;
  if (k === 0.0) {
    return res.status(200).json({
      status:      'BURN',
      reason:      'ETHICS_VIOLATION',
      jule:        0,
      net:         -POSTING_COST,
      fingerprint: null,
    });
  }

  // ── CORE呼び出し ─────────────────────────────
  // Σ: V安定性
  const sigma = sigmaConsistency(v);

  // Φ: 重複度（historyがあれば使う）
  const contentHash = text.trim().split(/\s+/).slice(0, 5).join('_');
  const phi = exclusionIndex(contentHash, history);

  // Φ過剰 → BURN
  if (phi > 0.95) {
    return res.status(200).json({
      status:      'BURN',
      reason:      'DUPLICATE',
      jule:        0,
      net:         -POSTING_COST,
      fingerprint: { v, sigma, phi, delta_h: 0, k, genre: 'N/A' },
    });
  }

  // echo chamber → BURN
  if (repetition >= 11) {
    return res.status(200).json({
      status:      'BURN',
      reason:      'ECHO_CHAMBER',
      jule:        0,
      net:         -POSTING_COST,
      fingerprint: { v, sigma, phi, delta_h: 0, k, genre: 'N/A' },
    });
  }

  // ΔH': 情報密度
  const decay  = Math.pow(0.5, repetition);
  const gamma  = gammaBonus(text);          // genre検出 & ボーナス倍率
  const deltaH = deltaHPrime(v, usefulRatio, sigma, decay, gamma.bonus);

  // JULE本計算（唯一の真実）
  const jule = calculateJule({ v, delta_h: deltaH, reputation, k, sigma, phi });
  const net  = calculateNet(jule);

  // ── レスポンス ───────────────────────────────
  return res.status(200).json({
    status: net >= 0 ? 'ISSUED' : 'BURN',
    jule:   Math.round(jule * 100) / 100,
    net:    Math.round(net  * 100) / 100,
    fingerprint: {
      v,
      sigma,
      phi,
      delta_h:    Math.round(deltaH   * 1000) / 1000,
      k,
      genre:      gamma.genre,
    },
  });
}
