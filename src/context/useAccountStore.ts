import { useContext } from 'react';
import { AccountStoreContext } from './accountStoreContextValue';
import type { AccountStoreContextValue } from './accountStoreContextValue';

export type { AccountStoreContextValue };

export function useAccountStore(): AccountStoreContextValue {
  const ctx = useContext(AccountStoreContext);
  if (!ctx) throw new Error('useAccountStore must be used within AccountStoreProvider');
  return ctx;
}
