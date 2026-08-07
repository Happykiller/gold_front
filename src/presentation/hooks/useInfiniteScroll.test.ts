import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { IntersectionObserverStub } from '@src/setupTests';
import { useInfiniteScroll } from './useInfiniteScroll';

/** Dernier observer instancié, celui que le hook vient de poser. */
const lastObserver = () =>
  IntersectionObserverStub.instances[
    IntersectionObserverStub.instances.length - 1
  ];

/** Monte le hook et lui fournit une sentinelle, comme le ferait la table. */
const renderWithSentinel = (onIntersect: () => void, enabled: boolean) => {
  const node = document.createElement('div');
  const view = renderHook(
    ({ on, en }) => useInfiniteScroll({ onIntersect: on, enabled: en }),
    { initialProps: { on: onIntersect, en: enabled } },
  );
  act(() => view.result.current(node));
  return view;
};

describe('useInfiniteScroll', () => {
  it('signale l’entrée en vue de la sentinelle', () => {
    const onIntersect = vi.fn();
    renderWithSentinel(onIntersect, true);

    act(() => lastObserver().trigger());

    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it('ne signale rien quand la sentinelle sort de vue', () => {
    const onIntersect = vi.fn();
    renderWithSentinel(onIntersect, true);

    act(() => lastObserver().trigger(false));

    expect(onIntersect).not.toHaveBeenCalled();
  });

  it('n’observe rien quand il n’y a plus rien à charger', () => {
    const onIntersect = vi.fn();
    renderWithSentinel(onIntersect, false);

    // Aucun observer n'est même instancié : rien ne tourne en fin de liste.
    expect(IntersectionObserverStub.instances).toHaveLength(0);
    expect(onIntersect).not.toHaveBeenCalled();
  });

  it('observe dès que le chargement redevient possible', () => {
    // La sentinelle est montée alors qu'un lot est en vol (`enabled` faux),
    // puis le lot revient. Un objet ref n'aurait prévenu personne de son
    // apparition, et l'observer n'aurait jamais été posé.
    const onIntersect = vi.fn();
    const node = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ en }) => useInfiniteScroll({ onIntersect, enabled: en }),
      { initialProps: { en: false } },
    );
    act(() => result.current(node));
    expect(IntersectionObserverStub.instances).toHaveLength(0);

    rerender({ en: true });

    expect(IntersectionObserverStub.instances).toHaveLength(1);
    act(() => lastObserver().trigger());
    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it('appelle toujours le callback le plus récent', () => {
    // L'observer n'est pas recréé à chaque rendu : sans la ref interne, il
    // continuerait d'appeler la version initiale de `loadMore`, figée sur un
    // `hasMore` périmé.
    const first = vi.fn();
    const second = vi.fn();
    const node = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ on }) => useInfiniteScroll({ onIntersect: on, enabled: true }),
      { initialProps: { on: first } },
    );
    act(() => result.current(node));

    rerender({ on: second });
    act(() => lastObserver().trigger());

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('débranche l’observer au démontage', () => {
    const node = document.createElement('div');
    const { result, unmount } = renderHook(() =>
      useInfiniteScroll({ onIntersect: vi.fn(), enabled: true }),
    );
    act(() => result.current(node));
    const observer = lastObserver();

    unmount();

    expect(observer.disconnected).toBe(true);
  });
});
