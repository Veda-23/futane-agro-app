import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() items: any[] = [];
  @Input() bindLabel: string = 'name';
  @Input() bindValue: string = 'id';
  @Input() subLabelKey: string = '';
  @Input() placeholder: string = 'Select an option...';
  @Input() searchPlaceholder: string = 'Search...';
  @Input() disabled: boolean = false;
  @Input() allowClear: boolean = true;
  @Input() id: string = '';

  @Output() change = new EventEmitter<any>();

  @ViewChild('searchInput') searchInputElement?: ElementRef<HTMLInputElement>;

  value: any = null;
  isOpen: boolean = false;
  searchQuery: string = '';
  filteredItems: any[] = [];
  focusedIndex: number = -1;

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.updateFilteredItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.updateFilteredItems();
    }
  }

  // ControlValueAccessor implementation
  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleDropdown(event?: MouseEvent): void {
    if (this.disabled) return;
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchQuery = '';
      this.updateFilteredItems();
      this.focusedIndex = -1;
      setTimeout(() => {
        if (this.searchInputElement) {
          this.searchInputElement.nativeElement.focus();
        }
      }, 50);
    } else {
      this.onTouched();
    }
  }

  closeDropdown(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  updateFilteredItems(): void {
    if (!this.items || !Array.isArray(this.items)) {
      this.filteredItems = [];
      return;
    }

    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredItems = [...this.items];
      return;
    }

    this.filteredItems = this.items.filter(item => {
      const label = this.getItemLabel(item).toLowerCase();
      const sub = this.getItemSubLabel(item).toLowerCase();
      return label.includes(q) || sub.includes(q);
    });
  }

  onSearchInput(): void {
    this.updateFilteredItems();
    this.focusedIndex = this.filteredItems.length > 0 ? 0 : -1;
  }

  clearSearch(event: MouseEvent): void {
    event.stopPropagation();
    this.searchQuery = '';
    this.updateFilteredItems();
    if (this.searchInputElement) {
      this.searchInputElement.nativeElement.focus();
    }
  }

  selectItem(item: any, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const val = this.getItemValue(item);
    this.value = val;
    this.onChange(val);
    this.change.emit(item);
    this.closeDropdown();
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.value = null;
    this.onChange(null);
    this.change.emit(null);
  }

  getSelectedItem(): any {
    if (this.value === null || this.value === undefined || this.value === '') {
      return null;
    }
    if (!this.items || !Array.isArray(this.items)) {
      return null;
    }
    return this.items.find(item => this.getItemValue(item) === this.value) || null;
  }

  getItemLabel(item: any): string {
    if (!item) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return item[this.bindLabel] !== undefined ? String(item[this.bindLabel]) : '';
  }

  getItemSubLabel(item: any): string {
    if (!item || !this.subLabelKey) return '';
    return item[this.subLabelKey] !== undefined ? String(item[this.subLabelKey]) : '';
  }

  getItemValue(item: any): any {
    if (!item) return null;
    if (typeof item === 'string' || typeof item === 'number') return item;
    return this.bindValue && item[this.bindValue] !== undefined ? item[this.bindValue] : item;
  }

  // Keyboard navigation
  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;

    if (!this.isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.toggleDropdown();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.filteredItems.length > 0) {
        this.focusedIndex = (this.focusedIndex + 1) % this.filteredItems.length;
        this.scrollToFocused();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.filteredItems.length > 0) {
        this.focusedIndex = (this.focusedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
        this.scrollToFocused();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.focusedIndex >= 0 && this.focusedIndex < this.filteredItems.length) {
        this.selectItem(this.filteredItems[this.focusedIndex]);
      }
    }
  }

  private scrollToFocused(): void {
    setTimeout(() => {
      const listEl = this.elementRef.nativeElement.querySelector('.select-dropdown-list');
      const focusedEl = this.elementRef.nativeElement.querySelector('.select-option.focused');
      if (listEl && focusedEl) {
        const listRect = listEl.getBoundingClientRect();
        const focusedRect = focusedEl.getBoundingClientRect();
        if (focusedRect.bottom > listRect.bottom) {
          listEl.scrollTop += focusedRect.bottom - listRect.bottom;
        } else if (focusedRect.top < listRect.top) {
          listEl.scrollTop -= listRect.top - focusedRect.top;
        }
      }
    }, 10);
  }

  // Click outside to dismiss
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
