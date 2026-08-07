import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { CODES } from '@src/common/codes';

// Le hook consomme le singleton d'injection, pas un conteneur qu'on lui
// passerait : il faut donc doubler le module lui-même.
const mocks = vi.hoisted(() => ({
  getOperations: vi.fn(),
  getAccount: vi.fn(),
}));

vi.mock('@src/common/inversify', () => ({
  default: {
    getOperationsUsecase: { execute: mocks.getOperations },
    getAccountUsecase: { execute: mocks.getAccount },
  },
}));

import {
  useAccountOperations,
  OPERATIONS_PAGE_SIZE,
} from './useAccountOperations';

/** Un lot d'opérations aux identifiants contigus. */
const batch = (size: number, firstId = 0) =>
  Array.from({ length: size }, (_, i) => ({
    id: firstId + i,
    amount: 10,
    status_id: 1,
  }));

const success = (data: unknown) =>
  Promise.resolve({ message: CODES.SUCCESS, data });

/** L'offset demandé au n-ième appel de l'usecase. */
const offsetOfCall = (n: number) => mocks.getOperations.mock.calls[n][0].offset;

describe('useAccountOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAccount.mockReturnValue(success({ id: 1 }));
  });

  it('charge un premier lot et le déclare incomplet quand il ne l’est pas', async () => {
    mocks.getOperations.mockReturnValue(success(batch(OPERATIONS_PAGE_SIZE)));

    const { result } = renderHook(() => useAccountOperations(1));

    await waitFor(() =>
      expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE),
    );
    expect(offsetOfCall(0)).toBe(0);
    expect(mocks.getOperations.mock.calls[0][0].limit).toBe(
      OPERATIONS_PAGE_SIZE,
    );
    // Un lot plein ne prouve pas qu'il reste des données, mais c'est le seul
    // signal disponible : le serveur ne renvoie aucun total.
    expect(result.current.hasMore).toBe(true);
  });

  it('ajoute le lot suivant au précédent au lieu de le remplacer', async () => {
    mocks.getOperations
      .mockReturnValueOnce(success(batch(OPERATIONS_PAGE_SIZE)))
      .mockReturnValueOnce(
        success(batch(OPERATIONS_PAGE_SIZE, OPERATIONS_PAGE_SIZE)),
      );

    const { result } = renderHook(() => useAccountOperations(1));
    await waitFor(() =>
      expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE),
    );

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE * 2),
    );
    expect(offsetOfCall(1)).toBe(OPERATIONS_PAGE_SIZE);
    // C'est bien une accumulation : la première opération est toujours là.
    expect(result.current.operations?.[0].id).toBe(0);
  });

  it('arrête la liste sur un lot incomplet', async () => {
    mocks.getOperations.mockReturnValue(
      success(batch(OPERATIONS_PAGE_SIZE - 1)),
    );

    const { result } = renderHook(() => useAccountOperations(1));
    await waitFor(() => expect(result.current.hasMore).toBe(false));

    act(() => result.current.loadMore());

    // La sentinelle peut rappeler `loadMore` autant qu'elle veut : plus rien
    // ne part.
    expect(mocks.getOperations).toHaveBeenCalledTimes(1);
  });

  it('ne lance pas un second lot pendant qu’un lot est en vol', async () => {
    let releaseFirst: (v: unknown) => void = () => {};
    mocks.getOperations.mockReturnValueOnce(
      new Promise((resolve) => {
        releaseFirst = resolve;
      }),
    );

    const { result } = renderHook(() => useAccountOperations(1));

    // Le premier lot n'est pas encore revenu : la sentinelle insiste.
    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    expect(mocks.getOperations).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseFirst({
        message: CODES.SUCCESS,
        data: batch(OPERATIONS_PAGE_SIZE),
      });
    });
    expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE);
  });

  it('ne décale pas l’offset quand une opération est supprimée', async () => {
    // Le point sensible : `removeOperation` retire une ligne de l'affichage
    // sans que le serveur en sache rien. Déduire l'offset de la longueur de la
    // liste ferait sauter une opération au lot suivant.
    mocks.getOperations.mockReturnValue(success(batch(OPERATIONS_PAGE_SIZE)));

    const { result } = renderHook(() => useAccountOperations(1));
    await waitFor(() =>
      expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE),
    );

    act(() => result.current.removeOperation(0));
    expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE - 1);

    act(() => result.current.loadMore());

    await waitFor(() => expect(mocks.getOperations).toHaveBeenCalledTimes(2));
    expect(offsetOfCall(1)).toBe(OPERATIONS_PAGE_SIZE);
  });

  it('repart du premier lot au rafraîchissement', async () => {
    mocks.getOperations.mockReturnValue(success(batch(OPERATIONS_PAGE_SIZE)));

    const { result } = renderHook(() => useAccountOperations(1));
    await waitFor(() =>
      expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE),
    );
    act(() => result.current.loadMore());
    await waitFor(() => expect(mocks.getOperations).toHaveBeenCalledTimes(2));

    act(() => result.current.reload());

    await waitFor(() => expect(mocks.getOperations).toHaveBeenCalledTimes(3));
    expect(offsetOfCall(2)).toBe(0);
    // L'accumulation est repartie de zéro, pas empilée sur les deux lots.
    await waitFor(() =>
      expect(result.current.operations).toHaveLength(OPERATIONS_PAGE_SIZE),
    );
    expect(result.current.hasMore).toBe(true);
  });

  it('ne relance pas indéfiniment un lot en échec', async () => {
    mocks.getOperations.mockReturnValue(
      Promise.resolve({ message: CODES.FAIL, error: 'boom' }),
    );

    const { result } = renderHook(() => useAccountOperations(1));

    await waitFor(() => expect(result.current.errorOps).toBe(CODES.FAIL));
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.loadMore());
    expect(mocks.getOperations).toHaveBeenCalledTimes(1);
  });
});
