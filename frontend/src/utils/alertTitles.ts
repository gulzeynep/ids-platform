import type { Alert } from '../types';

const formatSignatureTitle = (severity: string, signature: string): string => {
  const cleaned = signature.trim();
  if (/^(critical|high|medium|low)\s*:/i.test(cleaned)) return cleaned;
  return `${severity.charAt(0).toUpperCase()}${severity.slice(1)}: ${cleaned}`;
};

export const getAlertTitle = (
  alert: Pick<Alert, 'title' | 'type' | 'severity' | 'payload_preview' | 'signature_msg'>
): string => {
  if (alert.signature_msg) return formatSignatureTitle(alert.severity, alert.signature_msg);
  if (alert.title) return alert.title;

  const raw = alert.payload_preview?.match(/^\[([^\]]+)\]/)?.[1] || alert.type;
  const normalized = raw.replace('LOCAL-OFFICIAL-', '').trim();
  const lower = normalized.toLowerCase();

  let name = normalized;
  if (lower.includes('shadow') || lower.includes('/etc/shadow')) name = 'Shadow File Access';
  else if (lower.includes('passwd')) name = 'Password File Access';
  else if (lower.includes('http request by ipv4')) name = 'Direct IP HTTP Request';
  else if (lower.includes('union select') || lower.includes('sql')) name = 'SQL Injection Probe';
  else if (lower.includes('script tag') || lower.includes('cross-site') || lower.includes('xss')) name = 'Cross-Site Scripting Attempt';
  else if (lower.includes('acunetix')) name = 'Acunetix Scanner Probe';
  else if (lower.includes('.env') || lower.includes('environment file')) name = 'Environment File Disclosure';
  else if (lower.includes('wp-config')) name = 'WordPress Config Disclosure';
  else if (lower.includes('jndi') || lower.includes('log4shell')) name = 'Log4Shell JNDI Probe';

  return `${alert.severity.charAt(0).toUpperCase()}${alert.severity.slice(1)}: ${name}`;
};
