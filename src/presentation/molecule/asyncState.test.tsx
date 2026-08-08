import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { AsyncState } from './asyncState';
import { renderWithApp } from '@src/testing/renderWithApp';

describe('AsyncState', () => {
  it('montre le contenu quand tout va bien', () => {
    renderWithApp(<AsyncState>contenu</AsyncState>);

    expect(screen.getByText('contenu')).toBeInTheDocument();
  });

  it('remplace le contenu pendant le chargement', () => {
    renderWithApp(<AsyncState loading>contenu</AsyncState>);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('contenu')).not.toBeInTheDocument();
  });

  it('résout le message d’erreur dans l’espace de nommage demandé', () => {
    // Le défaut que cette propriété supprime : l'écran de clonage affichait
    // ses erreurs avec les clés du virement, et l'absence de clé rend la clé
    // brute — donc rien ne le signalait.
    renderWithApp(<AsyncState error="deleteSucced" namespace="operations" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Suppression réussie');
  });

  it('rend l’état vide plutôt que le contenu', () => {
    renderWithApp(
      <AsyncState isEmpty empty="Aucun compte">
        contenu
      </AsyncState>,
    );

    expect(screen.getByText('Aucun compte')).toBeInTheDocument();
    expect(screen.queryByText('contenu')).not.toBeInTheDocument();
  });

  it('fait passer l’échec avant le vide', () => {
    // Une liste vide parce que la requête a échoué n'est pas une liste vide.
    renderWithApp(
      <AsyncState error="FAIL" isEmpty empty="Aucun compte">
        contenu
      </AsyncState>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Aucun compte')).not.toBeInTheDocument();
  });
});
