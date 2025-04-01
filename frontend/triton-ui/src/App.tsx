import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './services/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import VMsList from './pages/VMs';
import ServersList from './pages/Servers';
import NetworksList from './pages/Networks';
import ImagesList from './pages/Images';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<VMsList />} />
            <Route path="vms" element={<VMsList />} />
            <Route path="servers" element={<ServersList />} />
            <Route path="networks" element={<NetworksList />} />
            <Route path="images" element={<ImagesList />} />
            {/* Routes for packages, users to be added later */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
