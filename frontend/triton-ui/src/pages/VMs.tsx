import React, { useEffect, useState } from 'react';
import { getVMs, getServers, getImages, getServer, getImage } from '../services/api';
import { Link } from 'react-router-dom';

interface VM {
  uuid: string;
  alias: string;
  state: string;
  brand: string;
  // In VMAPI, memory is stored as "ram" field in MB
  ram?: number;
  memory?: number; // For backward compatibility
  quota?: number;  // For zones, disk quota in GB
  disk?: number;   // For KVM VMs, disk size
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
  billing_id?: string; // Package UUID in VMAPI
  package_uuid?: string; // For backward compatibility
  server_uuid?: string;
  create_timestamp?: string; // VMAPI uses this
  created_at?: string;      // For backward compatibility
  tags?: any;
  customer_metadata?: any;
  internal_metadata?: any;
  cpu_cap?: number;
  cpu_shares?: number;
  dns_domain?: string;
  autoboot?: boolean;
  max_physical_memory?: number; // Also sometimes used for RAM
}

interface Server {
  uuid: string;
  hostname: string;
  status: string;
}

interface Image {
  uuid: string;
  name: string;
  version: string;
  os: string;
}

// Filter interface for VM filtering
interface VMFilters {
  alias: string;
  uuid: string;
  state: string;
  server: string;
  brand: string;
  image: string;
}

