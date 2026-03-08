import { describe, it, expect } from 'vitest';
import { rateChangeToFormState } from '../components/RateChangeEditor/rateChangeFormState';
import type { RateChange } from '../models/RateChange';

describe('rateChangeToFormState', () => {
  it('converts a rate change to form state', () => {
    const rc: RateChange = { id: '1', date: '2025-06-01', annualInterestRate: 3.5 };
    const form = rateChangeToFormState(rc);
    expect(form.date).toBe('2025-06-01');
    expect(form.rate).toBe('3,5');
    expect(form.errors).toEqual({});
  });

  it('formats whole number rates without decimals', () => {
    const rc: RateChange = { id: '2', date: '2025-01-01', annualInterestRate: 5 };
    const form = rateChangeToFormState(rc);
    expect(form.rate).toBe('5');
  });

  it('formats rates with comma separator', () => {
    const rc: RateChange = { id: '3', date: '2025-01-01', annualInterestRate: 2.75 };
    const form = rateChangeToFormState(rc);
    expect(form.rate).toBe('2,75');
  });

  it('handles zero rate', () => {
    const rc: RateChange = { id: '4', date: '2025-01-01', annualInterestRate: 0 };
    const form = rateChangeToFormState(rc);
    expect(form.rate).toBe('0');
  });
});
