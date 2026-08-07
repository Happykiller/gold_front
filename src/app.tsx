// src\app.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Close as CloseIcon } from '@mui/icons-material';

import { LayoutPublicExt } from './presentation/layout/LayoutPublicExt';
import { LayoutProtectedExt } from './presentation/layout/LayoutProtectedExt';
import { FlashMessage } from '@happykiller/sunny-ui';

const CguPage = lazy(() =>
  import('@presentation/routes/CguPage').then((module) => ({
    default: module.CguPage,
  })),
);
const Home = lazy(() =>
  import('@presentation/home').then((module) => ({ default: module.Home })),
);
const LoginPage = lazy(() =>
  import('@presentation/routes/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@presentation/routes/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@presentation/routes/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
);
const Clone = lazy(() =>
  import('@presentation/clone').then((module) => ({ default: module.Clone })),
);
const CreateVir = lazy(() =>
  import('@presentation/createVir').then((module) => ({
    default: module.CreateVir,
  })),
);
const Operations = lazy(() =>
  import('@presentation/operations').then((module) => ({
    default: module.Operations,
  })),
);
const Ventilation = lazy(() =>
  import('@presentation/ventilation').then((module) => ({
    default: module.Ventilation,
  })),
);
const Graphic = lazy(() =>
  import('@presentation/graphic').then((module) => ({
    default: module.Graphic,
  })),
);
const OperationNew = lazy(() =>
  import('@presentation/operation_new').then((module) => ({
    default: module.OperationNew,
  })),
);
const EditOperation = lazy(() =>
  import('@presentation/operation_edit').then((module) => ({
    default: module.EditOperation,
  })),
);

// Main application component
const App: React.FC = () => {
  return (
    <div>
      {/* Define the application's routing structure */}
      <Suspense fallback={null}>
        <Routes>
          <Route
            path="*"
            element={
              <LayoutPublicExt>
                <NotFoundPage />
              </LayoutPublicExt>
            }
          />

          {/* Route for the cgu page */}
          <Route
            path="/cgu"
            element={
              <LayoutPublicExt>
                <CguPage />
              </LayoutPublicExt>
            }
          />

          {/* Route for the login page */}
          <Route
            path="/login"
            element={
              <LayoutPublicExt>
                <LoginPage />
              </LayoutPublicExt>
            }
          />

          {/* Route for the profil page */}
          <Route
            path="/profile"
            element={
              <LayoutProtectedExt>
                <ProfilePage />
              </LayoutProtectedExt>
            }
          />

          {/* Route for root */}
          <Route
            path="/"
            element={
              <LayoutProtectedExt>
                <Home />
              </LayoutProtectedExt>
            }
          />

          {/* Route for the profil page */}
          <Route
            path="/accounts"
            element={
              <LayoutProtectedExt>
                <Home />
              </LayoutProtectedExt>
            }
          />

          {/* Route for the profil page */}
          <Route
            path="/operations"
            element={
              <LayoutProtectedExt>
                <Operations />
              </LayoutProtectedExt>
            }
          />

          {/* Route for the info page */}
          <Route
            path="/createVir"
            element={
              <LayoutProtectedExt>
                <CreateVir />
              </LayoutProtectedExt>
            }
          />

          {/* Route for ventilation page */}
          <Route
            path="/ventilation"
            element={
              <LayoutProtectedExt>
                <Ventilation />
              </LayoutProtectedExt>
            }
          />

          {/* Route for the graphic page */}
          <Route
            path="/graphic"
            element={
              <LayoutProtectedExt>
                <Graphic />
              </LayoutProtectedExt>
            }
          />

          {/* Route for the training page */}
          <Route
            path="/clone"
            element={
              <LayoutProtectedExt>
                <Clone />
              </LayoutProtectedExt>
            }
          />

          {/* Route for the trainings page */}
          <Route
            path="/operation_edit"
            element={
              <LayoutProtectedExt>
                <EditOperation />
              </LayoutProtectedExt>
            }
          />

          {/* Route for the preview page */}
          <Route
            path="/operation_new"
            element={
              <LayoutProtectedExt>
                <OperationNew />
              </LayoutProtectedExt>
            }
          />
        </Routes>
      </Suspense>

      {/* Render the Footer component */}
      <FlashMessage icons={{ close: <CloseIcon fontSize="small" /> }} />
    </div>
  );
};

export default App;
