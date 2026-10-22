import { Pipe, PipeTransform } from '@angular/core';

/**
 * Indian Rupee Financial Currency Formatter (`inr`).
 *
 * Formats numbers into standardized Indian Rupee notation (Lakhs and Crores e.g. `₹1,25,000.00`)
 * with strictly two decimal places and `en-IN` grouping separators. Returns em-dash (`—`) for nil values.
 */
@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || isNaN(Number(value))) return '—';
    return '₹' + Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
