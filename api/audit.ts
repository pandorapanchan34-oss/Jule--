// ─────────────────────────────────────────────
// api/audit.ts  ── ルール管理者
// 入力チェック → CORE呼び出し → 結果返却
// ─────────────────────────────────────────────
export const config = { runtime: 'nodejs' };

import { buildFingerprint6 }           from '../src/fingerprint/fingerprint6';
import { calculateJule, calculateNet } from '../src/core/jule-calculator';

const POSTING_COST = 10;

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
  } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim())
    return res.status(400).json({ error: 'Missing or empty text' });
  if (v < 0 || v > 100)
    return res.status(400).json({ error: 'v must be 0-100' });
  if (usefulRatio < 0 || usefulRatio > 1)
    return res.status(400).json({ error: 'usefulRatio must be 0-1' });
  if (reputation < 0 || reputation > 1)
    return res.status(400).json({ error: 'reputation must be 0-1' });

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

  // ── fingerprint6 で6軸計算（唯一の真実）──────
  const fp = buildFingerprint6({
    text,
    v,
    usefulRatio,
    k,
    historyHashes: Array.isArray(history) ? history : [],
    repetition,
  });

  // Φ過剰 → BURN
  if (fp.phi_inertia > 0.95) {
    return res.status(200).json({
      status:      'BURN',
      reason:      'DUPLICATE',
      jule:        0,
      net:         -POSTING_COST,
      fingerprint: fp,
    });
  }

  // Echo chamber → BURN
  if (repetition >= 11) {
    return res.status(200).json({
      status:      'BURN',
      reason:      'ECHO_CHAMBER',
      jule:        0,
      net:         -POSTING_COST,
      fingerprint: fp,
    });
  }

  // ── JULE計算（jule-calculator.tsに委譲）──────
  const jule = calculateJule({
    v,
    delta_h:    fp.delta_h_effective,  // 減衰・genreBonus済みの値
    reputation,
    k,
    sigma:      fp.sigma_singularity,
    phi:        fp.phi_inertia,
  });
  const net = calculateNet(jule);

  // ── レスポンス ───────────────────────────────
  return res.status(200).json({
    status: net >= 0 ? 'ISSUED' : 'BURN',
    jule:   Math.round(jule * 100) / 100,
    net:    Math.round(net  * 100) / 100,
    fingerprint: {
      v:       fp.v_score,
      sigma:   fp.sigma_singularity,
      phi:     fp.phi_inertia,
      delta_h: Math.round(fp.delta_h_effective * 1000) / 1000,
      k,
      genre:   fp.gamma_genre,
    },
  });
}
