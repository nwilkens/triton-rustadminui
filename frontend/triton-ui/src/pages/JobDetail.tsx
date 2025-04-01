import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJob, getJobOutput } from '../services/api';

interface ChainResult {
  result: string;
  error: string;
  name: string;
  started_at: string;
  finished_at: string;
}

interface Job {
  uuid: string;
  name: string;
  execution: string;
  params: Record<string, any>;
  exec_after: string | null;
  created_at: string;
  timeout: number;
  chain_results: ChainResult[];
  elapsed: string | null;
}

const JobDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'params' | 'steps' | 'output'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!uuid) return;
      try {
        setLoading(true);
        const jobResponse = await getJob(uuid);
        setJob(jobResponse.data);

        try {
          const outputResponse = await getJobOutput(uuid);
          setOutput(outputResponse.data);
        } catch (outputErr) {
          // Handle missing output gracefully
          console.log("Could not fetch job output:", outputErr);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uuid]);

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatDuration = (start?: string, end?: string): string => {
    if (!start || !end) return '—';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();

    // Format the duration in a human-readable format
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
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
            <h3 className="text-sm font-medium text-red-800">Error loading job details</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Job not found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The job you're looking for doesn't exist or has been deleted.</p>
              <Link to="/jobs" className="text-indigo-600 hover:text-indigo-900 mt-2 inline-block">
                Return to Jobs List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
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
              <Link to="/jobs" className="ml-2 hover:text-indigo-600">Jobs</Link>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 font-medium text-gray-900 truncate max-w-xs">{job.name}</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Job Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0 mb-4 lg:mb-0">
              <div className="flex items-center">
                <div className="mr-4">
                  <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
                    job.execution === 'succeeded' ? 'bg-green-100' : 
                    job.execution === 'failed' ? 'bg-red-100' : 
                    'bg-yellow-100'
                  }`}>
                    <svg className={`h-6 w-6 ${
                      job.execution === 'succeeded' ? 'text-green-500' : 
                      job.execution === 'failed' ? 'text-red-500' : 
                      'text-yellow-500'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center">
                    {job.name}
                    <span className={`ml-3 px-3 py-0.5 inline-flex text-sm leading-5 font-medium rounded-full ${
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
                  </h2>
                  <div className="mt-1 text-sm text-gray-500 truncate">{job.uuid}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Created</dt>
                  <dd className="mt-1 text-xl font-semibold text-gray-900">
                    {formatDate(job.created_at)}
                  </dd>
                </dl>
              </div>
            </div>

            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Duration</dt>
                  <dd className="mt-1 text-xl font-semibold text-gray-900">
                    {job.elapsed || '—'}
                  </dd>
                </dl>
              </div>
            </div>

            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Timeout</dt>
                  <dd className="mt-1 text-xl font-semibold text-gray-900">
                    {job.timeout ? `${job.timeout} sec` : '—'}
                  </dd>
                </dl>
              </div>
            </div>

            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">VM</dt>
                  <dd className="mt-1 text-xl font-semibold text-gray-900">
                    {job.params?.vm_uuid ? (
                      <Link 
                        to={`/vms/${job.params.vm_uuid}`} 
                        className="text-indigo-600 hover:text-indigo-900 text-sm truncate"
                      >
                        {job.params.vm_uuid}
                      </Link>
                    ) : '—'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('params')}
              className={`${
                activeTab === 'params' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none`}
            >
              Parameters
            </button>
            <button 
              onClick={() => setActiveTab('steps')}
              className={`${
                activeTab === 'steps' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none`}
            >
              Steps
            </button>
            <button 
              onClick={() => setActiveTab('output')}
              className={`${
                activeTab === 'output' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none`}
            >
              Output
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Overview</h3>
              <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                <dl className="divide-y divide-gray-200">
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Job Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.name}</dd>
                  </div>
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
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
                    </dd>
                  </div>
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">UUID</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">{job.uuid}</dd>
                  </div>
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(job.created_at)}</dd>
                  </div>
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.elapsed || '—'}</dd>
                  </div>
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Timeout</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.timeout || '—'} seconds</dd>
                  </div>
                  {job.params?.vm_uuid && (
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">VM</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <Link to={`/vms/${job.params.vm_uuid}`} className="text-indigo-600 hover:text-indigo-900 font-mono">
                          {job.params.vm_uuid}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {job.params?.task && (
                    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Task</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.params.task}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Parameters Tab */}
          {activeTab === 'params' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Parameters</h3>
              {job.params ? (
                <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                  <div className="p-4">
                    <pre className="text-sm text-gray-800 overflow-auto max-h-[600px] p-4 bg-gray-100 rounded">
                      {JSON.stringify(job.params, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No parameters available for this job.
                </div>
              )}
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Steps</h3>
              {job.chain_results && job.chain_results.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Step</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Result</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Started</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {job.chain_results.map((step, index) => (
                        <tr key={index} className={`${step.error ? 'bg-red-50' : ''} hover:bg-gray-50`}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-900">{step.name}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {step.error ? (
                              <div className="text-red-600">{step.error}</div>
                            ) : (
                              <div className="text-green-600">{step.result}</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {step.started_at ? formatDate(step.started_at) : '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDuration(step.started_at, step.finished_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No step information available for this job.
                </div>
              )}
            </div>
          )}

          {/* Output Tab */}
          {activeTab === 'output' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Output</h3>
              {output ? (
                <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                  <div className="p-4">
                    <pre className="text-sm text-gray-800 overflow-auto max-h-[600px] p-4 bg-gray-100 rounded">
                      {output}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No output available for this job.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;