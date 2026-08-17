import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import Swal from 'sweetalert2';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false }));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call Swal.fire on success', () => {
    service.success('Test Title', 'Test message');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'success',
      title: 'Test Title',
      text: 'Test message'
    }));
  });

  it('should call Swal.fire on error', () => {
    service.error('Error Title', 'Error message');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'error',
      title: 'Error Title',
      text: 'Error message'
    }));
  });

  it('showValidationError should trigger warning Swal', () => {
    service.showValidationError('Custom error message');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Custom error message'
    }));
  });

  it('confirmAction should resolve to boolean', async () => {
    const result = await service.confirmAction('Confirm', 'Are you sure?');
    expect(result).toBeTrue();
  });
});
