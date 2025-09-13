const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// MIB tree structure (simplified)
const mibTree = {
  '1.3.6.1.2.1': {
    name: 'mib-2',
    description: 'MIB-II',
    children: {
      '1.3.6.1.2.1.1': {
        name: 'system',
        description: 'System Group',
        children: {
          '1.3.6.1.2.1.1.1.0': {
            name: 'sysDescr',
            description: 'System Description',
            type: 'OCTET STRING',
            access: 'read-only'
          },
          '1.3.6.1.2.1.1.2.0': {
            name: 'sysObjectID',
            description: 'System Object ID',
            type: 'OBJECT IDENTIFIER',
            access: 'read-only'
          },
          '1.3.6.1.2.1.1.3.0': {
            name: 'sysUpTime',
            description: 'System Uptime',
            type: 'TimeTicks',
            access: 'read-only'
          },
          '1.3.6.1.2.1.1.4.0': {
            name: 'sysContact',
            description: 'System Contact',
            type: 'OCTET STRING',
            access: 'read-write'
          },
          '1.3.6.1.2.1.1.5.0': {
            name: 'sysName',
            description: 'System Name',
            type: 'OCTET STRING',
            access: 'read-write'
          },
          '1.3.6.1.2.1.1.6.0': {
            name: 'sysLocation',
            description: 'System Location',
            type: 'OCTET STRING',
            access: 'read-write'
          }
        }
      },
      '1.3.6.1.2.1.2': {
        name: 'interfaces',
        description: 'Interfaces Group',
        children: {
          '1.3.6.1.2.1.2.1.0': {
            name: 'ifNumber',
            description: 'Number of Interfaces',
            type: 'INTEGER',
            access: 'read-only'
          },
          '1.3.6.1.2.1.2.2.1': {
            name: 'ifTable',
            description: 'Interface Table',
            type: 'SEQUENCE OF',
            access: 'not-accessible',
            children: {
              '1.3.6.1.2.1.2.2.1.1': {
                name: 'ifIndex',
                description: 'Interface Index',
                type: 'INTEGER',
                access: 'read-only'
              },
              '1.3.6.1.2.1.2.2.1.2': {
                name: 'ifDescr',
                description: 'Interface Description',
                type: 'OCTET STRING',
                access: 'read-only'
              },
              '1.3.6.1.2.1.2.2.1.3': {
                name: 'ifType',
                description: 'Interface Type',
                type: 'INTEGER',
                access: 'read-only'
              },
              '1.3.6.1.2.1.2.2.1.10': {
                name: 'ifInOctets',
                description: 'Interface In Octets',
                type: 'Counter32',
                access: 'read-only'
              },
              '1.3.6.1.2.1.2.2.1.16': {
                name: 'ifOutOctets',
                description: 'Interface Out Octets',
                type: 'Counter32',
                access: 'read-only'
              }
            }
          }
        }
      },
      '1.3.6.1.2.1.4': {
        name: 'ip',
        description: 'IP Group',
        children: {
          '1.3.6.1.2.1.4.1.0': {
            name: 'ipForwarding',
            description: 'IP Forwarding',
            type: 'INTEGER',
            access: 'read-write'
          },
          '1.3.6.1.2.1.4.3.0': {
            name: 'ipInReceives',
            description: 'IP In Receives',
            type: 'Counter32',
            access: 'read-only'
          }
        }
      }
    }
  },
  '1.3.6.1.4.1': {
    name: 'enterprises',
    description: 'Private Enterprises',
    children: {
      '1.3.6.1.4.1.9999': {
        name: 'custom-enterprise',
        description: 'Custom Enterprise MIB',
        children: {
          '1.3.6.1.4.1.9999.1': {
            name: 'customSystem',
            description: 'Custom System Group',
            children: {
              '1.3.6.1.4.1.9999.1.1.1': {
                name: 'customTrap',
                description: 'Custom Trap OID',
                type: 'OCTET STRING',
                access: 'read-only'
              }
            }
          }
        }
      }
    }
  }
};

// GET /api/mib/tree - Get MIB tree structure
router.get('/tree', (req, res) => {
  try {
    logger.info('Fetching MIB tree');
    res.json(mibTree);
  } catch (error) {
    logger.error('Error fetching MIB tree:', error);
    res.status(500).json({ error: 'Failed to fetch MIB tree' });
  }
});

// GET /api/mib/search - Search MIB by OID or name
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = searchMib(mibTree, q.toLowerCase());
    logger.info(`MIB search for "${q}": ${results.length} results`);
    
    res.json({
      query: q,
      results: results,
      count: results.length
    });
  } catch (error) {
    logger.error('Error searching MIB:', error);
    res.status(500).json({ error: 'Failed to search MIB' });
  }
});

// GET /api/mib/oid/:oid - Get specific OID information
router.get('/oid/:oid', (req, res) => {
  try {
    const { oid } = req.params;
    
    if (!isValidOid(oid)) {
      return res.status(400).json({ error: 'Invalid OID format' });
    }
    
    const oidInfo = findOidInTree(mibTree, oid);
    
    if (!oidInfo) {
      return res.status(404).json({ error: 'OID not found in MIB' });
    }
    
    logger.info(`Fetching OID info: ${oid}`);
    res.json(oidInfo);
  } catch (error) {
    logger.error('Error fetching OID info:', error);
    res.status(500).json({ error: 'Failed to fetch OID information' });
  }
});

// Helper function to search MIB tree
function searchMib(tree, query, results = []) {
  for (const [oid, node] of Object.entries(tree)) {
    // Check if OID matches
    if (oid.includes(query)) {
      results.push({
        oid: oid,
        name: node.name,
        description: node.description,
        type: node.type,
        access: node.access
      });
    }
    
    // Check if name or description matches
    if (node.name && node.name.toLowerCase().includes(query)) {
      results.push({
        oid: oid,
        name: node.name,
        description: node.description,
        type: node.type,
        access: node.access
      });
    }
    
    if (node.description && node.description.toLowerCase().includes(query)) {
      results.push({
        oid: oid,
        name: node.name,
        description: node.description,
        type: node.type,
        access: node.access
      });
    }
    
    // Recursively search children
    if (node.children) {
      searchMib(node.children, query, results);
    }
  }
  
  return results;
}

// Helper function to find specific OID in tree
function findOidInTree(tree, targetOid) {
  for (const [oid, node] of Object.entries(tree)) {
    if (oid === targetOid) {
      return {
        oid: oid,
        name: node.name,
        description: node.description,
        type: node.type,
        access: node.access,
        children: node.children ? Object.keys(node.children) : undefined
      };
    }
    
    if (node.children) {
      const result = findOidInTree(node.children, targetOid);
      if (result) {
        return result;
      }
    }
  }
  
  return null;
}

// Helper function to validate OID format
function isValidOid(oid) {
  const oidPattern = /^[0-9]+(\.[0-9]+)*$/;
  return oidPattern.test(oid);
}

module.exports = router;
