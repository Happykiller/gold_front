// src\presentation\hooks\useStickyBottom.ts
import { useEffect, useRef } from 'react';

import { STICKY_TOP_VAR } from '@presentation/molecule/appLayout';

/**
 * Publie le bas réel d'une barre collante, pour que ce qui la suit s'y cale.
 *
 * **Mesuré et non calculé.** La somme « hauteur de la barre de navigation +
 * hauteur de la barre d'écran » paraissait suffire, mais aucun des deux termes
 * n'est garanti : la barre du socle se dimensionne sur son contenu, et celle
 * de l'écran grandit dès qu'une puce de recherche est posée. Une valeur devinée
 * décale tous les éléments collants en dessous, et le décalage ne se voit qu'à
 * l'écran — aucune barrière automatique ne l'attrape.
 *
 * Le `ResizeObserver` suit les deux cas sans que personne n'ait à prévenir.
 */
export function useStickyBottom() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const publish = () => {
      // `bottom` est relatif au viewport : la barre étant collante, c'est
      // exactement l'offset auquel la suite doit se caler.
      const { bottom } = node.getBoundingClientRect();
      document.documentElement.style.setProperty(
        STICKY_TOP_VAR,
        `${Math.round(bottom)}px`,
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    window.addEventListener('resize', publish);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publish);
      document.documentElement.style.removeProperty(STICKY_TOP_VAR);
    };
  }, []);

  return ref;
}
