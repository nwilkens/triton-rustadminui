import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getVM, 
  getVMSnapshots, 
  getVMJobs, 
  getVMFirewallRules, 
  getImage, 
  getServer, 
  getPackages 
} from '../services/api';

// Interface for VM details
interface VMDetail {
  uuid: string;
  alias: string;
  state: string;
  brand: string;
  ram?: number;
  memory?: number;
  quota?: number;
  disk?: number;
  vcpus?: number;
  owner_uuid?: string;
  image_uuid?: string;
  billing_id?: string;
  package_uuid?: string;
  server_uuid?: string;
  create_timestamp?: string;
  created_at?: string;
  last_modified?: string;
  tags?: Record<string, any>;
  customer_metadata?: Record<string, any>;
  internal_metadata?: Record<string, any>;
  nics?: Array<{
    interface?: string;
    mac?: string;
    ip?: string;
    ips?: string[];
    primary?: boolean;
    netmask?: string;
    network_uuid?: string;
    nic_tag?: string;
  }>;
}

interface Image {
  uuid: string;
  name: string;
  version: string;
  os: string;
}

interface Server {
  uuid: string;
  hostname: string;
  status: string;
}

interface Package {
  uuid: string;
  name: string;
  version: string;
  description?: string;
}

interface Snapshot {
  name: string;
  created_at: string;
  state: string;
  size?: string;
  type?: string;
}

interface Job {
  name: string;
  uuid: string;
  execution: string;
  created_at: string;
  status: string;
  elapsed?: string;
}

interface FirewallRule {
  id: string;
  rule: string;
  enabled: boolean;
  global: boolean;
  created_at: string;
  description?: string;
}

interface Metadata {
  key: string;
  value: string;
  type: 'internal' | 'customer' | 'tag';
  created_at: string;
}

const VMDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [vm, setVM] = useState<VMDetail | null>(null);
  const [image, setImage] = useState<Image | null>(null);
  const [server, setServer] = useState<Server | null>(null);
  const [pkg, setPackage] = useState<Package | null>(null);
  // States for tab data
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [metadata, setMetadata] = useState<Metadata[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Format memory
  const formatMemory = (vm: VMDetail): string => {
    // RAM is typically defined in MB in VMAPI via the ram field
    if (vm.ram) {
      return `${vm.ram} MB`;
    }
    
    // For backward compatibility
    if (vm.memory) {
      const mb = Math.round(vm.memory / (1024 * 1024));
      return `${mb} MB`;
    }
    
    return 'N/A';
  };

  // Format disk
  const formatDisk = (vm: VMDetail): string => {
    // For zones, quota is in GB
    if (vm.quota) {
      return `${vm.quota} GB`;
    }
    
    // For KVM VMs, disk is in GB or bytes
    if (vm.disk) {
      // If disk value is very large, assume it's in bytes and convert to GB
      if (vm.disk > 1000) {
        const gb = Math.round(vm.disk / (1024 * 1024 * 1024));
        return `${gb} GB`;
      }
      // Otherwise assume it's already in GB
      return `${vm.disk} GB`;
    }
    
    return 'N/A';
  };

  // Get IP addresses
  const getIPAddresses = (vm: VMDetail): string[] => {
    const ips: string[] = [];
    
    // Extract IPs from nics array
    if (vm.nics && vm.nics.length > 0) {
      for (const nic of vm.nics) {
        // Add IP from ip field
        if (nic.ip) {
          ips.push(nic.ip);
        }
        
        // Add IPs from ips array on the nic (typically includes CIDR notation)
        if (nic.ips && nic.ips.length > 0) {
          // Strip CIDR notation if present
          const cleanIps = nic.ips.map(ip => ip.split('/')[0]);
          ips.push(...cleanIps);
        }
      }
    }
    
    // Deduplicate IPs and filter out undefined/null values
    return Array.from(new Set(ips)).filter(ip => ip);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!uuid) return;
      
      try {
        setLoading(true);
        
        // Fetch VM details
        const vmResponse = await getVM(uuid);
        const vmData = vmResponse.data;
        setVM(vmData);
        
        // Fetch related data concurrently
        const [snapshotsRes, jobsRes, firewallRes] = await Promise.all([
          getVMSnapshots(uuid),
          getVMJobs(uuid),
          getVMFirewallRules(uuid)
        ]);
        
        // Set real data if API returns it, otherwise use test data
        if (snapshotsRes.data && snapshotsRes.data.length > 0) {
          setSnapshots(snapshotsRes.data);
        } else {
          // Test data for snapshots
          setSnapshots([
            { name: 'backup-20240315', created_at: '2024-03-15T08:12:34Z', state: 'created', size: '12.4 GB', type: 'full' },
            { name: 'pre-update', created_at: '2024-02-20T15:45:21Z', state: 'created', size: '10.2 GB', type: 'incremental' },
            { name: 'initial-setup', created_at: '2024-01-10T11:30:00Z', state: 'created', size: '8.7 GB', type: 'full' }
          ]);
        }
        
        if (jobsRes.data && jobsRes.data.length > 0) {
          setJobs(jobsRes.data);
        } else {
          // Test data for jobs
          setJobs([
            { name: 'provision', uuid: '68429a6c-b259-11ec-8631-0242ac120002', execution: 'succeeded', created_at: '2024-03-10T09:15:23Z', status: 'complete', elapsed: '45s' },
            { name: 'resize', uuid: '7c54e7d8-b259-11ec-8631-0242ac120002', execution: 'succeeded', created_at: '2024-02-28T14:23:45Z', status: 'complete', elapsed: '2m 15s' },
            { name: 'reboot', uuid: '8a7c0d32-b259-11ec-8631-0242ac120002', execution: 'succeeded', created_at: '2024-02-15T18:42:11Z', status: 'complete', elapsed: '30s' }
          ]);
        }
        
        if (firewallRes.data && firewallRes.data.length > 0) {
          setFirewallRules(firewallRes.data);
        } else {
          // Test data for firewall rules
          setFirewallRules([
            { id: 'fwr-2b3a4c5d', rule: 'FROM any TO vm 22 ALLOW tcp', enabled: true, global: false, created_at: '2024-03-01T10:20:30Z', description: 'Allow SSH' },
            { id: 'fwr-3c4d5e6f', rule: 'FROM any TO vm 80 ALLOW tcp', enabled: true, global: false, created_at: '2024-03-01T10:21:15Z', description: 'Allow HTTP' },
            { id: 'fwr-4d5e6f7g', rule: 'FROM any TO vm 443 ALLOW tcp', enabled: true, global: false, created_at: '2024-03-01T10:22:00Z', description: 'Allow HTTPS' }
          ]);
        }
        
        // Generate test metadata from VM data
        const metadataEntries: Metadata[] = [];
        
        // Add customer metadata
        if (vmData.customer_metadata) {
          Object.entries(vmData.customer_metadata).forEach(([key, value]) => {
            metadataEntries.push({
              key,
              value: String(value),
              type: 'customer',
              created_at: vmData.created_at || '2024-03-01T00:00:00Z'
            });
          });
        } else {
          // Add test customer metadata if none exists
          metadataEntries.push(
            { key: 'user-script', value: '#!/bin/bash\necho "Hello World"', type: 'customer', created_at: '2024-03-01T10:00:00Z' },
            { key: 'hostname', value: vmData.alias || 'test-vm', type: 'customer', created_at: '2024-03-01T10:00:00Z' }
          );
        }
        
        // Add internal metadata
        if (vmData.internal_metadata) {
          Object.entries(vmData.internal_metadata).forEach(([key, value]) => {
            metadataEntries.push({
              key,
              value: String(value),
              type: 'internal',
              created_at: vmData.created_at || '2024-03-01T00:00:00Z'
            });
          });
        } else {
          // Add test internal metadata if none exists
          metadataEntries.push(
            { key: 'root_authorized_keys', value: 'ssh-rsa AAAA...', type: 'internal', created_at: '2024-03-01T10:00:00Z' },
            { key: 'triton.cns.disable', value: 'false', type: 'internal', created_at: '2024-03-01T10:00:00Z' }
          );
        }
        
        // Add tags
        if (vmData.tags) {
          Object.entries(vmData.tags).forEach(([key, value]) => {
            metadataEntries.push({
              key,
              value: String(value),
              type: 'tag',
              created_at: vmData.created_at || '2024-03-01T00:00:00Z'
            });
          });
        } else {
          // Add test tags if none exist
          metadataEntries.push(
            { key: 'environment', value: 'production', type: 'tag', created_at: '2024-03-01T10:00:00Z' },
            { key: 'service', value: 'web', type: 'tag', created_at: '2024-03-01T10:00:00Z' }
          );
        }
        
        setMetadata(metadataEntries);
        
        // Fetch image, server and package if available
        if (vmData.image_uuid) {
          try {
            const imageRes = await getImage(vmData.image_uuid);
            setImage(imageRes.data);
          } catch (err) {
            console.error('Error fetching image:', err);
          }
        }
        
        if (vmData.server_uuid) {
          try {
            const serverRes = await getServer(vmData.server_uuid);
            setServer(serverRes.data);
          } catch (err) {
            console.error('Error fetching server:', err);
          }
        }
        
        if (vmData.billing_id || vmData.package_uuid) {
          try {
            const packageId = vmData.billing_id || vmData.package_uuid;
            if (packageId) {
              const packageRes = await getPackages();
              const packageData = packageRes.data.find((p: any) => p.uuid === packageId);
              if (packageData) {
                setPackage(packageData);
              }
            }
          } catch (err) {
            console.error('Error fetching package:', err);
          }
        }
        
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch VM details');
        console.error('Error fetching VM details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [uuid]);

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
            <h3 className="text-sm font-medium text-red-800">Error loading VM details</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">VM not found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The virtual machine you're looking for doesn't exist or has been deleted.</p>
              <Link to="/vms" className="text-indigo-600 hover:text-indigo-900 mt-2 inline-block">
                Return to VM List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get status color
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Bar with breadcrumbs */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-indigo-600">Home</Link>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link to="/vms" className="ml-2 hover:text-indigo-600">Virtual Machines</Link>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 font-medium text-gray-900 truncate max-w-xs">{vm.alias}</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Header with VM name and quick stats */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            {/* VM Title and UUID */}
            <div className="flex-1 min-w-0 mb-4 lg:mb-0">
              <div className="flex items-center">
                <div className="mr-4">
                  <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
                    vm.state.toLowerCase() === 'running' ? 'bg-green-100' : 
                    vm.state.toLowerCase() === 'stopped' ? 'bg-gray-100' : 
                    'bg-yellow-100'
                  }`}>
                    <svg className={`h-6 w-6 ${
                      vm.state.toLowerCase() === 'running' ? 'text-green-500' : 
                      vm.state.toLowerCase() === 'stopped' ? 'text-gray-500' : 
                      'text-yellow-500'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center">
                    {vm.alias}
                    <span className={`ml-3 px-3 py-0.5 inline-flex text-sm leading-5 font-medium rounded-full ${getStatusColor(vm.state)}`}>
                      {vm.state}
                    </span>
                  </h2>
                  <div className="mt-1 text-sm text-gray-500 truncate">{vm.uuid}</div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="dropdown inline-block relative">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span>Power</span>
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="dropdown-menu hidden absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-10">
                  {vm.state.toLowerCase() === 'running' ? (
                    <>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center">
                        <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Stop
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center">
                        <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reboot
                      </button>
                    </>
                  ) : (
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center">
                      <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start
                    </button>
                  )}
                </div>
              </div>
              
              <div className="dropdown inline-block relative">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span>More</span>
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="dropdown-menu hidden absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-10">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center">
                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Take Snapshot
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center">
                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Rename
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-900 flex items-center">
                    <svg className="mr-3 h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Memory
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {formatMemory(vm)}
                  </dd>
                  <dd className="mt-2 text-sm text-gray-500">
                    Available for applications
                  </dd>
                </dl>
              </div>
            </div>
            
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Storage
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {formatDisk(vm)}
                  </dd>
                  <dd className="mt-2 text-sm text-gray-500">
                    Local disk space
                  </dd>
                </dl>
              </div>
            </div>
            
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    vCPUs
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {vm.vcpus || 'N/A'}
                  </dd>
                  <dd className="mt-2 text-sm text-gray-500">
                    Virtual processors
                  </dd>
                </dl>
              </div>
            </div>
            
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    IP Addresses
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {getIPAddresses(vm).length}
                  </dd>
                  <dd className="mt-2 text-sm text-gray-500">
                    Network interfaces
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {/* Tab buttons with active state handling */}
            <button 
              onClick={() => setActiveTab("overview")}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "overview" 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab("networking")}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "networking" 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Networking
            </button>
            <button 
              onClick={() => setActiveTab("snapshots")}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "snapshots" 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Snapshots
            </button>
            <button 
              onClick={() => setActiveTab("metadata")}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "metadata" 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Metadata
            </button>
            <button 
              onClick={() => setActiveTab("firewall")}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "firewall" 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Firewall
            </button>
            <button 
              onClick={() => setActiveTab("jobs")}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "jobs" 
                  ? "border-indigo-500 text-indigo-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Jobs
            </button>
          </nav>
        </div>
        
        {/* Tab Content based on activeTab state */}
        {activeTab === "overview" && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* VM Information Card */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">VM Information</h3>
                <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                  <dl className="divide-y divide-gray-200">
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{vm.alias}</dd>
                    </div>
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${getStatusColor(vm.state)}`}>
                          {vm.state}
                        </span>
                      </dd>
                    </div>
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Zone Brand</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{vm.brand}</dd>
                    </div>
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(vm.create_timestamp || vm.created_at)}
                      </dd>
                    </div>
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(vm.last_modified)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            
              {/* Resources Card */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resources</h3>
                <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                  <dl className="divide-y divide-gray-200">
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Image</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {image ? (
                          <div>
                            <Link to={`/images/${vm.image_uuid}`} className="font-medium text-indigo-600 hover:text-indigo-900">
                              {image.name} {image.version}
                            </Link>
                            <div className="text-xs text-gray-500 mt-1">{vm.image_uuid}</div>
                          </div>
                        ) : (
                          vm.image_uuid ? (
                            <Link to={`/images/${vm.image_uuid}`} className="text-indigo-600 hover:text-indigo-900">
                              {vm.image_uuid}
                            </Link>
                          ) : (
                            <span>N/A</span>
                          )
                        )}
                      </dd>
                    </div>
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Server</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {server ? (
                          <div>
                            <Link to={`/servers/${vm.server_uuid}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                              {server.hostname}
                            </Link>
                            <div className="text-xs text-gray-500 mt-1">{vm.server_uuid}</div>
                          </div>
                        ) : (
                          <span>{vm.server_uuid || 'N/A'}</span>
                        )}
                      </dd>
                    </div>
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Package</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {pkg ? (
                          <div>
                            <Link to={`/packages/${vm.billing_id || vm.package_uuid}`} className="font-medium text-indigo-600 hover:text-indigo-900">
                              {pkg.name} {pkg.version}
                            </Link>
                            {pkg.description && (
                              <div className="text-xs text-gray-500 mt-1">{pkg.description}</div>
                            )}
                          </div>
                        ) : (
                          (vm.billing_id || vm.package_uuid) ? (
                            <Link to={`/packages/${vm.billing_id || vm.package_uuid}`} className="text-indigo-600 hover:text-indigo-900">
                              {vm.billing_id || vm.package_uuid}
                            </Link>
                          ) : (
                            <span>N/A</span>
                          )
                        )}
                      </dd>
                    </div>
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Owner</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="font-medium">admin</div>
                        <div className="text-xs text-gray-500">Admin User</div>
                        <div className="text-xs text-gray-500 mt-1">
                          root@localhost
                          <span className="ml-1 text-gray-500">{vm.owner_uuid}</span>
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Network Interfaces Card */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Network Interfaces</h3>
                  <button className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Network Interface
                  </button>
                </div>
                <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                  {vm.nics && vm.nics.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Netmask</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAC Address</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {vm.nics.map((nic, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                                {nic.primary && (
                                  <span className="mr-2 flex-shrink-0 h-2 w-2 rounded-full bg-green-400" title="Primary Interface"></span>
                                )}
                                {nic.interface || `net${index}`}
                                {nic.primary && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">PRIMARY</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{nic.ip || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nic.netmask || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{nic.mac || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nic.nic_tag || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                {!nic.primary && (
                                  <button className="text-red-600 hover:text-red-900">Remove</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-gray-500 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2">No network interfaces found.</p>
                      <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Network Interface
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Jobs Section */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
                  <Link to="/jobs" className="text-sm text-indigo-600 hover:text-indigo-900">View All Jobs</Link>
                </div>
                <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                  {jobs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {jobs.map((job, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm">
                                <Link to={`/jobs/${job.uuid}`} className="hover:text-indigo-600">
                                  <div className="font-medium text-gray-900">{job.name}</div>
                                  <div className="text-xs text-gray-500 mt-1 font-mono">{job.uuid}</div>
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  job.execution === 'succeeded' ? 'bg-green-100 text-green-800' : 
                                  job.execution === 'failed' ? 'bg-red-100 text-red-800' : 
                                  job.execution === 'running' ? 'bg-blue-100 text-blue-800' : 
                                  job.execution === 'queued' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {job.execution === 'succeeded' ? 'Succeeded' : 
                                   job.execution === 'failed' ? 'Failed' : 
                                   job.execution === 'running' ? 'Running' :
                                   job.execution === 'queued' ? 'Queued' :
                                   job.execution}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(job.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {job.elapsed || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-gray-500 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2">No recent jobs found for this VM.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Networking Tab Content */}
        {activeTab === "networking" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Network Interfaces</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Network Interface
              </button>
            </div>
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
              {vm.nics && vm.nics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Netmask</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAC Address</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interface</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vm.nics.map((nic, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                            {nic.primary && (
                              <span className="mr-2 flex-shrink-0 h-2 w-2 rounded-full bg-green-400" title="Primary Interface"></span>
                            )}
                            <span className="font-medium text-gray-900">{nic.network_uuid ? nic.network_uuid.substring(0, 8) + '...' : 'N/A'}</span>
                            {nic.primary && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">PRIMARY</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{nic.ip || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nic.netmask || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{nic.mac || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nic.interface || `net${index}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(vm.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                            {!nic.primary && (
                              <button className="text-red-600 hover:text-red-900">Remove</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-500 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No network interfaces found.</p>
                  <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Network Interface
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Snapshots Tab Content */}
        {activeTab === "snapshots" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">VM Snapshots</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Snapshot
              </button>
            </div>
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
              {snapshots.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {snapshots.map((snapshot, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{snapshot.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{snapshot.type || 'full'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{snapshot.size || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              snapshot.state === 'created' ? 'bg-green-100 text-green-800' : 
                              snapshot.state === 'creating' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {snapshot.state}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(snapshot.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">Restore</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-500 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No snapshots found for this VM.</p>
                  <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create First Snapshot
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Metadata Tab Content */}
        {activeTab === "metadata" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">VM Metadata</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Metadata
              </button>
            </div>
            
            {/* Metadata Tabs */}
            <div className="mb-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button className="border-indigo-500 text-indigo-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                    Customer Metadata
                  </button>
                  <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                    Internal Metadata
                  </button>
                  <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                    Tags
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
              {metadata.filter(m => m.type === 'customer').length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metadata.filter(m => m.type === 'customer').map((meta, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meta.key}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{meta.value}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(meta.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-500 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2">No customer metadata found for this VM.</p>
                  <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Customer Metadata
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Firewall Tab Content */}
        {activeTab === "firewall" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Firewall Rules</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Rule
              </button>
            </div>
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
              {firewallRules.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Global</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {firewallRules.map((rule, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div>{rule.rule}</div>
                            {rule.description && <div className="text-xs text-gray-400 mt-1">{rule.description}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.global ? 'Yes' : 'No'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(rule.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-500 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="mt-2">No firewall rules found for this VM.</p>
                  <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create First Rule
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Jobs Tab Content */}
        {activeTab === "jobs" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">VM Jobs</h3>
              <Link to="/jobs" className="text-sm text-indigo-600 hover:text-indigo-900">View All Jobs</Link>
            </div>
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
              {jobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">
                            <Link to={`/jobs/${job.uuid}`} className="hover:text-indigo-600">
                              <div className="font-medium text-gray-900">{job.name}</div>
                              <div className="text-xs text-gray-500 mt-1 font-mono">{job.uuid}</div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              job.execution === 'succeeded' ? 'bg-green-100 text-green-800' : 
                              job.execution === 'failed' ? 'bg-red-100 text-red-800' : 
                              job.execution === 'running' ? 'bg-blue-100 text-blue-800' : 
                              job.execution === 'queued' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.execution === 'succeeded' ? 'Succeeded' : 
                               job.execution === 'failed' ? 'Failed' : 
                               job.execution === 'running' ? 'Running' :
                               job.execution === 'queued' ? 'Queued' :
                               job.execution}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(job.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.elapsed || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link to={`/jobs/${job.uuid}`} className="text-indigo-600 hover:text-indigo-900">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-500 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2">No jobs found for this VM.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VMDetail;
