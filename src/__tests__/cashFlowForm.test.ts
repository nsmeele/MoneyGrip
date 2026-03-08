import { describe, it, expect } from 'vitest';
import { cashFlowToFormState } from '../components/CashFlowEditor/cashFlowFormState';
import type { CashFlow } from '../models/CashFlow';

describe('cashFlowToFormState', () => {
  it('converts a deposit to form state', () => {
    const cf: CashFlow = {
      id: '1', date: '2025-06-01', amount: 500, description: 'Storting',
    };
    const form = cashFlowToFormState(cf);
    expect(form.isWithdrawal).toBe(false);
    expect(form.amount).toBe('500');
    expect(form.date).toBe('2025-06-01');
    expect(form.description).toBe('Storting');
    expect(form.isRecurring).toBe(false);
    expect(form.amountError).toBe('');
  });

  it('converts a withdrawal to form state with positive amount', () => {
    const cf: CashFlow = {
      id: '2', date: '2025-07-15', amount: -250, description: 'Opname',
    };
    const form = cashFlowToFormState(cf);
    expect(form.isWithdrawal).toBe(true);
    expect(form.amount).toBe('250');
  });

  it('formats decimal amounts with comma separator', () => {
    const cf: CashFlow = {
      id: '3', date: '2025-01-01', amount: 1234.56, description: 'Test',
    };
    const form = cashFlowToFormState(cf);
    expect(form.amount).toBe('1234,56');
  });

  it('formats whole numbers without unnecessary decimals', () => {
    const cf: CashFlow = {
      id: '4', date: '2025-01-01', amount: 500, description: 'Test',
    };
    const form = cashFlowToFormState(cf);
    expect(form.amount).toBe('500');
  });

  it('converts a recurring cashflow with end date', () => {
    const cf: CashFlow = {
      id: '5', date: '2025-01-01', amount: 100, description: 'Maandelijks',
      recurring: { intervalMonths: 1, endDate: '2025-12-31' },
    };
    const form = cashFlowToFormState(cf);
    expect(form.isRecurring).toBe(true);
    expect(form.intervalMonths).toBe(1);
    expect(form.endDate).toBe('2025-12-31');
  });

  it('converts a recurring cashflow without end date', () => {
    const cf: CashFlow = {
      id: '6', date: '2025-01-01', amount: 200, description: 'Kwartaal',
      recurring: { intervalMonths: 3 },
    };
    const form = cashFlowToFormState(cf);
    expect(form.isRecurring).toBe(true);
    expect(form.intervalMonths).toBe(3);
    expect(form.endDate).toBe('');
  });

  it('sets default interval for non-recurring cashflow', () => {
    const cf: CashFlow = {
      id: '7', date: '2025-01-01', amount: 100, description: 'Eenmalig',
    };
    const form = cashFlowToFormState(cf);
    expect(form.isRecurring).toBe(false);
    expect(form.intervalMonths).toBe(1);
    expect(form.endDate).toBe('');
  });
});
