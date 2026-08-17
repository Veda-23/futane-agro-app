import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpensesComponent } from './expenses.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('ExpensesComponent', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getExpenses', 'createExpense', 'deleteExpense', 'createAuditLog']);
    mockApiService.getExpenses.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ExpensesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
