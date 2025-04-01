import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServers } from '../services/api';

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
  system_type?: string;
  comments?: string;
  sysinfo?: {
    'Live Image'?: string;
    Manufacturer?: string;
    'Product'?: string;
  };
}

// Filter interface for server filtering
interface ServerFilters {
  hostname: string;
  status: string;
  datacenter: string;
  headnode: string;
  setup: string;
}

const ServersList = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [filteredServers, setFilteredServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServerFilters>({
    hostname: '',
    status: '',
    datacenter: '',
    headnode: '',
    setup: ''
  });

  useEffect(() => {
    if (!servers.length) return;
    
    const filtered = servers.filter(server => {
      // Filter by hostname
      if (filters.hostname && !server.hostname.toLowerCase().includes(filters.hostname.toLowerCase())) {
        return false;
      }
      
      // Filter by status
      if (filters.status && server.status !== filters.status) {
        return false;
      }
      
      // Filter by datacenter
      if (filters.datacenter && server.datacenter !== filters.datacenter) {
        return false;
      }
      
      // Filter by headnode status
      if (filters.headnode) {
        const isHeadnode = server.headnode === true;
        if (filters.headnode === 'true' && !isHeadnode) {
          return false;
        }
        if (filters.headnode === 'false' && isHeadnode) {
          return false;
        }
      }
      
      // Filter by setup status
      if (filters.setup) {
        if (filters.setup === 'complete' && (!server.setup || server.setting_up)) {
          return false;
        }
        if (filters.setup === 'setting_up' && !server.setting_up) {
          return false;
        }
        if (filters.setup === 'needed' && (server.setup || server.setting_up)) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredServers(filtered);
  }, [servers, filters]);

  const refreshServers = async () => {
    try {
      setLoading(true);
      const response = await getServers();
      setServers(response.data);
      setFilteredServers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshServers();
  }, []);

  const formatMemory = (ram?: number): string => {
    if (!ram) return 'N/A';
    const gb = ram / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
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
  
  const getStatusIcon = (status: string, isHeadnode: boolean = false) => {
    const iconClasses = isHeadnode ? 
      "flex-shrink-0 h-3 w-3 rounded-full border border-green-900" : 
      "flex-shrink-0 h-3 w-3 rounded-full";
      
    switch(status.toLowerCase()) {
      case 'running':
        return (
          <div className={`${iconClasses} bg-green-400`} 
               title={`${isHeadnode ? 'Headnode' : 'Compute Node'} - Running`}></div>
        );
      case 'offline':
        return (
          <div className={`${iconClasses} bg-red-500`} 
               title={`${isHeadnode ? 'Headnode' : 'Compute Node'} - Offline`}></div>
        );
      case 'maintenance':
        return (
          <div className={`${iconClasses} bg-yellow-400`} 
               title={`${isHeadnode ? 'Headnode' : 'Compute Node'} - Maintenance`}></div>
        );
      default:
        return (
          <div className={`${iconClasses} bg-gray-400`} 
               title={`${isHeadnode ? 'Headnode' : 'Compute Node'} - ${status}`}></div>
        );
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

  // Get unique values for filters
  const getUniqueStatuses = () => {
    const statuses = servers.map(server => server.status);
    return Array.from(new Set(statuses));
  };
  
  const getUniqueDatacenters = () => {
    const datacenters = servers.map(server => server.datacenter);
    return Array.from(new Set(datacenters));
  };

  // Handler for filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      hostname: '',
      status: '',
      datacenter: '',
      headnode: '',
      setup: ''
    });
  };

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
            <h3 className="text-sm font-medium text-red-800">Error loading servers</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Compute Nodes</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all compute nodes in this datacenter.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <span className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={refreshServers}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </span>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="hostnameFilter" className="block text-sm font-medium text-gray-700">Hostname</label>
            <input
              type="text"
              id="hostnameFilter"
              name="hostname"
              value={filters.hostname}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by hostname"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="statusFilter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              {getUniqueStatuses().map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="datacenterFilter" className="block text-sm font-medium text-gray-700">Datacenter</label>
            <select
              id="datacenterFilter"
              name="datacenter"
              value={filters.datacenter}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Datacenters</option>
              {getUniqueDatacenters().map(dc => (
                <option key={dc} value={dc}>{dc}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="headnodeFilter" className="block text-sm font-medium text-gray-700">Node Type</label>
            <select
              id="headnodeFilter"
              name="headnode"
              value={filters.headnode}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="true">Headnodes</option>
              <option value="false">Compute Nodes</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="setupFilter" className="block text-sm font-medium text-gray-700">Setup Status</label>
            <select
              id="setupFilter"
              name="setup"
              value={filters.setup}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Setup Statuses</option>
              <option value="complete">Setup Complete</option>
              <option value="setting_up">Setting Up</option>
              <option value="needed">Setup Needed</option>
            </select>
          </div>
          
          <div className="flex items-end pt-4">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Filter stats */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredServers.length} of {servers.length} servers
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Hostname
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Memory
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Platform
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Uptime
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredServers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 px-6 text-center text-sm text-gray-500">
                        {servers.length > 0 ? 'No matching servers found. Try adjusting your filters.' : 'No servers found'}
                      </td>
                    </tr>
                  ) : (
                    filteredServers.map((server) => (
                      <tr key={server.uuid} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(server.status, server.headnode)}
                            </div>
                            <div>
                              <Link to={`/servers/${server.uuid}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                {server.hostname}
                                {server.headnode && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Headnode</span>}
                              </Link>
                              <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500">
                                <span className="inline-block">{server.datacenter || 'unknown datacenter'}</span>
                                <span className="mx-1 text-gray-300">•</span>
                                <span className="inline-block font-mono text-2xs truncate max-w-[120px]" title={server.uuid}>
                                  {server.uuid}
                                </span>
                              </div>
                              {server.comments && (
                                <div className="mt-1 text-xs text-gray-500 italic">
                                  {server.comments}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(server.status)}`}>
                              {server.status}
                            </span>
                            <div className="text-xs">
                              {getSetupStatus(server)}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{formatMemory(server.ram)}</span>
                          </div>
                          {server.reservation_ratio && (
                            <div className="text-xs text-gray-500 mt-1">
                              Res. ratio: {(server.reservation_ratio * 100).toFixed(0)}%
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-xs font-mono">
                            {server.current_platform || 'unknown'}
                            {server.current_platform !== server.boot_platform && (
                              <div className="mt-1 text-yellow-600">
                                Boot: {server.boot_platform || 'unknown'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatUptime(server.last_boot)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Since {formatDate(server.last_boot)}
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="dropdown relative inline-block">
                            <button className="rounded-md bg-white p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            <div className="dropdown-menu hidden absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-10">
                              <Link to={`/servers/${server.uuid}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                <div className="flex items-center">
                                  <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View details
                                </div>
                              </Link>
                              
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                <div className="flex items-center">
                                  <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Reboot
                                </div>
                              </button>

                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                <div className="flex items-center">
                                  <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  View logs
                                </div>
                              </button>

                              {server.setup && (
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                  <div className="flex items-center">
                                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit setup
                                  </div>
                                </button>
                              )}
                              
                              {!server.headnode && (
                                <button className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900">
                                  <div className="flex items-center">
                                    <svg className="mr-3 h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Enter maintenance
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServersList;