// ─────────────────────────────────────────────
// Jule Calculator
// J = tanh(V/50) × ΔH' × R × k × f(Σ,Φ)
// ─────────────────────────────────────────────
import { exclusionMultiplier } from '../fingerprint/phi.js';

const J_MAX        = 100;
const POSTING_COST = 10;

export interface JuleComponents {
  v:            number;
  delta_h:      number;
  reputation:   number;
  k:            number;
  sigma:        number;
  phi:          number;
}

export function calculateJule(c: JuleComponents): number {
  const cost_mult   = exclusionMultiplier(c.phi);
  const f_sigma_phi = (c.sigma * (1 - c.phi)) / cost_mult;

  const raw = Math.tanh(c.v / 50)
            * c.delta_h
            * c.reputation
            * c.k
            * f_sigma_phi
            * J_MAX;

  return Math.min(J_MAX, Math.max(0, raw));
}

export function calculateNet(jule: number): number {
  return jule - POSTING_COST;
}

export function canAfford(total_jule: number): boolean {
  return total_jule >= POSTING_COST;
}
