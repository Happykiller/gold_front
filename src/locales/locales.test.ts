import { describe, expect, it } from 'vitest';

import fr from './fr/translation.json';
import en from './en/translation.json';

/**
 * Une clé absente d'un fichier de traduction ne casse rien : `<Trans>` affiche
 * la clé brute, et aucune autre barrière ne la voit. Le défaut reste donc
 * invisible jusqu'au jour où un écran affiche le libellé.
 *
 * Vécu le 2026-08-08 sur `operation.status-follow`, absente des deux fichiers,
 * et retrouvé ici sur `operation.type`, présente en français seulement depuis
 * l'origine.
 */
function flatten(node: unknown, prefix = ''): string[] {
  if (node === null || typeof node !== 'object') return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(
    ([key, value]) => flatten(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('parité des fichiers de traduction', () => {
  const frKeys = new Set(flatten(fr));
  const enKeys = new Set(flatten(en));

  it('ne laisse aucune clé française sans équivalent anglais', () => {
    expect([...frKeys].filter((key) => !enKeys.has(key))).toEqual([]);
  });

  it('ne laisse aucune clé anglaise sans équivalent français', () => {
    expect([...enKeys].filter((key) => !frKeys.has(key))).toEqual([]);
  });
});