const VMsList = () => {
  const [vms, setVMs] = useState<VM[]>([]);
  const [filteredVMs, setFilteredVMs] = useState<VM[]>([]);
  const [servers, setServers] = useState<Record<string, Server>>({});
  const [images, setImages] = useState<Record<string, Image>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VMFilters>({
    alias: '',
    uuid: '',
    state: '',
    server: '',
    brand: '',
    image: '',
  });

  // Apply filters to VMs
  useEffect(() => {
    if (!vms.length) return;
    
    const filtered = vms.filter(vm => {
      // Filter by alias (case insensitive)
      if (filters.alias && !vm.alias.toLowerCase().includes(filters.alias.toLowerCase())) {
        return false;
      }
      
      // Filter by UUID
      if (filters.uuid && !vm.uuid.toLowerCase().includes(filters.uuid.toLowerCase())) {
        return false;
      }
      
      // Filter by state
      if (filters.state && vm.state !== filters.state) {
        return false;
      }
      
      // Filter by server (hostname)
      if (filters.server && servers[vm.server_uuid || '']?.hostname !== filters.server) {
        return false;
      }
      
      // Filter by brand
      if (filters.brand && vm.brand !== filters.brand) {
        return false;
      }
      
      // Filter by image
      if (filters.image && !vm.image_uuid?.includes(filters.image)) {
        return false;
      }
      
      return true;
    });
    
    setFilteredVMs(filtered);
  }, [vms, filters, servers, images]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch VMs, servers, and images concurrently
        const [vmsResponse, serversResponse, imagesResponse] = await Promise.all([
          getVMs(),
          getServers(),
          getImages()
        ]);
        
        const fetchedVMs = vmsResponse.data;
        setVMs(fetchedVMs);
        setFilteredVMs(fetchedVMs);
        
        // Convert servers array to a map for quick lookups
        const serversMap: Record<string, Server> = {};
        serversResponse.data.forEach((server: Server) => {
          serversMap[server.uuid] = server;
        });
        setServers(serversMap);
        
        // Convert images array to a map for quick lookups
        const imagesMap: Record<string, Image> = {};
        imagesResponse.data.forEach((image: Image) => {
          imagesMap[image.uuid] = image;
        });
        setImages(imagesMap);
        
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatMemory = (vm: VM): string => {
    // RAM is typically defined in MB in VMAPI via the ram field
    if (vm.ram) {
      const gb = vm.ram / 1024;
      return `${gb.toFixed(1)} GB`;
    }
    
    // For backward compatibility, check max_physical_memory (also in MB)
    if (vm.max_physical_memory) {
      const gb = vm.max_physical_memory / 1024;
      return `${gb.toFixed(1)} GB`;
    }
    
    // If memory field is available (bytes), convert from bytes
    if (vm.memory) {
      const gb = vm.memory / (1024 * 1024 * 1024);
      return `${gb.toFixed(1)} GB`;
    }
    
    return "N/A";
  };

  const formatDisk = (vm: VM): string => {
    // For zones, quota is in GB
    if (vm.quota) {
      return `${vm.quota} GB`;
    }
    
    // For KVM VMs, disk is in GB or bytes
    if (vm.disk) {
      // If disk value is very large, assume it's in bytes and convert to GB
      if (vm.disk > 1000) {
        const gb = vm.disk / (1024 * 1024 * 1024);
        return `${gb.toFixed(0)} GB`;
      }
      // Otherwise assume it's already in GB
      return `${vm.disk} GB`;
    }
    
    return "N/A";
  };
  
  const calculateVCPUs = (vm: VM): number => {
    // If vcpus is directly provided, use it
    if (vm.vcpus) return vm.vcpus;
    
    // Otherwise, if cpu_shares is provided, calculate vCPUs (cpu_shares / 100)
    if (vm.cpu_shares) return Math.max(1, Math.round(vm.cpu_shares / 100));
    
    // Default to 1 if no data is available
    return 1;
  };
  
  const getIPAddresses = (vm: VM): string[] => {
    const ips: string[] = [];
    
    // Debug: Log the VM and its nics to console
    console.log('VM', vm.uuid, vm.alias, 'nics:', vm.nics);
    
    // If IPs array is directly available, use it
    if (vm.ips && vm.ips.length > 0) {
      ips.push(...vm.ips);
    }
    
    // Extract IPs from nics array - handling both array and object formats
    if (vm.nics) {
      // Check if nics is an array
      if (Array.isArray(vm.nics)) {
        for (const nic of vm.nics) {
          // Add IP from ip field
          if (nic && typeof nic === 'object' && nic.ip) {
            ips.push(nic.ip);
          }
          
          // Add IPs from ips array on the nic (typically includes CIDR notation)
          if (nic && typeof nic === 'object' && nic.ips && Array.isArray(nic.ips)) {
            // Strip CIDR notation if present
            const cleanIps = nic.ips.map((ip: string) => 
              typeof ip === 'string' ? ip.split('/')[0] : ip
            );
            ips.push(...cleanIps);
          }
        }
      } 
      // Handle the case where nics is an object with numeric keys (old format)
      else if (typeof vm.nics === 'object') {
        Object.keys(vm.nics || {}).forEach(key => {
          const nicsObject = vm.nics as Record<string, any>;
          const nic = nicsObject[key];
          if (nic && typeof nic === 'object' && nic.ip) {
            ips.push(nic.ip);
          }
          
          if (nic && typeof nic === 'object' && nic.ips && Array.isArray(nic.ips)) {
            const cleanIps = nic.ips.map((ip: string) => 
              typeof ip === 'string' ? ip.split('/')[0] : ip
            );
            ips.push(...cleanIps);
          }
        });
      }
    }
    
    console.log('Extracted IPs:', ips);
    
    // Deduplicate IPs and filter out undefined/null values
    return Array.from(new Set(ips)).filter(ip => ip);
  };
  
  const formatIPAddresses = (vm: VM): string => {
    const ips = getIPAddresses(vm);
    
    if (ips.length === 0) {
      return "N/A";
    } else if (ips.length === 1) {
      return ips[0];
    } else {
      // If there are multiple, show first + count
      return `${ips[0]} +${ips.length - 1} more`;
    }
  };
  
  const getImageDetails = (imageUuid: string | undefined): string => {
    if (!imageUuid) return "N/A";
    
    const image = images[imageUuid];
    if (!image) return imageUuid.substring(0, 8) + "...";
    
    return `${image.name} ${image.version}`;
  };
  
  const getServerDetails = (serverUuid: string | undefined): { name: string, uuid: string } => {
    if (!serverUuid) return { name: "N/A", uuid: "" };
    
    const server = servers[serverUuid];
    if (!server) return { name: serverUuid.substring(0, 8) + "...", uuid: serverUuid };
    
    return { name: server.hostname, uuid: server.uuid };
  };

  const getStatusColor = (state: string): string => {
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
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      case 'unknown':
        return 'bg-purple-100 text-purple-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  const getStateIcon = (state: string) => {
    switch(state.toLowerCase()) {
      case 'running':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-green-400" 
               title="Running"></div>
        );
      case 'stopped':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-gray-400" 
               title="Stopped"></div>
        );
      case 'provisioning':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-blue-400 animate-pulse" 
               title="Provisioning"></div>
        );
      case 'failed':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-red-500" 
               title="Failed"></div>
        );
      case 'destroyed':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-red-800" 
               title="Destroyed"></div>
        );
      case 'incomplete':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-yellow-400" 
               title="Incomplete"></div>
        );
      case 'unknown':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-purple-400" 
               title="Unknown"></div>
        );
      case 'active':
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-blue-600" 
               title="Active"></div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-yellow-400" 
               title={state}></div>
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

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading VMs</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract unique values for filters
  const getUniqueStates = () => {
    const states = vms.map(vm => vm.state);
    return Array.from(new Set(states));
  };
  
  const getUniqueBrands = () => {
    const brands = vms.map(vm => vm.brand);
    return Array.from(new Set(brands));
  };
  
  const getUniqueServerNames = () => {
    const serverNames = vms
      .map(vm => servers[vm.server_uuid || '']?.hostname)
      .filter(Boolean) as string[];
    return Array.from(new Set(serverNames));
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
      alias: '',
      uuid: '',
      state: '',
      server: '',
      brand: '',
      image: '',
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Virtual Machines</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all virtual machines in this datacenter.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Create VM
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="aliasFilter" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="aliasFilter"
              name="alias"
              value={filters.alias}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by name"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="uuidFilter" className="block text-sm font-medium text-gray-700">UUID</label>
            <input
              type="text"
              id="uuidFilter"
              name="uuid"
              value={filters.uuid}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by UUID"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="stateFilter" className="block text-sm font-medium text-gray-700">State</label>
            <select
              id="stateFilter"
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All States</option>
              {getUniqueStates().map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="brandFilter" className="block text-sm font-medium text-gray-700">Brand</label>
            <select
              id="brandFilter"
              name="brand"
              value={filters.brand}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Brands</option>
              {getUniqueBrands().map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="serverFilter" className="block text-sm font-medium text-gray-700">Server</label>
            <select
              id="serverFilter"
              name="server"
              value={filters.server}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Servers</option>
              {getUniqueServerNames().map(server => (
                <option key={server} value={server}>{server}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="imageFilter" className="block text-sm font-medium text-gray-700">Image</label>
            <input
              type="text"
              id="imageFilter"
              name="image"
              value={filters.image}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by image ID"
            />
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
          Showing {filteredVMs.length} of {vms.length} VMs
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
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      IP Address
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Resources
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-4 px-6 text-center text-sm text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredVMs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 px-6 text-center text-sm text-gray-500">
                        {vms.length > 0 ? 'No matching virtual machines found. Try adjusting your filters.' : 'No virtual machines found'}
                      </td>
                    </tr>
                  ) : (
                    filteredVMs.map((vm) => {
                      const serverDetails = getServerDetails(vm.server_uuid);
                      return (
                        <tr key={vm.uuid} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getStateIcon(vm.state)}
                              </div>
                              <div>
                                <Link to={`/vms/${vm.uuid}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                  {vm.alias}
                                </Link>
                                <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500">
                                  <span className="inline-block">{serverDetails.name || 'No server'}</span>
                                  <span className="mx-1 text-gray-300">•</span>
                                  <span className="inline-block">{getImageDetails(vm.image_uuid)}</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                  <span>{vm.brand}</span>
                                  {vm.uuid && (
                                    <span className="ml-1 text-gray-400 font-mono text-2xs" title={vm.uuid}>
                                      ({vm.uuid})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex flex-col space-y-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vm.state)}`}>
                                {vm.state}
                              </span>
                              <div className="text-xs text-gray-500">
                                {vm.create_timestamp || vm.created_at ? 
                                  new Date(vm.create_timestamp || vm.created_at || '').toLocaleDateString() : ''}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center">
                              <span className="text-gray-900 font-mono">{formatIPAddresses(vm)}</span>
                              {formatIPAddresses(vm) !== "N/A" && (
                                <button 
                                  title="Copy IP Address"
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                  onClick={() => {
                                    const ip = getIPAddresses(vm)[0];
                                    if (ip) {
                                      navigator.clipboard.writeText(ip);
                                    }
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            {vm.dns_domain && (
                              <div className="text-xs text-gray-500 mt-1">
                                {vm.dns_domain}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">{formatMemory(vm)}</span>
                              <span className="text-gray-300">/</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span className="font-medium">{formatDisk(vm)}</span>
                            </div>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{calculateVCPUs(vm)} vCPUs</span>
                              {vm.cpu_cap && <span className="ml-1">(Cap: {vm.cpu_cap}%)</span>}
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
                                <Link to={`/vms/${vm.uuid}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                  <div className="flex items-center">
                                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View details
                                  </div>
                                </Link>
                                
                                {vm.state.toLowerCase() === 'running' ? (
                                  <>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                      <div className="flex items-center">
                                        <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Stop
                                      </div>
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                      <div className="flex items-center">
                                        <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Reboot
                                      </div>
                                    </button>
                                  </>
                                ) : (
                                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                    <div className="flex items-center">
                                      <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Start
                                    </div>
                                  </button>
                                )}
                                
                                <div className="border-t border-gray-100 my-1"></div>
                                
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                  <div className="flex items-center">
                                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Take snapshot
                                  </div>
                                </button>
                                
                                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-900">
                                  <div className="flex items-center">
                                    <svg className="mr-3 h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </div>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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

export default VMsList;