import React, { useState } from 'react';
import { Play, Search, ArrowRight, List, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiService } from '../services/apiService';

const SNMPOperations = ({ devices }) => {
  const [selectedDevice, setSelectedDevice] = useState('');
  const [oid, setOid] = useState('');
  const [operation, setOperation] = useState('get');
  const [setValue, setSetValue] = useState('');
  const [setType, setSetType] = useState('string');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleOperation = async () => {
    if (!selectedDevice || !oid.trim()) {
      toast.error('Please select a device and enter an OID');
      return;
    }

    setLoading(true);
    try {
      let result;
      const timestamp = new Date().toISOString();

      switch (operation) {
        case 'get':
          result = await apiService.snmpGet(selectedDevice, oid);
          break;
        case 'set':
          if (!setValue.trim()) {
            toast.error('Please enter a value for SET operation');
            setLoading(false);
            return;
          }
          result = await apiService.snmpSet(selectedDevice, oid, setValue, setType);
          break;
        case 'getnext':
          result = await apiService.snmpGetNext(selectedDevice, oid);
          break;
        case 'walk':
          result = await apiService.snmpWalk(selectedDevice, oid);
          break;
        default:
          throw new Error('Invalid operation');
      }

      const operationResult = {
        id: Date.now(),
        timestamp,
        device: devices.find(d => d.id === selectedDevice)?.name || 'Unknown',
        operation: operation.toUpperCase(),
        oid,
        result: result,
        success: true
      };

      setResults(prev => [operationResult, ...prev.slice(0, 49)]); // Keep last 50 results
      toast.success(`${operation.toUpperCase()} operation completed successfully`);
    } catch (error) {
      const errorResult = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        device: devices.find(d => d.id === selectedDevice)?.name || 'Unknown',
        operation: operation.toUpperCase(),
        oid,
        result: { error: error.response?.data?.message || error.message },
        success: false
      };

      setResults(prev => [errorResult, ...prev.slice(0, 49)]);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const commonOids = [
    { oid: '1.3.6.1.2.1.1.1.0', description: 'System Description' },
    { oid: '1.3.6.1.2.1.1.3.0', description: 'System Uptime' },
    { oid: '1.3.6.1.2.1.1.4.0', description: 'System Contact' },
    { oid: '1.3.6.1.2.1.1.5.0', description: 'System Name' },
    { oid: '1.3.6.1.2.1.1.6.0', description: 'System Location' },
    { oid: '1.3.6.1.2.1.2.1.0', description: 'Number of Interfaces' },
    { oid: '1.3.6.1.2.1.2.2.1.2', description: 'Interface Descriptions' },
    { oid: '1.3.6.1.2.1.2.2.1.10', description: 'Interface In Octets' },
    { oid: '1.3.6.1.2.1.2.2.1.16', description: 'Interface Out Octets' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SNMP Operations</h1>
          <p className="text-gray-600">Perform SNMP operations on managed devices</p>
        </div>
        <button
          onClick={clearResults}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Clear Results
        </button>
      </div>

      {/* Operation Form */}
      <div className="snmp-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SNMP Operation</h3>
        
        <div className="space-y-4">
          {/* Device Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Device *
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="snmp-select"
            >
              <option value="">Choose a device...</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.ipAddress})
                </option>
              ))}
            </select>
          </div>

          {/* Operation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'get', label: 'GET', icon: Search },
                { value: 'set', label: 'SET', icon: Play },
                { value: 'getnext', label: 'GETNEXT', icon: ArrowRight },
                { value: 'walk', label: 'WALK', icon: List }
              ].map(op => {
                const Icon = op.icon;
                return (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setOperation(op.value)}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md border transition-colors ${
                      operation === op.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{op.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OID (Object Identifier) *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={oid}
                onChange={(e) => setOid(e.target.value)}
                className="snmp-input flex-1"
                placeholder="e.g., 1.3.6.1.2.1.1.1.0"
              />
              <button
                onClick={() => setOid('1.3.6.1.2.1.1.1.0')}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Test OID
              </button>
            </div>
          </div>

          {/* SET Value (only for SET operation) */}
          {operation === 'set' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value *
                </label>
                <input
                  type="text"
                  value={setValue}
                  onChange={(e) => setSetValue(e.target.value)}
                  className="snmp-input"
                  placeholder="Enter value to set"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Type
                </label>
                <select
                  value={setType}
                  onChange={(e) => setSetType(e.target.value)}
                  className="snmp-select"
                >
                  <option value="string">String</option>
                  <option value="integer">Integer</option>
                  <option value="octet">Octet String</option>
                  <option value="oid">OID</option>
                </select>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <div className="flex justify-end">
            <button
              onClick={handleOperation}
              disabled={loading || !selectedDevice || !oid.trim()}
              className="snmp-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              <span>Execute {operation.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Common OIDs */}
      <div className="snmp-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Common OIDs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {commonOids.map((item, index) => (
            <button
              key={index}
              onClick={() => setOid(item.oid)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{item.oid}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="snmp-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Operation Results</h3>
          <span className="text-sm text-gray-500">{results.length} results</span>
        </div>
        
        {results.length === 0 ? (
          <div className="text-center py-8">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No operations performed yet</p>
            <p className="text-sm text-gray-400">Execute an SNMP operation to see results</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.operation}
                    </span>
                    <span className="text-sm text-gray-600">{result.device}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-900 mb-2">
                  <strong>OID:</strong> {result.oid}
                </div>
                
                <div className="text-sm">
                  <strong>Result:</strong>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SNMPOperations;
