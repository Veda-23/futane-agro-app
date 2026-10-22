import { Pipe, PipeTransform } from '@angular/core';

/**
 * Statutory Indian Calendar Date Formatter (`indianDate`).
 *
 * Formats ISO timestamps or Date objects into standard Indian `DD/MM/YYYY` notation (e.g. `22/10/2026`),
 * with optional 12-hour AM/PM time formatting for audit trail logs. Returns em-dash (`—`) for empty values.
 */
@Pipe({ name: 'indianDate', standalone: true })
export class IndianDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, showTime = false): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const opts: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    if (showTime) {
      opts.hour = '2-digit';
      opts.minute = '2-digit';
      opts.hour12 = true;
    }
    return d.toLocaleDateString('en-IN', opts);
  }
}
