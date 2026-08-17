import { Pipe, PipeTransform } from '@angular/core';

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
