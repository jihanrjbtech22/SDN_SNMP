import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DeviceManagement from './components/DeviceManagement';
import SNMPOperations from './components/SNMPOperations';
import TrapMonitor from './components/TrapMonitor';

// Services
import { apiService } from './services/apiService';
import { socketService } from './services/socketService';

function App() {
  const [devices, setDevices] = useState([]);
  const [traps, setTraps] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();
    
    // Set up event listeners
    socketService.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketService.on('trap', (trapData) => {
      setTraps(prev => [trapData, ...prev.slice(0, 49)]); // Keep last 50 traps
    });

    socketService.on('deviceStatus', (deviceData) => {
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceData.id 
            ? { ...device, status: deviceData.status, lastSeen: deviceData.lastSeen }
            : device
        )
      );
    });

    // Load initial data
    loadDevices();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadDevices = async () => {
    try {
      const deviceList = await apiService.getDevices();
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const addDevice = async (deviceData) => {
    try {
      const newDevice = await apiService.addDevice(deviceData);
      setDevices(prev => [...prev, newDevice]);
      return newDevice;
    } catch (error) {
      console.error('Failed to add device:', error);
      throw error;
    }
  };

  const removeDevice = async (deviceId) => {
    try {
      await apiService.removeDevice(deviceId);
      setDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (error) {
      console.error('Failed to remove device:', error);
      throw error;
    }
  };

  const updateDevice = async (deviceId, deviceData) => {
    try {
      const updatedDevice = await apiService.updateDevice(deviceId, deviceData);
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceId ? updatedDevice : device
        )
      );
      return updatedDevice;
    } catch (error) {
      console.error('Failed to update device:', error);
      throw error;
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header isConnected={isConnected} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  devices={devices}
                  traps={traps}
                  onRefresh={loadDevices}
                />
              } 
            />
            <Route 
              path="/devices" 
              element={
                <DeviceManagement 
                  devices={devices}
                  onAddDevice={addDevice}
                  onRemoveDevice={removeDevice}
                  onUpdateDevice={updateDevice}
                />
              } 
            />
            <Route 
              path="/operations" 
              element={
                <SNMPOperations 
                  devices={devices}
                />
              } 
            />
            <Route 
              path="/traps" 
              element={
                <TrapMonitor 
                  traps={traps}
                  onClearTraps={() => setTraps([])}
                />
              } 
            />
          </Routes>
        </main>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
