// src\presentation\hooks\groupOperationsByDay.ts
import dayjs from 'dayjs';

import type { Operation } from '@presentation/hooks/useAccountOperations';

export type OperationDayGroup = {
  /** `YYYY-MM-DD` — identité stable d'un groupe entre deux lots. */
  key: string;
  /** `JEU 07 AOÛT`, dans la langue de l'interface. */
  label: string;
  operations: Operation[];
};

/**
 * Étiquette d'un bandeau de jour.
 *
 * `Intl` plutôt que dayjs : aucune locale dayjs n'est chargée dans le projet,
 * et `dayjs.locale('fr')` est un réglage **global** qui changerait le format
 * de toutes les dates de l'application. La locale reste ici un paramètre, ce
 * qui laisse le module pur et l'étiquette alignée sur `i18n.language`.
 */
function dayLabel(date: dayjs.Dayjs, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  })
    .format(date.toDate())
    .toUpperCase();
}

/**
 * Découpe une liste d'opérations en journées.
 *
 * **Segmentation de suites consécutives, jamais de tri.** Le serveur renvoie
 * `ORDER BY date DESC, id DESC` : les opérations d'un même jour sont contiguës
 * par construction. Re-trier ici entrerait en concurrence avec l'ordre du
 * serveur et casserait la pagination par offset, qui suppose cet ordre.
 *
 * Corollaire assumé : deux suites non contiguës du même jour donneraient deux
 * bandeaux. C'est préférable à un regroupement par clé, qui fusionnerait des
 * journées éloignées dans la liste et ferait sauter des lignes d'un bandeau à
 * l'autre.
 *
 * Le résultat est **dérivé** de la liste accumulée complète, jamais accumulé :
 * une journée coupée entre deux lots de 50 redonne bien un seul groupe.
 */
export function groupOperationsByDay(
  operations: Operation[],
  locale: string,
): OperationDayGroup[] {
  const groups: OperationDayGroup[] = [];

  for (const operation of operations) {
    // `date` arrive en millisecondes epoch **sous forme de chaîne** : sans le
    // `parseInt`, dayjs rend une date invalide, sans rien signaler.
    const date = dayjs(parseInt(operation.date));
    const key = date.format('YYYY-MM-DD');
    const last = groups[groups.length - 1];

    if (last && last.key === key) last.operations.push(operation);
    else
      groups.push({
        key,
        label: dayLabel(date, locale),
        operations: [operation],
      });
  }

  return groups;
}
