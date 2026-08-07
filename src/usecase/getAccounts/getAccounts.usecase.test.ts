import { describe, expect, it } from 'vitest';

import { CODES } from '@src/common/codes';
import { GetAccountsUsecase } from '@usecase/getAccounts/getAccounts.usecase';
import { graphqlError, mockInversify } from '@usecase/testing/inversify.mock';

const account = (id: number, label: string) => ({
  id,
  label,
  type_id: 1,
  parent_account_id: null,
  balance_reconcilied: 0,
  balance_not_reconcilied: 0,
});

describe('GetAccountsUsecase', () => {
  it('trie les comptes par libellé', async () => {
    const { inversify } = mockInversify(() =>
      Promise.resolve({
        data: {
          accounts: [
            account(1, 'Zébu'),
            account(2, 'Courant'),
            account(3, 'Épargne'),
          ],
        },
      }),
    );

    const result = await new GetAccountsUsecase(inversify).execute();

    expect(result.message).toBe(CODES.SUCCESS);
    expect(result.data?.map((a) => a.label)).toEqual([
      'Courant',
      'Épargne',
      'Zébu',
    ]);
  });

  it('utilise localeCompare, et non un tri binaire', async () => {
    // Un tri par ordre de code place 'Épargne' après 'Zébu' : c'est
    // exactement ce que localeCompare doit éviter.
    const { inversify } = mockInversify(() =>
      Promise.resolve({
        data: { accounts: [account(1, 'Zébu'), account(2, 'Épargne')] },
      }),
    );

    const result = await new GetAccountsUsecase(inversify).execute();

    expect(result.data?.[0].label).toBe('Épargne');
  });

  it('renvoie FAIL et le message du serveur quand la requête est en erreur', async () => {
    const { inversify } = mockInversify(() =>
      Promise.resolve(graphqlError('Access token is not set')),
    );

    const result = await new GetAccountsUsecase(inversify).execute();

    expect(result.message).toBe(CODES.FAIL);
    expect(result.error).toBe('Access token is not set');
    expect(result.data).toBeUndefined();
  });

  it('ne laisse jamais remonter une exception', async () => {
    // Le contrat des usecases : renvoyer FAIL, jamais lever. Les composants
    // testent `message`, ils n'ont pas de try/catch.
    const { inversify } = mockInversify(() =>
      Promise.reject(new Error('réseau injoignable')),
    );

    const result = await new GetAccountsUsecase(inversify).execute();

    expect(result.message).toBe(CODES.FAIL);
    expect(result.error).toBe('réseau injoignable');
  });

  it("interroge l'opération 'accounts'", async () => {
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { accounts: [] } }),
    );

    await new GetAccountsUsecase(inversify).execute();

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ operationName: 'accounts' }),
    );
  });
});
