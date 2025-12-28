import { useState } from 'react';
import { useApiResponse } from '../contexts/ApiResponseContext';
import { ApiCall } from '../contexts/ApiResponseContext';
import { X, ChevronDown, ChevronUp, Trash2, Copy, Check, Code, Clock, Globe, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ApiResponseViewer() {
  const { apiCalls, clearApiCalls, isEnabled, toggleEnabled } = useApiResponse();
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJson = (obj: any): string => {
    if (!obj) return '';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
    if (status >= 400 && status < 500) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusBg = (status?: number) => {
    if (!status) return 'bg-gray-100 dark:bg-gray-800';
    if (status >= 200 && status < 300) return 'bg-green-100 dark:bg-green-900/30';
    if (status >= 300 && status < 400) return 'bg-blue-100 dark:bg-blue-900/30';
    if (status >= 400 && status < 500) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (!isEnabled && apiCalls.length === 0) {
    return null;
  }

  // Floating button when completely minimized
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-full shadow-2xl hover:shadow-brand-lg transition-all duration-300 hover:scale-110 group"
        title="Show API Responses"
      >
        <Code className="w-5 h-5" />
        <span className="font-semibold">API</span>
        {apiCalls.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold bg-white text-brand-600 rounded-full min-w-[24px] text-center">
            {apiCalls.length}
          </span>
        )}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
      </button>
    );
  }

  // Fullscreen modal view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full h-full max-w-7xl max-h-[95vh] flex flex-col bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-2xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Code className="w-6 h-6 text-brand-600 dark:text-cyan-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">API Responses</h3>
                <span className="px-3 py-1 text-sm font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full">
                  {apiCalls.length}
                </span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={toggleEnabled}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Track</span>
              </label>
            </div>
            <div className="flex items-center space-x-3">
              {apiCalls.length > 0 && (
                <button
                  onClick={clearApiCalls}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setIsMinimized(true);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Minimize to floating button"
              >
                <Minimize2 className="w-4 h-4 inline mr-2" />
                Minimize
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Exit fullscreen"
              >
                Exit Fullscreen
              </button>
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setSelectedCall(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - API Calls List */}
            <div className="w-80 border-r border-gray-300 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              {apiCalls.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No API calls yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {apiCalls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                        selectedCall?.id === call.id
                          ? 'bg-brand-50 dark:bg-brand-900/20 border-l-4 border-brand-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-semibold px-2 py-1 rounded ${
                            call.method === 'GET'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : call.method === 'POST'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : call.method === 'PUT'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : call.method === 'DELETE'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {call.method}
                        </span>
                        {call.responseStatus && (
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${getStatusBg(
                              call.responseStatus
                            )} ${getStatusColor(call.responseStatus)}`}
                          >
                            {call.responseStatus}
                          </span>
                        )}
                        {call.error && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words mb-2">
                        {call.url}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{format(call.timestamp, 'HH:mm:ss')}</span>
                        {call.duration && (
                          <>
                            <span>•</span>
                            <span>{call.duration}ms</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Content - Request/Response Details */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
              {selectedCall ? (
                <div className="p-6 space-y-6">
                  {/* Request Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <Globe className="w-5 h-5 mr-2" />
                        Request
                      </h4>
                      <button
                        onClick={() => copyToClipboard(formatJson(selectedCall), `req-${selectedCall.id}`)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {copiedId === `req-${selectedCall.id}` ? (
                          <>
                            <Check className="w-4 h-4 inline mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 inline mr-2" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Method:</span>
                        <span className="ml-3 text-base font-mono text-gray-900 dark:text-white">
                          {selectedCall.method}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">URL:</span>
                        <div className="mt-2 text-sm font-mono text-gray-900 dark:text-white break-all bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-800">
                          {selectedCall.fullUrl}
                        </div>
                      </div>
                      {Object.keys(selectedCall.headers).length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Headers:</span>
                          <pre className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800 max-h-60 overflow-y-auto">
                            {formatJson(selectedCall.headers)}
                          </pre>
                        </div>
                      )}
                      {selectedCall.requestBody && (
                        <div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Body:</span>
                          <pre className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800 max-h-96 overflow-y-auto">
                            {formatJson(selectedCall.requestBody)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Response Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        {selectedCall.error ? (
                          <>
                            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                            Error Response
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 mr-2 text-green-500" />
                            Response
                          </>
                        )}
                      </h4>
                      <button
                        onClick={() => copyToClipboard(formatJson(selectedCall.responseBody || selectedCall.error), `res-${selectedCall.id}`)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {copiedId === `res-${selectedCall.id}` ? (
                          <>
                            <Check className="w-4 h-4 inline mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 inline mr-2" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      {selectedCall.responseStatus && (
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`ml-3 text-base font-mono font-semibold ${getStatusColor(selectedCall.responseStatus)}`}>
                            {selectedCall.responseStatus}
                          </span>
                        </div>
                      )}
                      {selectedCall.responseHeaders && Object.keys(selectedCall.responseHeaders).length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Headers:</span>
                          <pre className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800 max-h-60 overflow-y-auto">
                            {formatJson(selectedCall.responseHeaders)}
                          </pre>
                        </div>
                      )}
                      {(selectedCall.responseBody || selectedCall.error) && (
                        <div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Body:</span>
                          <pre className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800 max-h-96 overflow-y-auto">
                            {formatJson(selectedCall.responseBody || selectedCall.error)}
                          </pre>
                        </div>
                      )}
                      {selectedCall.duration && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                          <span className="text-sm text-gray-500 dark:text-gray-500">
                            Duration: {selectedCall.duration}ms
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base">Select an API call to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular bottom-right view (larger size)
  return (
    <div className="fixed bottom-0 right-0 z-50 w-full max-w-4xl h-[700px] flex flex-col bg-white dark:bg-gray-900 border-t border-l border-gray-300 dark:border-gray-700 shadow-2xl rounded-tl-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-brand-600 dark:text-cyan-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">API Responses</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full">
              {apiCalls.length}
            </span>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={toggleEnabled}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Track</span>
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors"
            title="Open in fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {apiCalls.length > 0 && (
            <button
              onClick={clearApiCalls}
              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
            title="Minimize to floating button"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedCall(null)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - API Calls List */}
          <div className="w-80 border-r border-gray-300 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            {apiCalls.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No API calls yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {apiCalls.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      selectedCall?.id === call.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-brand-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          call.method === 'GET'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : call.method === 'POST'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : call.method === 'PUT'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : call.method === 'DELETE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {call.method}
                      </span>
                      {call.responseStatus && (
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStatusBg(
                            call.responseStatus
                          )} ${getStatusColor(call.responseStatus)}`}
                        >
                          {call.responseStatus}
                        </span>
                      )}
                      {call.error && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
                      {call.url}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{format(call.timestamp, 'HH:mm:ss')}</span>
                      {call.duration && (
                        <>
                          <span>•</span>
                          <span>{call.duration}ms</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content - Request/Response Details */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            {selectedCall ? (
              <div className="p-4 space-y-4">
                {/* Request Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Request
                    </h4>
                    <button
                      onClick={() => copyToClipboard(formatJson(selectedCall), `req-${selectedCall.id}`)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {copiedId === `req-${selectedCall.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Method:</span>
                      <span className="ml-2 text-sm font-mono text-gray-900 dark:text-white">
                        {selectedCall.method}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">URL:</span>
                      <div className="mt-1 text-xs font-mono text-gray-900 dark:text-white break-all">
                        {selectedCall.fullUrl}
                      </div>
                    </div>
                    {Object.keys(selectedCall.headers).length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Headers:</span>
                        <pre className="mt-1 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                          {formatJson(selectedCall.headers)}
                        </pre>
                      </div>
                    )}
                    {selectedCall.requestBody && (
                      <div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Body:</span>
                        <pre className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-60 overflow-y-auto bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-800">
                          {formatJson(selectedCall.requestBody)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Response Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      {selectedCall.error ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                          Error Response
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          Response
                        </>
                      )}
                    </h4>
                    <button
                      onClick={() => copyToClipboard(formatJson(selectedCall.responseBody || selectedCall.error), `res-${selectedCall.id}`)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {copiedId === `res-${selectedCall.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
                    {selectedCall.responseStatus && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`ml-2 text-sm font-mono font-semibold ${getStatusColor(selectedCall.responseStatus)}`}>
                          {selectedCall.responseStatus}
                        </span>
                      </div>
                    )}
                    {selectedCall.responseHeaders && Object.keys(selectedCall.responseHeaders).length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Headers:</span>
                        <pre className="mt-1 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                          {formatJson(selectedCall.responseHeaders)}
                        </pre>
                      </div>
                    )}
                    {(selectedCall.responseBody || selectedCall.error) && (
                      <div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Body:</span>
                        <pre className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-80 overflow-y-auto bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-800">
                          {formatJson(selectedCall.responseBody || selectedCall.error)}
                        </pre>
                      </div>
                    )}
                    {selectedCall.duration && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          Duration: {selectedCall.duration}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select an API call to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

