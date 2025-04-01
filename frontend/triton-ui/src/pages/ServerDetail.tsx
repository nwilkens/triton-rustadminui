import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getServer, getVMsByServer } from '../services/api';

interface Server {
  uuid: string;
  hostname: string;
  status: string;
  datacenter: string;
  ram?: number;
  memory_total_bytes?: number;
  memory_available_bytes?: number;
  disk_total_bytes?: number;
  disk_available_bytes?: number;
  cpu_type?: string;
  cpu_cores?: number;
  headnode?: boolean;
  setup?: boolean;
  setting_up?: boolean;
  created?: string;
  last_boot?: string;
  current_platform?: string;
  boot_platform?: string;
  reservation_ratio?: number;
  reserved?: boolean;
  reservoir?: boolean;
  system_type?: string;
  comments?: string;
  default_console?: string;
  serial?: string;
  traits?: Record<string, any>;
  boot_params?: Record<string, any>;
  kernel_flags?: Record<string, any>;
  rack_identifier?: string;
  sysinfo?: {
    'Live Image'?: string;
    Manufacturer?: string;
    'Product'?: string;
    [key: string]: any;
  };
}

interface VM {
  uuid: string;
  alias: string;
  state: string;
  brand: string;
  ram?: number;
  memory?: number;
  quota?: number;
  disk?: number;
  vcpus?: number;
  owner_uuid: string;
  ips?: string[];
  nics?: {
    interface?: string;
    mac?: string;
    ip?: string;
    ips?: string[];
    primary?: boolean;
    netmask?: string;
    network_uuid?: string;
  }[];
  image_uuid?: string;
  billing_id?: string;
  package_uuid?: string;
  server_uuid?: string;
  create_timestamp?: string;
  created_at?: string;
  tags?: any;
  customer_metadata?: any;
  internal_metadata?: any;
  cpu_cap?: number;
  cpu_shares?: number;
  dns_domain?: string;
  autoboot?: boolean;
  max_physical_memory?: number;
}

const ServerDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [server, setServer] = useState<Server | null>(null);
  const [vms, setVMs] = useState<VM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [vmsLoading, setVMsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vmsError, setVMsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!uuid) return;

      try {
        setLoading(true);
        const serverResponse = await getServer(uuid);
        const serverData = serverResponse.data;
        setServer(serverData);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch server details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uuid]);
  
  useEffect(() => {
    const fetchVMs = async () => {
      if (!uuid) return;

      try {
        setVMsLoading(true);
        const vmsResponse = await getVMsByServer(uuid);
        setVMs(vmsResponse.data);
        setVMsError(null);
      } catch (err: any) {
        setVMsError(err.response?.data?.message || 'Failed to fetch virtual machines');
      } finally {
        setVMsLoading(false);
      }
    };

    fetchVMs();
  }, [uuid]);

  const formatMemory = (ram?: number): string => {
    if (!ram) return 'N/A';
    const gb = ram / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const formatUptime = (lastBoot?: string): string => {
    if (!lastBoot) return 'N/A';
    
    const bootTime = new Date(lastBoot).getTime();
    const now = new Date().getTime();
    const diffMs = now - bootTime;
    
    // Convert to days, hours, minutes
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} days, ${hours} hours, ${minutes} minutes`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const getStatusColor = (status: string): string => {
    switch(status.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSetupStatus = (server: Server) => {
    if (server.setting_up) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          Setting up
        </span>
      );
    } else if (server.setup) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Setup complete
        </span>
      );
    } else {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Setup needed
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="rounded-md bg-red-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading server details</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Server data not available'}</p>
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
            <Link to="/servers" className="text-gray-500 hover:text-gray-700">Servers</Link>
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 text-gray-700 font-medium">{server.hostname}</span>
          </li>
        </ol>
      </nav>

      {/* Header with server name and quick stats */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {server.hostname}
              {server.headnode && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Headnode</span>}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {server.datacenter} • {server.uuid}
            </p>
            {server.comments && (
              <p className="mt-1 text-sm text-gray-600 italic">
                {server.comments}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(server.status)}`}>
              {server.status}
            </span>
            {getSetupStatus(server)}
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Memory</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {formatMemory(server.ram)}
                {server.reservation_ratio && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Reservation: {(server.reservation_ratio * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Uptime</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatUptime(server.last_boot)}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Current Platform</div>
              <div className="mt-1 text-sm text-gray-900 font-mono">
                {server.current_platform || 'unknown'}
                {server.current_platform !== server.boot_platform && (
                  <div className="mt-1 text-yellow-600 text-xs">
                    Boot: {server.boot_platform || 'unknown'}
                  </div>
                )}
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
              onClick={() => setActiveTab('specs')}
              className={`${
                activeTab === 'specs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
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
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Server Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Hostname</div>
                    <div className="mt-1 text-sm text-gray-900">{server.hostname}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">UUID</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{server.uuid}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Datacenter</div>
                    <div className="mt-1 text-sm text-gray-900">{server.datacenter}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">System Type</div>
                    <div className="mt-1 text-sm text-gray-900">{server.system_type || 'N/A'}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Created</div>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(server.created)}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Last Boot</div>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(server.last_boot)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Configuration</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Setup Status</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {getSetupStatus(server)}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Server Role</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {server.headnode ? 'Headnode' : 'Compute Node'}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Default Console</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {server.default_console || 'N/A'}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Serial Port</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {server.serial || 'N/A'}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Reservation Status</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {server.reserved ? 'Reserved' : 'Not Reserved'}
                      {server.reservation_ratio && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Ratio: {(server.reservation_ratio * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Reservoir</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {server.reservoir ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {server.boot_params && Object.keys(server.boot_params).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Boot Parameters</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(server.boot_params).map(([key, value]) => (
                      <div key={key} className="sm:col-span-1">
                        <div className="text-sm font-medium text-gray-500">{key}</div>
                        <div className="mt-1 text-sm text-gray-900">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Hardware Specifications</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Memory</div>
                    <div className="mt-1 text-sm text-gray-900">{formatMemory(server.ram)}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">CPU Type</div>
                    <div className="mt-1 text-sm text-gray-900">{server.cpu_type || 'N/A'}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">CPU Cores</div>
                    <div className="mt-1 text-sm text-gray-900">{server.cpu_cores || 'N/A'}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Rack Identifier</div>
                    <div className="mt-1 text-sm text-gray-900">{server.rack_identifier || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {server.sysinfo && Object.keys(server.sysinfo).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(server.sysinfo).map(([key, value]) => (
                      typeof value !== 'object' ? (
                        <div key={key} className="sm:col-span-1">
                          <div className="text-sm font-medium text-gray-500">{key}</div>
                          <div className="mt-1 text-sm text-gray-900">{String(value)}</div>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Platform Settings</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Current Platform</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{server.current_platform || 'N/A'}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Boot Platform</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{server.boot_platform || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {server.kernel_flags && Object.keys(server.kernel_flags).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Kernel Flags</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(server.kernel_flags).map(([key, value]) => (
                      <div key={key} className="sm:col-span-1">
                        <div className="text-sm font-medium text-gray-500">{key}</div>
                        <div className="mt-1 text-sm text-gray-900">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {server.traits && Object.keys(server.traits).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Server Traits</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(server.traits).map(([key, value]) => (
                      <div key={key} className="sm:col-span-1">
                        <div className="text-sm font-medium text-gray-500">{key}</div>
                        <div className="mt-1 text-sm text-gray-900">{JSON.stringify(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vms' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Virtual Machines</h3>
                  <Link
                    to="/vms"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View All VMs
                  </Link>
                </div>
                
                {vmsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : vmsError ? (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading VMs</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{vmsError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : vms.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Virtual Machines</h3>
                    <p className="mt-1 text-sm text-gray-500">No virtual machines are currently running on this server.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Name
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Type
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Memory
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {vms.map((vm) => {
                          // Format VM memory
                          const formatVMMemory = (): string => {
                            if (vm.ram) {
                              return `${(vm.ram / 1024).toFixed(1)} GB`;
                            } else if (vm.memory) {
                              return `${(vm.memory / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                            } else if (vm.max_physical_memory) {
                              return `${(vm.max_physical_memory / 1024).toFixed(1)} GB`;
                            }
                            return 'N/A';
                          };
                          
                          // Get status color
                          const getVMStatusColor = (state: string): string => {
                            switch(state.toLowerCase()) {
                              case 'running':
                                return 'bg-green-100 text-green-800';
                              case 'stopped':
                                return 'bg-gray-100 text-gray-800';
                              case 'provisioning':
                                return 'bg-blue-100 text-blue-800';
                              case 'failed':
                                return 'bg-red-100 text-red-800';
                              case 'destroyed':
                                return 'bg-red-100 text-red-800';
                              default:
                                return 'bg-yellow-100 text-yellow-800';
                            }
                          };
                          
                          return (
                            <tr key={vm.uuid} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                <Link to={`/vms/${vm.uuid}`} className="text-indigo-600 hover:text-indigo-900">
                                  {vm.alias}
                                </Link>
                                <div className="text-xs text-gray-500 font-mono mt-1">
                                  {vm.uuid.substring(0, 8)}...
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVMStatusColor(vm.state)}`}>
                                  {vm.state}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {vm.brand}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {formatVMMemory()}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <Link to={`/vms/${vm.uuid}`} className="text-indigo-600 hover:text-indigo-900">
                                  View<span className="sr-only">, {vm.alias}</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reboot
        </button>
        {!server.headnode && (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Enter Maintenance
          </button>
        )}
      </div>
    </div>
  );
};

export default ServerDetail;