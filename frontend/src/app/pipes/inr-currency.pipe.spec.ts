import { InrPipe } from './inr-currency.pipe';

describe('InrPipe', () => {
  let pipe: InrPipe;

  beforeEach(() => {
    pipe = new InrPipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format 1234567.89 as ₹12,34,567.89 (Indian format)', () => {
    expect(pipe.transform(1234567.89)).toBe('₹12,34,567.89');
  });

  it('should format 0 as ₹0.00', () => {
    expect(pipe.transform(0)).toBe('₹0.00');
  });

  it('should return — for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('should return — for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('should format 100 as ₹100.00', () => {
    expect(pipe.transform(100)).toBe('₹100.00');
  });

  it('should handle decimal precision correctly and round up', () => {
    expect(pipe.transform(9999.999)).toBe('₹10,000.00');
  });
});
