import { Pipe, PipeTransform } from '@angular/core';
import { TerminologyService, TerminologyDictionary } from '../services/terminology.service';

/**
 * Multi-Tenant Dynamic Terminology Transformer (`term`).
 *
 * Impure Angular pipe (`pure: false`) that translates generic terminology keys
 * into tenant-specific business domain terms dynamically (e.g. 'crate' -> 'fabric_roll' in Textiles,
 * or 'crate' -> 'milk_can' in Dairy).
 */
@Pipe({
  name: 'term',
  standalone: true,
  pure: false // impure to react immediately to dynamic changes
})
export class TermPipe implements PipeTransform {
  constructor(private terminologyService: TerminologyService) {}

  transform(key: keyof TerminologyDictionary): string {
    return this.terminologyService.get(key);
  }
}
