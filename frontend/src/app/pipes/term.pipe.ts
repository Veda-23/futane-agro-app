import { Pipe, PipeTransform } from '@angular/core';
import { TerminologyService, TerminologyDictionary } from '../services/terminology.service';

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
