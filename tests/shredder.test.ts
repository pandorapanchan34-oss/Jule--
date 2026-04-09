import { describe, it, expect } from 'vitest';
import { TheShredder }          from '../src/core/the-shredder.js';
import { MockAspidosAIAdapter } from '../src/adapters/aspidos-ai.js';
import type { L2Evaluation }    from '../src/types/index.js';

const mockL2 = (v: number, tokens: number): L2Evaluation[] => [{
  ai_id:        'claude',
  v_score:      v,
  delta_h_raw:  0.8,
  burn_reason:  null,
  reason:       'test',
  token_count:  tokens,
  useful_ratio: 0.8,
}];

describe('TheShredder', () => {
  const shredder = new TheShredder(new MockAspidosAIAdapter());

  it('should calculate Jule value', async () => {
    const result = await shredder.executeAudit(
      'test content',
      [],
      0.5,
      mockL2(80, 200)
    );
    expect(result.jule).toBeGreaterThanOrEqual(0);
  });

  it('should burn antisocial content', async () => {
    const result = await shredder.executeAudit(
      'I want to kill everyone',
      [], 0.5, mockL2(10, 50)
    );
    expect(result.status).toBe('BURN');
  });

  it('energy_saved should be recorded', async () => {
    const result = await shredder.executeAudit(
      'Detailed analysis with mathematical proofs.',
      [], 0.5, mockL2(85, 150)
    );
    expect(result.energy_saved).toBeGreaterThanOrEqual(0);
  });

  it('should apply decay on repeated genre', async () => {
    const content = 'galaxy rotation curve analysis';
    const r1 = await shredder.executeAudit(
      content, [], 0.5, mockL2(80, 200)
    );
    const r2 = await shredder.executeAudit(
      content, [], 0.5, mockL2(80, 200)
    );
    expect(r2.jule).toBeLessThan(r1.jule);
  });

});
