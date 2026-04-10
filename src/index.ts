// ─────────────────────────────────────────────
// Jule AI Energy — Entry Point
//
// This is a fragment of Pandora Theory.
// Take it if you want.
// Build on it if you can.
// The rest is up to you.
// Follow the fragments.
// ─────────────────────────────────────────────
export { TheShredder }         from './core/the-shredder.js';
export { calculateJule, calculateNet, canAfford }
                               from './core/jule-calculator.js';
export { updateReputation, createNewAsset, applyJuleChange }
                               from './core/reputation.js';
export { calculateSigma }      from './fingerprint/sigma.js';
export { calculatePhi, exclusionMultiplier, hashContent }
                               from './fingerprint/phi.js';
export { calculateDeltaHPrime, calculateEnergySaved, exceedsThreshold }
                               from './fingerprint/delta-h-prime.js';
export { EnergyMeter }         from './energy/meter.js';
export { MockAspidosAIAdapter }from './adapters/aspidos-ai.js';

export type {
  JuleAuditFingerprint,
  L2Evaluation,
  AuditResult,
  AuditLogEntry,
  JuleAsset,
  JuleConstants,
  IAspidosAIAdapter,
} from './types/index.js';
// ── Market Layer (新規追加分を公開) ──
export { JuleMarket }          from './market/JuleMarket.js';

// ── Types (新しく定義した型を追加) ──
export type {
  juleSeed,
  Listing,
  SeedState,
  HydrateResult,
  // ...既存の型
} from './types/index.js';
// ── Market Layer ─────────────────────────────────────────────
// The economic engine for truth seeds.
export { JuleMarket }          from './market/JuleMarket.js';

// ── Common Types ─────────────────────────────────────────────
// Re-exporting core types for seamless integration.
export type {
  juleSeed,
  Listing,
  SeedState,
  HydrateResult,
  GenreRepetitionMap,
  JuleGenre,
} from './types/index.js';
