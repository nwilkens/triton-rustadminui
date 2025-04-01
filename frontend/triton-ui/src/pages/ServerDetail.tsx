import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getServer, getVMsByServer } from '../services/api';

interface ServerMetrics {
  cpu_utilization?: number;
  network_throughput?: {
    rx_bytes_sec?: number;
    tx_bytes_sec?: number;
  };
  disk_io?: {
    read_bytes_sec?: number;
    write_bytes_sec?: number;
    iops?: number;
  };
  // Add more metrics as needed
}

interface Server {
  uuid: string;
  hostname: string;
  status: string;
  datacenter: string;
  ram?: number;
  memory_total_bytes?: number;
  memory_available_bytes?: number;
  memory_utilized_bytes?: number;
  memory_utilization_percent?: number;
  disk_total_bytes?: number;
  disk_available_bytes?: number;
  disk_utilized_bytes?: number;
  disk_utilization_percent?: number;
  cpu_type?: string;
  cpu_cores?: number;
  cpu_sockets?: number;
  cpu_threads_per_core?: number;
  cpu_speed_mhz?: number;
  cpu_virtualization?: boolean;
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
  network_interfaces?: {
    name: string;
    mac: string;
    ip: string;
    netmask: string;
    link_status: string;
    speed: string;
    type: string;
    mtu?: number;
  }[];
  sysinfo?: {
    'Live Image'?: string;
    Manufacturer?: string;
    'Product'?: string;
    [key: string]: any;
  };
  metrics?: ServerMetrics;
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

