import { describe, expect, it } from 'vitest';

import { CODES } from '@src/common/codes';
import { UpdateAccountUsecase } from '@usecase/updateAccount/updateAccount.usecase';
import { graphqlError, mockInversify } from '@usecase/testing/inversify.mock';

const updated = {
  id: 7,
  label: 'Courant',
  type_id: 1,
  parent_account_id: null,
  description: null,
  balance_reconcilied: 100,
  balance_not_reconcilied: 90,
};

describe('UpdateAccountUsecase', () => {
  it('envoie les champs modifiés avec l’identifiant du compte', async () => {
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { updateAccount: updated } }),
    );

    const result = await new UpdateAccountUsecase(inversify).execute({
      account_id: 7,
      label: 'Courant',
      type_id: 1,
    });

    expect(result.message).toBe(CODES.SUCCESS);
    expect(result.data?.label).toBe('Courant');

    const sent = send.mock.calls[0][0] as {
      operationName: string;
      variables: Record<string, unknown>;
    };
    expect(sent.operationName).toBe('updateAccount');
    expect(sent.variables).toEqual({
      account_id: 7,
      label: 'Courant',
      type_id: 1,
    });
  });

  it('accepte une mise à jour partielle', async () => {
    // `label` et `type_id` sont optionnels côté serveur : ne pas les passer
    // laisse la valeur en place. C'est ce qui permettra de n'envoyer que ce
    // qui change.
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { updateAccount: updated } }),
    );

    await new UpdateAccountUsecase(inversify).execute({
      account_id: 7,
      label: 'Nouveau nom',
    });

    const { variables } = send.mock.calls[0][0] as {
      variables: Record<string, unknown>;
    };
    expect(variables).toEqual({ account_id: 7, label: 'Nouveau nom' });
    expect(variables.type_id).toBeUndefined();
  });

  it('renvoie FAIL et le message du serveur en cas de refus', async () => {
    const { inversify } = mockInversify(() =>
      Promise.resolve(graphqlError('ACCOUNT_NOT_FOUND')),
    );

    const result = await new UpdateAccountUsecase(inversify).execute({
      account_id: 999999,
      label: 'x',
    });

    expect(result.message).toBe(CODES.FAIL);
    expect(result.error).toBe('ACCOUNT_NOT_FOUND');
    expect(result.data).toBeUndefined();
  });

  it('ne laisse pas échapper une erreur réseau', async () => {
    const { inversify } = mockInversify(() =>
      Promise.reject(new Error('réseau injoignable')),
    );

    const result = await new UpdateAccountUsecase(inversify).execute({
      account_id: 7,
      label: 'x',
    });

    expect(result.message).toBe(CODES.FAIL);
    expect(result.error).toBe('réseau injoignable');
  });
});
