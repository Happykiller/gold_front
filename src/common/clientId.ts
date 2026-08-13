// src\common\clientId.ts
/**
 * L'identité de cet onglet, le temps de sa vie.
 *
 * Elle part en en-tête `x-gold-client` sur chaque appel GraphQL ; le serveur la
 * recopie dans les événements que cet appel provoque. L'onglet peut ainsi
 * ignorer **l'écho de ses propres écritures** — qu'il a déjà appliquées à
 * l'écran, parfois de façon optimiste (`recoOperation`, `removeOperation`) —
 * sans ignorer celles des autres onglets, ni celles de l'extension, qui
 * n'envoie pas cet en-tête.
 *
 * Sans ce mécanisme, pointer une opération depuis la liste ferait revenir un
 * événement provoqué par soi-même : rechargement complet, retour en tête de
 * liste et perte de la mise à jour locale.
 *
 * En mémoire, jamais persistée : deux onglets doivent avoir deux identités, et
 * un rechargement peut en changer sans conséquence.
 *
 * **Ce module n'importe rien**, et c'est délibéré : ce qui doit rester testable
 * ne traverse pas le conteneur d'injection (voir
 * `docs/KB/DAT/injection-dependances.md`).
 */
export const CLIENT_ID: string =
  // `randomUUID` n'existe qu'en contexte sécurisé — le cas en localhost comme
  // en https — et manque dans jsdom. Le repli n'a pas besoin d'être
  // cryptographique : il ne sert qu'à distinguer deux onglets d'un même
  // utilisateur.
  globalThis.crypto?.randomUUID?.() ??
  `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