  // Simulate real-time metrics for development
  const simulateMetrics = (server: Server | null): ServerMetrics => {
    if (!server) return {};
    
    // Generate random CPU utilization between 10-70%
    const cpu_utilization = Math.floor(Math.random() * 60) + 10;
    
    // Generate network throughput - simulate realistic values
    const rx_bytes_sec = Math.floor(Math.random() * 50) * 1024 * 1024; // 0-50 MB/s
    const tx_bytes_sec = Math.floor(Math.random() * 40) * 1024 * 1024; // 0-40 MB/s
    
    // Generate disk I/O - simulate realistic values
    const read_bytes_sec = Math.floor(Math.random() * 100) * 1024 * 1024; // 0-100 MB/s
    const write_bytes_sec = Math.floor(Math.random() * 80) * 1024 * 1024; // 0-80 MB/s
    const iops = Math.floor(Math.random() * 2000) + 500; // 500-2500 IOPS
    
    return {
      cpu_utilization,
      network_throughput: {
        rx_bytes_sec,
        tx_bytes_sec
      },
      disk_io: {
        read_bytes_sec,
        write_bytes_sec,
        iops
      }
    };
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (!uuid) return;

      try {
        setLoading(true);
        const serverResponse = await getServer(uuid);
        let serverData = serverResponse.data;
        
        // Add computed fields for UI display
        if (serverData.memory_total_bytes && serverData.memory_available_bytes) {
          serverData.memory_utilized_bytes = serverData.memory_total_bytes - serverData.memory_available_bytes;
          serverData.memory_utilization_percent = (serverData.memory_utilized_bytes / serverData.memory_total_bytes) * 100;
        }
        
        if (serverData.disk_total_bytes && serverData.disk_available_bytes) {
          serverData.disk_utilized_bytes = serverData.disk_total_bytes - serverData.disk_available_bytes;
          serverData.disk_utilization_percent = (serverData.disk_utilized_bytes / serverData.disk_total_bytes) * 100;
        }
        
        // Extract CPU info from sysinfo if available
        if (serverData.sysinfo) {
          // Map common sysinfo fields to our server model
          if (serverData.sysinfo['CPU Cores Per Socket']) {
            serverData.cpu_cores = parseInt(serverData.sysinfo['CPU Cores Per Socket']);
          }
          
          if (serverData.sysinfo['CPU Physical Cores']) {
            serverData.cpu_cores = parseInt(serverData.sysinfo['CPU Physical Cores']);
          }
          
          if (serverData.sysinfo['CPU Sockets']) {
            serverData.cpu_sockets = parseInt(serverData.sysinfo['CPU Sockets']);
          }
          
          if (serverData.sysinfo['CPU Threads Per Core']) {
            serverData.cpu_threads_per_core = parseInt(serverData.sysinfo['CPU Threads Per Core']);
          }
          
          if (serverData.sysinfo['CPU Clock Rate']) {
            const cpuClockRate = serverData.sysinfo['CPU Clock Rate'];
            if (typeof cpuClockRate === 'string' && cpuClockRate.includes('MHz')) {
              serverData.cpu_speed_mhz = parseInt(cpuClockRate.replace('MHz', '').trim());
            }
          }
        }
        
        // Add simulated metrics for development
        serverData.metrics = simulateMetrics(serverData);
        
        // Add simulated network interfaces for development
        if (!serverData.network_interfaces) {
          serverData.network_interfaces = [
            {
              name: 'net0',
              mac: '00:50:56:01:02:03',
              ip: '10.88.88.10',
              netmask: '255.255.255.0',
              link_status: 'up',
              speed: '10 Gbps',
              type: 'external',
              mtu: 1500
            },
            {
              name: 'net1',
              mac: '00:50:56:03:04:05',
              ip: '192.168.1.10',
              netmask: '255.255.255.0',
              link_status: 'up',
              speed: '10 Gbps',
              type: 'internal',
              mtu: 1500
            },
            {
              name: 'admin0',
              mac: '00:50:56:aa:bb:cc',
              ip: '172.16.0.10',
              netmask: '255.255.0.0',
              link_status: 'up',
              speed: '1 Gbps',
              type: 'admin',
              mtu: 1500
            },
            {
              name: 'storage0',
              mac: '00:50:56:dd:ee:ff',
              ip: '10.100.0.10',
              netmask: '255.255.0.0',
              link_status: 'up',
              speed: '25 Gbps',
              type: 'storage',
              mtu: 9000
            }
          ];
        }
        
        setServer(serverData);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch server details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Setup interval to update metrics every 5 seconds
    const metricsInterval = setInterval(() => {
      if (server) {
        setServer(prevServer => {
          if (!prevServer) return null;
          return {
            ...prevServer,
            metrics: simulateMetrics(prevServer)
          };
        });
      }
    }, 5000);
    
    return () => clearInterval(metricsInterval);
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

  // Utility function to format bytes to human readable format
  const formatBytes = (bytes?: number, decimals: number = 1): string => {
    if (!bytes || bytes === 0) return 'N/A';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };
  
  // Format memory (RAM) in GB
  const formatMemory = (ram?: number): string => {
    if (!ram) return 'N/A';
    const gb = ram / 1024;
    return `${gb.toFixed(1)} GB`;
  };
  
  // Format disk space in GB or TB
  const formatDiskSpace = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    return formatBytes(bytes, 2);
  };
  
  // Format data rate (bytes/sec)
  const formatDataRate = (bytesPerSec?: number): string => {
    if (!bytesPerSec) return 'N/A';
    return `${formatBytes(bytesPerSec)}/s`;
  };
  
  // Format date and time
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };
  
  // Calculate and format uptime
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
  
