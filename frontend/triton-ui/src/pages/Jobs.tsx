import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../services/api';

interface Job {
  uuid: string;
  name: string;
  execution: string;
  params: Record<string, any>;
  exec_after: string | null;
  created_at: string;
  timeout: number;
  chain_results: {
    result: string;
    error: string;
    name: string;
    started_at: string;
    finished_at: string;
  }[];
  elapsed: string | null;
}

interface JobsFilter {
  name: string;
  execution: string;
  vm_uuid: string;
  task: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobsFilter>({
    name: '',
    execution: '',
    vm_uuid: '',
    task: '',
  });

  // Fetch jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getJobs();
        setJobs(response.data);
        setFilteredJobs(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter jobs when filters change
  useEffect(() => {
    if (!jobs.length) return;

    const filtered = jobs.filter(job => {
      // Filter by name
      if (filters.name && !job.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }

      // Filter by execution status
      if (filters.execution && job.execution !== filters.execution) {
        return false;
      }

      // Filter by VM UUID
      if (filters.vm_uuid && job.params?.vm_uuid && !job.params.vm_uuid.includes(filters.vm_uuid)) {
        return false;
      }

      // Filter by task
      if (filters.task && job.params?.task && !job.params.task.toLowerCase().includes(filters.task.toLowerCase())) {
        return false;
      }

      return true;
    });

    setFilteredJobs(filtered);
  }, [jobs, filters]);

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
      name: '',
      execution: '',
      vm_uuid: '',
      task: '',
    });
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Get unique execution status values
  const getUniqueExecutionValues = () => {
    const executions = jobs.map(job => job.execution);
    return Array.from(new Set(executions));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all workflow jobs in this datacenter.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="nameFilter"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by name"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="executionFilter" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="executionFilter"
              name="execution"
              value={filters.execution}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              {getUniqueExecutionValues().map(execution => (
                <option key={execution} value={execution}>{execution}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="vmUuidFilter" className="block text-sm font-medium text-gray-700">VM UUID</label>
            <input
              type="text"
              id="vmUuidFilter"
              name="vm_uuid"
              value={filters.vm_uuid}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by VM UUID"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="taskFilter" className="block text-sm font-medium text-gray-700">Task</label>
            <input
              type="text"
              id="taskFilter"
              name="task"
              value={filters.task}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by task"
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
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      </div>

      {/* Jobs table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Job</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Duration</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">VM UUID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Task</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-4 px-6 text-center text-sm text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="py-4 px-6 text-center text-sm text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 px-6 text-center text-sm text-gray-500">
                        {jobs.length > 0 ? 'No matching jobs found. Try adjusting your filters.' : 'No jobs found'}
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.uuid} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div>
                            <Link to={`/jobs/${job.uuid}`} className="font-medium text-indigo-600 hover:text-indigo-900">
                              {job.name}
                            </Link>
                            <div className="text-xs text-gray-500 mt-1 font-mono">{job.uuid}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <Link to={`/jobs/${job.uuid}`} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {job.elapsed || '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {job.params?.vm_uuid ? (
                            <Link to={`/vms/${job.params.vm_uuid}`} className="text-indigo-600 hover:text-indigo-900 font-mono text-xs">
                              {job.params.vm_uuid}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {job.params?.task || '—'}
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

export default Jobs;