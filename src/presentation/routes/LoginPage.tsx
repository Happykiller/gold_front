import React from 'react';
import {
  Done,
  Info as InfoIcon,
  Key,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

import inversify from '@src/common/inversify';
import { contextStore } from '@presentation/store/contextStore';
import { Login } from '@happykiller/sunny-ui';

export const LoginPage: React.FC = () => (
  <Login
    icons={{
      visibility: <Visibility fontSize="small" />,
      visibilityOff: <VisibilityOff fontSize="small" />,
      help: <InfoIcon fontSize="small" />,
      done: <Done />,
      key: <Key />,
      person: <Person fontSize="small" />,
      lock: <Lock fontSize="small" />,
    }}
    services={{
      authUsecase: inversify.authUsecase,
      authPasskeyUsecase: inversify.authPasskeyUsecase,
      passkeyAuthOptionsUsecase: inversify.passkeyAuthOptionsUsecase,
      loggerService: inversify.loggerService,
    }}
    contextStore={contextStore}
  />
);
