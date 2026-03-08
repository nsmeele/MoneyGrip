import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { TransferContext, type CreateTransferParams } from './transferContextValue';
import { useTransferStorage } from '../hooks/useTransferStorage';
import { useAccountStore } from './useAccountStore';
import { calculateTransferDates } from '../utils/transferDates';
import type { MoneyTransfer } from '../models/MoneyTransfer';
import type { CashFlow } from '../models/CashFlow';

export function TransferProvider({ children }: { children: ReactNode }) {
  const { transfers, addTransfer, replaceTransfer, removeTransfer, clearTransfers, replaceTransfers, mergeTransfers } = useTransferStorage();
  const { results, handleUpdateCashFlows } = useAccountStore();

  const createTransfer = useCallback((params: CreateTransferParams) => {
    const source = results.find((r) => r.id === params.sourceAccountId);
    const target = results.find((r) => r.id === params.targetAccountId);
    if (!source || !target) return;

    const transferId = crypto.randomUUID();
    const sourceCashFlowId = crypto.randomUUID();
    const targetCashFlowId = crypto.randomUUID();

    const { withdrawalDate, depositDate } = calculateTransferDates({
      initiationDate: params.initiationDate,
      sourceNoticePeriodValue: source.noticePeriodValue,
      sourceNoticePeriodUnit: source.noticePeriodUnit,
      sourceProcessingDays: source.processingDays,
      targetProcessingDays: target.processingDays,
    });

    const withdrawalCashFlow: CashFlow = {
      id: sourceCashFlowId,
      date: withdrawalDate,
      amount: -params.amount,
      description: params.description,
      transferId,
    };

    const depositCashFlow: CashFlow = {
      id: targetCashFlowId,
      date: depositDate,
      amount: params.amount,
      description: params.description,
      transferId,
    };

    const transfer: MoneyTransfer = {
      id: transferId,
      sourceAccountId: params.sourceAccountId,
      targetAccountId: params.targetAccountId,
      sourceCashFlowId,
      targetCashFlowId,
      amount: params.amount,
      initiationDate: params.initiationDate,
      withdrawalDate,
      depositDate,
      description: params.description,
      createdAt: Date.now(),
    };

    // Update both accounts with the new cashflows
    const sourceCashFlows = [...source.cashFlows, withdrawalCashFlow]
      .sort((a, b) => a.date.localeCompare(b.date));
    const targetCashFlows = [...target.cashFlows, depositCashFlow]
      .sort((a, b) => a.date.localeCompare(b.date));

    handleUpdateCashFlows(params.sourceAccountId, sourceCashFlows);
    handleUpdateCashFlows(params.targetAccountId, targetCashFlows);
    addTransfer(transfer);
  }, [results, handleUpdateCashFlows, addTransfer]);

  const updateTransfer = useCallback((oldTransferId: string, params: CreateTransferParams) => {
    const oldTransfer = transfers.find((t) => t.id === oldTransferId);
    if (!oldTransfer) return;

    const source = results.find((r) => r.id === params.sourceAccountId);
    const target = results.find((r) => r.id === params.targetAccountId);
    if (!source || !target) return;

    const newTransferId = crypto.randomUUID();
    const sourceCashFlowId = crypto.randomUUID();
    const targetCashFlowId = crypto.randomUUID();

    const { withdrawalDate, depositDate } = calculateTransferDates({
      initiationDate: params.initiationDate,
      sourceNoticePeriodValue: source.noticePeriodValue,
      sourceNoticePeriodUnit: source.noticePeriodUnit,
      sourceProcessingDays: source.processingDays,
      targetProcessingDays: target.processingDays,
    });

    const withdrawalCashFlow: CashFlow = {
      id: sourceCashFlowId,
      date: withdrawalDate,
      amount: -params.amount,
      description: params.description,
      transferId: newTransferId,
    };

    const depositCashFlow: CashFlow = {
      id: targetCashFlowId,
      date: depositDate,
      amount: params.amount,
      description: params.description,
      transferId: newTransferId,
    };

    const newTransfer: MoneyTransfer = {
      id: newTransferId,
      sourceAccountId: params.sourceAccountId,
      targetAccountId: params.targetAccountId,
      sourceCashFlowId,
      targetCashFlowId,
      amount: params.amount,
      initiationDate: params.initiationDate,
      withdrawalDate,
      depositDate,
      description: params.description,
      createdAt: Date.now(),
    };

    // Remove old cashflows and add new ones atomically
    const oldSource = results.find((r) => r.id === oldTransfer.sourceAccountId);
    const oldTarget = results.find((r) => r.id === oldTransfer.targetAccountId);

    // Build updated cashflow lists: remove old, add new where applicable
    if (oldSource) {
      const filtered = oldSource.cashFlows.filter((cf) => cf.id !== oldTransfer.sourceCashFlowId);
      const updated = params.sourceAccountId === oldTransfer.sourceAccountId
        ? [...filtered, withdrawalCashFlow].sort((a, b) => a.date.localeCompare(b.date))
        : filtered;
      handleUpdateCashFlows(oldTransfer.sourceAccountId, updated);
    }

    if (oldTarget) {
      const filtered = oldTarget.cashFlows.filter((cf) => cf.id !== oldTransfer.targetCashFlowId);
      const updated = params.targetAccountId === oldTransfer.targetAccountId
        ? [...filtered, depositCashFlow].sort((a, b) => a.date.localeCompare(b.date))
        : filtered;
      handleUpdateCashFlows(oldTransfer.targetAccountId, updated);
    }

    // If source/target changed, add cashflows to the new accounts
    if (params.sourceAccountId !== oldTransfer.sourceAccountId && source) {
      const updated = [...source.cashFlows, withdrawalCashFlow].sort((a, b) => a.date.localeCompare(b.date));
      handleUpdateCashFlows(params.sourceAccountId, updated);
    }
    if (params.targetAccountId !== oldTransfer.targetAccountId && target) {
      const updated = [...target.cashFlows, depositCashFlow].sort((a, b) => a.date.localeCompare(b.date));
      handleUpdateCashFlows(params.targetAccountId, updated);
    }

    replaceTransfer(oldTransferId, newTransfer);
  }, [transfers, results, handleUpdateCashFlows, replaceTransfer]);

  const deleteTransfer = useCallback((id: string) => {
    const transfer = transfers.find((t) => t.id === id);
    if (!transfer) return;

    const source = results.find((r) => r.id === transfer.sourceAccountId);
    const target = results.find((r) => r.id === transfer.targetAccountId);

    if (source) {
      const updatedCashFlows = source.cashFlows.filter((cf) => cf.id !== transfer.sourceCashFlowId);
      handleUpdateCashFlows(transfer.sourceAccountId, updatedCashFlows);
    }

    if (target) {
      const updatedCashFlows = target.cashFlows.filter((cf) => cf.id !== transfer.targetCashFlowId);
      handleUpdateCashFlows(transfer.targetAccountId, updatedCashFlows);
    }

    removeTransfer(id);
  }, [transfers, results, handleUpdateCashFlows, removeTransfer]);

  const getTransfersForAccount = useCallback((accountId: string) => {
    return transfers.filter((t) => t.sourceAccountId === accountId || t.targetAccountId === accountId);
  }, [transfers]);

  const value = useMemo(() => ({
    transfers, createTransfer, updateTransfer, deleteTransfer, getTransfersForAccount,
    clearTransfers, replaceTransfers, mergeTransfers,
  }), [transfers, createTransfer, updateTransfer, deleteTransfer, getTransfersForAccount, clearTransfers, replaceTransfers, mergeTransfers]);

  return (
    <TransferContext.Provider value={value}>
      {children}
    </TransferContext.Provider>
  );
}
