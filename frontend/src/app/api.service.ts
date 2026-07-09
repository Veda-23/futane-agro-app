import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public baseUrl: string;

  constructor(private http: HttpClient) {
    const savedBackend = localStorage.getItem('backend_url');
    if (savedBackend) {
      this.baseUrl = savedBackend;
    } else {
      this.baseUrl = environment.apiUrl;
    }
  }

  // Auth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/login`, credentials);
  }

  verifyOtp(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/login/verify`, payload);
  }


  // Dashboard
  getStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/stats`);
  }

  getCharts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/charts`);
  }

  importExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/dashboard/import`, formData, { responseType: 'text' });
  }

  // Parties
  getParties(): Observable<any> {
    return this.http.get(`${this.baseUrl}/parties`);
  }
  createParty(party: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/parties`, party);
  }
  updateParty(id: string, party: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/parties/${id}`, party);
  }
  deleteParty(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/parties/${id}`);
  }

  // Vendors
  getVendors(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vendors`);
  }
  createVendor(vendor: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vendors`, vendor);
  }
  updateVendor(id: string, vendor: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/vendors/${id}`, vendor);
  }
  deleteVendor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vendors/${id}`);
  }

  // Drivers
  getDrivers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/drivers`);
  }
  createDriver(driver: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/drivers`, driver);
  }
  updateDriver(id: string, driver: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/drivers/${id}`, driver);
  }
  deleteDriver(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/drivers/${id}`);
  }

  // PPD Production
  getPpd(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ppd`);
  }
  createPpd(ppd: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ppd`, ppd);
  }
  deletePpd(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ppd/${id}`);
  }

  // PPM Production
  getPpm(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ppm`);
  }
  createPpm(ppm: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ppm`, ppm);
  }
  deletePpm(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ppm/${id}`);
  }

  // Raw Materials
  getRawMaterials(): Observable<any> {
    return this.http.get(`${this.baseUrl}/raw-materials`);
  }
  createRawMaterial(rm: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/raw-materials`, rm);
  }
  deleteRawMaterial(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/raw-materials/${id}`);
  }

  // Sales
  getSales(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sales`);
  }
  createSale(sale: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales`, sale);
  }
  deleteSale(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/sales/${id}`);
  }

  // Payments
  getPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payments`);
  }
  createPayment(payment: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments`, payment);
  }
  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/payments/${id}`);
  }

  // Invoices
  getInvoices(): Observable<any> {
    return this.http.get(`${this.baseUrl}/invoices`);
  }

  // Employees
  getEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees`);
  }
  createEmployee(employee: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees`, employee);
  }
  updateEmployee(id: string, employee: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, employee);
  }
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`);
  }

  // Salaries
  getSalaries(): Observable<any> {
    return this.http.get(`${this.baseUrl}/salaries`);
  }
  createSalary(salary: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/salaries`, salary);
  }
  updateSalary(id: string, salary: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/salaries/${id}`, salary);
  }
  deleteSalary(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/salaries/${id}`);
  }

  // Transports
  getTransports(): Observable<any> {
    return this.http.get(`${this.baseUrl}/transports`);
  }
  createTransport(transport: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/transports`, transport);
  }
  updateTransport(id: string, transport: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/transports/${id}`, transport);
  }
  deleteTransport(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/transports/${id}`);
  }

  // Inventory
  getInventory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/inventory`);
  }
  createInventory(inventory: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/inventory`, inventory);
  }
  updateInventory(id: string, inventory: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/inventory/${id}`, inventory);
  }
  deleteInventory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/inventory/${id}`);
  }

  // Audit Logs
  getAuditLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/audit-logs`);
  }
  createAuditLog(log: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/audit-logs`, log);
  }

  // Machines
  getMachines(): Observable<any> {
    return this.http.get(`${this.baseUrl}/machines`);
  }
  createMachine(machine: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/machines`, machine);
  }
  deleteMachine(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/machines/${id}`);
  }

  // Machine Breakdowns
  getMachineBreakdowns(): Observable<any> {
    return this.http.get(`${this.baseUrl}/machine-breakdowns`);
  }
  createMachineBreakdown(bd: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/machine-breakdowns`, bd);
  }
  deleteMachineBreakdown(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/machine-breakdowns/${id}`);
  }

  // Dispatches
  getDispatches(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dispatches`);
  }
  createDispatch(dispatch: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/dispatches`, dispatch);
  }
  updateDispatch(id: string, dispatch: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/dispatches/${id}`, dispatch);
  }
  deleteDispatch(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/dispatches/${id}`);
  }

  // Expenses
  getExpenses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/expenses`);
  }
  createExpense(expense: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/expenses`, expense);
  }
  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/expenses/${id}`);
  }

  // Bank Transactions
  getBankTransactions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/bank-transactions`);
  }
  createBankTransaction(txn: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/bank-transactions`, txn);
  }
  deleteBankTransaction(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/bank-transactions/${id}`);
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
}

