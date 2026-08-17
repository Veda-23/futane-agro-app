import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('GET /api/parties should return party list', () => {
    const mockParties = [{ id: '1', partyName: 'Raj Crates' }];
    service.getParties().subscribe(res => {
      expect(res).toEqual(mockParties);
    });
    const req = httpMock.expectOne(r => r.url.includes('/parties'));
    expect(req.request.method).toBe('GET');
    req.flush(mockParties);
  });

  it('POST /api/parties should create a party', () => {
    const newParty = { partyName: 'New Customer', partyContact: '9876543210' };
    service.createParty(newParty).subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(r => r.url.includes('/parties'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2', ...newParty });
  });

  it('POST /api/users/login should send login request', () => {
    const creds = { username: 'admin', password: 'password123' };
    service.login(creds).subscribe(res => {
      expect(res.status).toBe('OTP_REQUIRED');
    });
    const req = httpMock.expectOne(r => r.url.includes('/users/login'));
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'OTP_REQUIRED', username: 'admin' });
  });
});
