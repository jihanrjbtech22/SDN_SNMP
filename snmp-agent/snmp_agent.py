#!/usr/bin/env python3
"""
SNMP Agent Implementation
Provides SNMP agent functionality with MIB support
"""

import asyncio
import logging
import json
import time
import threading
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from pysnmp.hlapi import *
from pysnmp.error import PySnmpError
import aiohttp
import websockets
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SNMPVersion(Enum):
    V1 = "1"
    V2C = "2c"
    V3 = "3"

@dataclass
class MIBEntry:
    oid: str
    name: str
    description: str
    type: str
    access: str
    value: Any = None
    last_updated: str = None

class SNMPAgent:
    """SNMP Agent with MIB support"""
    
    def __init__(self, agent_id: str = "agent-001", port: int = 161):
        self.agent_id = agent_id
        self.port = port
        self.mib: Dict[str, MIBEntry] = {}
        self.running = False
        self.trap_destinations: List[Tuple[str, int]] = []
        
        # Initialize MIB with standard entries
        self._initialize_mib()
    
    def _initialize_mib(self):
        """Initialize the MIB with standard SNMP entries"""
        current_time = time.strftime("%Y-%m-%d %H:%M:%S")
        
        # System Group (1.3.6.1.2.1.1)
        self.mib["1.3.6.1.2.1.1.1.0"] = MIBEntry(
            oid="1.3.6.1.2.1.1.1.0",
            name="sysDescr",
            description="System Description",
            type="OCTET STRING",
            access="read-only",
            value="SNMP Agent v1.0.0 - Python Implementation",
            last_updated=current_time
        )
        
        self.mib["1.3.6.1.2.1.1.2.0"] = MIBEntry(
            oid="1.3.6.1.2.1.1.2.0",
            name="sysObjectID",
            description="System Object ID",
            type="OBJECT IDENTIFIER",
            access="read-only",
            value="1.3.6.1.4.1.9999.1.1",
            last_updated=current_time
        )
        
        self.mib["1.3.6.1.2.1.1.3.0"] = MIBEntry(
            oid="1.3.6.1.2.1.1.3.0",
            name="sysUpTime",
            description="System Uptime",
            type="TimeTicks",
            access="read-only",
            value=str(int(time.time())),
            last_updated=current_time
        )
        
        self.mib["1.3.6.1.2.1.1.4.0"] = MIBEntry(
            oid="1.3.6.1.2.1.1.4.0",
            name="sysContact",
            description="System Contact",
            type="OCTET STRING",
            access="read-write",
            value="admin@snmp-agent.local",
            last_updated=current_time
        )
        
        self.mib["1.3.6.1.2.1.1.5.0"] = MIBEntry(
            oid="1.3.6.1.2.1.1.5.0",
            name="sysName",
            description="System Name",
            type="OCTET STRING",
            access="read-write",
            value=f"SNMP-Agent-{self.agent_id}",
            last_updated=current_time
        )
        
        self.mib["1.3.6.1.2.1.1.6.0"] = MIBEntry(
            oid="1.3.6.1.2.1.1.6.0",
            name="sysLocation",
            description="System Location",
            type="OCTET STRING",
            access="read-write",
            value="Data Center Rack 1",
            last_updated=current_time
        )
        
        # Interfaces Group (1.3.6.1.2.1.2)
        self.mib["1.3.6.1.2.1.2.1.0"] = MIBEntry(
            oid="1.3.6.1.2.1.2.1.0",
            name="ifNumber",
            description="Number of Interfaces",
            type="INTEGER",
            access="read-only",
            value="3",
            last_updated=current_time
        )
        
        # Interface Table
        interfaces = [
            ("1.3.6.1.2.1.2.2.1.1.1", "1", "Interface Index 1"),
            ("1.3.6.1.2.1.2.2.1.2.1", "eth0", "Ethernet Interface 0"),
            ("1.3.6.1.2.1.2.2.1.3.1", "6", "Ethernet Interface Type"),
            ("1.3.6.1.2.1.2.2.1.10.1", "1000000", "Interface In Octets"),
            ("1.3.6.1.2.1.2.2.1.16.1", "2000000", "Interface Out Octets"),
            ("1.3.6.1.2.1.2.2.1.1.2", "2", "Interface Index 2"),
            ("1.3.6.1.2.1.2.2.1.2.2", "eth1", "Ethernet Interface 1"),
            ("1.3.6.1.2.1.2.2.1.3.2", "6", "Ethernet Interface Type"),
            ("1.3.6.1.2.1.2.2.1.10.2", "1500000", "Interface In Octets"),
            ("1.3.6.1.2.1.2.2.1.16.2", "2500000", "Interface Out Octets"),
        ]
        
        for oid, value, desc in interfaces:
            self.mib[oid] = MIBEntry(
                oid=oid,
                name=f"ifEntry.{oid.split('.')[-1]}",
                description=desc,
                type="OCTET STRING" if not value.isdigit() else "INTEGER",
                access="read-only",
                value=value,
                last_updated=current_time
            )
        
        # Custom Enterprise MIB (1.3.6.1.4.1.9999)
        self.mib["1.3.6.1.4.1.9999.1.1.1"] = MIBEntry(
            oid="1.3.6.1.4.1.9999.1.1.1",
            name="customTrap",
            description="Custom Trap OID",
            type="OCTET STRING",
            access="read-only",
            value="Custom Agent Value",
            last_updated=current_time
        )
        
        logger.info(f"Initialized MIB with {len(self.mib)} entries")
    
    async def start(self):
        """Start the SNMP Agent"""
        logger.info(f"Starting SNMP Agent {self.agent_id} on port {self.port}")
        self.running = True
        
        # Start SNMP listener in a separate thread
        listener_thread = threading.Thread(target=self._start_snmp_listener)
        listener_thread.daemon = True
        listener_thread.start()
        
        # Start periodic MIB updates
        asyncio.create_task(self._update_mib_periodically())
        
        logger.info(f"SNMP Agent {self.agent_id} started successfully")
    
    async def stop(self):
        """Stop the SNMP Agent"""
        logger.info(f"Stopping SNMP Agent {self.agent_id}")
        self.running = False
        logger.info(f"SNMP Agent {self.agent_id} stopped")
    
    def _start_snmp_listener(self):
        """Start SNMP listener (runs in separate thread)"""
        try:
            from pysnmp.carrier.udp import UdpTransport
            from pysnmp.entity import engine, config
            from pysnmp.entity.rfc3413 import cmdrsp, context
            from pysnmp.proto.api import v2c
            from pysnmp.smi import builder, view, rfc1902
            
            # Create SNMP engine
            snmpEngine = engine.SnmpEngine()
            
            # Transport setup
            config.addTransport(
                snmpEngine,
                udp.domainName,
                UdpTransport().openServerMode(('0.0.0.0', self.port))
            )
            
            # SNMPv2c setup
            config.addV1System(snmpEngine, 'my-area', 'public')
            config.addV2cSystem(snmpEngine, 'my-area', 'public')
            
            # MIB view controller
            mibBuilder = builder.MibBuilder()
            mibViewController = view.MibViewController(mibBuilder)
            
            # Context
            snmpContext = context.SnmpContext(snmpEngine, mibViewController)
            
            # Command responder
            cmdrsp.GetCommandResponder(snmpEngine, snmpContext)
            cmdrsp.SetCommandResponder(snmpEngine, snmpContext)
            cmdrsp.NextCommandResponder(snmpEngine, snmpContext)
            
            # Custom MIB handler
            def mib_handler(oid, val=None):
                oid_str = '.'.join([str(x) for x in oid])
                
                if oid_str in self.mib:
                    entry = self.mib[oid_str]
                    if val is None:  # GET operation
                        return entry.value
                    else:  # SET operation
                        if entry.access == "read-write":
                            entry.value = str(val)
                            entry.last_updated = time.strftime("%Y-%m-%d %H:%M:%S")
                            return True
                        else:
                            raise Exception("OID is read-only")
                else:
                    raise Exception("OID not found")
            
            # Register MIB handler
            for oid_str, entry in self.mib.items():
                oid_tuple = tuple(map(int, oid_str.split('.')))
                snmpContext.registerContextName(
                    v2c.OctetString('my-area'),
                    oid_tuple,
                    mib_handler
                )
            
            logger.info(f"SNMP Agent {self.agent_id} listening on port {self.port}")
            
            # Run the SNMP engine
            snmpEngine.transportDispatcher.runDispatcher()
            
        except Exception as e:
            logger.error(f"Error in SNMP listener: {e}")
    
    async def _update_mib_periodically(self):
        """Update MIB values periodically"""
        while self.running:
            try:
                # Update uptime
                if "1.3.6.1.2.1.1.3.0" in self.mib:
                    self.mib["1.3.6.1.2.1.1.3.0"].value = str(int(time.time()))
                    self.mib["1.3.6.1.2.1.1.3.0"].last_updated = time.strftime("%Y-%m-%d %H:%M:%S")
                
                # Update interface counters (simulate traffic)
                for oid in ["1.3.6.1.2.1.2.2.1.10.1", "1.3.6.1.2.1.2.2.1.16.1",
                           "1.3.6.1.2.1.2.2.1.10.2", "1.3.6.1.2.1.2.2.1.16.2"]:
                    if oid in self.mib:
                        current_value = int(self.mib[oid].value)
                        # Simulate traffic increment
                        new_value = current_value + (int(time.time()) % 1000)
                        self.mib[oid].value = str(new_value)
                        self.mib[oid].last_updated = time.strftime("%Y-%m-%d %H:%M:%S")
                
                await asyncio.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                logger.error(f"Error updating MIB: {e}")
                await asyncio.sleep(60)
    
    def add_trap_destination(self, host: str, port: int = 162):
        """Add a trap destination"""
        self.trap_destinations.append((host, port))
        logger.info(f"Added trap destination: {host}:{port}")
    
    async def send_trap(self, oid: str, value: str, message: str = None, severity: str = "info"):
        """Send SNMP trap"""
        try:
            if not self.trap_destinations:
                logger.warning("No trap destinations configured")
                return False
            
            trap_data = {
                'id': str(int(time.time())),
                'agent_id': self.agent_id,
                'oid': oid,
                'value': value,
                'message': message or f"Trap from {self.agent_id}",
                'severity': severity,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'variables': {
                    oid: value
                }
            }
            
            # Send trap to all destinations
            for host, port in self.trap_destinations:
                try:
                    # In a real implementation, this would send actual SNMP traps
                    # For now, we'll just log the trap
                    logger.info(f"Trap sent to {host}:{port} - {trap_data}")
                except Exception as e:
                    logger.error(f"Failed to send trap to {host}:{port}: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending trap: {e}")
            return False
    
    def get_mib_entry(self, oid: str) -> Optional[MIBEntry]:
        """Get MIB entry by OID"""
        return self.mib.get(oid)
    
    def set_mib_entry(self, oid: str, value: str) -> bool:
        """Set MIB entry value"""
        try:
            if oid in self.mib:
                entry = self.mib[oid]
                if entry.access == "read-write":
                    entry.value = value
                    entry.last_updated = time.strftime("%Y-%m-%d %H:%M:%S")
                    logger.info(f"Set MIB entry {oid} = {value}")
                    return True
                else:
                    logger.warning(f"Cannot set read-only OID: {oid}")
                    return False
            else:
                logger.warning(f"OID not found: {oid}")
                return False
        except Exception as e:
            logger.error(f"Error setting MIB entry {oid}: {e}")
            return False
    
    def get_mib_tree(self) -> Dict[str, MIBEntry]:
        """Get the complete MIB tree"""
        return self.mib.copy()
    
    async def simulate_traps(self):
        """Simulate periodic trap generation"""
        while self.running:
            try:
                # Generate a trap every 60 seconds
                await asyncio.sleep(60)
                
                if self.running:
                    trap_oid = "1.3.6.1.4.1.9999.1.1.1"
                    trap_value = f"Simulated trap {int(time.time())}"
                    await self.send_trap(trap_oid, trap_value, "Periodic simulation trap")
                
            except Exception as e:
                logger.error(f"Error in trap simulation: {e}")
                await asyncio.sleep(30)

# Global SNMP Agent instance
snmp_agent = SNMPAgent()

async def main():
    """Main function for testing"""
    # Add trap destinations
    snmp_agent.add_trap_destination("127.0.0.1", 162)
    snmp_agent.add_trap_destination("192.168.1.100", 162)
    
    # Start the agent
    await snmp_agent.start()
    
    # Start trap simulation
    asyncio.create_task(snmp_agent.simulate_traps())
    
    try:
        # Keep running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        await snmp_agent.stop()

if __name__ == "__main__":
    asyncio.run(main())
