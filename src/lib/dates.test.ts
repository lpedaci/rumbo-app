import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, formatDate, formatNumber, formatPercent, relativeDue, stageForOffset } from './dates';

describe('dates', () => {
  it('adds calendar days across months and years', () => {
    expect(addDays('2026-10-13', 30)).toBe('2026-11-12');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2026-10-13', -7)).toBe('2026-10-06');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-13', '2026-11-10')).toBe(28);
    expect(daysBetween('2026-11-24', '2026-11-10')).toBe(-14);
  });

  it('formats dates as DD/MM/AAAA', () => {
    expect(formatDate('2026-10-13')).toBe('13/10/2026');
    expect(formatDate('2026-11-09T12:18:00.000Z')).toBe('09/11/2026');
  });

  it('formats numbers with dot thousands and comma decimals', () => {
    expect(formatNumber(1248)).toBe('1.248');
    expect(formatNumber(57.25, 1)).toBe('57,3');
    expect(formatPercent(84.4)).toBe('84 %');
  });

  it('maps offsets to stages with the limits of section 7', () => {
    expect(stageForOffset(-1)).toBe('preboarding');
    expect(stageForOffset(0)).toBe('week1');
    expect(stageForOffset(6)).toBe('week1');
    expect(stageForOffset(7)).toBe('month1');
    expect(stageForOffset(29)).toBe('month1');
    expect(stageForOffset(30)).toBe('days30to90');
    expect(stageForOffset(90)).toBe('days30to90');
  });
});

describe('relativeDue', () => {
  it('names nearby days and counts the rest', () => {
    expect(relativeDue('2026-11-10', '2026-11-10')).toEqual({ key: 'today' });
    expect(relativeDue('2026-11-11', '2026-11-10')).toEqual({ key: 'tomorrow' });
    expect(relativeDue('2026-11-09', '2026-11-10')).toEqual({ key: 'yesterday' });
    expect(relativeDue('2026-11-15', '2026-11-10')).toEqual({ key: 'inDays', count: 5 });
    expect(relativeDue('2026-10-27', '2026-11-10')).toEqual({ key: 'daysAgo', count: 14 });
  });
});
