// src\presentation\molecule\operationsSearch.tsx
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Chip,
  InputBase,
  Paper,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';

import {
  suggest,
  parseToken,
  tokenKey,
  tokenLabel,
  type Referentials,
  type Suggestion,
  type Token,
} from '@presentation/hooks/searchTokens';
import { LINE, MONO_FONT, SURFACE, TEXT } from '@src/theme/tokens';

type Props = {
  tokens: Token[];
  onChange: (tokens: Token[]) => void;
  refs: Referentials;
  translate: (label: string) => string;
};

/** Le statut se distingue à l'œil : c'est le filtre le plus consulté. */
const chipColor = (token: Token) =>
  token.kind === 'ref' && token.field === 'statut' ? 'error' : 'info';

/**
 * Barre de recherche à jetons.
 *
 * Construite sur `InputBase` plutôt que sur `Autocomplete` : ce dernier gère
 * une valeur sélectionnée dans une liste, là où il s'agit ici d'accumuler des
 * critères hétérogènes dont la plupart ne figurent dans aucune liste
 * (`montant:>50`). Le plier à cet usage coûterait plus que de composer.
 *
 * Aucun débounce : les suggestions se calculent en mémoire sur des
 * référentiels déjà chargés, et la requête ne part qu'à la validation d'un
 * jeton — jamais à la frappe.
 */
export const OperationsSearch: React.FC<Props> = ({
  tokens,
  onChange,
  refs,
  translate,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [input, setInput] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const suggestions = React.useMemo(
    () => suggest(input, refs, translate),
    [input, refs, translate],
  );
  // Ouvert dès que le champ a le focus : sur un champ vide, la liste présente
  // les critères disponibles — c'est le seul moment où la barre peut dire ce
  // qu'elle sait faire.
  const open = focused && suggestions.length > 0;

  React.useEffect(() => setHighlight(0), [input]);

  const addToken = (token: Token | null) => {
    if (!token) return;
    // Deux saisies équivalentes (« FAI » et « fai ») portent la même identité :
    // empiler la même puce deux fois ne filtrerait rien de plus.
    const key = tokenKey(token);
    if (!tokens.some((existing) => tokenKey(existing) === key)) {
      onChange([...tokens, token]);
    }
    setInput('');
  };

  const removeAt = (index: number) =>
    onChange(tokens.filter((_, i) => i !== index));

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // La suggestion mise en avant l'emporte : c'est elle que l'utilisateur
      // voit. Sans suggestion, on tente d'interpréter la saisie brute.
      const chosen = suggestions[highlight];
      if (chosen) pick(chosen);
      else addToken(parseToken(input, refs, translate));
      return;
    }
    if (event.key === 'Backspace' && input === '' && tokens.length) {
      // Retour arrière sur un champ vide : on retire la dernière puce, comme
      // dans un champ de destinataires d'e-mail.
      removeAt(tokens.length - 1);
      return;
    }
    if (event.key === 'ArrowDown' && open) {
      event.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === 'Escape') setInput('');
  };

  /**
   * `/` donne le focus au champ depuis n'importe où dans l'écran.
   *
   * La garde n'est pas décorative : sans elle, `/` deviendrait intapable dans
   * tout autre champ de l'application — y compris dans celui-ci.
   */
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      )
        return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const pick = (suggestion: Suggestion) => {
    // Un préfixe ne valide rien : il complète la saisie et rend la main, pour
    // que la liste se rabatte aussitôt sur les valeurs de ce critère.
    if (suggestion.kind === 'prefix') setInput(suggestion.input);
    else addToken(suggestion.token ?? null);
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        ref={anchorRef}
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          px: '10px',
          py: '2px',
          // 28 px tant qu'aucune puce n'est posée : c'est la hauteur qui laisse
          // la barre du compte tenir sur une seule ligne.
          minHeight: 28,
          borderRadius: `${theme.radius.md}px`,
          background: SURFACE.field,
          border: LINE.field,
          '&:focus-within': { borderColor: theme.palette.primary.main },
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <SearchIcon sx={{ fontSize: 15, color: TEXT.tertiary, mr: 0.5 }} />
        {tokens.map((token, index) => (
          <Chip
            key={tokenKey(token)}
            label={tokenLabel(token)}
            size="small"
            variant="outlined"
            color={chipColor(token)}
            onDelete={() => removeAt(index)}
            sx={{ height: 20, borderRadius: `${theme.radius.sm}px` }}
          />
        ))}
        <InputBase
          inputRef={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          placeholder={tokens.length ? '' : t('operations.search.placeholder')}
          sx={{
            flex: 1,
            minWidth: 140,
            color: TEXT.title,
            fontSize: 12.5,
            '& input': { padding: 0, height: 24 },
            '& input::placeholder': { color: TEXT.tertiary, opacity: 1 },
          }}
        />
        {/* Le raccourci est affiché : c'est ainsi qu'on l'apprend. */}
        <Typography
          component="span"
          sx={{
            fontFamily: MONO_FONT,
            fontWeight: 500,
            fontSize: 10,
            lineHeight: 1,
            color: TEXT.meta,
            background: SURFACE.action,
            borderRadius: `${theme.radius.sm}px`,
            padding: '2px 5px',
            ml: 'auto',
          }}
        >
          /
        </Typography>
      </Paper>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{
          zIndex: theme.zIndex.modal,
          width: anchorRef.current?.clientWidth,
        }}
      >
        <ClickAwayListener
          onClickAway={(event) => {
            // La barre elle-même n'est pas « ailleurs ». Sans cette garde, le
            // clic qui donne le focus au champ est aussitôt vu comme un clic
            // hors du Popper, et referme la liste qu'il vient d'ouvrir.
            if (anchorRef.current?.contains(event.target as Node)) return;
            setFocused(false);
            setInput('');
          }}
        >
          <Paper
            sx={{
              mt: 0.5,
              background: theme.palette.background.paper,
              borderRadius: `${theme.radius.md}px`,
              border: LINE.field,
            }}
          >
            <Typography
              sx={{
                px: 2,
                pt: 1,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TEXT.meta,
              }}
            >
              <Trans>operations.search.suggestions</Trans>
            </Typography>
            <MenuList dense>
              {suggestions.map((suggestion, index) => (
                <MenuItem
                  key={suggestion.input}
                  selected={index === highlight}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(suggestion)}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: TEXT.title,
                      // Un nom de critère se reconnaît à sa chasse fixe : il
                      // se tape, là où une valeur se choisit.
                      fontFamily:
                        suggestion.kind === 'prefix' ? MONO_FONT : undefined,
                    }}
                  >
                    {suggestion.label}
                  </Typography>
                  {suggestion.hint && (
                    <Typography
                      sx={{ fontSize: 12, color: TEXT.meta, ml: 1.5 }}
                    >
                      {suggestion.hint}
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};
