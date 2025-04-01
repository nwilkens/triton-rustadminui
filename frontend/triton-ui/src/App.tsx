import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './services/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VMsList from './pages/VMs';
import ServersList from './pages/Servers';
import NetworksList from './pages/Networks';
import ImagesList from './pages/Images';
import PackagesList from './pages/Packages';

// Lazy load components
const VMDetail = React.lazy(() => import('./pages/VMDetail'));

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
            <Route index element={<Dashboard />} />
            <Route path="vms">
              <Route index element={<VMsList />} />
              <Route path=":uuid" element={
                <Suspense fallback={<div className="py-6 px-4 text-center">Loading VM details...</div>}>
                  <VMDetail />
                </Suspense>
              } />
            </Route>
            <Route path="servers" element={<ServersList />} />
            <Route path="networks" element={<NetworksList />} />
            <Route path="images" element={<ImagesList />} />
            <Route path="packages" element={<PackagesList />} />
            {/* Route for users to be added later */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
