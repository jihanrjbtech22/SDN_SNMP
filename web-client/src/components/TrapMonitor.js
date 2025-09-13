import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Filter, Clock, Server } from 'lucide-react';
import { apiService } from '../services/apiService';

const TrapMonitor = ({ traps, onClearTraps }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [filteredTraps, setFilteredTraps] = useState([]);

  useEffect(() => {
    let filtered = [...traps];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(trap => {
        switch (filter) {
          case 'recent':
            return new Date(trap.timestamp) > new Date(Date.now() - 3600000); // Last hour
          case 'critical':
            return trap.severity === 'critical' || trap.severity === 'error';
          case 'warning':
            return trap.severity === 'warning';
          case 'info':
            return trap.severity === 'info';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'severity':
          const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
          return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
        case 'device':
          return (a.deviceName || '').localeCompare(b.deviceName || '');
        default:
          return 0;
      }
    });

    setFilteredTraps(filtered);
  }, [traps, filter, sortBy]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-800 bg-red-100 border-red-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'info':
        return 'text-blue-800 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'info':
        return <AlertTriangle size={16} className="text-blue-600" />;
      default:
        return <AlertTriangle size={16} className="text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleClearTraps = () => {
    if (window.confirm('Are you sure you want to clear all traps?')) {
      onClearTraps();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trap Monitor</h1>
          <p className="text-gray-600">Monitor SNMP trap notifications in real-time</p>
        </div>
        <button
          onClick={handleClearTraps}
          className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center space-x-2"
        >
          <Trash2 size={16} />
          <span>Clear All</span>
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="snmp-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="snmp-select text-sm"
              >
                <option value="all">All Traps</option>
                <option value="recent">Last Hour</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="snmp-select text-sm"
              >
                <option value="timestamp">Time</option>
                <option value="severity">Severity</option>
                <option value="device">Device</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Showing {filteredTraps.length} of {traps.length} traps
          </div>
        </div>
      </div>

      {/* Traps List */}
      <div className="snmp-card">
        {filteredTraps.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No traps to display</p>
            <p className="text-sm text-gray-400">
              {filter === 'all' 
                ? 'No traps have been received yet'
                : `No traps match the current filter (${filter})`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTraps.map((trap, index) => (
              <div
                key={trap.id || index}
                className={`p-4 rounded-lg border-l-4 ${getSeverityColor(trap.severity || 'info')}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(trap.severity || 'info')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(trap.severity || 'info')}`}>
                          {trap.severity || 'info'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {trap.deviceName || trap.device || 'Unknown Device'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(trap.timestamp)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-900 mb-2">
                        <strong>OID:</strong> {trap.oid || 'Unknown OID'}
                      </div>
                      
                      {trap.message && (
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Message:</strong> {trap.message}
                        </div>
                      )}
                      
                      {trap.value !== undefined && (
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Value:</strong> {String(trap.value)}
                        </div>
                      )}
                      
                      {trap.variables && Object.keys(trap.variables).length > 0 && (
                        <div className="text-sm text-gray-700">
                          <strong>Variables:</strong>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(trap.variables, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {new Date(trap.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {traps.length > 0 && (
        <div className="snmp-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trap Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{traps.length}</div>
              <div className="text-sm text-gray-500">Total Traps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {traps.filter(t => t.severity === 'critical' || t.severity === 'error').length}
              </div>
              <div className="text-sm text-gray-500">Critical/Error</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {traps.filter(t => t.severity === 'warning').length}
              </div>
              <div className="text-sm text-gray-500">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {traps.filter(t => t.severity === 'info' || !t.severity).length}
              </div>
              <div className="text-sm text-gray-500">Info</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrapMonitor;
