export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toISODateTime(date: Date): string {
  return date.toISOString();
}
