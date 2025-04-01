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
import JobsList from './pages/Jobs';

// Lazy load components
const VMDetail = React.lazy(() => import('./pages/VMDetail'));
const ServerDetail = React.lazy(() => import('./pages/ServerDetail'));
const JobDetail = React.lazy(() => import('./pages/JobDetail'));
const NetworkDetail = React.lazy(() => import('./pages/NetworkDetail'));
const ImageDetail = React.lazy(() => import('./pages/ImageDetail'));
const PackageDetail = React.lazy(() => import('./pages/PackageDetail'));

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
            <Route path="servers">
              <Route index element={<ServersList />} />
              <Route path=":uuid" element={
                <Suspense fallback={<div className="py-6 px-4 text-center">Loading server details...</div>}>
                  <ServerDetail />
                </Suspense>
              } />
            </Route>
            <Route path="networks">
              <Route index element={<NetworksList />} />
              <Route path=":uuid" element={
                <Suspense fallback={<div className="py-6 px-4 text-center">Loading network details...</div>}>
                  <NetworkDetail />
                </Suspense>
              } />
            </Route>
            <Route path="images">
              <Route index element={<ImagesList />} />
              <Route path=":uuid" element={
                <Suspense fallback={<div className="py-6 px-4 text-center">Loading image details...</div>}>
                  <ImageDetail />
                </Suspense>
              } />
            </Route>
            <Route path="packages">
              <Route index element={<PackagesList />} />
              <Route path=":uuid" element={
                <Suspense fallback={<div className="py-6 px-4 text-center">Loading package details...</div>}>
                  <PackageDetail />
                </Suspense>
              } />
            </Route>
            <Route path="jobs">
              <Route index element={<JobsList />} />
              <Route path=":uuid" element={
                <Suspense fallback={<div className="py-6 px-4 text-center">Loading job details...</div>}>
                  <JobDetail />
                </Suspense>
              } />
            </Route>
            {/* Route for users to be added later */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
