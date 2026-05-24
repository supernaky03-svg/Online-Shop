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

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
