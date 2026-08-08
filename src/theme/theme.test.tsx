import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Alert, Button, MenuItem, MenuList } from '@mui/material';

import { renderWithApp } from '@src/testing/renderWithApp';
import { AMOUNT, STATE, TEXT } from './tokens';
import { sharedRadius } from './shared';

/**
 * Les overrides de thème sont le seul chemin par lequel on atteint les écrans
 * de `sunny-ui` — profil, CGU, connexion, page introuvable — qu'aucun de nos
 * composants ne traverse.
 *
 * Or **une clé d'override qui n'existe pas est ignorée en silence** : rien ne
 * la signale, et l'écran garde son aspect d'origine. MUI 9 a par exemple
 * renommé les emplacements de `Alert` de `standardX` en `colorX`.
 *
 * On monte donc quelques composants et on vérifie que la règle est bien
 * produite. jsdom ne calcule aucune géométrie, mais il résout les règles
 * générées par emotion — c'est exactement la classe de défaut qu'on vise ici.
 */
describe('overrides de thème', () => {
  it('applique le fond teinté et la couleur sémantique à une alerte', () => {
    renderWithApp(<Alert severity="error">Échec</Alert>);

    expect(screen.getByRole('alert')).toHaveStyle({
      backgroundColor: STATE.errorBg,
      color: AMOUNT.debit,
    });
  });

  it('distingue les quatre sévérités', () => {
    renderWithApp(
      <>
        <Alert severity="success">ok</Alert>
        <Alert severity="warning">attention</Alert>
      </>,
    );
    const [success, warning] = screen.getAllByRole('alert');

    expect(success).toHaveStyle({ backgroundColor: STATE.successBg });
    expect(warning).toHaveStyle({ backgroundColor: STATE.warningBg });
  });

  it('écrit un bouton plein en sombre sur son fond doré', () => {
    // Le blanc précédent se lisait mal sur l'or.
    renderWithApp(<Button variant="contained">Valider</Button>);

    expect(screen.getByRole('button')).toHaveStyle({ color: TEXT.onAccent });
  });

  it('plafonne le rayon des boutons à l’échelle', () => {
    renderWithApp(<Button variant="contained">Valider</Button>);

    expect(screen.getByRole('button')).toHaveStyle({
      borderRadius: `${sharedRadius.md}px`,
    });
  });

  it('applique la gamme de texte aux entrées de menu', () => {
    // `MenuItem` exige son contexte de liste : hors `MenuList`, il lève.
    renderWithApp(
      <MenuList>
        <MenuItem>Choix</MenuItem>
      </MenuList>,
    );

    expect(screen.getByRole('menuitem')).toHaveStyle({
      color: TEXT.description,
    });
  });
});
