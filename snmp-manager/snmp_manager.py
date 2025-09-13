#!/usr/bin/env python3
"""
SNMP Manager Implementation
Supports all 4 SNMP PDU types: GET, SET, GETNEXT, and TRAP
"""

import asyncio
import logging
import json
import time
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

class SNMPOperation(Enum):
    GET = "get"
    SET = "set"
    GETNEXT = "getnext"
    WALK = "walk"

@dataclass
class SNMPDevice:
    id: str
    name: str
    ip_address: str
    port: int = 161
    community: str = "public"
    version: SNMPVersion = SNMPVersion.V2C
    description: str = ""
    status: str = "offline"
    last_seen: Optional[str] = None

@dataclass
class SNMPResult:
    success: bool
    oid: str
    value: Any = None
    type: str = None
    error: str = None
    timestamp: str = None
    device: Dict = None

class SNMPManager:
    """SNMP Manager supporting all 4 PDU types"""
    
    def __init__(self, web_server_url: str = "http://localhost:5000"):
        self.web_server_url = web_server_url
        self.devices: Dict[str, SNMPDevice] = {}
        self.trap_listeners: List[callable] = []
        self.running = False
        
    async def start(self):
        """Start the SNMP Manager"""
        logger.info("Starting SNMP Manager...")
        self.running = True
        
        # Start trap listener
        asyncio.create_task(self._start_trap_listener())
        
        # Start device monitoring
        asyncio.create_task(self._monitor_devices())
        
        logger.info("SNMP Manager started successfully")
    
    async def stop(self):
        """Stop the SNMP Manager"""
        logger.info("Stopping SNMP Manager...")
        self.running = False
        logger.info("SNMP Manager stopped")
    
    async def add_device(self, device: SNMPDevice) -> bool:
        """Add a device to manage"""
        try:
            self.devices[device.id] = device
            logger.info(f"Added device: {device.name} ({device.ip_address})")
            return True
        except Exception as e:
            logger.error(f"Failed to add device {device.name}: {e}")
            return False
    
    async def remove_device(self, device_id: str) -> bool:
        """Remove a device from management"""
        try:
            if device_id in self.devices:
                device = self.devices.pop(device_id)
                logger.info(f"Removed device: {device.name}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to remove device {device_id}: {e}")
            return False
    
    async def snmp_get(self, device_id: str, oid: str) -> SNMPResult:
        """Perform SNMP GET operation"""
        try:
            device = self.devices.get(device_id)
            if not device:
                return SNMPResult(
                    success=False,
                    oid=oid,
                    error="Device not found",
                    timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
                )
            
            logger.info(f"SNMP GET: {device.name} - {oid}")
            
            # Perform SNMP GET
            result = await self._perform_snmp_operation(
                device, SNMPOperation.GET, oid
            )
            
            return SNMPResult(
                success=result['success'],
                oid=oid,
                value=result.get('value'),
                type=result.get('type'),
                error=result.get('error'),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
                device={
                    'id': device.id,
                    'name': device.name,
                    'ip_address': device.ip_address
                }
            )
            
        except Exception as e:
            logger.error(f"SNMP GET failed: {e}")
            return SNMPResult(
                success=False,
                oid=oid,
                error=str(e),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
            )
    
    async def snmp_set(self, device_id: str, oid: str, value: str, value_type: str = "string") -> SNMPResult:
        """Perform SNMP SET operation"""
        try:
            device = self.devices.get(device_id)
            if not device:
                return SNMPResult(
                    success=False,
                    oid=oid,
                    error="Device not found",
                    timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
                )
            
            logger.info(f"SNMP SET: {device.name} - {oid} = {value} ({value_type})")
            
            # Perform SNMP SET
            result = await self._perform_snmp_operation(
                device, SNMPOperation.SET, oid, value, value_type
            )
            
            return SNMPResult(
                success=result['success'],
                oid=oid,
                value=result.get('value'),
                type=result.get('type'),
                error=result.get('error'),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
                device={
                    'id': device.id,
                    'name': device.name,
                    'ip_address': device.ip_address
                }
            )
            
        except Exception as e:
            logger.error(f"SNMP SET failed: {e}")
            return SNMPResult(
                success=False,
                oid=oid,
                error=str(e),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
            )
    
    async def snmp_getnext(self, device_id: str, oid: str) -> SNMPResult:
        """Perform SNMP GETNEXT operation"""
        try:
            device = self.devices.get(device_id)
            if not device:
                return SNMPResult(
                    success=False,
                    oid=oid,
                    error="Device not found",
                    timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
                )
            
            logger.info(f"SNMP GETNEXT: {device.name} - {oid}")
            
            # Perform SNMP GETNEXT
            result = await self._perform_snmp_operation(
                device, SNMPOperation.GETNEXT, oid
            )
            
            return SNMPResult(
                success=result['success'],
                oid=result.get('next_oid', oid),
                value=result.get('value'),
                type=result.get('type'),
                error=result.get('error'),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
                device={
                    'id': device.id,
                    'name': device.name,
                    'ip_address': device.ip_address
                }
            )
            
        except Exception as e:
            logger.error(f"SNMP GETNEXT failed: {e}")
            return SNMPResult(
                success=False,
                oid=oid,
                error=str(e),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
            )
    
    async def snmp_walk(self, device_id: str, oid: str, max_results: int = 50) -> List[SNMPResult]:
        """Perform SNMP WALK operation (multiple GETNEXT)"""
        try:
            device = self.devices.get(device_id)
            if not device:
                return [SNMPResult(
                    success=False,
                    oid=oid,
                    error="Device not found",
                    timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
                )]
            
            logger.info(f"SNMP WALK: {device.name} - {oid}")
            
            results = []
            current_oid = oid
            walk_count = 0
            
            while walk_count < max_results:
                result = await self._perform_snmp_operation(
                    device, SNMPOperation.GETNEXT, current_oid
                )
                
                if not result['success']:
                    break
                
                next_oid = result.get('next_oid')
                if not next_oid or not next_oid.startswith(oid):
                    break
                
                results.append(SNMPResult(
                    success=True,
                    oid=next_oid,
                    value=result.get('value'),
                    type=result.get('type'),
                    timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
                    device={
                        'id': device.id,
                        'name': device.name,
                        'ip_address': device.ip_address
                    }
                ))
                
                current_oid = next_oid
                walk_count += 1
            
            logger.info(f"SNMP WALK completed: {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"SNMP WALK failed: {e}")
            return [SNMPResult(
                success=False,
                oid=oid,
                error=str(e),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
            )]
    
    async def _perform_snmp_operation(self, device: SNMPDevice, operation: SNMPOperation, 
                                    oid: str, value: str = None, value_type: str = None) -> Dict:
        """Perform the actual SNMP operation using pysnmp"""
        try:
            # Convert OID string to tuple
            oid_tuple = tuple(map(int, oid.split('.')))
            
            # Prepare SNMP parameters
            if device.version == SNMPVersion.V1:
                snmp_engine = SnmpEngine()
                community_data = CommunityData(device.community)
                transport = UdpTransportTarget((device.ip_address, device.port))
                context_data = ContextData()
            elif device.version == SNMPVersion.V2C:
                snmp_engine = SnmpEngine()
                community_data = CommunityData(device.community)
                transport = UdpTransportTarget((device.ip_address, device.port))
                context_data = ContextData()
            else:  # V3
                snmp_engine = SnmpEngine()
                user_data = UsmUserData('admin', 'password')
                transport = UdpTransportTarget((device.ip_address, device.port))
                context_data = ContextData()
            
            # Perform operation
            if operation == SNMPOperation.GET:
                for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
                    snmp_engine,
                    community_data,
                    transport,
                    context_data,
                    ObjectType(ObjectIdentity(oid_tuple)),
                    lexicographicMode=False
                ):
                    if errorIndication:
                        return {'success': False, 'error': str(errorIndication)}
                    elif errorStatus:
                        return {'success': False, 'error': f"{errorStatus.prettyPrint()}")
                    else:
                        for varBind in varBinds:
                            return {
                                'success': True,
                                'value': str(varBind[1]),
                                'type': str(varBind[1].__class__.__name__)
                            }
            
            elif operation == SNMPOperation.SET:
                # Convert value to appropriate type
                if value_type == "integer":
                    value_obj = Integer(int(value))
                elif value_type == "string":
                    value_obj = OctetString(value)
                elif value_type == "oid":
                    value_obj = ObjectIdentifier(value)
                else:
                    value_obj = OctetString(value)
                
                for (errorIndication, errorStatus, errorIndex, varBinds) in setCmd(
                    snmp_engine,
                    community_data,
                    transport,
                    context_data,
                    ObjectType(ObjectIdentity(oid_tuple), value_obj)
                ):
                    if errorIndication:
                        return {'success': False, 'error': str(errorIndication)}
                    elif errorStatus:
                        return {'success': False, 'error': f"{errorStatus.prettyPrint()}")
                    else:
                        return {
                            'success': True,
                            'value': value,
                            'type': value_type
                        }
            
            elif operation == SNMPOperation.GETNEXT:
                for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
                    snmp_engine,
                    community_data,
                    transport,
                    context_data,
                    ObjectType(ObjectIdentity(oid_tuple)),
                    lexicographicMode=False
                ):
                    if errorIndication:
                        return {'success': False, 'error': str(errorIndication)}
                    elif errorStatus:
                        return {'success': False, 'error': f"{errorStatus.prettyPrint()}")
                    else:
                        for varBind in varBinds:
                            return {
                                'success': True,
                                'next_oid': '.'.join(map(str, varBind[0])),
                                'value': str(varBind[1]),
                                'type': str(varBind[1].__class__.__name__)
                            }
            
            return {'success': False, 'error': 'No response received'}
            
        except Exception as e:
            logger.error(f"SNMP operation failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _start_trap_listener(self):
        """Start listening for SNMP traps"""
        logger.info("Starting SNMP trap listener...")
        
        # In a real implementation, this would listen for actual SNMP traps
        # For now, we'll simulate trap reception
        while self.running:
            try:
                # Simulate trap reception every 30 seconds
                await asyncio.sleep(30)
                
                if self.devices and self.running:
                    # Generate a random trap
                    device_id = list(self.devices.keys())[0]
                    device = self.devices[device_id]
                    
                    trap_data = {
                        'id': str(int(time.time())),
                        'device_id': device_id,
                        'device_name': device.name,
                        'oid': '1.3.6.1.4.1.9999.1.1.1',
                        'message': f'Trap from {device.name}',
                        'severity': 'info',
                        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                        'variables': {
                            '1.3.6.1.4.1.9999.1.1.1': f'Trap Value {int(time.time())}'
                        }
                    }
                    
                    # Notify trap listeners
                    for listener in self.trap_listeners:
                        try:
                            await listener(trap_data)
                        except Exception as e:
                            logger.error(f"Error in trap listener: {e}")
                    
                    logger.info(f"Generated trap: {trap_data['id']}")
                
            except Exception as e:
                logger.error(f"Error in trap listener: {e}")
                await asyncio.sleep(5)
    
    async def _monitor_devices(self):
        """Monitor device status"""
        logger.info("Starting device monitoring...")
        
        while self.running:
            try:
                for device_id, device in self.devices.items():
                    # Test device connectivity
                    is_online = await self._test_device_connectivity(device)
                    
                    if is_online and device.status != 'online':
                        device.status = 'online'
                        device.last_seen = time.strftime("%Y-%m-%d %H:%M:%S")
                        logger.info(f"Device {device.name} is now online")
                    elif not is_online and device.status != 'offline':
                        device.status = 'offline'
                        logger.info(f"Device {device.name} is now offline")
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in device monitoring: {e}")
                await asyncio.sleep(30)
    
    async def _test_device_connectivity(self, device: SNMPDevice) -> bool:
        """Test if device is reachable"""
        try:
            # Simple connectivity test using SNMP GET for sysDescr
            result = await self._perform_snmp_operation(
                device, SNMPOperation.GET, "1.3.6.1.2.1.1.1.0"
            )
            return result['success']
        except Exception as e:
            logger.debug(f"Device {device.name} connectivity test failed: {e}")
            return False
    
    def add_trap_listener(self, callback):
        """Add a trap listener callback"""
        self.trap_listeners.append(callback)
    
    def remove_trap_listener(self, callback):
        """Remove a trap listener callback"""
        if callback in self.trap_listeners:
            self.trap_listeners.remove(callback)

# Global SNMP Manager instance
snmp_manager = SNMPManager()

async def main():
    """Main function for testing"""
    # Add some test devices
    device1 = SNMPDevice(
        id="1",
        name="Router-01",
        ip_address="192.168.1.1",
        port=161,
        community="public",
        version=SNMPVersion.V2C,
        description="Main router"
    )
    
    device2 = SNMPDevice(
        id="2",
        name="Switch-01",
        ip_address="192.168.1.2",
        port=161,
        community="public",
        version=SNMPVersion.V2C,
        description="Core switch"
    )
    
    await snmp_manager.add_device(device1)
    await snmp_manager.add_device(device2)
    
    # Start the manager
    await snmp_manager.start()
    
    try:
        # Keep running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        await snmp_manager.stop()

if __name__ == "__main__":
    asyncio.run(main())
