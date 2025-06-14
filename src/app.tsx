// src\app.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Done, Key, Visibility, VisibilityOff, Info as InfoIcon, HelpOutline, VpnKey, Add, Delete, Person, Lock, Close as CloseIcon } from '@mui/icons-material';

import { Home } from '@presentation/home';
import inversify from './common/inversify';
import { Clone } from '@presentation/clone';
import { CreateVir } from '@presentation/createVir';
import { Operations } from '@presentation/operations';
import { OperationNew } from '@presentation/operation_new';
import { EditOperation } from '@presentation/operation_edit';
import { contextStore } from './presentation/store/contextStore';
import { LayoutPublicExt } from './presentation/layout/LayoutPublicExt';
import { LayoutProtectedExt } from './presentation/layout/LayoutProtectedExt';
import { CGU, FlashMessage, Login, NotFound, Profile } from '@happykiller/sunny-ui';

// Main application component
const App: React.FC = () => {

  return (
    <div>
      {/* Define the application's routing structure */}
      <Routes>
        <Route path="*" element={<LayoutPublicExt><NotFound /></LayoutPublicExt>} />
        
        {/* Route for the cgu page */}
        <Route path="/cgu" element={<LayoutPublicExt><CGU /></LayoutPublicExt>} />

        {/* Route for the login page */}
        <Route
          path="/login"
          element={
            <LayoutPublicExt><Login
              icons={{
                visibility: <Visibility fontSize="small" />,
                visibilityOff: <VisibilityOff fontSize="small" />,
                help: <InfoIcon fontSize="small" />,
                done: <Done />,
                key: <Key />,
                person: <Person fontSize="small" />,
                lock: <Lock fontSize="small" />
              }}
              services={{
                authUsecase: inversify.authUsecase,
                authPasskeyUsecase: inversify.authPasskeyUsecase,
                loggerService: inversify.loggerService,
              }}
              contextStore={contextStore}
            /></LayoutPublicExt>
          }
        />

        {/* Route for the profil page */}
        <Route path="/profile" element={
          <LayoutProtectedExt>
            <Profile
              icons={{
                visibility: <Visibility fontSize="small" />,
                visibilityOff: <VisibilityOff fontSize="small" />,
                help: <HelpOutline fontSize="small" />,
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
          </LayoutProtectedExt>
        } />

        {/* Route for root */}
        <Route path="/" element={<LayoutProtectedExt><Home /></LayoutProtectedExt>} />

        {/* Route for the profil page */}
        <Route path="/accounts" element={<LayoutProtectedExt><Home /></LayoutProtectedExt>} />

        {/* Route for the profil page */}
        <Route path="/operations" element={<LayoutProtectedExt><Operations /></LayoutProtectedExt>} />

        {/* Route for the info page */}
        <Route path="/createVir" element={<LayoutProtectedExt><CreateVir /></LayoutProtectedExt>} />

        {/* Route for the training page */}
        <Route path="/clone" element={<LayoutProtectedExt><Clone /></LayoutProtectedExt>} />

        {/* Route for the trainings page */}
        <Route path="/operation_edit" element={<LayoutProtectedExt><EditOperation /></LayoutProtectedExt>} />

        {/* Route for the preview page */}
        <Route path="/operation_new" element={<LayoutProtectedExt><OperationNew /></LayoutProtectedExt>} />
      </Routes>
      
      {/* Render the Footer component */}
      <FlashMessage icons={{ close: <CloseIcon fontSize="small" /> }} />
    </div>
  );
}

export default App;
