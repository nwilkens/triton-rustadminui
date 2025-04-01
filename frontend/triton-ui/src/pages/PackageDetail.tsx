import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPackage } from '../services/api';

interface Package {
  uuid: string;
  name: string;
  version?: string;
  memory?: number;
  max_physical_memory?: number;
  disk?: number;
  quota?: number;
  vcpus?: number;
  cpu_cap?: number;
  active: boolean;
  description?: string;
  swap?: number;
  max_swap?: number;
  owner_uuids?: string[];
  default?: boolean;
  created_at?: string;
  updated_at?: string;
  v?: number;
  brand?: string;
  group?: string;
  max_lwps?: number;
  zfs_io_priority?: number;
  billing_tag?: string;
  flexible_disk?: boolean;
}

const PackageDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [pkg, setPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!uuid) return;

      try {
        setLoading(true);
        const packageResponse = await getPackage(uuid);
        const packageData = packageResponse.data;
        setPackage(packageData);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch package details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uuid]);

  const formatMemory = (megabytes?: number): string => {
    if (!megabytes) return 'N/A';
    if (megabytes >= 1024) {
      return `${(megabytes / 1024).toFixed(1)} GB`;
    }
    return `${megabytes} MB`;
  };

  const formatDisk = (megabytes?: number): string => {
    if (!megabytes) return 'N/A';
    if (megabytes >= 1024) {
      return `${Math.floor(megabytes / 1024)} GB`;
    }
    return `${megabytes} MB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const getStatusColor = (active: boolean): string => {
    return active
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="rounded-md bg-red-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading package details</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Package data not available'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/packages" className="text-gray-500 hover:text-gray-700">Packages</Link>
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 text-gray-700 font-medium">{pkg.name}</span>
          </li>
        </ol>
      </nav>

      {/* Header with package name and quick stats */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {pkg.name}
              {pkg.version && <span className="ml-2 text-gray-500 text-sm">{pkg.version}</span>}
              {pkg.default && (
                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  Default
                </span>
              )}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {pkg.uuid}
            </p>
            {pkg.description && (
              <p className="mt-1 text-sm text-gray-600 italic">
                {pkg.description}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(pkg.active)}`}>
              {pkg.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Memory</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {formatMemory(pkg.memory || pkg.max_physical_memory)}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Disk</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                {formatDisk(pkg.disk || pkg.quota)}
                {pkg.flexible_disk && (
                  <span className="ml-1 text-xs text-indigo-600">(Flexible)</span>
                )}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">vCPUs</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {pkg.vcpus || 'N/A'}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Brand</div>
              <div className="mt-1 text-sm text-gray-900">
                {pkg.brand || 'Any'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed interface */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`${
                activeTab === 'resources'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Resources
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`${
                activeTab === 'usage'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Usage
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Package Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Name</div>
                    <div className="mt-1 text-sm text-gray-900">{pkg.name}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">UUID</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{pkg.uuid}</div>
                  </div>
                  {pkg.version && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Version</div>
                      <div className="mt-1 text-sm text-gray-900">{pkg.version}</div>
                    </div>
                  )}
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pkg.active)}`}>
                        {pkg.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Default Package</div>
                    <div className="mt-1 text-sm text-gray-900">{pkg.default ? 'Yes' : 'No'}</div>
                  </div>
                  {pkg.brand && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Brand</div>
                      <div className="mt-1 text-sm text-gray-900">{pkg.brand}</div>
                    </div>
                  )}
                  {pkg.group && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Group</div>
                      <div className="mt-1 text-sm text-gray-900">{pkg.group}</div>
                    </div>
                  )}
                  {pkg.created_at && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Created</div>
                      <div className="mt-1 text-sm text-gray-900">{formatDate(pkg.created_at)}</div>
                    </div>
                  )}
                  {pkg.updated_at && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Updated</div>
                      <div className="mt-1 text-sm text-gray-900">{formatDate(pkg.updated_at)}</div>
                    </div>
                  )}
                  {pkg.description && (
                    <div className="sm:col-span-2">
                      <div className="text-sm font-medium text-gray-500">Description</div>
                      <div className="mt-1 text-sm text-gray-900">{pkg.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {pkg.owner_uuids && pkg.owner_uuids.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Owner Information</h3>
                  <div className="space-y-2">
                    {pkg.owner_uuids.map((owner, idx) => (
                      <div key={idx} className="text-sm text-gray-900 font-mono">{owner}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Resource Limits</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Memory (RAM)</div>
                    <div className="mt-1 text-sm text-gray-900">{formatMemory(pkg.memory || pkg.max_physical_memory)}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Disk</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDisk(pkg.disk || pkg.quota)} 
                      {pkg.flexible_disk && (
                        <span className="ml-1 text-xs text-indigo-600">(Flexible)</span>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">vCPUs</div>
                    <div className="mt-1 text-sm text-gray-900">{pkg.vcpus || 'N/A'}</div>
                  </div>
                  {pkg.cpu_cap !== undefined && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">CPU Cap</div>
                      <div className="mt-1 text-sm text-gray-900">{pkg.cpu_cap}%</div>
                    </div>
                  )}
                  {pkg.swap !== undefined && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Swap</div>
                      <div className="mt-1 text-sm text-gray-900">{formatMemory(pkg.swap)}</div>
                    </div>
                  )}
                  {pkg.max_swap !== undefined && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Max Swap</div>
                      <div className="mt-1 text-sm text-gray-900">{formatMemory(pkg.max_swap)}</div>
                    </div>
                  )}
                  {pkg.max_lwps !== undefined && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Max Lightweight Processes</div>
                      <div className="mt-1 text-sm text-gray-900">{pkg.max_lwps}</div>
                    </div>
                  )}
                  {pkg.zfs_io_priority !== undefined && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">ZFS I/O Priority</div>
                      <div className="mt-1 text-sm text-gray-900">{pkg.zfs_io_priority}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Package Usage</h3>
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">VM Usage Statistics</h3>
                  <p className="mt-1 text-sm text-gray-500">VM usage statistics will be available in a future update.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Package
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Create VM with Package
        </button>
        {pkg.active && (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deactivate Package
          </button>
        )}
      </div>
    </div>
  );
};

export default PackageDetail;