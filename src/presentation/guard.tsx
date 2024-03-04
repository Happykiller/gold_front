import * as React from 'react';
import { useLocation, Navigate } from "react-router-dom";

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { ContextStoreModel, contextStore } from '@presentation/contextStore';
import { SessionInfoUsecaseModel } from '@usecase/sessionInfo/model/sessionInfo.usecase.model';
import { Trans } from 'react-i18next';

export function Guard({ children }: { children: JSX.Element }) {
  let location = useLocation();
  const [qry, setQry] = React.useState({
    loading: true,
    data: null,
    error: null
  });
  
  const context:ContextStoreModel = contextStore();
  const reset = contextStore((state) => state.reset);

  if (qry.loading) {
    inversify.sessionInfo.execute()
      .then((response:SessionInfoUsecaseModel) => {
        if(response.message !== CODES.SUCCESS) {
          inversify.loggerService.debug(response.error);
          reset();
          <Navigate to="/login" state={{ from: location }} replace />
        }
      })
      .catch((error:any) => {
        inversify.loggerService.debug(error.error);
        reset();
        <Navigate to="/login" state={{ from: location }} replace />
      })
      .finally(() => {
        setQry(qry => ({
          ...qry,
          loading: false
        }));
      });
  }

  if (qry.loading) {
    return <div><Trans>common.loading</Trans></div>;
  } else if (qry.error) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else if (!context.id) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else {
    return children;
  }
}