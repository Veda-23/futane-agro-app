import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TerminologyDictionary {
  appName: string;
  itemUnitSingular: string;
  itemUnitPlural: string;
  rawMaterialSingular: string;
  rawMaterialPlural: string;
  productionMachineSingular: string;
  productionMachinePlural: string;
  inventorySectionName: string;
  currencySymbol: string;
  currencyCode: string;
}

export const DEFAULT_TERMINOLOGY: TerminologyDictionary = {
  appName: 'Futane Agro ERP',
  itemUnitSingular: 'Crate',
  itemUnitPlural: 'Crates',
  rawMaterialSingular: 'Polymer Raw Material',
  rawMaterialPlural: 'Polymer Raw Materials',
  productionMachineSingular: 'Injection Molding Machine',
  productionMachinePlural: 'Injection Molding Machines',
  inventorySectionName: 'Finished Goods Crates Warehouse Stock',
  currencySymbol: '₹',
  currencyCode: 'INR'
};

export const INDUSTRY_PRESET_TERMINOLOGY: Record<string, Partial<TerminologyDictionary>> = {
  agri_plastics: {
    appName: 'Futane Agro ERP',
    itemUnitSingular: 'Crate',
    itemUnitPlural: 'Crates',
    rawMaterialSingular: 'Polymer Granule',
    rawMaterialPlural: 'Polymer Raw Materials',
    productionMachineSingular: 'Injection Molding Machine',
    productionMachinePlural: 'Injection Molding Machines',
    inventorySectionName: 'Finished Goods Crates Warehouse Stock'
  },
  textiles: {
    appName: 'Apex Textile ERP',
    itemUnitSingular: 'Fabric Roll',
    itemUnitPlural: 'Fabric Rolls',
    rawMaterialSingular: 'Yarn & Fiber',
    rawMaterialPlural: 'Yarn & Raw Fibers',
    productionMachineSingular: 'Weaving Loom',
    productionMachinePlural: 'Weaving & Spinning Looms',
    inventorySectionName: 'Finished Fabric Rolls Warehouse Stock'
  },
  food_processing: {
    appName: 'Harvest Food Processing ERP',
    itemUnitSingular: 'Case / Carton',
    itemUnitPlural: 'Cases / Cartons',
    rawMaterialSingular: 'Raw Ingredient',
    rawMaterialPlural: 'Bulk Ingredients & Produce',
    productionMachineSingular: 'Processing Line',
    productionMachinePlural: 'Processing & Packaging Lines',
    inventorySectionName: 'Packaged Goods Warehouse Stock'
  },
  electronics: {
    appName: 'CircuitTech Discrete ERP',
    itemUnitSingular: 'Unit / Module',
    itemUnitPlural: 'Units / Modules',
    rawMaterialSingular: 'Component Reel',
    rawMaterialPlural: 'Electronic Components & PCBs',
    productionMachineSingular: 'SMT Pick-and-Place',
    productionMachinePlural: 'SMT Assembly Lines',
    inventorySectionName: 'Finished Units Warehouse Stock'
  },
  general_discrete: {
    appName: 'Enterprise Discrete ERP',
    itemUnitSingular: 'Finished Unit',
    itemUnitPlural: 'Finished Units',
    rawMaterialSingular: 'Raw Material',
    rawMaterialPlural: 'Raw Materials & Parts',
    productionMachineSingular: 'Production Machine',
    productionMachinePlural: 'Production Machinery',
    inventorySectionName: 'Finished Goods Warehouse Stock'
  }
};

@Injectable({
  providedIn: 'root'
})
export class TerminologyService {
  private readonly storageKey = 'erp_tenant_terminology';
  private termSubject = new BehaviorSubject<TerminologyDictionary>(this.loadInitial());

  terms$: Observable<TerminologyDictionary> = this.termSubject.asObservable();

  constructor() {
    // Listen to storage events across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.termSubject.next(this.loadInitial());
      }
    });
  }

  get current(): TerminologyDictionary {
    return this.termSubject.value;
  }

  get(key: keyof TerminologyDictionary): string {
    return this.current[key] || DEFAULT_TERMINOLOGY[key] || '';
  }

  setDictionary(partial: Partial<TerminologyDictionary>) {
    const updated = { ...this.current, ...partial };
    this.termSubject.next(updated);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      if (partial.appName) {
        const rawCfg = localStorage.getItem('futane_tenant_config');
        const cfg = rawCfg ? JSON.parse(rawCfg) : {};
        cfg['brand.app_title'] = partial.appName;
        localStorage.setItem('futane_tenant_config', JSON.stringify(cfg));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      // safe fallback
    }
  }

  applyIndustryPreset(presetKey: string) {
    const preset = INDUSTRY_PRESET_TERMINOLOGY[presetKey];
    if (preset) {
      this.setDictionary(preset);
    }
  }

  resetToDefaults() {
    this.termSubject.next(DEFAULT_TERMINOLOGY);
    localStorage.removeItem(this.storageKey);
  }

  private loadInitial(): TerminologyDictionary {
    try {
      let savedAppName = '';
      const rawCfg = localStorage.getItem('futane_tenant_config');
      if (rawCfg) {
        const cfg = JSON.parse(rawCfg);
        if (cfg['brand.app_title']) {
          savedAppName = cfg['brand.app_title'];
        }
      }

      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const dict = { ...DEFAULT_TERMINOLOGY, ...JSON.parse(saved) };
        if (savedAppName) dict.appName = savedAppName;
        return dict;
      }

      if (savedAppName) {
        return { ...DEFAULT_TERMINOLOGY, appName: savedAppName };
      }
    } catch (e) {
      // ignore
    }
    return { ...DEFAULT_TERMINOLOGY };
  }
}
