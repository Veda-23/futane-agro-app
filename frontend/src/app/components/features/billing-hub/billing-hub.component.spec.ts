import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingHubComponent } from './billing-hub.component';

describe('BillingHubComponent', () => {
  let component: BillingHubComponent;
  let fixture: ComponentFixture<BillingHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingHubComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillingHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
