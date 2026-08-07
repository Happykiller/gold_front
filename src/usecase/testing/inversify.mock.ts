import { vi } from 'vitest';

import { Inversify } from '@src/common/inversify';

/**
 * Conteneur d'injection réduit au strict nécessaire pour tester un usecase.
 *
 * Les usecases ne consomment du conteneur que `graphqlService` et
 * `loggerService` ; les monter en entier reviendrait à instancier toute
 * l'application pour vérifier trois lignes.
 */
export function mockInversify(sendImpl?: (datas: unknown) => Promise<unknown>) {
  const send = vi.fn(sendImpl ?? (() => Promise.resolve({ data: {} })));

  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const inversify = {
    graphqlService: { send },
    loggerService: logger,
  } as unknown as Inversify;

  return { inversify, send, logger };
}

/** Réponse GraphQL en erreur, telle que la renvoie le serveur. */
export function graphqlError(message: string) {
  return { errors: [{ message }] };
}
