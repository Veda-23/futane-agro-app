import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlobalFilterComponent } from './global-filter.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { of } from 'rxjs';

describe('GlobalFilterComponent', () => {
  let component: GlobalFilterComponent;
  let fixture: ComponentFixture<GlobalFilterComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getParties']);
    mockApiService.getParties.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [GlobalFilterComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
