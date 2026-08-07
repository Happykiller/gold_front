import { describe, expect, it } from 'vitest';
import * as module from 'highcharts-react-official';

/**
 * `highcharts-react-official` est un bundle UMD ancien. Vite le pré-bundle en
 * exportant l'objet module entier comme export par défaut
 * (`export default require_highcharts_react_min()`), si bien qu'un
 * `import HighchartsReact from 'highcharts-react-official'` récupère
 * `{ HighchartsReact, default }` — un objet que React refuse de rendre :
 * « Element type is invalid… got: object », et la page devient blanche.
 *
 * Ce test verrouille l'import nommé, seul correct.
 *
 * Portée honnête : Vitest résout les modules côté Node et n'a PAS reproduit le
 * problème d'origine, qui n'apparaît que dans le navigateur. Ce test protège
 * donc l'intention (l'export nommé existe et est un composant rendable), pas
 * le comportement du bundler. Une régression du même genre se verrait en
 * chargeant la page, pas ici.
 */
describe('import de highcharts-react-official', () => {
  it('expose un export nommé HighchartsReact', () => {
    expect(module.HighchartsReact).toBeDefined();
  });

  it('cet export nommé est un type rendable par React', () => {
    const component = module.HighchartsReact as unknown as {
      $$typeof?: symbol;
    };
    // Composant fonction, ou objet React (memo, forwardRef) porteur de $$typeof.
    const renderable =
      typeof component === 'function' ||
      (typeof component === 'object' &&
        typeof component?.$$typeof === 'symbol');

    expect(renderable).toBe(true);
  });
});
