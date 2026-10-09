import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, retry, shareReplay, tap, catchError, timer } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public baseUrl: string;

  private cachedParties$?: Observable<any>;
  private cachedVendors$?: Observable<any>;
  private cachedDrivers$?: Observable<any>;
  private cachedEmployees$?: Observable<any>;
  private cachedMachines$?: Observable<any>;
  private cachedStats$?: Observable<any>;
  private cachedCharts$?: Observable<any>;
  private statsCacheTime = 0;
  private chartsCacheTime = 0;

  // Enterprise SWR In-Memory Response Cache (Amazon & Flipkart Grade)
  private dataCache = new Map<string, { data: any; timestamp: number }>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 min TTL
  private inFlightRequests = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {
    const savedBackend = localStorage.getItem('backend_url');
    // Sanitize: Purge legacy, dead :8080 or plain localhost URLs so we always rely on Angular proxy /api
    if (savedBackend && !savedBackend.includes('localhost') && !savedBackend.includes('127.0.0.1') && !savedBackend.includes(':8080') && !savedBackend.includes(':8081')) {
      let url = savedBackend.trim().replace(/\/+$/, '');
      if (!url.endsWith('/api')) {
        url += '/api';
      }
      this.baseUrl = url;
    } else {
      if (savedBackend) {
        localStorage.removeItem('backend_url');
      }
      this.baseUrl = environment.apiUrl;
    }
  }

  // Safe retry policy: Retries transient errors once after 1s, but NEVER retries 401 Unauthorized, 403 Forbidden, or 404 Not Found
  private retryPolicy(count: number = 1) {
    return retry({
      count,
      delay: (err: any) => {
        if (err && (err.status === 401 || err.status === 403 || err.status === 404)) {
          throw err;
        }
        return timer(1000);
      }
    });
  }

  /**
   * High-Performance Stale-While-Revalidate In-Memory Fetch:
   * Returns cached data immediately (0ms) if available, eliminating blank loading screens on tab changes.
   */
  public getCachedOrFetch<T = any>(url: string, forceRefresh: boolean = false, ttl: number = this.DEFAULT_CACHE_TTL): Observable<T> {
    const cached = this.dataCache.get(url);
    const now = Date.now();
    if (!forceRefresh && cached && (now - cached.timestamp < ttl)) {
      return of(cached.data as T);
    }

    if (this.inFlightRequests.has(url)) {
      return this.inFlightRequests.get(url)!;
    }

    const req$ = this.http.get<T>(url).pipe(
      this.retryPolicy(1),
      tap({
        next: (data) => {
          this.dataCache.set(url, { data, timestamp: Date.now() });
        },
        complete: () => {
          this.inFlightRequests.delete(url);
        },
        error: () => {
          this.inFlightRequests.delete(url);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.inFlightRequests.set(url, req$);
    return req$;
  }

  public dedupeGet<T = any>(url: string, forceRefresh: boolean = false): Observable<T> {
    return this.getCachedOrFetch<T>(url, forceRefresh);
  }

  // Targeted Cache Invalidation
  public invalidateCache(urlKeyOrPrefix: string): void {
    for (const key of Array.from(this.dataCache.keys())) {
      if (key.includes(urlKeyOrPrefix)) {
        this.dataCache.delete(key);
      }
    }
    for (const key of Array.from(this.inFlightRequests.keys())) {
      if (key.includes(urlKeyOrPrefix)) {
        this.inFlightRequests.delete(key);
      }
    }
  }

  public setCacheData(urlKey: string, data: any): void {
    this.dataCache.set(urlKey, { data, timestamp: Date.now() });
  }

  public getCacheData<T = any>(urlKey: string): T | null {
    const item = this.dataCache.get(urlKey);
    return item ? (item.data as T) : null;
  }

  // Cache invalidation helpers
  invalidatePartiesCache(): void { this.cachedParties$ = undefined; this.invalidateCache('/parties'); }
  invalidateVendorsCache(): void { this.cachedVendors$ = undefined; this.invalidateCache('/vendors'); }
  invalidateDriversCache(): void { this.cachedDrivers$ = undefined; this.invalidateCache('/drivers'); }
  invalidateEmployeesCache(): void { this.cachedEmployees$ = undefined; this.invalidateCache('/employees'); }
  invalidateMachinesCache(): void { this.cachedMachines$ = undefined; this.invalidateCache('/machines'); }
  invalidateStatsCache(): void { this.cachedStats$ = undefined; this.invalidateCache('/dashboard/stats'); }
  invalidateChartsCache(): void { this.cachedCharts$ = undefined; this.invalidateCache('/dashboard/charts'); }
  clearAllReferenceCache(): void {
    this.cachedParties$ = undefined;
    this.cachedVendors$ = undefined;
    this.cachedDrivers$ = undefined;
    this.cachedEmployees$ = undefined;
    this.cachedMachines$ = undefined;
    this.cachedStats$ = undefined;
    this.cachedCharts$ = undefined;
    this.dataCache.clear();
    this.inFlightRequests.clear();
  }

  // Auth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/login`, credentials);
  }

  verifyOtp(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/login/verify`, payload);
  }

  changePassword(data: { username: string; currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/change-password`, data);
  }

  // Google ADK & AI Research Agent
  runAiResearch(query: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/adk/research`, { query });
  }

  getPolymerMarketRates(): Observable<any> {
    return this.http.post(`${this.baseUrl}/adk/research`, { query: 'Current HDPE injection moulding granule prices in India' });
  }


  // Dashboard (Cached with shareReplay & 8s/15s window to deduplicate concurrent calls)
  getStats(forceRefresh: boolean = false): Observable<any> {
    const now = Date.now();
    if (forceRefresh || !this.cachedStats$ || (now - this.statsCacheTime > 8000)) {
      this.statsCacheTime = now;
      this.cachedStats$ = this.http.get(`${this.baseUrl}/dashboard/stats`).pipe(
        this.retryPolicy(1),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.cachedStats$;
  }

  getCharts(forceRefresh: boolean = false): Observable<any> {
    const now = Date.now();
    if (forceRefresh || !this.cachedCharts$ || (now - this.chartsCacheTime > 15000)) {
      this.chartsCacheTime = now;
      this.cachedCharts$ = this.http.get(`${this.baseUrl}/dashboard/charts`).pipe(
        this.retryPolicy(1),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.cachedCharts$;
  }

  importExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/dashboard/import`, formData, { responseType: 'text' });
  }

  getSystemHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`).pipe(
      catchError(() => this.http.get(`${this.baseUrl.replace(/\/api$/, '')}/actuator/health`)),
      this.retryPolicy(1)
    );
  }

  getHealth(): Observable<any> {
    return this.getSystemHealth();
  }

  getPrometheusMetrics(): Observable<string> {
    return this.http.get(`${this.baseUrl.replace(/\/api$/, '')}/actuator/prometheus`, { responseType: 'text' });
  }

  getGrafanaHealth(): Observable<any> {
    return this.http.get('http://localhost:3000/api/health');
  }

  getEnvInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/env`);
  }

  // Parties (Cached with SWR)
  getParties(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/parties`, forceRefresh);
  }
  createParty(party: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/parties`, party).pipe(
      tap(() => this.invalidatePartiesCache())
    );
  }
  updateParty(id: string, party: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/parties/${id}`, party).pipe(
      tap(() => this.invalidatePartiesCache())
    );
  }
  deleteParty(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/parties/${id}`).pipe(
      tap(() => this.invalidatePartiesCache())
    );
  }

  // Vendors (Cached with SWR)
  getVendors(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/vendors`, forceRefresh);
  }
  createVendor(vendor: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vendors`, vendor).pipe(
      tap(() => this.invalidateVendorsCache())
    );
  }
  updateVendor(id: string, vendor: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/vendors/${id}`, vendor).pipe(
      tap(() => this.invalidateVendorsCache())
    );
  }
  deleteVendor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vendors/${id}`).pipe(
      tap(() => this.invalidateVendorsCache())
    );
  }

  // Drivers (Cached with SWR)
  getDrivers(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/drivers`, forceRefresh);
  }
  createDriver(driver: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/drivers`, driver).pipe(
      tap(() => this.invalidateDriversCache())
    );
  }
  updateDriver(id: string, driver: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/drivers/${id}`, driver).pipe(
      tap(() => this.invalidateDriversCache())
    );
  }
  deleteDriver(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/drivers/${id}`).pipe(
      tap(() => this.invalidateDriversCache())
    );
  }

  // PPD Production (Cached with SWR)
  getPpd(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/ppd`, forceRefresh);
  }
  createPpd(ppd: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ppd`, ppd).pipe(
      tap(() => this.invalidateCache('/ppd'))
    );
  }
  updatePpd(id: string, ppd: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/ppd/${id}`, ppd).pipe(
      tap(() => this.invalidateCache('/ppd'))
    );
  }
  deletePpd(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ppd/${id}`).pipe(
      tap(() => this.invalidateCache('/ppd'))
    );
  }

  // PPM Production (Cached with SWR)
  getPpm(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/ppm`, forceRefresh);
  }
  createPpm(ppm: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ppm`, ppm).pipe(
      tap(() => this.invalidateCache('/ppm'))
    );
  }
  updatePpm(id: string, ppm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/ppm/${id}`, ppm).pipe(
      tap(() => this.invalidateCache('/ppm'))
    );
  }
  deletePpm(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ppm/${id}`).pipe(
      tap(() => this.invalidateCache('/ppm'))
    );
  }

  // Raw Materials (Cached with SWR)
  getRawMaterials(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/raw-materials`, forceRefresh);
  }
  createRawMaterial(rm: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/raw-materials`, rm).pipe(
      tap(() => this.invalidateCache('/raw-materials'))
    );
  }
  updateRawMaterial(id: string, rm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/raw-materials/${id}`, rm).pipe(
      tap(() => this.invalidateCache('/raw-materials'))
    );
  }
  deleteRawMaterial(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/raw-materials/${id}`).pipe(
      tap(() => this.invalidateCache('/raw-materials'))
    );
  }

  // Sales (Cached with SWR)
  getSales(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/sales`, forceRefresh);
  }
  createSale(sale: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales`, sale).pipe(
      tap(() => this.invalidateCache('/sales'))
    );
  }
  updateSale(id: string, sale: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/sales/${id}`, sale).pipe(
      tap(() => this.invalidateCache('/sales'))
    );
  }
  deleteSale(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/sales/${id}`).pipe(
      tap(() => this.invalidateCache('/sales'))
    );
  }
  generatePaymentLink(saleId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales/${saleId}/payment-link`, {});
  }
  createRazorpayOrder(saleId: string, requestedAmount?: number): Observable<any> {
    let url = `${this.baseUrl}/sales/${saleId}/checkout/order`;
    if (requestedAmount && requestedAmount > 0) {
      url += `?requestedAmount=${requestedAmount}`;
    }
    return this.http.post(url, {});
  }
  verifyRazorpayPayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales/checkout/verify?razorpay_order_id=${data.razorpay_order_id}&razorpay_payment_id=${data.razorpay_payment_id}&razorpay_signature=${data.razorpay_signature}`, {});
  }

  // Payments (Cached with SWR)
  getPayments(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/payments`, forceRefresh);
  }
  createPayment(payment: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments`, payment).pipe(
      tap(() => this.invalidateCache('/payments'))
    );
  }
  updatePayment(id: string, payment: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/payments/${id}`, payment).pipe(
      tap(() => this.invalidateCache('/payments'))
    );
  }
  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/payments/${id}`).pipe(
      tap(() => this.invalidateCache('/payments'))
    );
  }

  // Invoices (Cached with SWR)
  getInvoices(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/invoices`, forceRefresh);
  }

  // Employees (Cached with SWR)
  getEmployees(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/employees`, forceRefresh);
  }
  createEmployee(employee: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees`, employee).pipe(
      tap(() => this.invalidateEmployeesCache())
    );
  }
  updateEmployee(id: string, employee: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, employee).pipe(
      tap(() => this.invalidateEmployeesCache())
    );
  }
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`).pipe(
      tap(() => this.invalidateEmployeesCache())
    );
  }

  // Salaries (Cached with SWR)
  getSalaries(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/salaries`, forceRefresh);
  }
  createSalary(salary: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/salaries`, salary).pipe(
      tap(() => this.invalidateCache('/salaries'))
    );
  }
  updateSalary(id: string, salary: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/salaries/${id}`, salary).pipe(
      tap(() => this.invalidateCache('/salaries'))
    );
  }
  deleteSalary(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/salaries/${id}`).pipe(
      tap(() => this.invalidateCache('/salaries'))
    );
  }

  // Transports (Cached with SWR)
  getTransports(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/transports`, forceRefresh);
  }
  createTransport(transport: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/transports`, transport).pipe(
      tap(() => this.invalidateCache('/transports'))
    );
  }
  updateTransport(id: string, transport: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/transports/${id}`, transport).pipe(
      tap(() => this.invalidateCache('/transports'))
    );
  }
  deleteTransport(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/transports/${id}`).pipe(
      tap(() => this.invalidateCache('/transports'))
    );
  }

  // Inventory (Cached with SWR)
  getInventory(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/inventory`, forceRefresh);
  }
  createInventory(inventory: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/inventory`, inventory).pipe(
      tap(() => this.invalidateCache('/inventory'))
    );
  }
  updateInventory(id: string, inventory: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/inventory/${id}`, inventory).pipe(
      tap(() => this.invalidateCache('/inventory'))
    );
  }
  deleteInventory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/inventory/${id}`).pipe(
      tap(() => this.invalidateCache('/inventory'))
    );
  }

  // Audit Logs
  getAuditLogs(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/audit-logs`, { params });
  }
  createAuditLog(log: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/audit-logs`, log);
  }

  // Machines (Cached with SWR)
  getMachines(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/machines`, forceRefresh);
  }
  createMachine(machine: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/machines`, machine).pipe(
      tap(() => this.invalidateMachinesCache())
    );
  }
  updateMachine(id: string, machine: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/machines/${id}`, machine).pipe(
      tap(() => this.invalidateMachinesCache())
    );
  }
  deleteMachine(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/machines/${id}`).pipe(
      tap(() => this.invalidateMachinesCache())
    );
  }

  // Machine Breakdowns
  getMachineBreakdowns(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/breakdowns`, forceRefresh).pipe(
      catchError(() => this.getCachedOrFetch(`${this.baseUrl}/machine-breakdowns`, forceRefresh))
    );
  }
  createMachineBreakdown(bd: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/breakdowns`, bd).pipe(
      catchError(() => this.http.post(`${this.baseUrl}/machine-breakdowns`, bd)),
      tap(() => {
        this.invalidateCache('/breakdowns');
        this.invalidateCache('/machine-breakdowns');
      })
    );
  }
  updateMachineBreakdown(id: string, bd: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/breakdowns/${id}`, bd).pipe(
      catchError(() => this.http.put(`${this.baseUrl}/machine-breakdowns/${id}`, bd)),
      tap(() => {
        this.invalidateCache('/breakdowns');
        this.invalidateCache('/machine-breakdowns');
      })
    );
  }
  deleteMachineBreakdown(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/breakdowns/${id}`).pipe(
      catchError(() => this.http.delete(`${this.baseUrl}/machine-breakdowns/${id}`)),
      tap(() => {
        this.invalidateCache('/breakdowns');
        this.invalidateCache('/machine-breakdowns');
      })
    );
  }

  // Dispatches (Cached with SWR)
  getDispatches(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/dispatches`, forceRefresh);
  }
  createDispatch(dispatch: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/dispatches`, dispatch).pipe(
      tap(() => this.invalidateCache('/dispatches'))
    );
  }
  updateDispatch(id: string, dispatch: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/dispatches/${id}`, dispatch).pipe(
      tap(() => this.invalidateCache('/dispatches'))
    );
  }
  deleteDispatch(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/dispatches/${id}`).pipe(
      tap(() => this.invalidateCache('/dispatches'))
    );
  }

  // Expenses (Cached with SWR)
  getExpenses(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/expenses`, forceRefresh);
  }
  createExpense(expense: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/expenses`, expense).pipe(
      tap(() => this.invalidateCache('/expenses'))
    );
  }
  updateExpense(id: string, expense: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/expenses/${id}`, expense).pipe(
      tap(() => this.invalidateCache('/expenses'))
    );
  }
  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/expenses/${id}`).pipe(
      tap(() => this.invalidateCache('/expenses'))
    );
  }

  // Bank Transactions (Cached with SWR)
  getBankTransactions(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/bank-transactions`, forceRefresh);
  }
  createBankTransaction(txn: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/bank-transactions`, txn).pipe(
      tap(() => this.invalidateCache('/bank-transactions'))
    );
  }
  updateBankTransaction(id: string, txn: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/bank-transactions/${id}`, txn).pipe(
      tap(() => this.invalidateCache('/bank-transactions'))
    );
  }
  deleteBankTransaction(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/bank-transactions/${id}`).pipe(
      tap(() => this.invalidateCache('/bank-transactions'))
    );
  }

  // Settings (Power BI URL)
  getSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/settings`);
  }
  saveSetting(key: string, value: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/settings`, { settingKey: key, settingValue: value });
  }

  // User Management
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }
  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user);
  }
  updateUser(username: string, updates: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${username}`, updates);
  }
  deleteUser(username: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${username}`);
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/uploads/upload`, formData);
  }

  getBackups(): Observable<any> {
    return this.http.get(`${this.baseUrl}/settings/backups`);
  }

  runBackup(): Observable<any> {
    return this.http.post(`${this.baseUrl}/settings/backup`, {});
  }

  runRestore(filename: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/settings/restore`, { filename });
  }

  // Tally Prime XML Export (Z-02)
  exportTallyXml(fromDate?: string, toDate?: string): Observable<string> {
    let params = '';
    if (fromDate && toDate) {
      params = `?fromDate=${fromDate}&toDate=${toDate}`;
    } else if (fromDate) {
      params = `?fromDate=${fromDate}`;
    } else if (toDate) {
      params = `?toDate=${toDate}`;
    }
    return this.http.get(`${this.baseUrl}/reports/tally-xml${params}`, { responseType: 'text' });
  }

  // =========================================================================
  // SUPER ADMIN NO-CODE CONTROL CENTER API METHODS
  // =========================================================================
  getAdminBranding(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/branding`);
  }
  saveAdminBranding(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/branding`, payload);
  }
  uploadCompanyLogo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/admin/branding/logo-upload`, formData);
  }

  getAdminTeams(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/teams`);
  }
  createAdminTeam(team: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/teams`, team);
  }
  updateAdminTeam(id: string, team: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/teams/${id}`, team);
  }
  deactivateAdminTeam(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/admin/teams/${id}/deactivate`, {});
  }

  getAdminUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/users`);
  }
  inviteUser(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/users/invite`, payload);
  }
  forcePasswordReset(username: string, payload?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/users/${username}/reset-password`, payload || {});
  }

  getAdminRolePermissions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/permissions`);
  }
  saveAdminRolePermissions(permissions: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/permissions`, permissions);
  }

  getAdminFeatureFlags(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/features`);
  }
  toggleAdminFeatureFlag(moduleKey: string, enabled: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/features/${moduleKey}/toggle`, { enabled });
  }

  // AI Copilot & ADK Gateway
  executeAdkChat(payload: any): Observable<any> {
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || '';
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
    return this.http.post(`${this.baseUrl}/adk/chat`, payload, { headers });
  }
  resetAdkSession(conversationId: string): Observable<any> {
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || '';
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
    return this.http.post(`${this.baseUrl}/adk/session/reset`, { conversationId }, { headers });
  }

  getCustomFieldDefs(entityName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/custom-fields/${entityName}`);
  }
  createCustomFieldDef(def: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/custom-fields`, def);
  }
  deleteCustomFieldDef(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/custom-fields/${id}`);
  }
  getCustomFieldValues(entityName: string, recordId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/custom-fields/values/${entityName}/${recordId}`);
  }
  saveCustomFieldValues(entityName: string, recordId: string, values: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/custom-fields/values/${entityName}/${recordId}`, values);
  }

  // Developer Hub: API Keys
  getApiKeys(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/api-keys`);
  }
  createApiKey(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/api-keys`, payload);
  }
  revokeApiKey(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/api-keys/${id}`);
  }

  // Developer Hub: Webhooks
  getWebhooks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/webhooks`);
  }
  createWebhook(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/webhooks`, payload);
  }
  deleteWebhook(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/webhooks/${id}`);
  }
  testWebhook(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/webhooks/${id}/test`, {});
  }

  // Governance & Cache Management
  getCacheStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/cache/stats`);
  }
  flushCache(): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/cache/flush`, {});
  }
  updateAuditRetention(days: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/governance/retention`, { retentionDays: days });
  }

  // Multi-Company & Billing Profiles
  getCompanyProfiles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/billing/companies`);
  }
  saveCompanyProfile(profile: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/billing/companies`, profile);
  }
  setDefaultCompany(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/billing/companies/${id}/set-default`, {});
  }
  deleteCompanyProfile(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/billing/companies/${id}`);
  }

  // Banking & UPI Accounts
  getBankProfiles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/billing/banks`);
  }
  saveBankProfile(bank: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/billing/banks`, bank);
  }
  setPrimaryBank(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/billing/banks/${id}/set-primary`, {});
  }
  deleteBankProfile(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/billing/banks/${id}`);
  }

  // Invoice Template & Print Designer
  getInvoiceTemplateConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/billing/invoice-template`);
  }
  saveInvoiceTemplateConfig(config: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/billing/invoice-template`, config);
  }

  // Automated Notification Templates (WhatsApp/SMS)
  getNotificationTemplates(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/notifications/templates`);
  }
  saveNotificationTemplate(template: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/notifications/templates`, template);
  }
  toggleNotificationTemplate(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/notifications/templates/${id}/toggle`, {});
  }
  testSendNotification(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/notifications/templates/test-send`, payload);
  }

  // System Diagnostics & Enterprise Backup
  getSystemDiagnostics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/governance/diagnostics`);
  }
  exportSystemBackup(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/governance/backup/export`);
  }
  getAdminSystemHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/system-health`);
  }
  flushCacheRegion(cacheName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/cache/${cacheName}/flush`, {});
  }
  forceLogoutAllUsers(): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/sessions/force-logout-all`, {});
  }
}

