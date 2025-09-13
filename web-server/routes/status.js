const express = require('express');
const os = require('os');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/status - Get system status
router.get('/', (req, res) => {
  try {
    const status = {
      system: {
        version: '1.0.0',
        uptime: formatUptime(process.uptime()),
        health: 'Good',
        lastUpdate: new Date().toISOString()
      },
      server: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        }
      },
      services: {
        webServer: 'Running',
        snmpManager: 'Running',
        snmpAgent: 'Running',
        database: 'Connected'
      },
      timestamp: new Date().toISOString()
    };
    
    logger.info('System status requested');
    res.json(status);
  } catch (error) {
    logger.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// GET /api/status/health - Health check endpoint
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      }
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Health check failed' 
    });
  }
});

// GET /api/status/metrics - System metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpu: {
          model: os.cpus()[0].model,
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        },
        network: os.networkInterfaces()
      }
    };
    
    logger.info('System metrics requested');
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

module.exports = router;
