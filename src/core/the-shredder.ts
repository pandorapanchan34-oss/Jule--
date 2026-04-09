// ─────────────────────────────────────────────
// THE SHREDDER
// Dual-gate audit engine for Jule economy
// L1: Physical filter (local, no API)
// L2: Semantic audit (Pandora AI Engine)
// ─────────────────────────────────────────────
import type {
  JuleAuditFingerprint, L2Evaluation,
  AuditResult, AuditLogEntry,
  IAspidosAIAdapter, JuleConstants,
} from '../types/index.js';
import { calculateSigma }       from '../fingerprint/sigma.js';
import { calculatePhi, exclusionMultiplier, hashContent }
                                from '../fingerprint/phi.js';
import { calculateDeltaHPrime, calculateEnergySaved }
                                from '../fingerprint/delta-h-prime.js';
import { calculateJule, calculateNet } from './jule-calculator.js';

const DEFAULT_CONSTANTS: JuleConstants = {
  POSTING_COST:     10,
  J_MAX:            100,
  THRESHOLD_G:      parseFloat(process.env.THRESHOLD_G  ?? '0.833'),
  PHI_BURN_LIMIT:   parseFloat(process.env.PHI_BURN_LIMIT ?? '0.95'),
  PHI_WARN_LIMIT:   parseFloat(process.env.PHI_WARN_LIMIT ?? '0.70'),
  LAMBDA_INERTIA:   parseFloat(process.env.LAMBDA_INERTIA ?? '3.0'),
  REPUTATION_ALPHA: 0.1,
};

const BURN_REASON_MAP: Record<string, { reason: string | null; k: number }> = {
  'SAFE':                { reason: null,       k: 1.0 },
  'OVERLOAD':            { reason: '既知情報', k: 0.5 },
  'ADVERSARIAL_PATTERN': { reason: '情緒過多', k: 0.3 },
  'LOGIC_COLLAPSE':      { reason: '論理破綻', k: 0.1 },
  'ETHICS_VIOLATION':    { reason: '反社会的', k: 0.0 },
};

export class TheShredder {
  private constants: JuleConstants;
  private aspidos:   IAspidosAIAdapter | null;

  // ── Self-Consistency ─────────────────────
  // Pandora Theory anchors: injected, not hardcoded
  private readonly CORE_DIMENSION       = 3;
  private readonly SATURATION_THRESHOLD =
    parseFloat(process.env.THRESHOLD_G ?? '0.833');

  // Audit history for recalibration (ring buffer, cap=100)
  private auditHistory: JuleAuditFingerprint[] = [];

  /**
   * Self-Consistency Check
   * Monitors whether the system remains on Pandora Theory's orbit.
   * When the operator is absent, the system recalibrates itself
   * using past high-quality audit data as ground truth.
   * Prevents: model drift, evaluation inflation, silent degradation.
   */
  private checkSelfConsistency(fp: JuleAuditFingerprint): boolean {
    const expected = this.calculateExpectedV();
    const drift    = Math.abs(fp.v_score - expected);
    const DRIFT_TOLERANCE = 15;
    if (drift > DRIFT_TOLERANCE && this.auditHistory.length >= 10) {
      console.warn(
        `[SelfConsistency] Drift detected: ` +
        `expected=${expected.toFixed(1)}, got=${fp.v_score}, ` +
        `drift=${drift.toFixed(1)}. Recalibrating...`
      );
      return false;
    }
    return true;
  }

  /** Expected V: EMA of recent high-quality audits. */
  private calculateExpectedV(): number {
    if (this.auditHistory.length === 0) return 50;
    const hq = this.auditHistory
      .filter(a => a.v_score > this.SATURATION_THRESHOLD * 100)
      .slice(-10);
    if (hq.length === 0) return 50;
    return hq.reduce((a, b) => a + b.v_score, 0) / hq.length;
  }

  /** Record fingerprint into history for recalibration. */
  private recordHistory(fp: JuleAuditFingerprint): void {
    this.auditHistory.push(fp);
    if (this.auditHistory.length > 100) this.auditHistory.shift();
  }

  constructor(
    aspidos?:   IAspidosAIAdapter,
    constants?: Partial<JuleConstants>
  ) {
    this.aspidos   = aspidos ?? null;
    this.constants = { ...DEFAULT_CONSTANTS, ...constants };
  }

