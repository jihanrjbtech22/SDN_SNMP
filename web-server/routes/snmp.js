const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');
const { snmpManagerService } = require('../services/snmpManagerService');

const router = express.Router();

// Validation schemas
const snmpOperationSchema = Joi.object({
  deviceId: Joi.string().required(),
  oid: Joi.string().pattern(/^[0-9]+(\.[0-9]+)*$/).required()
});

const snmpSetSchema = snmpOperationSchema.keys({
  value: Joi.string().required(),
  type: Joi.string().valid('string', 'integer', 'octet', 'oid').default('string')
});

// GET /api/snmp/get - SNMP GET operation
router.post('/get', async (req, res) => {
  try {
    const { error, value } = snmpOperationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const { deviceId, oid } = value;
    logger.info(`SNMP GET request: device=${deviceId}, oid=${oid}`);

    // Get device information
    const device = await getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Perform SNMP GET operation
    const result = await snmpManagerService.snmpGet(device, oid);
    
    logger.info(`SNMP GET response: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    logger.error('SNMP GET error:', error);
    res.status(500).json({ 
      error: 'SNMP GET operation failed', 
      message: error.message 
    });
  }
});

// POST /api/snmp/set - SNMP SET operation
router.post('/set', async (req, res) => {
  try {
    const { error, value } = snmpSetSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const { deviceId, oid, value: setValue, type } = value;
    logger.info(`SNMP SET request: device=${deviceId}, oid=${oid}, value=${setValue}, type=${type}`);

    // Get device information
    const device = await getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Perform SNMP SET operation
    const result = await snmpManagerService.snmpSet(device, oid, setValue, type);
    
    logger.info(`SNMP SET response: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    logger.error('SNMP SET error:', error);
    res.status(500).json({ 
      error: 'SNMP SET operation failed', 
      message: error.message 
    });
  }
});

// POST /api/snmp/getnext - SNMP GETNEXT operation
router.post('/getnext', async (req, res) => {
  try {
    const { error, value } = snmpOperationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const { deviceId, oid } = value;
    logger.info(`SNMP GETNEXT request: device=${deviceId}, oid=${oid}`);

    // Get device information
    const device = await getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Perform SNMP GETNEXT operation
    const result = await snmpManagerService.snmpGetNext(device, oid);
    
    logger.info(`SNMP GETNEXT response: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    logger.error('SNMP GETNEXT error:', error);
    res.status(500).json({ 
      error: 'SNMP GETNEXT operation failed', 
      message: error.message 
    });
  }
});

// POST /api/snmp/walk - SNMP WALK operation (multiple GETNEXT)
router.post('/walk', async (req, res) => {
  try {
    const { error, value } = snmpOperationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const { deviceId, oid } = value;
    logger.info(`SNMP WALK request: device=${deviceId}, oid=${oid}`);

    // Get device information
    const device = await getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Perform SNMP WALK operation
    const result = await snmpManagerService.snmpWalk(device, oid);
    
    logger.info(`SNMP WALK response: ${result.length} results`);
    res.json(result);
  } catch (error) {
    logger.error('SNMP WALK error:', error);
    res.status(500).json({ 
      error: 'SNMP WALK operation failed', 
      message: error.message 
    });
  }
});

// Helper function to get device by ID
async function getDeviceById(deviceId) {
  // In production, this would query the database
  // For now, we'll use a simple in-memory lookup
  const devices = [
    {
      id: '1',
      name: 'Router-01',
      ipAddress: '192.168.1.1',
      port: 161,
      community: 'public',
      version: '2c',
      status: 'online'
    },
    {
      id: '2',
      name: 'Switch-01',
      ipAddress: '192.168.1.2',
      port: 161,
      community: 'public',
      version: '2c',
      status: 'offline'
    }
  ];
  
  return devices.find(d => d.id === deviceId);
}

module.exports = router;
