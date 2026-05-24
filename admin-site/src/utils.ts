export function formatKs(price: number): string {
  return `${new Intl.NumberFormat('en-US').format(price)} Ks`;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export function isContactUrlValid(type: string, url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (type === 'facebook') return ['http:', 'https:'].includes(parsed.protocol) && (host.includes('facebook.com') || host.includes('fb.com') || host.includes('m.me'));
    if (type === 'tiktok') return ['http:', 'https:'].includes(parsed.protocol) && host.includes('tiktok.com');
    if (type === 'telegram') return parsed.protocol === 'tg:' || (['http:', 'https:'].includes(parsed.protocol) && (host.includes('t.me') || host.includes('telegram.me')));
    if (type === 'viber') return parsed.protocol === 'viber:' || ['http:', 'https:'].includes(parsed.protocol);
    return false;
  } catch {
    return false;
  }
}
