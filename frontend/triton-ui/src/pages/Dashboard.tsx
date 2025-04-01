import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import { Link } from 'react-router-dom';

interface DashboardStats {
  vms_count: number;
  users_count: number;
  servers_count: number;
  servers_reserved: number;
  servers_total: number;
  memory_provisionable_gb: number;
  memory_total_gb: number;
  utilization_percent: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshTime, setRefreshTime] = useState<string>(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setStats(response.data);
        setRefreshTime(new Date().toLocaleTimeString());
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Set up auto-refresh every 60 seconds
    const intervalId = setInterval(() => fetchStats(), 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Determine utilization color and status
  const getUtilizationStatus = (percent: number) => {
    if (percent < 50) return { color: 'bg-emerald-500', textColor: 'text-emerald-700', status: 'Healthy' };
    if (percent < 80) return { color: 'bg-amber-500', textColor: 'text-amber-700', status: 'Moderate' };
    return { color: 'bg-rose-500', textColor: 'text-rose-700', status: 'Critical' };
  };

  const utilizationStatus = getUtilizationStatus(stats.utilization_percent);
  
  // Calculate core stats
  const memoryUsedGB = stats.memory_total_gb - stats.memory_provisionable_gb;
  const serverUtilizationPercent = (stats.servers_reserved / stats.servers_total) * 100;
  const serverStatus = stats.servers_reserved === stats.servers_total 
    ? { color: 'bg-rose-500', text: 'At Capacity' }
    : stats.servers_reserved > stats.servers_total * 0.8
    ? { color: 'bg-amber-500', text: 'High Utilization' }
    : { color: 'bg-emerald-500', text: 'Available' };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datacenter Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enterprise infrastructure overview and monitoring
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <span className="text-sm text-gray-500">Last refreshed: {refreshTime}</span>
          <button 
            onClick={() => getDashboardStats().then(res => {
              setStats(res.data);
              setRefreshTime(new Date().toLocaleTimeString());
            })}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3">System Status</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* System Health Card */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${utilizationStatus.color}`}>
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">{utilizationStatus.status}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${utilizationStatus.textColor} bg-opacity-10 ${utilizationStatus.color.replace('bg-', 'bg-opacity-10 bg-')}`}>
                    {stats.utilization_percent.toFixed(1)}% utilization
                  </span>
                  <span className="text-sm text-gray-500">Memory usage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Availability Card */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${serverStatus.color}`}>
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Server Capacity</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">{serverStatus.text}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">{stats.servers_reserved} / {stats.servers_total} reserved</span>
                  <span className="text-sm text-gray-500">{serverUtilizationPercent.toFixed(1)}% utilization</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`${serverStatus.color} h-1.5 rounded-full`} 
                    style={{ width: `${Math.min(serverUtilizationPercent, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* VM Status Card */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-indigo-500">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Virtual Machines</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">{stats.vms_count} VMs Provisioned</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <Link 
                  to="/vms" 
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all VMs
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Utilization Section */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Resource Utilization</h2>
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Memory Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Memory Gauge */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total System Memory</span>
                  <span className="text-sm font-bold text-gray-900">{stats.memory_total_gb.toFixed(1)} GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`${utilizationStatus.color} rounded-full h-4 flex items-center justify-center text-xs font-medium text-white`} 
                    style={{ width: `${Math.min(stats.utilization_percent, 100)}%` }}
                  >
                    {stats.utilization_percent > 15 ? `${stats.utilization_percent.toFixed(0)}%` : ''}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <span className="text-xs font-medium text-indigo-600 block">Used Memory</span>
                    <span className="text-xl font-bold text-indigo-800">{memoryUsedGB.toFixed(1)} GB</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <span className="text-xs font-medium text-green-600 block">Available Memory</span>
                    <span className="text-xl font-bold text-green-800">{stats.memory_provisionable_gb.toFixed(1)} GB</span>
                  </div>
                </div>
              </div>
              
              {/* Memory Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-sm text-gray-600">Memory Utilization</span>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${utilizationStatus.textColor} bg-opacity-10 ${utilizationStatus.color.replace('bg-', 'bg-opacity-10 bg-')}`}>
                      {stats.utilization_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-sm text-gray-600">Average Per VM</span>
                  <span className="font-medium text-gray-900">
                    {stats.vms_count > 0 ? (memoryUsedGB / stats.vms_count).toFixed(1) : '0'} GB
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-sm text-gray-600">Memory Per Server</span>
                  <span className="font-medium text-gray-900">
                    {stats.servers_count > 0 ? (stats.memory_total_gb / stats.servers_count).toFixed(1) : '0'} GB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity Status</span>
                  <span className="font-medium text-gray-900">
                    {stats.memory_provisionable_gb < 10 ? 'Near Capacity' : 'Sufficient'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions and Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Servers Card */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Physical Servers</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.servers_count}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/servers" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Manage servers →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Users Card */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-purple-100">
                <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">User Accounts</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.users_count}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/users" className="text-sm font-medium text-purple-600 hover:text-purple-500">
                Manage users →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Networks Card */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-green-100">
                <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Networks</h3>
                <p className="mt-1 text-sm text-gray-500">Configure network infrastructure</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/networks" className="text-sm font-medium text-green-600 hover:text-green-500">
                Manage networks →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Images Card */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">VM Images</h3>
                <p className="mt-1 text-sm text-gray-500">Manage OS images and templates</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/images" className="text-sm font-medium text-amber-600 hover:text-amber-500">
                Manage images →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;