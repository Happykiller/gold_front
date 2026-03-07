// src\components\Layout\HeaderExt.tsx
import MenuIcon from '@mui/icons-material/Menu';

import inversify from '@src/common/inversify';
import { Header } from '@happykiller/sunny-ui';
import { contextStore } from '../store/contextStore';

export function HeaderExt() {
  return <Header
    contextStore={contextStore()}
    routes={['accounts', 'createVir', 'ventilation', 'graphic', 'clone']}
    settings={['profile', 'logout']}
    brandName='Vergo'
    icons={{ menu: <MenuIcon /> }}
    onLogout={() => inversify.loggerService.log('logout')}
  />
}
export default HeaderExt;
