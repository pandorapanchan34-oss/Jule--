export const config = { runtime: 'nodejs' };

const POSTING_COST = 10;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { text, v = 70, usefulRatio = 0.75, k = 1.0, repetition = 0 } = req.body || {};

  if (!text) return res.status(400).json({ error: 'Missing text' });

  const vScores  = [v, Math.max(0, v-8), Math.min(100, v+5)];
  const mean     = vScores.reduce((a,b)=>a+b,0) / 3;
  const variance = vScores.reduce((a,b)=>a+(b-mean)**2,0) / 3;
  const sigma    = Math.exp(-variance / 100);
  const deltaH   = (v/100) * usefulRatio * sigma * k;
  const decay    = Math.pow(0.5, repetition);
  const deltaHEff= deltaH * decay;
  const jule     = Math.min(100, Math.tanh(v/50) * deltaHEff * 100);
  const net      = Math.round((jule - POSTING_COST) * 100) / 100;

  return res.status(200).json({
    status: net >= 0 ? 'ISSUED' : 'BURN',
    jule:   Math.round(jule * 100) / 100,
    net,
    fingerprint: { v_score:v, sigma_singularity:sigma, delta_h_prime:deltaH, delta_h_effective:deltaHEff, repetition_count:repetition }
  });
}
