import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Alert, Button, MenuItem, MenuList, TextField } from '@mui/material';

import { renderWithApp } from '@src/testing/renderWithApp';
import { AMOUNT, STATE, TEXT } from './tokens';
import { OUTLINED, outlinedShrunkLabelOffset, sharedRadius } from './shared';

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

  /**
   * Un champ `outlined` porte son étiquette hors du flux : elle remonte au-dessus
   * du champ, et le cadre avec elle. Le thème lui rend cette place et la ramène
   * dans son encoche — voir le bloc `OUTLINED` de `shared.ts`.
   *
   * jsdom ne mesurera jamais le résultat : ce qui est vérifié ici, c'est que les
   * **règles sont bien émises**. Leur justesse géométrique se contrôle sur
   * capture d'écran, seule barrière pour cette classe de défaut.
   */
  describe('champ outlined — l’étiquette et sa place', () => {
    it('réserve la place de l’étiquette au-dessus du champ', () => {
      renderWithApp(<TextField label="Montant" variant="outlined" />);

      const field = document.querySelector('.MuiOutlinedInput-root');
      expect(field).toHaveStyle({ marginTop: `${OUTLINED.reserve}px` });
    });

    it('ne réserve rien à un champ sans étiquette', () => {
      renderWithApp(<TextField variant="outlined" />);

      // La règle est conditionnée au frère `label` qui précède : sans étiquette,
      // ces 9px ne seraient qu'un décalage inexpliqué.
      const field = document.querySelector('.MuiOutlinedInput-root');
      expect(field).not.toHaveStyle({ marginTop: `${OUTLINED.reserve}px` });
    });

    it('redescend l’étiquette réduite dans son encoche', () => {
      renderWithApp(
        <TextField label="Montant" variant="outlined" value="12" />,
      );

      // MUI code son décalage en dur pour une étiquette de 16px ; les nôtres
      // sont à 13px, ce qui la laissait au-dessus du trait.
      const label = document.querySelector('label');
      expect(label).toHaveStyle({
        transform: `translate(14px, ${outlinedShrunkLabelOffset}px) scale(${OUTLINED.shrinkScale})`,
      });
    });

    it('taille l’encoche sur l’étiquette, non sur le champ', () => {
      renderWithApp(<TextField label="Montant" variant="outlined" />);

      // Elle hérite sinon des 14px du champ et dégage un trou plus large que le
      // texte qu'elle doit laisser passer.
      const outline = document.querySelector(
        '.MuiOutlinedInput-notchedOutline',
      );
      expect(outline).toHaveStyle({ fontSize: '13px' });
    });
  });

  /**
   * Un message de champ ne doit compter dans la hauteur de personne : il pousse
   * la ligne quand il apparaît, et désaligne durablement le champ qui réserve sa
   * place — c'est ce qui laissait le taux de TVA 22px plus haut que le montant et
   * la date.
   */
  it('sort les messages de champ du flux', () => {
    renderWithApp(<TextField label="Taux" helperText="Entre 0 et 100" />);

    expect(screen.getByText('Entre 0 et 100')).toHaveStyle({
      position: 'absolute',
      top: '100%',
    });
  });
});
