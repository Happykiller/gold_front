import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { CGU } from '@presentation/cgu';
import { Home } from '@presentation/home';
import { Clone } from '@presentation/clone';
import { Login } from '@presentation/login';
import { Profile } from '@presentation/profile';
import Flash from '@presentation/molecule/flash';
import { CreateVir } from '@presentation/createVir';
import { Guard } from '@presentation/molecule/guard';
import { Operations } from '@presentation/operations';
import { Footer } from '@presentation/molecule/footer';
import { OperationNew } from '@presentation/operation_new';
import { EditOperation } from '@presentation/operation_edit';

// Main application component
const App: React.FC = () => {

  return (
    <div>
      {/* Define the application's routing structure */}
      <Routes>
        {/* Route for root */}
        <Route path="/" element={<Guard><Home /></Guard>} />

        {/* Route for the home page */}
        <Route path="/home" element={<Guard><Home /></Guard>} />

        {/* Route for the profil page */}
        <Route path="/accounts" element={<Guard><Home /></Guard>} />

        {/* Route for the login page */}
        <Route path="/login" element={<Login />} />

        {/* Route for the profil page */}
        <Route path="/operations" element={<Guard><Operations /></Guard>} />

        {/* Route for the info page */}
        <Route path="/createVir" element={<Guard><CreateVir /></Guard>} />

        {/* Route for the training page */}
        <Route path="/clone" element={<Guard><Clone /></Guard>} />

        {/* Route for the trainings page */}
        <Route path="/operation_edit" element={<Guard><EditOperation /></Guard>} />

        {/* Route for the preview page */}
        <Route path="/operation_new" element={<Guard><OperationNew /></Guard>} />

        {/* Route for the training edit page */}
        <Route path="/profile" element={<Guard><Profile /></Guard>} />

        {/* Route for the cgu page */}
        <Route path="/cgu" element={<CGU />} />
      </Routes>
      
      {/* Render the Footer component */}
      <Footer />
      <Flash/>
    </div>
  );
}

export default App;
