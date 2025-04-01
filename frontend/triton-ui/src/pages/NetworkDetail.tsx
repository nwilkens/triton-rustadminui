import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNetwork } from '../services/api';

interface Network {
  uuid: string;
  name: string;
  description?: string;
  subnet: string;
  provision_start_ip: string;
  provision_end_ip: string;
  gateway?: string;
  netmask?: string;
  fabric: boolean;
  vlan_id: number;
  owner_uuid?: string;
  public: boolean;
  created_at?: string;
  updated_at?: string;
}

const NetworkDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [network, setNetwork] = useState<Network | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!uuid) return;

      try {
        setLoading(true);
        const networkResponse = await getNetwork(uuid);
        const networkData = networkResponse.data;
        setNetwork(networkData);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch network details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uuid]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const getNetworkTypeColor = (isPublic: boolean, isFabric: boolean): string => {
    if (isPublic) {
      return 'bg-blue-100 text-blue-800';
    }
    if (isFabric) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getNetworkType = (isPublic: boolean, isFabric: boolean): string => {
    if (isPublic) {
      return 'Public';
    }
    if (isFabric) {
      return 'Fabric';
    }
    return 'Private';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !network) {
    return (
      <div className="rounded-md bg-red-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading network details</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Network data not available'}</p>
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
            <Link to="/networks" className="text-gray-500 hover:text-gray-700">Networks</Link>
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 text-gray-700 font-medium">{network.name}</span>
          </li>
        </ol>
      </nav>

      {/* Header with network name and quick stats */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {network.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {network.uuid}
            </p>
            {network.description && (
              <p className="mt-1 text-sm text-gray-600 italic">
                {network.description}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getNetworkTypeColor(network.public, network.fabric)}`}>
              {getNetworkType(network.public, network.fabric)}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Subnet</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {network.subnet} {network.netmask && `/ ${network.netmask}`}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">VLAN ID</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                {network.vlan_id}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Gateway</div>
              <div className="mt-1 text-sm text-gray-900 font-mono">
                {network.gateway || 'N/A'}
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
              onClick={() => setActiveTab('ips')}
              className={`${
                activeTab === 'ips'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              IP Addresses
            </button>
            <button
              onClick={() => setActiveTab('vms')}
              className={`${
                activeTab === 'vms'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Virtual Machines
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Network Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Name</div>
                    <div className="mt-1 text-sm text-gray-900">{network.name}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">UUID</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{network.uuid}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Network Type</div>
                    <div className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getNetworkTypeColor(network.public, network.fabric)}`}>
                        {getNetworkType(network.public, network.fabric)}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Fabric Network</div>
                    <div className="mt-1 text-sm text-gray-900">{network.fabric ? 'Yes' : 'No'}</div>
                  </div>
                  {network.owner_uuid && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Owner</div>
                      <div className="mt-1 text-sm text-gray-900 font-mono">{network.owner_uuid}</div>
                    </div>
                  )}
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Created</div>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(network.created_at)}</div>
                  </div>
                  {network.updated_at && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Updated</div>
                      <div className="mt-1 text-sm text-gray-900">{formatDate(network.updated_at)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Network Configuration</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Subnet</div>
                    <div className="mt-1 text-sm text-gray-900">{network.subnet}</div>
                  </div>
                  {network.netmask && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Netmask</div>
                      <div className="mt-1 text-sm text-gray-900">{network.netmask}</div>
                    </div>
                  )}
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Gateway</div>
                    <div className="mt-1 text-sm text-gray-900">{network.gateway || 'N/A'}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">VLAN ID</div>
                    <div className="mt-1 text-sm text-gray-900">{network.vlan_id}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ips' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">IP Address Range</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Provisioning Range Start</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{network.provision_start_ip}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Provisioning Range End</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{network.provision_end_ip}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Subnet</div>
                    <div className="mt-1 text-sm text-gray-900">{network.subnet}</div>
                  </div>
                  {network.netmask && (
                    <div className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">Netmask</div>
                      <div className="mt-1 text-sm text-gray-900">{network.netmask}</div>
                    </div>
                  )}
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Gateway</div>
                    <div className="mt-1 text-sm text-gray-900">{network.gateway || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">IP Management</h3>
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">IP Usage Information</h3>
                  <p className="mt-1 text-sm text-gray-500">IP usage details will be added in a future update.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vms' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Virtual Machines on this Network</h3>
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">VM Information Coming Soon</h3>
                  <p className="mt-1 text-sm text-gray-500">The list of VMs connected to this network will be available in a future update.</p>
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
          Edit Network
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Network
        </button>
      </div>
    </div>
  );
};

export default NetworkDetail;