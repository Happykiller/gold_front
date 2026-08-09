// src\presentation\hooks\useImportAnalysis.ts
import * as React from 'react';
import dayjs from 'dayjs';

import inversify from '@src/common/inversify';
import { CODES } from '@src/common/codes';
import type { Operation } from '@presentation/hooks/useAccountOperations';
import {
  parseBankStatement,
  type SkippedLine,
} from '@presentation/hooks/bankStatementParse';
import {
  analyseImport,
  type AnalysedRow,
} from '@presentation/hooks/importDiff';

/**
 * Lecture d'un relevé, chargement de l'historique, rapprochement.
 *
 * Le hook isole les trois effets de bord de l'import — un fichier, un réseau,
 * une horloge — de la logique qui les exploite, entièrement pure et testée
 * dans `bankStatementParse` et `importDiff`.
 */

/**
 * Taille d'un lot d'historique.
 *
 * 100 plutôt que les 50 de la liste : la KB mesure ~325 ms à cette taille
 * contre ~170 ms à 50, soit deux fois moins d'allers-retours pour un coût
 * unitaire à peine doublé. Personne ne regarde défiler ce chargement-ci, seul
 * le total compte.
 */
const HISTORY_PAGE_SIZE = 100;

/**
 * Plafond de sécurité du chargement.
 *
 * Le compte le plus fourni porte plus de 10 000 lignes : importer un relevé
 * très ancien les tirerait toutes. Au-delà de ce plafond on s'arrête — et on
 * le **dit**, `truncated` remontant jusqu'à la modale. Une troncature muette
 * ferait passer des opérations déjà présentes pour des nouvelles.
 */
const HISTORY_MAX = 2000;

/**
 * Marge avant la plus ancienne ligne du relevé.
 *
 * Elle rattrape le décalage entre la date bancaire et celle saisie dans Gold.
 * Aucune marge n'est nécessaire *après* : le chargement n'a pas de borne
 * haute, puisqu'une opération pointée porte la date de son pointage.
 */
const HISTORY_MARGIN_DAYS = 15;

export type ImportAnalysisError =
  /** Fichier vide, ou réduit à sa ligne d'en-tête. */
  | 'empty'
  /** Colonnes indispensables absentes — le détail est dans `columns`. */
  | 'missing-columns'
  /** L'historique n'a pas pu être lu : sans lui, tout paraîtrait nouveau. */
  | 'load-failed';

export type ImportAnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: ImportAnalysisError; columns: string[] }
  | {
      status: 'ready';
      lines: AnalysedRow[];
      skipped: SkippedLine[];
      /** Nombre d'opérations confrontées, pour que le compte soit vérifiable. */
      historyCount: number;
      /** Le plafond a été atteint : le rapprochement peut être incomplet. */
      truncated: boolean;
    };

/**
 * Toutes les opérations du compte depuis `dateFrom`, par lots.
 *
 * La liste comprend les virements reçus autant que les opérations émises —
 * c'est le serveur qui en décide, par l'`UNION` de `getOperations`. C'est
 * voulu : un virement reçu apparaît bien sur le relevé du compte crédité.
 */
async function loadHistory(
  accountId: number,
  dateFrom: string,
): Promise<{ operations: Operation[]; truncated: boolean } | null> {
  const operations: Operation[] = [];

  for (let offset = 0; offset < HISTORY_MAX; offset += HISTORY_PAGE_SIZE) {
    const response = await inversify.getOperationsUsecase.execute({
      account_id: accountId,
      limit: HISTORY_PAGE_SIZE,
      offset,
      date_from: dateFrom,
    });

    // Un lot manquant n'est pas un lot vide : poursuivre donnerait un
    // rapprochement fait sur un historique troué, donc des doublons.
    if (response.message !== CODES.SUCCESS || !response.data) return null;

    operations.push(...response.data);
    if (response.data.length < HISTORY_PAGE_SIZE)
      return { operations, truncated: false };
  }

  return { operations, truncated: true };
}

export function useImportAnalysis(accountId: number) {
  const [state, setState] = React.useState<ImportAnalysisState>({
    status: 'idle',
  });

  // Un second dépôt de fichier pendant que le premier charge encore doit
  // gagner : sans ce jeton, la réponse la plus lente écraserait la plus
  // récente et afficherait l'analyse du fichier précédent.
  const runRef = React.useRef(0);

  const reset = React.useCallback(() => {
    runRef.current += 1;
    setState({ status: 'idle' });
  }, []);

  const analyse = React.useCallback(
    async (content: string) => {
      const run = (runRef.current += 1);
      setState({ status: 'loading' });

      const parsed = parseBankStatement(content);
      if (!parsed.ok) {
        if (run === runRef.current)
          setState({
            status: 'error',
            error: parsed.error,
            columns: parsed.columns,
          });
        return;
      }

      const oldest = parsed.rows.reduce(
        (min, row) => (row.date < min ? row.date : min),
        parsed.rows[0]?.date ?? dayjs().format('YYYY-MM-DD'),
      );
      const dateFrom = dayjs(oldest)
        .subtract(HISTORY_MARGIN_DAYS, 'day')
        .format('YYYY-MM-DD');

      const history = await loadHistory(accountId, dateFrom);
      if (run !== runRef.current) return;

      if (!history) {
        setState({ status: 'error', error: 'load-failed', columns: [] });
        return;
      }

      setState({
        status: 'ready',
        lines: analyseImport(parsed.rows, history.operations, accountId),
        skipped: parsed.skipped,
        historyCount: history.operations.length,
        truncated: history.truncated,
      });
    },
    [accountId],
  );

  return { state, analyse, reset };
}
