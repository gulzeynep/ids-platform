import { describe, expect, it } from 'vitest';
import { getAlertTitle } from './alertTitles';

describe('getAlertTitle', () => {
  it('prefers signature messages and avoids duplicate severity prefixes', () => {
    expect(
      getAlertTitle({
        type: 'Fallback',
        severity: 'critical',
        payload_preview: '[Generic]',
        signature_msg: 'Critical: Shadow File Access',
      }),
    ).toBe('Critical: Shadow File Access');
  });

  it('normalizes common IDS payload labels', () => {
    expect(
      getAlertTitle({
        type: 'Path Traversal',
        severity: 'high',
        payload_preview: '[LOCAL-OFFICIAL-/etc/passwd probe]',
        signature_msg: null,
      }),
    ).toBe('High: Password File Access');
  });
});
