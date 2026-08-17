import { IndianDatePipe } from './indian-date.pipe';

describe('IndianDatePipe', () => {
  let pipe: IndianDatePipe;

  beforeEach(() => {
    pipe = new IndianDatePipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format ISO date string as dd/MM/yyyy', () => {
    const result = pipe.transform('2026-08-15');
    expect(result).toMatch(/15\/08\/2026/);
  });

  it('should return — for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('should return — for empty string', () => {
    expect(pipe.transform('')).toBe('—');
  });

  it('should include time when showTime is true', () => {
    const result = pipe.transform('2026-08-15T10:30:00', true);
    expect(result).toContain('10');
  });

  it('should handle Date objects', () => {
    const date = new Date(2026, 7, 15); // Aug 15, 2026
    const result = pipe.transform(date);
    expect(result).toMatch(/15\/08\/2026/);
  });
});
