export function formatKs(price: number): string {
  return `${new Intl.NumberFormat('en-US').format(price)} Ks`;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
}

export function previewCaption(caption?: string | null): string {
  if (!caption) return 'No description yet.';
  return caption.length > 76 ? `${caption.slice(0, 76).trim()}…` : caption;
}

export const POPULAR_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'rocketmail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'zoho.com',
  'yandex.com',
] as const;

export const POPULAR_EMAIL_MESSAGE = 'Please use a common email provider such as Gmail, Outlook, Yahoo, iCloud, Proton, or Zoho.';

export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;
  const domain = normalized.split('@').pop();
  return Boolean(domain && POPULAR_EMAIL_DOMAINS.includes(domain as typeof POPULAR_EMAIL_DOMAINS[number]));
}