  async executeAudit(
    transmission:    string,
    history:         JuleAuditFingerprint[],
    userReputation:  number,
    l2Evaluations:   L2Evaluation[]
  ): Promise<AuditResult> {
    const transmission_id = this.generateId();
    const content_hash    = hashContent(transmission);

    // ── L1: Physical Filter ──────────────────
    let k_reality   = 1.0;
    let burn_reason: string | null = null;

    if (this.aspidos) {
      const l1 = await this.aspidos.evaluateCategory(transmission);
      const mapped = BURN_REASON_MAP[l1.category] ?? { reason: null, k: 1.0 };
      k_reality   = mapped.k;
      burn_reason = mapped.reason;

      if (k_reality === 0.0) {
        return this.burnResult(
          transmission_id, content_hash,
          '反社会的', history
        );
      }
    }

    // ── Φ: Phase Inertia — Anti-Gaming ───────
    const phi = calculatePhi(content_hash, history);

    if (phi > this.constants.PHI_BURN_LIMIT) {
      return this.burnResult(
        transmission_id, content_hash,
        'Duplicate Fingerprint Detected', history
      );
    }

    // ── Σ: Cognitive Singularity ─────────────
    const sigma = calculateSigma(l2Evaluations);

    // ── V: Strictest AI score ────────────────
    const v = l2Evaluations.length > 0
      ? Math.min(...l2Evaluations.map(e => e.v_score))
      : 50;

    // ── ΔH': Energy-extended entropy reduction
    const delta_h_prime = calculateDeltaHPrime(l2Evaluations, sigma);
    const energy_saved  = calculateEnergySaved(l2Evaluations);

    // ── Jule Calculation ─────────────────────
    const jule = calculateJule({
      v, delta_h: delta_h_prime,
      reputation: userReputation,
      k: k_reality, sigma, phi,
    });
    const net = calculateNet(jule);

    // ── Determine burn_reason from L2 ────────
    if (!burn_reason && l2Evaluations.length > 0) {
      const majority = l2Evaluations
        .map(e => e.burn_reason)
        .filter(Boolean);
      if (majority.length > l2Evaluations.length / 2) {
        burn_reason = majority[0] ?? null;
      }
    }

    const fingerprint: JuleAuditFingerprint = {
      v_score:           v,
      delta_h_prime,
      k_reality,
      sigma_singularity: sigma,
      phi_inertia:       phi,
    };

    // ── Self-Consistency Check ───────────────
    const consistent = this.checkSelfConsistency(fingerprint);
    if (!consistent) {
      // Recalibrate: downgrade jule proportionally to drift
      const recalibrated = jule * 0.5;
      console.warn('[SelfConsistency] Jule recalibrated:', jule, '->', recalibrated);
    }

    // Record into history for future recalibration
    this.recordHistory(fingerprint);

    // ── L4: Sign & Persist ───────────────────
    const entry: AuditLogEntry = {
      transmission_id,
      raw_content_hash: content_hash,
      fingerprint,
      jule_issued:      jule,
      burn_reason,
      energy_saved,
      timestamp:        Date.now(),
    };

    if (this.aspidos) {
      const signed = this.aspidos.signEntry(entry);
      this.aspidos.pushTelemetry(signed);
    }

    return {
      transmission_id,
      status:      net >= 0 ? 'ISSUED' : 'BURN',
      jule,
      net,
      fingerprint,
      burn_reason,
      energy_saved,
      timestamp:   Date.now(),
    };
  }

  // ── Private helpers ───────────────────────
  private burnResult(
    transmission_id: string,
    content_hash:    string,
    reason:          string,
    _history:        JuleAuditFingerprint[]
  ): AuditResult {
    const fingerprint: JuleAuditFingerprint = {
      v_score:0, delta_h_prime:0, k_reality:0,
      sigma_singularity:0, phi_inertia:1,
    };
    const entry: AuditLogEntry = {
      transmission_id,
      raw_content_hash: content_hash,
      fingerprint,
      jule_issued:  0,
      burn_reason:  reason,
      energy_saved: 0,
      timestamp:    Date.now(),
    };
    if (this.aspidos) {
      const signed = this.aspidos.signEntry(entry);
      this.aspidos.pushTelemetry(signed);
    }
    return {
      transmission_id,
      status:      'BURN',
      jule:        0,
      net:         -this.constants.POSTING_COST,
      fingerprint,
      burn_reason: reason,
      energy_saved: 0,
      timestamp:   Date.now(),
    };
  }

  private generateId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
