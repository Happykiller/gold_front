import { describe, expect, it } from 'vitest';

import { CODES } from '@src/common/codes';
import { CreateOperationUsecase } from '@usecase/createOperation/createOperation.usecase';
import { mockInversify } from '@usecase/testing/inversify.mock';

const base = {
  account_id: 1,
  amount: 10,
  date: '2026-01-01',
  description: 'virement',
  status_id: 2,
  type_id: 3,
  third_id: 1,
  category_id: 1,
};

const sentPayload = (send: { mock: { calls: unknown[][] } }) =>
  send.mock.calls[0][0] as {
    query: string;
    variables: Record<string, unknown>;
  };

describe('CreateOperationUsecase', () => {
  it('transmet au serveur les opérations prises en charge par un virement', async () => {
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { createOperation: { id: 1 } } }),
    );

    const result = await new CreateOperationUsecase(inversify).execute({
      ...base,
      linked_operation_ids: [7, 8],
    });

    expect(result.message).toBe(CODES.SUCCESS);

    // C'est LE test de non-régression de cette fonctionnalité. Le DTO portait
    // déjà les identifiants — sous le nom `linkedOps` — et l'écran de virement
    // les renseignait consciencieusement, mais la mutation ne déclarait pas la
    // variable : la valeur partait dans `variables` et n'était jamais lue.
    // Le lien entre un virement et ses opérations a disparu ainsi, en silence,
    // pendant deux ans.
    const sent = sentPayload(send);
    expect(sent.query).toContain('$linked_operation_ids: [Int!]');
    expect(sent.query).toContain('linked_operation_ids: $linked_operation_ids');
    expect(sent.variables.linked_operation_ids).toEqual([7, 8]);
  });

  it('n’envoie pas de liens quand il n’y en a pas', async () => {
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { createOperation: { id: 1 } } }),
    );

    await new CreateOperationUsecase(inversify).execute(base);

    // La variable reste déclarée dans le document — elle est nullable côté
    // schéma — mais aucune valeur ne l'accompagne.
    expect(sentPayload(send).variables.linked_operation_ids).toBeUndefined();
  });

  it('demande le compteur de liens en retour', async () => {
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { createOperation: { id: 1 } } }),
    );

    await new CreateOperationUsecase(inversify).execute(base);

    expect(sentPayload(send).query).toContain('linked_count');
  });
});
