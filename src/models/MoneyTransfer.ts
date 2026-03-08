export interface MoneyTransfer {
  id: string;
  sourceAccountId: string;
  targetAccountId: string;
  sourceCashFlowId: string;
  targetCashFlowId: string;
  amount: number;
  initiationDate: string;
  withdrawalDate: string;
  depositDate: string;
  description: string;
  createdAt: number;
}
