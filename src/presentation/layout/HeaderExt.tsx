// src\presentation\layout\HeaderExt.tsx
import MenuIcon from '@mui/icons-material/Menu';

import inversify from '@src/common/inversify';
import { Header } from '@happykiller/sunny-ui';
import { contextStore } from '../store/contextStore';
import { LINE, SURFACE } from '@src/theme/tokens';

/**
 * La barre de navigation.
 *
 * `Header` vient de `sunny-ui` et sa composition interne — logo, boutons de
 * navigation, avatar — n'est pas modifiable d'ici. En revanche il **fusionne
 * son `sx` en dernier**, donc tout ce qu'on écrit ici gagne sur ses propres
 * styles. C'est le seul levier sur cette barre, et il n'était pas utilisé.
 *
 * Ce qu'on lui retire : un halo doré sur trois niveaux, une bordure dorée de
 * 1 px et un flou d'arrière-plan. Ce qu'on lui donne : le fond de la page et
 * un filet neutre, pour qu'elle cesse d'être un objet flottant et redevienne
 * le haut de l'écran.
 *
 * Sa hauteur, elle, se règle par l'override `MuiToolbar` du thème — c'est le
 * seul élément de l'en-tête qu'aucun `sx` ne verrouille.
 */
export function HeaderExt() {
  return (
    <Header
      contextStore={contextStore()}
      // L'ordre suit l'usage, pas l'alphabet ni l'ordre d'écriture des écrans :
      // les comptes d'abord puisqu'on y revient sans cesse, puis les trois
      // gestes de saisie du plus courant au plus rare, et le graphique en
      // dernier — on le consulte, on n'y travaille pas.
      routes={['accounts', 'createVir', 'clone', 'ventilation', 'graphic']}
      settings={['profile', 'logout']}
      brandName="Gold"
      icons={{ menu: <MenuIcon /> }}
      onLogout={() => inversify.loggerService.log('logout')}
      sx={{
        background: SURFACE.header,
        backgroundImage: 'none',
        boxShadow: 'none',
        borderBottom: LINE.block,
        backdropFilter: 'none',
      }}
    />
  );
}
export default HeaderExt;
