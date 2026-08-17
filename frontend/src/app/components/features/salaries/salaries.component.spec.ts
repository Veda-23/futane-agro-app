import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalariesComponent } from './salaries.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('SalariesComponent', () => {
  let component: SalariesComponent;
  let fixture: ComponentFixture<SalariesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getEmployees', 'getSalaries', 'createSalary', 'deleteSalary', 'createAuditLog']);
    mockApiService.getEmployees.and.returnValue(of([]));
    mockApiService.getSalaries.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SalariesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SalariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
