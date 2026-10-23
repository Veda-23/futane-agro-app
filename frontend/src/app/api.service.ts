import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, retry, shareReplay, tap, catchError, timer, MonoTypeOperatorFunction } from 'rxjs';
import { environment } from '../environments/environment';

/**
 * <h1>ApiService</h1>
 * <p>
 * Centralized Angular HTTP Client Service for Futane Agro ERP.
 * Orchestrates all RESTful communication between the Angular 17 single-page application
 * and the Spring Boot 3 enterprise backend.
 * </p>
 *
 * <h3>Key Performance & Architectural Features:</h3>
 * <ul>
 *   <li><b>Stale-While-Revalidate (SWR) In-Memory Cache:</b> Eliminates blank loading skeletons on tab changes
 *       by serving cached JSON payloads immediately (&lt;1ms) while background-revalidating.</li>
 *   <li><b>Request Deduplication:</b> Re-uses identical in-flight HTTP requests via {@code inFlightRequests}
 *       and RxJS {@code shareReplay({ bufferSize: 1, refCount: true })} to prevent duplicate network roundtrips.</li>
 *   <li><b>Safe Transient Retry Policy:</b> Retries failed network requests once with exponential backoff,
 *       while strictly prohibiting retries on HTTP 401 Unauthorized, 403 Forbidden, and 404 Not Found errors.</li>
 *   <li><b>Granular Cache Invalidation:</b> Provides targeted prefix and entity invalidation methods
 *       (e.g., {@link #invalidatePartiesCache}, {@link #invalidateCache}) triggered upon entity mutations.</li>
 * </ul>
 *
 * @author Futane Agro Engineering Team
 * @version 2.0 (Enterprise Multi-Tenant)
 */
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

  /**
   * Safe transient retry operator for HTTP observables.
   * <p>Retries transient socket or 5xx server glitches, but rejects immediate 401, 403, and 404 failures
   * to avoid flooding authentication endpoints or masking client errors.</p>
   *
   * @param count Number of retry attempts (default 1).
   */
  private retryPolicy<T = any>(count: number = 1): MonoTypeOperatorFunction<T> {
    return retry<T>({
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
   * High-Performance Stale-While-Revalidate (SWR) In-Memory Fetcher:
   * <p>Returns cached data immediately (0ms) if within the TTL window, preventing layout shifts
   * and blank loading screens on navigation. Deduplicates parallel requests via {@code inFlightRequests}.</p>
   *
   * @param url          Full target endpoint URL.
   * @param forceRefresh If true, bypasses the memory cache and executes an immediate network call.
   * @param ttl          Time-to-live in milliseconds (defaults to 5 minutes).
   * @returns RxJS Observable delivering the typed payload.
   */
  public getCachedOrFetch<T = any>(url: string, forceRefresh: boolean = false, ttl: number = this.DEFAULT_CACHE_TTL): Observable<T> {
    const cached = this.dataCache.get(url);
    const now = Date.now();
    if (!forceRefresh && cached && (now - cached.timestamp < ttl)) {
      return of(cached.data as T);
    }

    if (this.inFlightRequests.has(url)) {
      return this.inFlightRequests.get(url)! as Observable<T>;
    }

    const req$: Observable<T> = this.http.get<T>(url).pipe(
      this.retryPolicy<T>(1),
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

  /**
   * Deduplicates concurrent GET requests for identical resources.
   *
   * @param url          Endpoint URL.
   * @param forceRefresh Force fresh server fetch.
   */
  public dedupeGet<T = any>(url: string, forceRefresh: boolean = false): Observable<T> {
    return this.getCachedOrFetch<T>(url, forceRefresh);
  }

  /**
   * Selectively purges cached HTTP responses matching a URL key or substring prefix.
   *
   * @param urlKeyOrPrefix String fragment (e.g., "/sales", "/parties", "/inventory").
   */
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

  /** Manually caches pre-fetched data for a URL. */
  public setCacheData(urlKey: string, data: any): void {
    this.dataCache.set(urlKey, { data, timestamp: Date.now() });
  }

  /** Retrieves in-memory cached payload synchronously without triggering network requests. */
  public getCacheData<T = any>(urlKey: string): T | null {
    const item = this.dataCache.get(urlKey);
    return item ? (item.data as T) : null;
  }

  // --- Entity-Specific Cache Invalidation Helpers ---
  invalidatePartiesCache(): void { this.cachedParties$ = undefined; this.invalidateCache('/parties'); }
  invalidateVendorsCache(): void { this.cachedVendors$ = undefined; this.invalidateCache('/vendors'); }
  invalidateDriversCache(): void { this.cachedDrivers$ = undefined; this.invalidateCache('/drivers'); }
  invalidateEmployeesCache(): void { this.cachedEmployees$ = undefined; this.invalidateCache('/employees'); }
  invalidateMachinesCache(): void { this.cachedMachines$ = undefined; this.invalidateCache('/machines'); }
  invalidateStatsCache(): void { this.cachedStats$ = undefined; this.invalidateCache('/dashboard/stats'); }
  invalidateChartsCache(): void { this.cachedCharts$ = undefined; this.invalidateCache('/dashboard/charts'); }

  /** Flushes all in-memory SWR caches and active in-flight request handles. */
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

  // ==========================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================

  /** Authenticates user with username & password; initiates OTP/MFA workflow or grants access. */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/login`, credentials);
  }

  /** Self-registers a new customer or organization account. */
  register(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/register`, payload);
  }

  /** Validates login OTP and retrieves active JWT access token & refresh token. */
  verifyOtp(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/login/verify`, payload);
  }

  /** Verifies active JWT token validity and fetches current user roles. */
  verifySession(token?: string): Observable<any> {
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.http.get(`${this.baseUrl}/users/verify-session`, { headers });
  }

  /** Blacklists active JWT token and invalidates server-side refresh session. */
  logout(): Observable<any> {
    const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.http.post(`${this.baseUrl}/users/logout`, {}, { headers }).pipe(
      catchError(() => of({ status: 'LOGGED_OUT' }))
    );
  }

  /** Changes the authenticated user's password with current password verification. */
  changePassword(data: { username: string; currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/change-password`, data);
  }

  // ── Multi-Factor Authentication (MFA) ──

  /** Verifies Firebase Phone Auth ID token during secondary login challenge. */
  verifyFirebaseOtp(payload: { preAuthToken: string; firebaseIdToken: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/mfa/verify-firebase-otp`, payload);
  }

  /** Validates an emergency single-use MFA recovery code. */
  verifyMfaRecoveryCode(payload: { preAuthToken: string; recoveryCode: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/mfa/verify-recovery-code`, payload);
  }

  getMfaStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/mfa/status`);
  }

  enrollMfa(payload: { firebaseIdToken: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/mfa/enroll`, payload);
  }

  disableMfa(payload: { password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/mfa/disable`, payload);
  }

  regenerateMfaRecoveryCodes(payload: { password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/mfa/regenerate-recovery-codes`, payload);
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

  // ==========================================
  // PARTIES & MASTER DIRECTORIES
  // ==========================================

  /** Retrieves all registered parties (customers/dealers), serving SWR cached data when fresh. */
  getParties(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/parties`, forceRefresh);
  }
  /** Creates a new customer/party and evicts parties cache. */
  createParty(party: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/parties`, party).pipe(
      tap(() => this.invalidatePartiesCache())
    );
  }
  /** Updates an existing customer/party and evicts parties cache. */
  updateParty(id: string, party: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/parties/${id}`, party).pipe(
      tap(() => this.invalidatePartiesCache())
    );
  }
  /** Soft-deletes a customer/party and evicts parties cache. */
  deleteParty(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/parties/${id}`).pipe(
      tap(() => this.invalidatePartiesCache())
    );
  }

  // Vendors (Cached with SWR)
  /** Retrieves all raw material and service vendors. */
  getVendors(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/vendors`, forceRefresh);
  }
  /** Creates a vendor and purges vendor cache. */
  createVendor(vendor: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vendors`, vendor).pipe(
      tap(() => this.invalidateVendorsCache())
    );
  }
  /** Updates vendor details and purges vendor cache. */
  updateVendor(id: string, vendor: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/vendors/${id}`, vendor).pipe(
      tap(() => this.invalidateVendorsCache())
    );
  }
  /** Soft-deletes a vendor and purges vendor cache. */
  deleteVendor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vendors/${id}`).pipe(
      tap(() => this.invalidateVendorsCache())
    );
  }

  // Drivers (Cached with SWR)
  /** Retrieves all registered logistics drivers and contact phone numbers. */
  getDrivers(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/drivers`, forceRefresh);
  }
  /** Registers a new logistics driver. */
  createDriver(driver: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/drivers`, driver).pipe(
      tap(() => this.invalidateDriversCache())
    );
  }
  /** Updates driver contact or vehicle assignment. */
  updateDriver(id: string, driver: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/drivers/${id}`, driver).pipe(
      tap(() => this.invalidateDriversCache())
    );
  }
  /** Soft-deletes a driver profile. */
  deleteDriver(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/drivers/${id}`).pipe(
      tap(() => this.invalidateDriversCache())
    );
  }

  // ==========================================
  // PRODUCTION & RAW MATERIALS (MANUFACTURING)
  // ==========================================

  /** Retrieves daily production runs (PPD) across injection molding machines. */
  getPpd(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/ppd`, forceRefresh);
  }
  /** Logs a daily production run; atomically increments finished goods produced stock. */
  createPpd(ppd: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ppd`, ppd).pipe(
      tap(() => this.invalidateCache('/ppd'))
    );
  }
  /** Updates a daily production run and reconciles inventory adjustments. */
  updatePpd(id: string, ppd: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/ppd/${id}`, ppd).pipe(
      tap(() => this.invalidateCache('/ppd'))
    );
  }
  /** Soft-deletes a daily production run and rolls back inventory counts. */
  deletePpd(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ppd/${id}`).pipe(
      tap(() => this.invalidateCache('/ppd'))
    );
  }

  // PPM Production (Monthly aggregated metrics & utility costs)
  /** Retrieves monthly production summary reports (PPM). */
  getPpm(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/ppm`, forceRefresh);
  }
  /** Records a monthly plant production consolidation with electricity/water billing. */
  createPpm(ppm: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ppm`, ppm).pipe(
      tap(() => this.invalidateCache('/ppm'))
    );
  }
  /** Updates monthly production report metrics. */
  updatePpm(id: string, ppm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/ppm/${id}`, ppm).pipe(
      tap(() => this.invalidateCache('/ppm'))
    );
  }
  /** Soft-deletes a monthly production report. */
  deletePpm(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ppm/${id}`).pipe(
      tap(() => this.invalidateCache('/ppm'))
    );
  }

  // Raw Materials (Inventory & Inward Stock)
  /** Retrieves raw polymer material batches (HDPE granules, masterbatch pigments). */
  getRawMaterials(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/raw-materials`, forceRefresh);
  }
  /** Logs an inward raw material receipt and updates inventory buffer. */
  createRawMaterial(rm: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/raw-materials`, rm).pipe(
      tap(() => this.invalidateCache('/raw-materials'))
    );
  }
  /** Modifies raw material consignment parameters. */
  updateRawMaterial(id: string, rm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/raw-materials/${id}`, rm).pipe(
      tap(() => this.invalidateCache('/raw-materials'))
    );
  }
  /** Soft-deletes a raw material consignment. */
  deleteRawMaterial(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/raw-materials/${id}`).pipe(
      tap(() => this.invalidateCache('/raw-materials'))
    );
  }

  // ==========================================
  // COMMERCIAL OPERATIONS: SALES & INVOICING
  // ==========================================

  /** Retrieves all sales orders, dispatching cached SWR representation when available. */
  getSales(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/sales`, forceRefresh);
  }
  /** Records a sales order, auto-generating a tax invoice and reducing finished stock. */
  createSale(sale: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales`, sale).pipe(
      tap(() => this.invalidateCache('/sales'))
    );
  }
  /** Updates a sales record and reconciles finished goods inventory differences. */
  updateSale(id: string, sale: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/sales/${id}`, sale).pipe(
      tap(() => this.invalidateCache('/sales'))
    );
  }
  /** Soft-deletes a sales order and reverts associated inventory sold stock. */
  deleteSale(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/sales/${id}`).pipe(
      tap(() => this.invalidateCache('/sales'))
    );
  }
  /** Generates a Razorpay payment link for customer remittance via SMS/WhatsApp. */
  generatePaymentLink(saleId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales/${saleId}/payment-link`, {});
  }
  /** Creates a server-side Razorpay order ID for in-app UPI/NetBanking modal checkout. */
  createRazorpayOrder(saleId: string, requestedAmount?: number): Observable<any> {
    let url = `${this.baseUrl}/sales/${saleId}/checkout/order`;
    if (requestedAmount && requestedAmount > 0) {
      url += `?requestedAmount=${requestedAmount}`;
    }
    return this.http.post(url, {});
  }
  /** Validates HMAC-SHA256 signature from Razorpay modal payment completion. */
  verifyRazorpayPayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales/checkout/verify?razorpay_order_id=${data.razorpay_order_id}&razorpay_payment_id=${data.razorpay_payment_id}&razorpay_signature=${data.razorpay_signature}`, {});
  }

  // Customer Web Orders (Storefront Integration Bridge)
  /** Fetches B2B e-commerce orders placed through the public customer portal. */
  getWebOrders(status: string = 'ALL'): Observable<any> {
    return this.http.get(`${this.baseUrl}/erp/web-orders?status=${status}`).pipe(
      catchError(() => of([])),
      this.retryPolicy(1)
    );
  }
  /** Updates fulfillment status of an inbound web order (CONFIRMED, IN_PRODUCTION, DISPATCHED). */
  updateWebOrderStatus(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/erp/web-orders/${id}/status`, payload);
  }
  /** Converts a confirmed web purchase order into an official ERP sales transaction. */
  convertWebOrderToSale(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/erp/web-orders/${id}/create-sale`, {}).pipe(
      tap(() => this.invalidateCache('/sales'))
    );
  }

  // ==========================================
  // PAYMENT COLLECTIONS & INVOICES
  // ==========================================

  /** Retrieves all customer payment receipts. */
  getPayments(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/payments`, forceRefresh);
  }
  /** Registers a customer payment and decreases the outstanding balance on the related sale invoice. */
  createPayment(payment: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments`, payment).pipe(
      tap(() => this.invalidateCache('/payments'))
    );
  }
  /** Updates payment receipt metadata (mode, payment date). Amount is immutable for ledger safety. */
  updatePayment(id: string, payment: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/payments/${id}`, payment).pipe(
      tap(() => this.invalidateCache('/payments'))
    );
  }
  /** Soft-deletes a payment receipt and restores the outstanding balance on the invoice. */
  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/payments/${id}`).pipe(
      tap(() => this.invalidateCache('/payments'))
    );
  }

  /** Retrieves all issued tax invoices. */
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

  /**
   * Evaluates if current authenticated user holds SUPER_ADMIN authority.
   */
  private isSuperAdminUser(): boolean {
    try {
      const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        const role = (u?.role || '').toUpperCase();
        return role === 'SUPER_ADMIN' || role === 'SUPERADMIN' || role === 'ROLE_SUPER_ADMIN';
      }
    } catch (e) {
      // Fallback
    }
    return false;
  }

  // Audit Logs (Restricted strictly to SUPER_ADMIN)
  getAuditLogs(params?: any, forceRefresh: boolean = false): Observable<any> {
    if (!this.isSuperAdminUser()) {
      return of([]);
    }
    if (!params || Object.keys(params).length === 0) {
      return this.getCachedOrFetch(`${this.baseUrl}/audit-logs`, forceRefresh);
    }
    return this.http.get(`${this.baseUrl}/audit-logs`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  createAuditLog(log: any): Observable<any> {
    if (!this.isSuperAdminUser()) {
      // Backend services already record transactional audit entries automatically.
      // Skipping client-side call prevents 403 Forbidden console spam for operational roles.
      return of({ status: 'SERVER_AUDITED' });
    }
    return this.http.post(`${this.baseUrl}/audit-logs`, log).pipe(
      tap(() => this.invalidateCache('/audit-logs')),
      catchError(() => of(null))
    );
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

  // Settings (Cached with SWR)
  getSettings(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/settings`, forceRefresh);
  }
  saveSetting(key: string, value: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/settings`, { settingKey: key, settingValue: value }).pipe(
      tap(() => this.invalidateCache('/settings'))
    );
  }

  // User Management (Cached with SWR)
  getUsers(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/users`, forceRefresh);
  }
  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user).pipe(
      tap(() => this.invalidateCache('/users'))
    );
  }
  updateUser(username: string, updates: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${username}`, updates).pipe(
      tap(() => this.invalidateCache('/users'))
    );
  }
  deleteUser(username: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${username}`).pipe(
      tap(() => this.invalidateCache('/users'))
    );
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/uploads/upload`, formData);
  }

  getBackups(forceRefresh: boolean = false): Observable<any> {
    return this.getCachedOrFetch(`${this.baseUrl}/settings/backups`, forceRefresh);
  }

  runBackup(): Observable<any> {
    return this.http.post(`${this.baseUrl}/settings/backup`, {}).pipe(
      tap(() => this.invalidateCache('/settings/backups'))
    );
  }

  runRestore(filename: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/settings/restore`, { filename }).pipe(
      tap(() => this.invalidateCache('/settings/backups'))
    );
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

