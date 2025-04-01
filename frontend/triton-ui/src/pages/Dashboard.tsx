import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setStats(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            System overview for this datacenter.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* VMs Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Virtual Machines</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.vms_count}</dd>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Users</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.users_count}</dd>
          </div>
        </div>

        {/* Servers Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Servers</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.servers_count}</dd>
          </div>
        </div>

        {/* Servers Reserved Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Servers Reserved</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.servers_reserved} / {stats.servers_total}
            </dd>
          </div>
        </div>

        {/* RAM Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">RAM Provisionable / Total</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.memory_provisionable_gb.toFixed(2)} / {stats.memory_total_gb.toFixed(2)} GB
            </dd>
          </div>
        </div>

        {/* Utilization Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Utilization %</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.utilization_percent.toFixed(2)}%
            </dd>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(stats.utilization_percent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;