// ─────────────────────────────────────────────
// Jule Type Definitions
// This is a fragment of Pandora Theory.
// ─────────────────────────────────────────────


// ── Genre Axis (6th axis) ─────────────────────
export type JuleGenre =
  | 'PHYSICS'       // 物理・宇宙論
  | 'MATH'          // 数学・証明
  | 'AI_SAFETY'     // AI安全・倫理
  | 'ECONOMICS'     // 経済・トークン設計
  | 'CONSCIOUSNESS' // 意識・哲学
  | 'ENGINEERING'   // 実装・コード
  | 'CROSS'         // ジャンル横断（ボーナス）
  | 'OTHER';        // 未分類

// Genre repetition tracking
export interface GenreRepetitionMap {
  [userId: string]: {
    [genre: string]: {
      [fingerprintBucket: string]: number;
    };
  };
}

// Repetition decay result
export interface DecayResult {
  repetition_count: number;
  decay_factor:     number;  // (1/2)^count
  delta_h_effective: number; // ΔH' × decay_factor
  is_echo_chamber:  boolean; // count >= 11
}

// ── 6-Axis Information Fingerprint ───────────
export interface JuleAuditFingerprint {
  v_score:           number;    // 論理硬度         (0-100)
  delta_h_prime:     number;    // エネルギー拡張新規性 (0-1)
  k_reality:         number;    // 接地力           (0-1)
  sigma_singularity: number;    // 認知的特異性      (0-1)
  phi_inertia:       number;    // 位相慣性          (0-1)
  gamma_genre:       JuleGenre; // ジャンル軸 ★NEW (6th axis)
  delta_h_effective: number;    // 減衰後ΔH' (decay applied)
  repetition_count:  number;    // 同ジャンル×指紋の連投回数
}

// ── L2 Evaluation from AI engines ────────────
export interface L2Evaluation {
  ai_id:       string;       // "claude" | "chatgpt" | "gemini" | "grok"
  v_score:     number;       // 0-100
  delta_h_raw: number;       // 0-1
  burn_reason: string | null;
  reason:      string;
  token_count: number;       // total tokens generated
  useful_ratio: number;      // useful_tokens / total_tokens (0-1)
}

// ── Audit Result ──────────────────────────────
export type AuditStatus = "ISSUED" | "BURN" | "THRESHOLD_BURN";

export interface AuditResult {
  transmission_id: string;
  status:          AuditStatus;
  jule:            number;
  net:             number;            // jule - POSTING_COST
  fingerprint:     JuleAuditFingerprint;
  burn_reason:     string | null;
  energy_saved:    number;            // normalized units (→ kWh in Phase 3)
  timestamp:       number;
}

// ── Audit Log Entry (for persistence) ────────
export interface AuditLogEntry {
  transmission_id:  string;
  raw_content_hash: string;           // SHA-256 of content
  fingerprint:      JuleAuditFingerprint;
  jule_issued:      number;
  burn_reason:      string | null;
  energy_saved:     number;
  timestamp:        number;
  hmac_signature?:  string;           // set by PandoraTruthGate adapter
}

// ── User Asset ────────────────────────────────
export interface JuleAsset {
  user_id:                 string;
  total_jule:              number;
  reputation_score:        number;    // R (0-1)
  entropy_reduction_total: number;    // cumulative ΔH'
  energy_saved_total:      number;    // cumulative energy_saved
  last_updated:            number;
}

// ── Jule Constants (abstracted) ───────────────
// Specific values are derived from Pandora Theory.
// They are injected via environment variables in production.
export interface JuleConstants {
  POSTING_COST:    number;   // default: 10
  J_MAX:           number;   // default: 100
  THRESHOLD_G:     number;   // θ_sat — from Pandora Theory (undisclosed)
  PHI_BURN_LIMIT:  number;   // default: 0.95
  PHI_WARN_LIMIT:  number;   // default: 0.70
  LAMBDA_INERTIA:  number;   // default: 3.0
  REPUTATION_ALPHA:number;   // EMA smoothing, default: 0.1
}

// ── AspidosAI Adapter Interface ───────────────
// Implemented by aspidos-ai (separate project)
export interface IAspidosAIAdapter {
  evaluateCategory(content: string): Promise<{
    category: string;
    k:        number;
    reason:   string | null;
  }>;
  signEntry(entry: AuditLogEntry): AuditLogEntry;
  verifyEntry(entry: AuditLogEntry): boolean;
  pushTelemetry(entry: AuditLogEntry): void;
}
