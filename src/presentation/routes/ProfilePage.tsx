import React from 'react';
import {
  Add,
  Delete,
  Done,
  HelpOutlined,
  Visibility,
  VisibilityOff,
  VpnKey,
} from '@mui/icons-material';

import inversify from '@src/common/inversify';
import { contextStore } from '@presentation/store/contextStore';
import { Profile } from '@happykiller/sunny-ui';

export const ProfilePage: React.FC = () => (
  <Profile
    icons={{
      visibility: <Visibility fontSize="small" />,
      visibilityOff: <VisibilityOff fontSize="small" />,
      help: <HelpOutlined fontSize="small" />,
      done: <Done />,
      key: <VpnKey />,
      add: <Add />,
      delete: <Delete />,
    }}
    services={{
      createPasskeyUsecase: inversify.createPasskeyUsecase,
      deletePasskeyUsecase: inversify.deletePasskeyUsecase,
      getPasskeyForUserUsecase: inversify.getPasskeyForUserUsecase,
      updPasswordUsecase: inversify.updPasswordUsecase,
      loggerService: inversify.loggerService,
    }}
    contextStore={contextStore}
  />
);
