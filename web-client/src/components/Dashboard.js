import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { apiService } from '../services/apiService';

const Dashboard = ({ devices, traps, onRefresh }) => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const status = await apiService.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
      await loadSystemStatus();
    } finally {
      setLoading(false);
    }
  };

  const onlineDevices = devices.filter(device => device.status === 'online').length;
  const offlineDevices = devices.filter(device => device.status === 'offline').length;
  const recentTraps = traps.slice(0, 5);

  const stats = [
    {
      title: 'Total Devices',
      value: devices.length,
      icon: Server,
      color: 'blue',
      change: '+2 this week'
    },
    {
      title: 'Online Devices',
      value: onlineDevices,
      icon: Activity,
      color: 'green',
      change: `${Math.round((onlineDevices / devices.length) * 100) || 0}% uptime`
    },
    {
      title: 'Recent Traps',
      value: traps.length,
      icon: AlertTriangle,
      color: 'yellow',
      change: `${traps.filter(t => new Date(t.timestamp) > new Date(Date.now() - 3600000)).length} in last hour`
    },
    {
      title: 'System Health',
      value: systemStatus?.health || 'Unknown',
      icon: TrendingUp,
      color: systemStatus?.health === 'Good' ? 'green' : 'red',
      change: systemStatus?.uptime || 'N/A'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">SNMP Management System Overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="snmp-button flex items-center space-x-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'text-blue-600 bg-blue-100',
            green: 'text-green-600 bg-green-100',
            yellow: 'text-yellow-600 bg-yellow-100',
            red: 'text-red-600 bg-red-100'
          };

          return (
            <div key={index} className="snmp-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Traps */}
        <div className="snmp-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Traps</h3>
            <span className="text-sm text-gray-500">{traps.length} total</span>
          </div>
          <div className="space-y-3">
            {recentTraps.length > 0 ? (
              recentTraps.map((trap, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {trap.oid || 'Unknown OID'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {trap.deviceName || 'Unknown Device'} • {new Date(trap.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent traps</p>
            )}
          </div>
        </div>

        {/* Device Status */}
        <div className="snmp-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
            <span className="text-sm text-gray-500">{devices.length} devices</span>
          </div>
          <div className="space-y-3">
            {devices.length > 0 ? (
              devices.slice(0, 5).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{device.name}</p>
                      <p className="text-xs text-gray-500">{device.ipAddress}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {device.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No devices configured</p>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      {systemStatus && (
        <div className="snmp-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="text-lg font-semibold text-gray-900">{systemStatus.version}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold text-gray-900">{systemStatus.uptime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Update</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(systemStatus.lastUpdate).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
