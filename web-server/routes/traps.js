const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory storage for traps (in production, use a database)
let traps = [];

// GET /api/traps - Get all traps
router.get('/', (req, res) => {
  try {
    const { limit = 100, offset = 0, severity, deviceId } = req.query;
    
    let filteredTraps = [...traps];
    
    // Filter by severity
    if (severity) {
      filteredTraps = filteredTraps.filter(trap => trap.severity === severity);
    }
    
    // Filter by device
    if (deviceId) {
      filteredTraps = filteredTraps.filter(trap => trap.deviceId === deviceId);
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTraps = filteredTraps.slice(startIndex, endIndex);
    
    logger.info(`Fetching traps: ${paginatedTraps.length} of ${filteredTraps.length}`);
    
    res.json({
      traps: paginatedTraps,
      total: filteredTraps.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching traps:', error);
    res.status(500).json({ error: 'Failed to fetch traps' });
  }
});

// GET /api/traps/:id - Get trap by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const trap = traps.find(t => t.id === id);
    
    if (!trap) {
      return res.status(404).json({ error: 'Trap not found' });
    }
    
    logger.info(`Fetching trap: ${id}`);
    res.json(trap);
  } catch (error) {
    logger.error('Error fetching trap:', error);
    res.status(500).json({ error: 'Failed to fetch trap' });
  }
});

// DELETE /api/traps - Clear all traps
router.delete('/', (req, res) => {
  try {
    const clearedCount = traps.length;
    traps = [];
    
    logger.info(`Cleared ${clearedCount} traps`);
    
    // Emit trap cleared event
    const io = req.app.get('io');
    if (io) {
      io.emit('trapsCleared', { count: clearedCount });
    }
    
    res.json({ 
      message: 'All traps cleared successfully', 
      clearedCount 
    });
  } catch (error) {
    logger.error('Error clearing traps:', error);
    res.status(500).json({ error: 'Failed to clear traps' });
  }
});

// DELETE /api/traps/:id - Delete specific trap
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const trapIndex = traps.findIndex(t => t.id === id);
    
    if (trapIndex === -1) {
      return res.status(404).json({ error: 'Trap not found' });
    }
    
    const deletedTrap = traps.splice(trapIndex, 1)[0];
    logger.info(`Deleted trap: ${id}`);
    
    res.json({ 
      message: 'Trap deleted successfully', 
      trap: deletedTrap 
    });
  } catch (error) {
    logger.error('Error deleting trap:', error);
    res.status(500).json({ error: 'Failed to delete trap' });
  }
});

// POST /api/traps/simulate - Simulate a trap (for testing)
router.post('/simulate', (req, res) => {
  try {
    const { deviceId, oid, message, severity = 'info' } = req.body;
    
    const trap = {
      id: Date.now().toString(),
      deviceId: deviceId || '1',
      deviceName: 'Test Device',
      oid: oid || '1.3.6.1.4.1.9999.1.1.1',
      message: message || 'Simulated trap message',
      severity: severity,
      timestamp: new Date().toISOString(),
      variables: {
        '1.3.6.1.4.1.9999.1.1.1': 'Test Value'
      }
    };
    
    traps.unshift(trap); // Add to beginning
    traps = traps.slice(0, 1000); // Keep only last 1000 traps
    
    logger.info(`Simulated trap: ${trap.id}`);
    
    // Emit trap event
    const io = req.app.get('io');
    if (io) {
      io.emit('trap', trap);
    }
    
    res.status(201).json(trap);
  } catch (error) {
    logger.error('Error simulating trap:', error);
    res.status(500).json({ error: 'Failed to simulate trap' });
  }
});

// Function to add trap (used by SNMP manager)
function addTrap(trapData) {
  const trap = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...trapData,
    timestamp: new Date().toISOString()
  };
  
  traps.unshift(trap); // Add to beginning
  traps = traps.slice(0, 1000); // Keep only last 1000 traps
  
  logger.info(`New trap received: ${trap.id}`);
  
  return trap;
}

// Function to get trap count by severity
function getTrapStats() {
  const stats = {
    total: traps.length,
    critical: traps.filter(t => t.severity === 'critical').length,
    error: traps.filter(t => t.severity === 'error').length,
    warning: traps.filter(t => t.severity === 'warning').length,
    info: traps.filter(t => t.severity === 'info' || !t.severity).length
  };
  
  return stats;
}

module.exports = { router, addTrap, getTrapStats };
