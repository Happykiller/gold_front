import { describe, expect, it } from 'vitest';

import { CODES } from '@src/common/codes';
import { CreateOperationLinkUsecase } from '@usecase/createOperationLink/createOperationLink.usecase';
import { graphqlError, mockInversify } from '@usecase/testing/inversify.mock';

const link = { id: 7, operation_id: 42, operation_ref_id: 99, active: true };

describe('CreateOperationLinkUsecase', () => {
  it('envoie le virement porteur et l’opération prise en charge, dans cet ordre', async () => {
    // Le sens du lien est la seule chose que ce usecase peut se tromper, et
    // rien ne le signalerait : l'API accepte les deux, mais l'inverse fait
    // apparaître le lien dans la section « pris en charge par » de la dépense
    // au lieu de celle du virement.
    const { inversify, send } = mockInversify(() =>
      Promise.resolve({ data: { createOperationLink: link } }),
    );

    const result = await new CreateOperationLinkUsecase(inversify).execute({
      operation_id: 42,
      operation_ref_id: 99,
    });

    expect(result.message).toBe(CODES.SUCCESS);

    const sent = send.mock.calls[0][0] as {
      operationName: string;
      variables: Record<string, unknown>;
    };
    expect(sent.operationName).toBe('createOperationLink');
    expect(sent.variables).toEqual({ operation_id: 42, operation_ref_id: 99 });
  });

  it('rend l’identifiant du LIEN, sans quoi la puce posée serait irretirable', async () => {
    // `deleteOperationLink` prend l'id du lien, pas celui de l'opération : si
    // la requête ne le demandait pas, on pourrait rattacher puis plus détacher
    // avant un rechargement de page.
    const { inversify } = mockInversify(() =>
      Promise.resolve({ data: { createOperationLink: link } }),
    );

    const result = await new CreateOperationLinkUsecase(inversify).execute({
      operation_id: 42,
      operation_ref_id: 99,
    });

    expect(result.data?.id).toBe(7);
  });

  it('renvoie FAIL quand le serveur refuse', async () => {
    const { inversify } = mockInversify(() =>
      Promise.resolve(graphqlError('Operation not found')),
    );

    const result = await new CreateOperationLinkUsecase(inversify).execute({
      operation_id: 42,
      operation_ref_id: 404,
    });

    expect(result.message).toBe(CODES.FAIL);
    expect(result.error).toBe('Operation not found');
  });
});
