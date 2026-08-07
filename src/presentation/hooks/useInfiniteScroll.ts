// src\presentation\hooks\useInfiniteScroll.ts
import { useCallback, useEffect, useRef } from 'react';

/**
 * Marge d'anticipation : la sentinelle est considérée comme atteinte 400 px
 * avant d'être réellement visible, pour que le lot suivant arrive pendant que
 * l'utilisateur scrolle encore plutôt qu'une fois arrivé sur le vide.
 */
const ROOT_MARGIN = '400px';

type Options = {
  /** Appelé quand la sentinelle entre dans le viewport. */
  onIntersect: () => void;
  /** Faux quand il n'y a plus rien à charger, ou qu'un lot est déjà en vol. */
  enabled: boolean;
};

/**
 * Observe un élément vide placé en fin de liste et signale son approche.
 *
 * `IntersectionObserver` plutôt que `useInView` de framer-motion — la lib est
 * bien installée, mais lier le chargement des données à une bibliothèque
 * d'animation la rendrait difficile à retirer. C'est aussi la seule API à
 * n'écouter aucun événement de scroll : rien ne tourne entre deux passages.
 *
 * Le retour est une **callback ref**, pas un objet ref : la sentinelle n'est
 * rendue qu'une fois le premier lot arrivé, et un objet ref ne préviendrait
 * personne de son apparition — l'observer ne serait jamais posé.
 */
export function useInfiniteScroll({ onIntersect, enabled }: Options) {
  // Passer par une ref évite qu'un simple changement d'identité du callback
  // ne fasse recréer l'observer à chaque rendu.
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!enabled || !nodeRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(nodeRef.current);
    observerRef.current = observer;
  }, [enabled]);

  const setSentinel = useCallback(
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

  return setSentinel;
}
