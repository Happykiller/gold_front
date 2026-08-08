import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Le DOM est partagé entre les tests d'un même fichier : sans ce nettoyage,
// un composant monté dans un test reste interrogeable dans le suivant.
afterEach(() => {
  cleanup();
});

/**
 * jsdom n'implémente pas non plus `ResizeObserver`, dont l'en-tête du compte se
 * sert pour publier sa hauteur réelle. Il ne calcule aucune géométrie : le
 * doublet ne sert qu'à laisser le composant se monter.
 */
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver =
  ResizeObserverStub as unknown as typeof ResizeObserver;

/**
 * jsdom n'implémente pas `IntersectionObserver` : sans ce doublet, tout test
 * rendant la table des opérations échouerait sur un `ReferenceError`.
 *
 * Les instances créées sont conservées pour que les tests puissent simuler
 * l'entrée en vue de la sentinelle — jsdom ne calcule aucune géométrie, c'est
 * donc le seul moyen de déclencher le comportement.
 */
class IntersectionObserverStub implements IntersectionObserver {
  static instances: IntersectionObserverStub[] = [];

  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number> = [];
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.rootMargin = options?.rootMargin ?? '0px';
    IntersectionObserverStub.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  disconnect() {
    this.observed.clear();
    this.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Simule l'entrée en vue de tous les éléments observés. */
  trigger(isIntersecting = true) {
    const entries = [...this.observed].map(
      (target) => ({ target, isIntersecting }) as IntersectionObserverEntry,
    );
    if (entries.length) this.callback(entries, this);
  }
}

globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

export { IntersectionObserverStub };

afterEach(() => {
  IntersectionObserverStub.instances = [];
});
