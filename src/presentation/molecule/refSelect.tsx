// src\presentation\molecule\refSelect.tsx
import * as React from 'react';
import { Trans } from 'react-i18next';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';

/** Ce dont ce composant a besoin d'une entrée de référentiel, et rien de plus. */
export type RefItem = { id: number; label: string };

/** La forme de retour commune à tous les usecases du projet. */
type RefResponse = {
  message: string;
  data?: RefItem[] | null;
  error?: string;
};

export type RefSelectProps = {
  value: string | number;
  label: React.ReactNode;
  onChange: (event: SelectChangeEvent) => void;
  /** Charge le référentiel. Passé plutôt que déduit : c'est la seule chose qui
   *  distinguait les trois copies de ce composant. */
  load: () => Promise<RefResponse>;
  /**
   * Les libellés du référentiel viennent de la base sous forme de **clés
   * i18n** (`operation.type-credit`, `operation.status-follow`,
   * `operation.third-*`, `operation.category-other`).
   *
   * À activer dès qu'un seul libellé du référentiel peut être une clé : la
   * traduction laisse intacte une chaîne sans clé correspondante, donc un
   * référentiel mixte — les catégories, saisies par l'utilisateur sauf une —
   * se traite comme un référentiel fermé. Ne pas l'activer, en revanche,
   * affiche la clé brute.
   */
  translateLabels?: boolean;
  /**
   * Valeur du choix vide.
   *
   * Les appelants divergent — `0` pour les comptes, `''` pour les autres — et
   * cette divergence n'est pas cosmétique : elle décide de ce que le
   * formulaire enverra. On la garde en propriété plutôt que de l'uniformiser
   * à l'aveugle.
   */
  emptyValue?: string | number;
  /** Masque le choix vide, pour un critère obligatoire. */
  required?: boolean;
  /** Restreint la liste — le type de compte, par exemple. */
  filter?: (item: RefItem) => boolean;
  /**
   * Une icône devant chaque entrée.
   *
   * Optionnelle parce que tous les référentiels n'en ont pas : seules les
   * catégories portent un pictogramme, et il est déjà calculé pour la liste
   * des opérations.
   */
  renderIcon?: (item: RefItem) => React.ReactNode;
  /** Espacement laissé à l'appelant : la brique ne décide pas de sa marge. */
  sx?: SxProps<Theme>;
};

/**
 * Un sélecteur de référentiel, chargé à la volée.
 *
 * Il remplace trois composants qui ne différaient que par leur usecase, leur
 * sentinelle de vide et la traduction ou non des libellés — soit une
 * quarantaine de lignes recopiées trois fois, effet de bord compris : chacun
 * rendait son propre message de chargement et sa propre erreur, tous
 * légèrement différents.
 */
export const RefSelect: React.FC<RefSelectProps> = ({
  value,
  label,
  onChange,
  load,
  translateLabels = false,
  emptyValue = '',
  required = false,
  filter,
  renderIcon,
  sx,
}) => {
  const [items, setItems] = React.useState<RefItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // `load` est une fonction reconstruite à chaque rendu par la plupart des
  // appelants : la garder en dépendance relancerait la requête en boucle.
  const loadRef = React.useRef(load);
  loadRef.current = load;

  React.useEffect(() => {
    let alive = true;

    loadRef
      .current()
      .then((response) => {
        if (!alive) return;
        if (response.message === CODES.SUCCESS && response.data)
          setItems(response.data);
        else {
          inversify.loggerService.debug(response.error);
          setError(response.message);
        }
      })
      .catch((err: unknown) => {
        if (alive) setError((err as Error).message);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (error)
    return (
      <Typography sx={{ color: 'error.main', fontSize: 13 }}>
        <Trans>common.{error}</Trans>
      </Typography>
    );

  const visible = filter ? (items ?? []).filter(filter) : (items ?? []);

  return (
    <FormControl variant="standard" fullWidth sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select
        variant="standard"
        size="small"
        displayEmpty
        value={value.toString()}
        onChange={onChange}
        // La liste peut n'être pas encore là : le composant garde sa place au
        // lieu de disparaître puis de réapparaître, ce que faisaient les trois
        // copies en rendant un texte « Chargement… » à la place du champ.
        disabled={items === null}
      >
        {!required && (
          <MenuItem value={emptyValue}>
            <Trans>common.clear</Trans>
          </MenuItem>
        )}
        {visible.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {renderIcon && (
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  mr: '8px',
                  lineHeight: 0,
                  '& .MuiSvgIcon-root': { fontSize: 16 },
                }}
              >
                {renderIcon(item)}
              </Box>
            )}
            <Typography noWrap sx={{ fontSize: 13.5 }}>
              {translateLabels ? <Trans>{item.label}</Trans> : item.label}
            </Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
