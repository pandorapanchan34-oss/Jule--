import type { VercelRequest, VercelResponse } from '@vercel/node';

const POSTING_COST = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, v, usefulRatio, k, repetition } = req.body;

  if (!text || v === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 6軸計算
  const vScores  = [v, Math.max(0, v-8), Math.min(100, v+5)];
  const mean     = vScores.reduce((a,b)=>a+b,0) / vScores.length;
  const variance = vScores.reduce((a,b)=>a+(b-mean)**2,0) / vScores.length;
  const sigma    = Math.exp(-variance / 100);

  const deltaH   = (v/100) * (usefulRatio||0.75) * sigma * (k||1.0);
  const decay    = Math.pow(0.5, repetition||0);
  const deltaHEff= deltaH * decay;

  const jule     = Math.min(100, Math.tanh(v/50) * deltaHEff * 100);
  const net      = jule - POSTING_COST;
  const status   = net >= 0 ? 'ISSUED' : 'BURN';

  return res.status(200).json({
    status,
    jule:   Math.round(jule * 100) / 100,
    net:    Math.round(net  * 100) / 100,
    fingerprint: {
      v_score:           v,
      sigma_singularity: sigma,
      delta_h_prime:     deltaH,
      delta_h_effective: deltaHEff,
      repetition_count:  repetition || 0,
    }
  });
}
