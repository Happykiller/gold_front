import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import '@presentation/footer.scss';
import { CODES } from '@src/common/codes';
import { version } from '../../package.json';
import inversify from '@src/common/inversify';
import { SystemInfoUsecaseModel } from '@usecase/system/model/systemInfo.usecase.model';

export const Footer = () => {
  const [backVersion, setBackVersion] = React.useState('loading');

  if (backVersion === 'loading') {
    inversify.systemInfoUsecase.execute()
      .then((response:SystemInfoUsecaseModel) => {
        if(response.message === CODES.SUCCESS) {
          setBackVersion(response.data.version);
        } else {
          setBackVersion(`Error! ${response.error}`);
        }
      })
      .catch((error:any) => {
        setBackVersion(`Error! ${error}`);
      });
  }

  return (
    <div className='footer'>
      Projet Gold 
      &nbsp;- <a href="mailto:fabrice.rosito@gmail.com">Envoyer Email</a> 
      &nbsp;- <Trans>footer.version.front</Trans>{version} 
      &nbsp;- <Trans>footer.version.back</Trans><Trans>{backVersion}</Trans> 
      &nbsp;- <a href="https://github.com/Happykiller/gold_front/issues" target="_blank"><Trans>footer.issues</Trans></a> 
      &nbsp;- <a href="https://github.com/users/Happykiller/projects/3/views/1" target="_blank"><Trans>footer.roadmap</Trans></a>
      &nbsp;- <Link to="/CGU" target="_blank" rel="noopener noreferrer">CGU</Link>
    </div>
  )
}