const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory storage for devices (in production, use a database)
let devices = [
  {
    id: '1',
    name: 'Router-01',
    ipAddress: '192.168.1.1',
    port: 161,
    community: 'public',
    version: '2c',
    description: 'Main router',
    status: 'online',
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Switch-01',
    ipAddress: '192.168.1.2',
    port: 161,
    community: 'public',
    version: '2c',
    description: 'Core switch',
    status: 'offline',
    lastSeen: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Validation schemas
const deviceSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  ipAddress: Joi.string().ip().required(),
  port: Joi.number().port().default(161),
  community: Joi.string().min(1).max(50).default('public'),
  version: Joi.string().valid('1', '2c', '3').default('2c'),
  description: Joi.string().max(500).allow('').default('')
});

const updateDeviceSchema = deviceSchema.fork(['name', 'ipAddress'], (schema) => schema.optional());

// GET /api/devices - Get all devices
router.get('/', (req, res) => {
  try {
    logger.info('Fetching all devices');
    res.json(devices);
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// GET /api/devices/:id - Get device by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const device = devices.find(d => d.id === id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    logger.info(`Fetching device: ${id}`);
    res.json(device);
  } catch (error) {
    logger.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// POST /api/devices - Create new device
router.post('/', (req, res) => {
  try {
    const { error, value } = deviceSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    // Check if device with same IP already exists
    const existingDevice = devices.find(d => d.ipAddress === value.ipAddress);
    if (existingDevice) {
      return res.status(409).json({ error: 'Device with this IP address already exists' });
    }

    const newDevice = {
      id: uuidv4(),
      ...value,
      status: 'offline',
      lastSeen: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    devices.push(newDevice);
    logger.info(`Created new device: ${newDevice.id}`);
    
    // Emit device added event
    const io = req.app.get('io');
    if (io) {
      io.emit('deviceAdded', newDevice);
    }

    res.status(201).json(newDevice);
  } catch (error) {
    logger.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// PUT /api/devices/:id - Update device
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateDeviceSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const deviceIndex = devices.findIndex(d => d.id === id);
    if (deviceIndex === -1) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check if IP is being changed and if it conflicts with existing device
    if (value.ipAddress && value.ipAddress !== devices[deviceIndex].ipAddress) {
      const existingDevice = devices.find(d => d.ipAddress === value.ipAddress && d.id !== id);
      if (existingDevice) {
        return res.status(409).json({ error: 'Device with this IP address already exists' });
      }
    }

    const updatedDevice = {
      ...devices[deviceIndex],
      ...value,
      updatedAt: new Date().toISOString()
    };

    devices[deviceIndex] = updatedDevice;
    logger.info(`Updated device: ${id}`);
    
    // Emit device updated event
    const io = req.app.get('io');
    if (io) {
      io.emit('deviceUpdated', updatedDevice);
    }

    res.json(updatedDevice);
  } catch (error) {
    logger.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// DELETE /api/devices/:id - Delete device
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deviceIndex = devices.findIndex(d => d.id === id);
    
    if (deviceIndex === -1) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const deletedDevice = devices.splice(deviceIndex, 1)[0];
    logger.info(`Deleted device: ${id}`);
    
    // Emit device removed event
    const io = req.app.get('io');
    if (io) {
      io.emit('deviceRemoved', { id });
    }

    res.json({ message: 'Device deleted successfully', device: deletedDevice });
  } catch (error) {
    logger.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// POST /api/devices/:id/test - Test device connection
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const device = devices.find(d => d.id === id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Simulate connection test (in production, actually test SNMP connection)
    const isOnline = Math.random() > 0.3; // 70% chance of being online for demo
    
    const updatedDevice = {
      ...device,
      status: isOnline ? 'online' : 'offline',
      lastSeen: isOnline ? new Date().toISOString() : device.lastSeen,
      updatedAt: new Date().toISOString()
    };

    const deviceIndex = devices.findIndex(d => d.id === id);
    devices[deviceIndex] = updatedDevice;

    logger.info(`Tested device connection: ${id}, status: ${updatedDevice.status}`);
    
    // Emit device status update
    const io = req.app.get('io');
    if (io) {
      io.emit('deviceStatus', updatedDevice);
    }

    res.json({
      success: true,
      status: updatedDevice.status,
      message: isOnline ? 'Device is reachable' : 'Device is not reachable'
    });
  } catch (error) {
    logger.error('Error testing device connection:', error);
    res.status(500).json({ error: 'Failed to test device connection' });
  }
});

module.exports = router;
