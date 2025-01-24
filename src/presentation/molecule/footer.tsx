import * as React from 'react';
import { Link } from '@mui/material';
import { Trans } from 'react-i18next';

import { CODES } from '@src/common/codes';
import '@presentation/molecule/footer.scss';
import inversify from '@src/common/inversify';
import { SystemInfoUsecaseModel } from '@usecase/system/model/systemInfo.usecase.model';

export const Footer: React.FC = () => {
  const [backVersion, setBackVersion] = React.useState('loading');

  React.useEffect(() => {
    let isMounted = true; // To avoid updating state if the component unmounts
    inversify.systemInfoUsecase.execute()
      .then((response: SystemInfoUsecaseModel) => {
        if (isMounted) {
          if (response.message === CODES.SUCCESS && response.data) {
            setBackVersion(response.data.version);
          } else {
            setBackVersion(`Error! ${response.error}`);
          }
        }
      })
      .catch((error: any) => {
        if (isMounted) {
          setBackVersion(`Error! ${error}`);
        }
      });

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
  }, []); // Empty dependency array ensures this runs only once after mounting

  return (
    <div className="footer">
      Projet Gold 
      &nbsp;- <Link href="mailto:fabrice.rosito@gmail.com">Envoyer Email</Link> 
      &nbsp;- <Trans>footer.version.front</Trans>{process.env.VERSION} 
      &nbsp;- <Trans>footer.version.back</Trans>{backVersion} 
      &nbsp;- <Link href="https://github.com/Happykiller/gold_front/issues" target="_blank"><Trans>footer.issues</Trans></Link> 
      &nbsp;- <Link href="https://github.com/users/Happykiller/projects/2/views/1" target="_blank"><Trans>footer.roadmap</Trans></Link>
      &nbsp;- <Link href="/CGU" target="_blank" rel="noopener noreferrer">CGU</Link>
    </div>
  );
};
