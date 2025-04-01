import React, { useEffect, useState } from 'react';
import { getVMs, getServers, getImages, getServer, getImage } from '../services/api';
import { Link } from 'react-router-dom';

interface VM {
  uuid: string;
  alias: string;
  state: string;
  brand: string;
  memory: number;
  quota?: number;
  disk: number;
  vcpus: number;
  owner_uuid: string;
  ips?: string[];
  nics?: any[];
  image_uuid?: string;
  package_uuid?: string;
  server_uuid?: string;
  created_at?: string;
  tags?: any;
  customer_metadata?: any;
  internal_metadata?: any;
  cpu_cap?: number;
  cpu_shares?: number;
  dns_domain?: string;
  autoboot?: boolean;
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

const VMsList = () => {
  const [vms, setVMs] = useState<VM[]>([]);
  const [servers, setServers] = useState<Record<string, Server>>({});
  const [images, setImages] = useState<Record<string, Image>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        
        setVMs(vmsResponse.data);
        
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

  const formatMemory = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const formatDisk = (vm: VM): string => {
    // Use quota field if available (for zones), otherwise use disk field
    const diskBytes = vm.quota ? vm.quota : vm.disk;
    const gb = diskBytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(0)} GB`;
  };
  
  const calculateVCPUs = (vm: VM): number => {
    // If vcpus is directly provided, use it
    if (vm.vcpus) return vm.vcpus;
    
    // Otherwise, if cpu_shares is provided, calculate vCPUs (cpu_shares / 100)
    if (vm.cpu_shares) return Math.max(1, Math.round(vm.cpu_shares / 100));
    
    // Default to 1 if no data is available
    return 1;
  };
  
  const getIPAddress = (vm: VM): string => {
    // If IPs array is directly available, use the first IP
    if (vm.ips && vm.ips.length > 0) return vm.ips[0];
    
    // Otherwise, try to extract IP from nics array
    if (vm.nics && vm.nics.length > 0) {
      // Look for primary NIC first
      const primaryNic = vm.nics.find(nic => nic.primary === true);
      if (primaryNic && primaryNic.ip) return primaryNic.ip;
      
      // If no primary NIC found, use the first NIC
      if (vm.nics[0].ip) return vm.nics[0].ip;
    }
    
    return "N/A";
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
      default:
        return 'bg-yellow-100 text-yellow-800';
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
                      State
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Image
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Server
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      IP Address
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Specs
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {vms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 px-6 text-center text-sm text-gray-500">
                        No virtual machines found
                      </td>
                    </tr>
                  ) : (
                    vms.map((vm) => {
                      const serverDetails = getServerDetails(vm.server_uuid);
                      return (
                        <tr key={vm.uuid} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                            <div className="text-sm font-medium text-gray-900">
                              {vm.alias}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {vm.uuid}
                            </div>
                            {vm.dns_domain && (
                              <div className="text-xs text-gray-500 mt-1">
                                {vm.dns_domain}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vm.state)}`}>
                              {vm.state}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {vm.brand}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {getImageDetails(vm.image_uuid)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {serverDetails.uuid ? (
                              <Link to={`/servers/${serverDetails.uuid}`} className="text-indigo-600 hover:text-indigo-900">
                                {serverDetails.name}
                              </Link>
                            ) : (
                              serverDetails.name
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {getIPAddress(vm)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-900">{formatMemory(vm.memory)}</span>
                              </div>
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-gray-900">{formatDisk(vm)}</span>
                              </div>
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-900">{calculateVCPUs(vm)} vCPUs</span>
                                {vm.cpu_cap && <span className="text-xs text-gray-500 ml-1">(Cap: {vm.cpu_cap}%)</span>}
                              </div>
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex flex-col space-y-2">
                              <Link to={`/vms/${vm.uuid}`} className="text-indigo-600 hover:text-indigo-900">
                                View
                              </Link>
                              {vm.state.toLowerCase() === 'running' ? (
                                <button className="text-red-600 hover:text-red-900">
                                  Stop
                                </button>
                              ) : (
                                <button className="text-green-600 hover:text-green-900">
                                  Start
                                </button>
                              )}
                              <button className="text-gray-600 hover:text-gray-900">
                                Reboot
                              </button>
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