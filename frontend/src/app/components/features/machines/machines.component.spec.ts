import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MachinesComponent } from './machines.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('MachinesComponent', () => {
  let component: MachinesComponent;
  let fixture: ComponentFixture<MachinesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getMachines', 'getMachineBreakdowns', 'createMachine', 'deleteMachine', 'createAuditLog']);
    mockApiService.getMachines.and.returnValue(of([]));
    mockApiService.getMachineBreakdowns.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MachinesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MachinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
