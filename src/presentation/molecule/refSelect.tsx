// src\presentation\molecule\refSelect.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
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
  /** Reçoit l'identifiant choisi, ou la sentinelle de vide. */
  onChange: (value: string) => void;
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
   * Valeur rendue quand le champ est vidé.
   *
   * Les appelants divergent — `0` pour les comptes, `''` pour les autres — et
   * cette divergence n'est pas cosmétique : elle décide de ce que le
   * formulaire enverra. On la garde en propriété plutôt que de l'uniformiser
   * à l'aveugle.
   */
  emptyValue?: string | number;
  /** Interdit de vider le champ, pour un critère obligatoire. */
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
 * Un sélecteur de référentiel, à saisie semi-automatique.
 *
 * Il remplace trois composants qui ne différaient que par leur usecase, leur
 * sentinelle de vide et la traduction ou non des libellés — soit une
 * quarantaine de lignes recopiées trois fois, effet de bord compris : chacun
 * rendait son propre message de chargement et sa propre erreur, tous
 * légèrement différents.
 *
 * Construit sur `Autocomplete` plutôt que sur `Select` : plusieurs
 * référentiels dépassent la vingtaine d'entrées — les comptes, les catégories
 * — et les parcourir à la souris coûte plus cher que d'en taper trois lettres.
 * Le filtrage se fait en mémoire, sur une liste déjà chargée : il n'y a rien à
 * débouncer, et la requête ne part jamais à la frappe.
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
  const { t } = useTranslation();
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

  const labelOf = React.useCallback(
    (item: RefItem) => (translateLabels ? t(item.label) : item.label),
    [t, translateLabels],
  );

  if (error)
    return (
      <Typography sx={{ color: 'error.main', fontSize: 13 }}>
        {t(`common.${error}`)}
      </Typography>
    );

  const options = filter ? (items ?? []).filter(filter) : (items ?? []);
  const selected =
    options.find((item) => String(item.id) === String(value)) ?? null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      // La liste peut n'être pas encore là : le champ garde sa place au lieu de
      // disparaître puis de réapparaître, ce que faisaient les trois copies en
      // rendant un texte « Chargement… » à sa place.
      disabled={items === null}
      disableClearable={required}
      autoHighlight
      handleHomeEndKeys
      getOptionLabel={labelOf}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      noOptionsText={t('common.no_result')}
      onChange={(_event, option) =>
        onChange(option ? String(option.id) : String(emptyValue))
      }
      renderOption={(props, option) => {
        // `key` est fourni dans les props depuis MUI 9 : le laisser dans le
        // spread déclenche un avertissement React à chaque rendu.
        const { key, ...rest } =
          props as React.HTMLAttributes<HTMLLIElement> & {
            key: string;
          };
        return (
          <Box component="li" key={key} {...rest}>
            <Box
              component="span"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
              }}
            >
              {renderIcon && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    lineHeight: 0,
                    '& .MuiSvgIcon-root': { fontSize: 16 },
                  }}
                >
                  {renderIcon(option)}
                </Box>
              )}
              <Typography component="span" noWrap sx={{ fontSize: 13.5 }}>
                {labelOf(option)}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label={label}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              // Le pictogramme de la valeur choisie, devant la saisie : sans
              // lui, le champ perdrait au repos ce que la liste montre.
              startAdornment:
                renderIcon && selected ? (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      lineHeight: 0,
                      mr: '6px',
                      '& .MuiSvgIcon-root': { fontSize: 16 },
                    }}
                  >
                    {renderIcon(selected)}
                  </Box>
                ) : undefined,
            },
          }}
        />
      )}
      sx={sx}
    />
  );
};
