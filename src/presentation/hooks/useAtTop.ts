// src\presentation\hooks\useAtTop.ts
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * L'utilisateur est-il en tête de liste ?
 *
 * Une sentinelle observée, et **pas** `window.scrollY` : le conteneur qui
 * défile vient du `LayoutProtected` de `sunny-ui`, et rien ne garantit que
 * c'est la fenêtre. Si c'est un div interne, `scrollY` reste à 0 en
 * permanence — la liste se rechargerait alors sous les yeux de quelqu'un en
 * train de lire, précisément ce qu'on cherche à éviter.
 *
 * `IntersectionObserver` mesure une intersection géométrique et ne dépend
 * d'aucun conteneur nommé. C'est le patron déjà employé par
 * `useInfiniteScroll`, et son doublet de test existe (`setupTests.ts`).
 *
 * Le retour porte **à la fois** un état et une ref. L'état sert au rendu ; la
 * ref sert au gestionnaire d'événement, qui doit lire la valeur courante sans
 * être recréé — sinon on se réabonnerait au flux à chaque défilement.
 */
export function useAtTop() {
  const [atTop, setAtTop] = useState(true);
  const atTopRef = useRef(true);

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!nodeRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      atTopRef.current = visible;
      setAtTop(visible);
    });
    observer.observe(nodeRef.current);
    observerRef.current = observer;
  }, []);

  // Callback ref et non objet ref : la sentinelle n'apparaît qu'avec le premier
  // lot, et un objet ref ne préviendrait personne de son arrivée.
  const setTopSentinel = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      observe();
    },
    [observe],
  );

  useEffect(() => {
    observe();
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [observe]);

  return { atTop, atTopRef, setTopSentinel };
}
