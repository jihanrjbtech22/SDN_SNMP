import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Server, Wifi } from 'lucide-react';
import { toast } from 'react-toastify';

const DeviceManagement = ({ devices, onAddDevice, onRemoveDevice, onUpdateDevice }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: 161,
    community: 'public',
    version: '2c',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await onUpdateDevice(editingDevice.id, formData);
        toast.success('Device updated successfully');
        setEditingDevice(null);
      } else {
        await onAddDevice(formData);
        toast.success('Device added successfully');
      }
      setShowAddForm(false);
      setFormData({
        name: '',
        ipAddress: '',
        port: 161,
        community: 'public',
        version: '2c',
        description: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save device');
    }
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      ipAddress: device.ipAddress,
      port: device.port,
      community: device.community,
      version: device.version,
      description: device.description || ''
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingDevice(null);
    setFormData({
      name: '',
      ipAddress: '',
      port: 161,
      community: 'public',
      version: '2c',
      description: ''
    });
  };

  const handleDelete = async (device) => {
    if (window.confirm(`Are you sure you want to delete device "${device.name}"?`)) {
      try {
        await onRemoveDevice(device.id);
        toast.success('Device deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete device');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600">Manage SNMP devices and their configurations</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="snmp-button flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Device</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="snmp-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingDevice ? 'Edit Device' : 'Add New Device'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="snmp-input"
                  placeholder="e.g., Router-01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address *
                </label>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  required
                  className="snmp-input"
                  placeholder="192.168.1.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  className="snmp-input"
                  min="1"
                  max="65535"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Community String
                </label>
                <input
                  type="text"
                  name="community"
                  value={formData.community}
                  onChange={handleInputChange}
                  className="snmp-input"
                  placeholder="public"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SNMP Version
                </label>
                <select
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  className="snmp-select"
                >
                  <option value="1">SNMP v1</option>
                  <option value="2c">SNMP v2c</option>
                  <option value="3">SNMP v3</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="snmp-input"
                  placeholder="Optional description for this device"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="snmp-button flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{editingDevice ? 'Update' : 'Add'} Device</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Devices List */}
      <div className="snmp-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configured Devices</h3>
        
        {devices.length === 0 ? (
          <div className="text-center py-8">
            <Server size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No devices configured yet</p>
            <p className="text-sm text-gray-400">Add your first device to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Server size={20} className="text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {device.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {device.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {device.ipAddress}:{device.port}
                      </div>
                      <div className="text-sm text-gray-500">
                        {device.community}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <Wifi size={12} className="mr-1" />
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      SNMP v{device.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(device)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(device)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceManagement;
