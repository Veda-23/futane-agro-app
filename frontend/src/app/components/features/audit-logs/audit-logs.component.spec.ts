import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogsComponent } from './audit-logs.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { of } from 'rxjs';

describe('AuditLogsComponent', () => {
  let component: AuditLogsComponent;
  let fixture: ComponentFixture<AuditLogsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getAuditLogs']);
    mockApiService.getAuditLogs.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AuditLogsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