  // Progress bar component for utilization metrics
  const UtilizationBar = ({ percent, color }: { percent: number, color: string }) => {
    const safePercent = isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));
    let bgColorClass;
    
    // Default color scheme
    if (!color) {
      if (safePercent < 60) {
        bgColorClass = 'bg-green-500';
      } else if (safePercent < 80) {
        bgColorClass = 'bg-yellow-500';
      } else {
        bgColorClass = 'bg-red-500';
      }
    } else {
      bgColorClass = color;
    }
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 my-1">
        <div 
          className={`${bgColorClass} h-2.5 rounded-full`} 
          style={{ width: `${safePercent}%` }}
        ></div>
      </div>
    );
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            {/* CPU and cores */}
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">CPU</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {server.cpu_cores || 'N/A'} Cores
                {server.cpu_sockets && server.cpu_threads_per_core && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({server.cpu_sockets} Socket{server.cpu_sockets > 1 ? 's' : ''}, {server.cpu_threads_per_core} Thread{server.cpu_threads_per_core > 1 ? 's' : ''}/Core)
                  </span>
                )}
              </div>
              
              {/* CPU utilization bar */}
              {server.metrics?.cpu_utilization !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Utilization: {server.metrics.cpu_utilization}%</span>
                  </div>
                  <UtilizationBar 
                    percent={server.metrics.cpu_utilization} 
                    color={server.metrics.cpu_utilization < 60 ? 'bg-green-500' : 
                           server.metrics.cpu_utilization < 80 ? 'bg-yellow-500' : 'bg-red-500'} 
                  />
                </div>
              )}
            </div>
            
            {/* Memory usage */}
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Memory</div>
              <div className="mt-1 text-sm text-gray-900">
                {server.memory_total_bytes ? formatBytes(server.memory_total_bytes) : formatMemory(server.ram)}
                {server.reservation_ratio && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Reservation: {(server.reservation_ratio * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
              
              {/* Memory utilization bar */}
              {server.memory_total_bytes && server.memory_available_bytes && (
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Used: {formatBytes(server.memory_utilized_bytes)} ({server.memory_utilization_percent?.toFixed(1)}%)</span>
                    <span>Free: {formatBytes(server.memory_available_bytes)}</span>
                  </div>
                  <UtilizationBar 
                    percent={server.memory_utilization_percent || 0} 
                    color={server.memory_utilization_percent && server.memory_utilization_percent < 60 ? 'bg-green-500' : 
                           server.memory_utilization_percent && server.memory_utilization_percent < 80 ? 'bg-yellow-500' : 'bg-red-500'} 
                  />
                </div>
              )}
            </div>
            
            {/* Disk usage */}
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Disk</div>
              <div className="mt-1 text-sm text-gray-900">
                {formatDiskSpace(server.disk_total_bytes)}
              </div>
              
              {/* Disk utilization bar */}
              {server.disk_total_bytes && server.disk_available_bytes && (
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Used: {formatBytes(server.disk_utilized_bytes)} ({server.disk_utilization_percent?.toFixed(1)}%)</span>
                    <span>Free: {formatBytes(server.disk_available_bytes)}</span>
                  </div>
                  <UtilizationBar 
                    percent={server.disk_utilization_percent || 0} 
                    color={server.disk_utilization_percent && server.disk_utilization_percent < 60 ? 'bg-green-500' : 
                           server.disk_utilization_percent && server.disk_utilization_percent < 80 ? 'bg-yellow-500' : 'bg-red-500'} 
                  />
                </div>
              )}
              
              {/* Disk I/O metrics */}
              {server.metrics?.disk_io && (
                <div className="mt-1 text-xs text-gray-600">
                  <span>I/O: {formatDataRate(server.metrics.disk_io.read_bytes_sec)} read, {formatDataRate(server.metrics.disk_io.write_bytes_sec)} write</span>
                </div>
              )}
            </div>
            
            {/* Uptime and platform */}
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Uptime</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatUptime(server.last_boot)}
              </div>
              
              <div className="mt-3 text-sm font-medium text-gray-500">Platform</div>
              <div className="mt-1 text-sm text-gray-900 font-mono truncate">
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
              onClick={() => setActiveTab('metrics')}
              className={`${
                activeTab === 'metrics'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Metrics
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
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              Virtual Machines
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`${
                activeTab === 'network'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Network
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'metrics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CPU Utilization Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">CPU Utilization</h3>
                  
                  {/* CPU utilization "graph" - simulated with bars for now */}
                  <div className="h-48 flex items-end space-x-1">
                    {/* Generate 30 dummy bars with random heights to simulate a graph */}
                    {Array.from({ length: 30 }).map((_, i) => {
                      const height = server.metrics?.cpu_utilization || Math.floor(Math.random() * 60) + 10;
                      let barColor = 'bg-green-500';
                      
                      if (height > 80) barColor = 'bg-red-500';
                      else if (height > 60) barColor = 'bg-yellow-500';
                      
                      return (
                        <div 
                          key={i} 
                          className={`${barColor} w-full rounded-t`} 
                          style={{ height: `${height}%` }}
                        ></div>
                      );
                    })}
                  </div>
                  
                  {/* Current value */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Current:</span>
                      <span className="text-lg font-semibold">{server.metrics?.cpu_utilization || 0}%</span>
                    </div>
                    <UtilizationBar 
                      percent={server.metrics?.cpu_utilization || 0} 
                      color="" 
                    />
                  </div>
                  
                  {/* CPU Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">CPU Type:</span> {server.cpu_type || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Cores:</span> {server.cpu_cores || 'N/A'}
                    </div>
                    {server.cpu_sockets && (
                      <div>
                        <span className="font-medium">Sockets:</span> {server.cpu_sockets}
                      </div>
                    )}
                    {server.cpu_threads_per_core && (
                      <div>
                        <span className="font-medium">Threads/Core:</span> {server.cpu_threads_per_core}
                      </div>
                    )}
                    {server.cpu_speed_mhz && (
                      <div>
                        <span className="font-medium">Clock Speed:</span> {server.cpu_speed_mhz} MHz
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Memory Usage Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage</h3>
                  
                  {/* Memory usage visualization */}
                  <div className="h-48 flex items-center justify-center">
                    {/* Create a donut chart for memory usage */}
                    <div className="relative h-32 w-32">
                      <svg viewBox="0 0 36 36" className="h-32 w-32">
                        {/* Background circle */}
                        <circle 
                          cx="18" cy="18" r="15.91549430918954" 
                          fill="transparent" 
                          stroke="#e5e7eb" 
                          strokeWidth="3"
                        ></circle>
                        
                        {/* Foreground circle showing usage */}
                        <circle 
                          cx="18" cy="18" r="15.91549430918954" 
                          fill="transparent" 
                          stroke={
                            server.memory_utilization_percent && server.memory_utilization_percent < 60 ? '#10B981' : 
                            server.memory_utilization_percent && server.memory_utilization_percent < 80 ? '#F59E0B' : '#EF4444'
                          }
                          strokeWidth="3"
                          strokeDasharray={`${server.memory_utilization_percent || 0} ${100 - (server.memory_utilization_percent || 0)}`}
                          strokeDashoffset="25"
                          strokeLinecap="round"
                        ></circle>
                        
                        {/* Percentage text in center */}
                        <text 
                          x="18" y="18" 
                          fontFamily="sans-serif" 
                          fontSize="0.5rem" 
                          textAnchor="middle" 
                          dominantBaseline="middle"
                        >
                          <tspan x="18" y="18" fontSize="0.6rem" fontWeight="bold">
                            {server.memory_utilization_percent?.toFixed(1) || 0}%
                          </tspan>
                          <tspan x="18" y="22" fontSize="0.25rem">
                            used
                          </tspan>
                        </text>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Memory details */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <div className="font-medium">{formatBytes(server.memory_total_bytes)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Used:</span>
                      <div className="font-medium">{formatBytes(server.memory_utilized_bytes)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>
                      <div className="font-medium">{formatBytes(server.memory_available_bytes)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Utilization:</span>
                      <div className="font-medium">{server.memory_utilization_percent?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Disk I/O Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Disk I/O</h3>
                  
                  {/* Disk I/O visualization */}
                  <div className="h-44 mb-4">
                    <div className="h-full flex flex-col justify-center">
                      {/* Read/Write bars */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Read Rate:</span>
                          <span className="font-medium">{formatDataRate(server.metrics?.disk_io?.read_bytes_sec)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-blue-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (server.metrics?.disk_io?.read_bytes_sec || 0) / (200 * 1024 * 1024) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Write Rate:</span>
                          <span className="font-medium">{formatDataRate(server.metrics?.disk_io?.write_bytes_sec)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-purple-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (server.metrics?.disk_io?.write_bytes_sec || 0) / (200 * 1024 * 1024) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">IOPS:</span>
                          <span className="font-medium">{server.metrics?.disk_io?.iops || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-green-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (server.metrics?.disk_io?.iops || 0) / 5000 * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Disk usage stats */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-500">Total Storage:</span>
                      <span className="font-medium">{formatDiskSpace(server.disk_total_bytes)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-500">Used:</span>
                      <span className="font-medium">{formatDiskSpace(server.disk_utilized_bytes)} ({server.disk_utilization_percent?.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Available:</span>
                      <span className="font-medium">{formatDiskSpace(server.disk_available_bytes)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Network Activity Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Network Activity</h3>
                  
                  {/* Network visualization */}
                  <div className="h-44 mb-4">
                    <div className="h-full flex flex-col justify-center">
                      {/* Network bars */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Inbound (RX):</span>
                          <span className="font-medium">{formatDataRate(server.metrics?.network_throughput?.rx_bytes_sec)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-indigo-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (server.metrics?.network_throughput?.rx_bytes_sec || 0) / (200 * 1024 * 1024) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Outbound (TX):</span>
                          <span className="font-medium">{formatDataRate(server.metrics?.network_throughput?.tx_bytes_sec)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-teal-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (server.metrics?.network_throughput?.tx_bytes_sec || 0) / (200 * 1024 * 1024) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Network Interfaces:
                    </div>
                    {server.network_interfaces ? (
                      <div className="overflow-hidden rounded-md">
                        <div className="text-xs text-gray-600 grid grid-cols-4 gap-2 font-medium bg-gray-50 p-2">
                          <div>Interface</div>
                          <div>IP Address</div>
                          <div>Status</div>
                          <div>Speed</div>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {server.network_interfaces.map((iface, i) => (
                            <div key={i} className="text-xs grid grid-cols-4 gap-2 p-2">
                              <div className="font-medium">{iface.name}</div>
                              <div>{iface.ip}</div>
                              <div>
                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  iface.link_status === 'up' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {iface.link_status}
                                </span>
                              </div>
                              <div>{iface.speed}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 italic">No network interface data available</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <span className="text-xs text-gray-500 italic">Metrics are refreshed every 5 seconds</span>
              </div>
            </div>
          )}
          
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

          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Network Interfaces</h3>
                
                {server.network_interfaces && server.network_interfaces.length > 0 ? (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Interface</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">MAC Address</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">IP Address</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Netmask</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Speed</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {server.network_interfaces.map((iface, index) => (
                          <tr key={index} className={index % 2 === 0 ? undefined : 'bg-gray-50'}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{iface.name}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">{iface.mac}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{iface.ip}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{iface.netmask}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                iface.link_status === 'up' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {iface.link_status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{iface.speed}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{iface.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Network Interfaces</h3>
                    <p className="mt-1 text-sm text-gray-500">No network interface information is available for this server.</p>
                  </div>
                )}
              </div>
              
              {/* Network Activity Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Network Activity</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Network Throughput */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-base font-medium text-gray-700 mb-3">Current Throughput</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Inbound (RX):</span>
                          <span className="font-medium">{formatDataRate(server.metrics?.network_throughput?.rx_bytes_sec)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-indigo-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (server.metrics?.network_throughput?.rx_bytes_sec || 0) / (200 * 1024 * 1024) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Outbound (TX):</span>
                          <span className="font-medium">{formatDataRate(server.metrics?.network_throughput?.tx_bytes_sec)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-teal-500 h-4 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (server.metrics?.network_throughput?.tx_bytes_sec || 0) / (200 * 1024 * 1024) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Total:</span>
                          <span className="font-medium">
                            {formatDataRate((server.metrics?.network_throughput?.rx_bytes_sec || 0) + 
                                           (server.metrics?.network_throughput?.tx_bytes_sec || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Network Stats Placeholder */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-base font-medium text-gray-700 mb-3">Traffic Statistics</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Today's Transfer</div>
                        <div className="text-lg font-medium">{formatBytes(Math.random() * 50 * 1024 * 1024 * 1024)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Total Transfer</div>
                        <div className="text-lg font-medium">{formatBytes(Math.random() * 500 * 1024 * 1024 * 1024)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Peak Throughput</div>
                        <div className="text-lg font-medium">{formatDataRate(Math.random() * 800 * 1024 * 1024)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Avg Throughput</div>
                        <div className="text-lg font-medium">{formatDataRate(Math.random() * 300 * 1024 * 1024)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-500 italic text-right">
                      Simulated data for demonstration
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Connectivity Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Connectivity Status</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">Internet Access</div>
                      <div className="text-base font-medium">Available</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Up
                    </span>
                  </div>
                  
                  <div className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">Internal Network</div>
                      <div className="text-base font-medium">10.0.0.0/8</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Connected
                    </span>
                  </div>
                  
                  <div className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">Storage Network</div>
                      <div className="text-base font-medium">192.168.0.0/16</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
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