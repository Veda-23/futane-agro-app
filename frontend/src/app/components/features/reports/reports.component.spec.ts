import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsComponent } from './reports.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { of } from 'rxjs';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let mockApi: jasmine.SpyObj<ApiService>;

  const mockSales = [
    { id: '1', date: '2026-04-10', party: { id: 'p1', partyName: 'Raj' }, totalAmount: 5000, quantity: 50 },
    { id: '2', date: '2026-05-15', party: { id: 'p2', partyName: 'Shan' }, totalAmount: 3000, quantity: 30 }
  ];

  beforeEach(async () => {
    mockApi = jasmine.createSpyObj('ApiService', [
      'getPpd', 'getSales', 'getInventory', 'getSalaries',
      'getTransports', 'getParties', 'getPayments', 'getExpenses'
    ]);
    mockApi.getPpd.and.returnValue(of([]));
    mockApi.getSales.and.returnValue(of(mockSales));
    mockApi.getInventory.and.returnValue(of([]));
    mockApi.getSalaries.and.returnValue(of([]));
    mockApi.getTransports.and.returnValue(of([]));
    mockApi.getParties.and.returnValue(of([]));
    mockApi.getPayments.and.returnValue(of([]));
    mockApi.getExpenses.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ReportsComponent, HttpClientTestingModule],
      providers: [{ provide: ApiService, useValue: mockApi }]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter sales by date range', () => {
    component.salesList = mockSales;
    component.reportFilter = { type: 'sales', fromDate: '2026-04-01', toDate: '2026-04-30', partyId: '', employeeId: '', month: '', year: '2026' };
    component.runReport();
    expect(component.filteredReportData.length).toBe(1);
    expect(component.filteredReportData[0].id).toBe('1');
  });

  it('should return ALL sales when date range is empty', () => {
    component.salesList = mockSales;
    component.reportFilter = { type: 'sales', fromDate: '', toDate: '', partyId: '', employeeId: '', month: '', year: '2026' };
    component.runReport();
    expect(component.filteredReportData.length).toBe(2);
  });

  it('should compute correct report totals', () => {
    component.salesList = mockSales;
    component.reportFilter = { type: 'sales', fromDate: '', toDate: '', partyId: '', employeeId: '', month: '', year: '2026' };
    component.runReport();
    expect(component.reportTotals.amount).toBe(8000);
    expect(component.reportTotals.qty).toBe(80);
  });

  it('totalRevenue getter should sum all sales totalAmount', () => {
    component.salesList = mockSales;
    expect(component.totalRevenue).toBe(8000);
  });
});
