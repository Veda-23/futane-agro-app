import { Injectable } from '@angular/core';

export interface FilterCriteria {
  searchTerm: string;
  preset: string; // 'today', 'yesterday', 'this_week', 'this_month', 'last_month', 'current_fy', 'custom'
  fromDate: string;
  toDate: string;
  partyId: string;
  crateType: string;
  status: string;
  shift: string;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class DataFilterService {

  getDefaultCriteria(): FilterCriteria {
    return {
      searchTerm: '',
      preset: 'this_month',
      fromDate: this.getFirstDayOfMonth(),
      toDate: this.getTodayDate(),
      partyId: '',
      crateType: '',
      status: '',
      shift: '',
      page: 1,
      pageSize: 25
    };
  }

  // Calculate Quick Date Presets
  applyPreset(preset: string): { fromDate: string; toDate: string } {
    const now = new Date();
    const today = this.formatDate(now);

    switch (preset) {
      case 'today':
        return { fromDate: today, toDate: today };

      case 'yesterday': {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yStr = this.formatDate(y);
        return { fromDate: yStr, toDate: yStr };
      }

      case 'this_week': {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        return { fromDate: this.formatDate(monday), toDate: today };
      }

      case 'this_month':
        return { fromDate: this.getFirstDayOfMonth(), toDate: today };

      case 'last_month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return { fromDate: this.formatDate(firstDay), toDate: this.formatDate(lastDay) };
      }

      case 'current_fy': {
        // Indian Financial Year: April 1 to March 31
        const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        const fyStart = new Date(fyStartYear, 3, 1);
        const fyEnd = new Date(fyStartYear + 1, 2, 31);
        return { fromDate: this.formatDate(fyStart), toDate: this.formatDate(fyEnd) };
      }

      default:
        return { fromDate: '', toDate: '' };
    }
  }

  // Filter Array in Memory (Client-Side Big-Data Handler)
  filterRecords(data: any[], criteria: FilterCriteria): { paginated: any[]; totalCount: number; totals: any } {
    if (!data) return { paginated: [], totalCount: 0, totals: {} };

    let filtered = [...data];

    // 1. Date Range
    if (criteria.fromDate) {
      filtered = filtered.filter(item => {
        const dateStr = item.date || item.createdAt || item.paymentDate || item.transferDate;
        return dateStr ? new Date(dateStr) >= new Date(criteria.fromDate) : true;
      });
    }
    if (criteria.toDate) {
      filtered = filtered.filter(item => {
        const dateStr = item.date || item.createdAt || item.paymentDate || item.transferDate;
        return dateStr ? new Date(dateStr) <= new Date(criteria.toDate + 'T23:59:59') : true;
      });
    }

    // 2. Party / Customer ID
    if (criteria.partyId) {
      filtered = filtered.filter(item => item.party?.id === criteria.partyId || item.partyId === criteria.partyId);
    }

    // 3. Crate / Material Type
    if (criteria.crateType) {
      filtered = filtered.filter(item => (item.crateType || item.materialName || '').toLowerCase() === criteria.crateType.toLowerCase());
    }

    // 4. Shift
    if (criteria.shift) {
      filtered = filtered.filter(item => item.shift === criteria.shift);
    }

    // 5. Full-text Search
    if (criteria.searchTerm && criteria.searchTerm.trim()) {
      const q = criteria.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item => {
        return JSON.stringify(item).toLowerCase().includes(q);
      });
    }

    // Calculate Aggregations
    const totals = {
      count: filtered.length,
      totalAmount: filtered.reduce((sum, item) => sum + (item.totalAmount || item.amountReceived || item.amount || item.rent || item.salaryAmount || 0), 0),
      totalQuantity: filtered.reduce((sum, item) => sum + (item.quantity || item.totalProduction || item.weight || 0), 0)
    };

    // 6. Pagination Slice
    const startIndex = (criteria.page - 1) * criteria.pageSize;
    const paginated = criteria.pageSize === -1 ? filtered : filtered.slice(startIndex, startIndex + criteria.pageSize);

    return { paginated, totalCount: filtered.length, totals };
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTodayDate(): string {
    return this.formatDate(new Date());
  }

  private getFirstDayOfMonth(): string {
    const now = new Date();
    return this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }
}
