// src\presentation\molecule\accouts\accounts.ts
import { AccountUsecaseModel } from '@usecase/model/account.usecase.model';

export type FormattedAccount = AccountUsecaseModel & {
  children: FormattedAccount[];
  balance_reconcilied_aggregate: number;
  balance_not_reconcilied_aggregate: number;
};

export function formatAccounts(
  accounts: AccountUsecaseModel[],
): FormattedAccount[] {
  const map = new Map<number, FormattedAccount>();

  // Clone accounts and initialize children and aggregates
  accounts.forEach((acc) => {
    map.set(acc.id, {
      ...acc,
      children: [],
      balance_reconcilied_aggregate: acc.balance_reconcilied,
      balance_not_reconcilied_aggregate: acc.balance_not_reconcilied,
    });
  });

  // Build tree
  const roots: FormattedAccount[] = [];
  map.forEach((acc) => {
    if (acc.parent_account_id && map.has(acc.parent_account_id)) {
      map.get(acc.parent_account_id)!.children.push(acc);
    } else {
      roots.push(acc);
    }
  });

  // Recursive aggregate sums
  const aggregate = (node: FormattedAccount) => {
    node.children.forEach((child) => {
      aggregate(child);
      node.balance_reconcilied_aggregate += child.balance_reconcilied_aggregate;
      node.balance_not_reconcilied_aggregate +=
        child.balance_not_reconcilied_aggregate;
    });
  };
  roots.forEach(aggregate);

  return roots;
}
