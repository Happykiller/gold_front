import { describe, expect, it } from 'vitest';

import { CODES } from '@src/common/codes';
import { SetRecoUsecase } from '@usecase/setReco/setReco.usecase';
import { graphqlError, mockInversify } from '@usecase/testing/inversify.mock';

describe('SetRecoUsecase', () => {
  it('rapproche une opération en la passant au statut 2', async () => {
    // Le rapprochement bancaire est l'acte central du produit : il fait
    // basculer une opération du solde prévisionnel vers le solde réel.
    // Le statut 2 (operation.status-reconciled) est en dur dans la requête.
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { updateOperation: { id: 42 } } }),
    );

    const result = await new SetRecoUsecase(inversify).execute({
      operation_id: 42,
    });

    expect(result.message).toBe(CODES.SUCCESS);

    const sent = send.mock.calls[0][0] as {
      operationName: string;
      query: string;
      variables: Record<string, unknown>;
    };
    // L'opération s'appelait elle aussi « updateOperation », en collision avec
    // celle de UpdateOperationUsecase : deux documents distincts sous le même
    // nom, ce que le codegen refuse. Seul le libellé du document change, le
    // resolver appelé reste bien `updateOperation`.
    expect(sent.operationName).toBe('setOperationReconciled');
    expect(sent.query).toContain('status_id: 2');
    expect(sent.variables.operation_id).toBe(42);
  });

  it('date le rapprochement du jour, au format attendu par le serveur', async () => {
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { updateOperation: { id: 1 } } }),
    );

    await new SetRecoUsecase(inversify).execute({ operation_id: 1 });

    const { variables } = send.mock.calls[0][0] as {
      variables: { date: string };
    };
    expect(variables.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('renvoie FAIL quand le serveur refuse', async () => {
    const { inversify } = mockInversify(() =>
      Promise.resolve(graphqlError('Operation not found')),
    );

    const result = await new SetRecoUsecase(inversify).execute({
      operation_id: 999,
    });

    expect(result.message).toBe(CODES.FAIL);
    expect(result.error).toBe('Operation not found');
  });
});
