// Calcul de la ventilation : répartir un montant d'un compte d'origine vers
// plusieurs comptes de destination, chaque ligne étant exprimée soit en
// pourcentage, soit en montant fixe.
//
// Extrait du composant pour être testable : c'est de l'argent qu'on répartit,
// et une erreur d'arrondi ici produit des opérations fausses en base.

/** Une ligne de destination, telle que saisie dans le formulaire. */
export interface VentilationDestinationInput {
  isPercentage: boolean;
  /** Saisie brute : la virgule décimale est acceptée. */
  amountStr: { value: string };
}

/**
 * Convertit une saisie utilisateur en nombre.
 * Une saisie vide ou non numérique vaut 0 — jamais NaN, qui contaminerait
 * tous les totaux en aval.
 */
export function parseAmount(value: string): number {
  return parseFloat(value.replace(',', '.')) || 0;
}

/** Montant réel d'une ligne, selon qu'elle est en pourcentage ou en valeur. */
export function destinationAmount(
  destination: VentilationDestinationInput,
  totalAmount: number,
): number {
  const value = parseAmount(destination.amountStr.value);
  return destination.isPercentage ? (totalAmount * value) / 100 : value;
}

/**
 * Somme des montants répartis, arrondie au centime.
 *
 * L'arrondi est indispensable : trois lignes à 33,33 % d'un montant donnent
 * en binaire une somme légèrement différente du total, et la comparaison
 * d'égalité qui autorise la validation échouerait sans lui.
 */
export function totalAllocated(
  destinations: VentilationDestinationInput[],
  totalAmount: number,
): number {
  const sum = destinations.reduce(
    (acc, destination) => acc + destinationAmount(destination, totalAmount),
    0,
  );
  return Math.round(sum * 100) / 100;
}

/** Le total réparti dépasse-t-il le montant à ventiler ? */
export function isExceeded(
  destinations: VentilationDestinationInput[],
  totalAmount: number,
): boolean {
  return (
    totalAllocated(destinations, totalAmount) > totalAmount && totalAmount > 0
  );
}

/**
 * La répartition est-elle complète ? Elle doit tomber juste : ni reste, ni
 * dépassement, et sur un montant non nul.
 */
export function isFullyAllocated(
  destinations: VentilationDestinationInput[],
  totalAmount: number,
): boolean {
  return (
    totalAllocated(destinations, totalAmount) === totalAmount && totalAmount > 0
  );
}
