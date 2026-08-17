import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartyComponent } from './party.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('PartyComponent', () => {
  let component: PartyComponent;
  let fixture: ComponentFixture<PartyComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockParties = [
    { id: 1, partyName: 'Agro Foods', partyContact: '9876543210', gstNumber: '27AABCU9603R1ZM' }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getParties', 'createParty', 'deleteParty', 'createAuditLog']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info', 'confirmAction']);

    mockApiService.getParties.and.returnValue(of(mockParties));

    await TestBed.configureTestingModule({
      imports: [PartyComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PartyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should detect duplicate party by name or contact', () => {
    component.partyForm.partyName = 'Agro Foods';
    component.partyForm.partyContact = '9876543210';
    expect(component.isDuplicateParty()).toBeTrue();
  });
});
