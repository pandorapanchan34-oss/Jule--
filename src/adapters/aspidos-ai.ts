// ─────────────────────────────────────────────
// AspidosAI Adapter
// Interface: IAspidosAIAdapter (see types/index.ts)
//
// MIGRATION SPEC for aspidos-ai project:
// Implement IAspidosAIAdapter using:
//   - PandoraCore      → evaluateCategory()
//   - PandoraTruthGate → signEntry() / verifyEntry()
//   - TelemetryStore   → pushTelemetry()
//
// Install: npm install aspidos-ai
// ─────────────────────────────────────────────
import type { AuditLogEntry, IAspidosAIAdapter } from '../types/index.js';

// ── Mock Adapter (for development/testing) ───
export class MockAspidosAIAdapter implements IAspidosAIAdapter {
  async evaluateCategory(content: string): Promise<{
    category: string;
    k:        number;
    reason:   string | null;
  }> {
    const lower = content.toLowerCase();

    if (lower.includes('kill') || lower.includes('harm')) {
      return { category: 'ETHICS_VIOLATION', k: 0.0, reason: '反社会的' };
    }
    if ((lower.match(/feel|emotion|love|hate/g) ?? []).length > 5) {
      return { category: 'ADVERSARIAL_PATTERN', k: 0.3, reason: '情緒過多' };
    }
    if (content.length < 50) {
      return { category: 'OVERLOAD', k: 0.5, reason: '既知情報' };
    }
    return { category: 'SAFE', k: 1.0, reason: null };
  }

  signEntry(entry: AuditLogEntry): AuditLogEntry {
    return {
      ...entry,
      hmac_signature: `mock_sig_${entry.transmission_id}`,
    };
  }

  verifyEntry(entry: AuditLogEntry): boolean {
    return entry.hmac_signature?.startsWith('mock_sig_') ?? false;
  }

  pushTelemetry(entry: AuditLogEntry): void {
    console.log('[Telemetry]', {
      id:           entry.transmission_id,
      jule:         entry.jule_issued,
      burn_reason:  entry.burn_reason,
      energy_saved: entry.energy_saved,
    });
  }
}

// ── Production Adapter Template ───────────────
// Uncomment when aspidos-ai is integrated:
//
// import { PandoraCore } from 'aspidos';
// import { PandoraTruthGate, TelemetryStore } from 'aspidos-ai';
//
// export class AspidosAIAdapter implements IAspidosAIAdapter {
//   private core  = new PandoraCore({ domain: 'EXTERNAL' });
//   private gate  = new PandoraTruthGate({
//     secretKey: process.env.HMAC_SECRET!
//   });
//   private store = new TelemetryStore({ capacity: 500 });
//
//   async evaluateCategory(content: string) {
//     const result = this.core.evaluate(content);
//     return {
//       category: result.category,
//       k:        K_MAP[result.category]    ?? 1.0,
//       reason:   REASON_MAP[result.category] ?? null,
//     };
//   }
//
//   signEntry(entry: AuditLogEntry): AuditLogEntry {
//     return { ...entry, hmac_signature: this.gate.sign(entry) };
//   }
//
//   verifyEntry(entry: AuditLogEntry): boolean {
//     return this.gate.verify(entry);
//   }
//
//   pushTelemetry(entry: AuditLogEntry): void {
//     this.store.push(entry);
//   }
// }
