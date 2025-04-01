import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getImage } from '../services/api';

interface Image {
  uuid: string;
  name: string;
  version: string;
  os: string;
  state: string;
  type: string;
  published_at: string;
  owner_uuid: string;
  description?: string;
  homepage?: string;
  files?: {
    compression?: string;
    sha1?: string;
    size?: number;
    path?: string;
  }[];
  requirements?: {
    min_memory?: number;
    min_platform?: Record<string, string>;
    brand?: string;
  };
  tags?: Record<string, string>;
  icon?: string;
  acl?: string[];
}

const ImageDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [image, setImage] = useState<Image | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!uuid) return;

      try {
        setLoading(true);
        const imageResponse = await getImage(uuid);
        const imageData = imageResponse.data;
        setImage(imageData);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch image details');
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

  const formatFileSize = (sizeInBytes?: number): string => {
    if (!sizeInBytes) return 'N/A';
    
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;
    
    if (sizeInBytes >= gb) {
      return `${(sizeInBytes / gb).toFixed(2)} GB`;
    } else if (sizeInBytes >= mb) {
      return `${(sizeInBytes / mb).toFixed(2)} MB`;
    } else if (sizeInBytes >= kb) {
      return `${(sizeInBytes / kb).toFixed(2)} KB`;
    }
    
    return `${sizeInBytes} B`;
  };

  const formatMemory = (sizeInMB?: number): string => {
    if (!sizeInMB) return 'N/A';
    
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    
    return `${sizeInMB} MB`;
  };

  const getStatusColor = (state: string): string => {
    switch(state.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'disabled':
        return 'bg-gray-100 text-gray-800';
      case 'unactivated':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="rounded-md bg-red-50 p-4 m-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading image details</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Image data not available'}</p>
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
            <Link to="/images" className="text-gray-500 hover:text-gray-700">Images</Link>
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 text-gray-700 font-medium">{image.name}</span>
          </li>
        </ol>
      </nav>

      {/* Header with image name and quick stats */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {image.name} 
              <span className="ml-2 text-gray-500 text-sm">{image.version}</span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {image.uuid}
            </p>
            {image.description && (
              <p className="mt-1 text-sm text-gray-600 italic">
                {image.description}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(image.state)}`}>
              {image.state}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">OS</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {image.os}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Type</div>
              <div className="mt-1 text-sm text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                {image.type}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-medium text-gray-500">Published</div>
              <div className="mt-1 text-sm text-gray-900">
                {formatDate(image.published_at)}
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
              onClick={() => setActiveTab('requirements')}
              className={`${
                activeTab === 'requirements'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Requirements
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`${
                activeTab === 'files'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Files
            </button>
            {image.tags && Object.keys(image.tags).length > 0 && (
              <button
                onClick={() => setActiveTab('tags')}
                className={`${
                  activeTab === 'tags'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Tags
              </button>
            )}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Image Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Name</div>
                    <div className="mt-1 text-sm text-gray-900">{image.name}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Version</div>
                    <div className="mt-1 text-sm text-gray-900">{image.version}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">UUID</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{image.uuid}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Owner</div>
                    <div className="mt-1 text-sm text-gray-900 font-mono">{image.owner_uuid}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">OS</div>
                    <div className="mt-1 text-sm text-gray-900">{image.os}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Type</div>
                    <div className="mt-1 text-sm text-gray-900">{image.type}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">State</div>
                    <div className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(image.state)}`}>
                        {image.state}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-medium text-gray-500">Published</div>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(image.published_at)}</div>
                  </div>
                  {image.homepage && (
                    <div className="sm:col-span-2">
                      <div className="text-sm font-medium text-gray-500">Homepage</div>
                      <div className="mt-1 text-sm text-gray-900">
                        <a 
                          href={image.homepage} 
                          className="text-indigo-600 hover:text-indigo-900" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {image.homepage}
                        </a>
                      </div>
                    </div>
                  )}
                  {image.description && (
                    <div className="sm:col-span-2">
                      <div className="text-sm font-medium text-gray-500">Description</div>
                      <div className="mt-1 text-sm text-gray-900">{image.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {image.acl && image.acl.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Access Control</h3>
                  <div className="mt-2">
                    {image.acl.map((entry, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2"
                      >
                        {entry}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Requirements</h3>
                {!image.requirements ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Requirements</h3>
                    <p className="mt-1 text-sm text-gray-500">This image does not specify any system requirements.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {image.requirements.min_memory && (
                      <div className="sm:col-span-1">
                        <div className="text-sm font-medium text-gray-500">Minimum Memory</div>
                        <div className="mt-1 text-sm text-gray-900">{formatMemory(image.requirements.min_memory)}</div>
                      </div>
                    )}
                    {image.requirements.brand && (
                      <div className="sm:col-span-1">
                        <div className="text-sm font-medium text-gray-500">VM Brand</div>
                        <div className="mt-1 text-sm text-gray-900">{image.requirements.brand}</div>
                      </div>
                    )}
                    {image.requirements.min_platform && Object.keys(image.requirements.min_platform).length > 0 && (
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-gray-500">Minimum Platform Versions</div>
                        <div className="mt-1 space-y-2">
                          {Object.entries(image.requirements.min_platform).map(([key, value]) => (
                            <div key={key} className="text-sm text-gray-900">
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Image Files</h3>
                {!image.files || image.files.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Files</h3>
                    <p className="mt-1 text-sm text-gray-500">No file information is available for this image.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Path
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Size
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Compression
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            SHA1
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {image.files.map((file, index) => (
                          <tr key={index}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {file.path || `File ${index + 1}`}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatFileSize(file.size)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {file.compression || 'None'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                              {file.sha1 ? `${file.sha1.substring(0, 10)}...` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tags' && image.tags && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Image Tags</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(image.tags).map(([key, value]) => (
                    <div key={key} className="sm:col-span-1">
                      <div className="text-sm font-medium text-gray-500">{key}</div>
                      <div className="mt-1 text-sm text-gray-900">{value}</div>
                    </div>
                  ))}
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
          Edit Image
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Create VM from Image
        </button>
        {image.state !== 'disabled' && (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Disable Image
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageDetail;