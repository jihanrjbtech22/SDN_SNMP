# 🚀 SNMP Project Setup Guide

## Complete Step-by-Step Instructions

### **Prerequisites**
Make sure you have these installed on your system:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **Python** (version 3.8 or higher) - [Download here](https://python.org/)
- **Git** - [Download here](https://git-scm.com/)

### **Step 1: Clone the Repository**
```bash
git clone <your-repository-url>
cd SDN_Project
```

### **Step 2: Install Dependencies**

#### **Install Node.js Dependencies**
```bash
# Install web client dependencies
cd web-client
npm install
cd ..

# Install web server dependencies
cd web-server
npm install
cd ..
```

#### **Install Python Dependencies**
```bash
# Fix Python package compatibility
python3 -m pip install --upgrade pyasn1

# Install SNMP manager dependencies
cd snmp-manager
python3 -m pip install -r requirements.txt
cd ..

# Install SNMP agent dependencies
cd snmp-agent
python3 -m pip install -r requirements.txt
cd ..
```

### **Step 3: Make the Startup Script Executable**
```bash
chmod +x start.sh
```

### **Step 4: Run the Application**
```bash
./start.sh
```

### **Step 5: Access the Application**
Once all services are running, you can access:

- **🌐 Web Interface**: http://localhost:3000
- **🔧 API Server**: http://localhost:5001
- **📊 Health Check**: http://localhost:5001/health

---

## **Alternative: Manual Startup**

If you prefer to start each service manually:

### **Terminal 1: SNMP Agent**
```bash
cd snmp-agent
python3 snmp_agent.py
```

### **Terminal 2: SNMP Manager**
```bash
cd snmp-manager
python3 snmp_manager_fixed.py
```

### **Terminal 3: Web Server**
```bash
cd web-server
PORT=5001 npm start
```

### **Terminal 4: Web Client**
```bash
cd web-client
npm start
```

---

## **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Port Already in Use**
```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process if needed
kill -9 <PID>
```

#### **2. Python Module Not Found**
```bash
# Update pip and install packages
python3 -m pip install --upgrade pip
python3 -m pip install --upgrade pyasn1
```

#### **3. Node.js Version Issues**
```bash
# Check Node.js version
node --version

# If version is too old, update Node.js
# Download from https://nodejs.org/
```

#### **4. Permission Denied**
```bash
# Make script executable
chmod +x start.sh
```

### **Stopping the Application**
- Press `Ctrl+C` in the terminal where you ran `./start.sh`
- Or manually kill processes:
```bash
pkill -f "snmp_manager"
pkill -f "snmp_agent"
pkill -f "web-server"
pkill -f "web-client"
```

---

## **Project Structure**
```
SDN_Project/
├── web-client/          # React frontend (port 3000)
├── web-server/          # Node.js API server (port 5001)
├── snmp-manager/        # Python SNMP manager
├── snmp-agent/          # Python SNMP agent (port 161)
├── mib/                 # MIB definitions
├── docs/                # Documentation
├── start.sh             # Startup script
└── SETUP_GUIDE.md       # This file
```

---

## **Features Available**

### **Web Interface Features:**
- ✅ Device Management Dashboard
- ✅ SNMP Operations (GET, SET, GETNEXT, WALK)
- ✅ Real-time Trap Monitoring
- ✅ MIB Browser
- ✅ Device Status Monitoring

### **SNMP Operations:**
- ✅ GET - Retrieve SNMP values
- ✅ SET - Modify SNMP values
- ✅ GETNEXT - Get next OID in sequence
- ✅ WALK - Traverse MIB tree

### **Supported OIDs:**
- System Description (1.3.6.1.2.1.1.1.0)
- System Uptime (1.3.6.1.2.1.1.3.0)
- Interface Information (1.3.6.1.2.1.2.2.1.*)
- Custom Enterprise OIDs (1.3.6.1.4.1.9999.*)

---

## **Quick Test**

Once the application is running:

1. **Open** http://localhost:3000 in your browser
2. **Navigate** to "SNMP Operations" tab
3. **Select** a device from the dropdown
4. **Enter** an OID (e.g., `1.3.6.1.2.1.1.1.0`)
5. **Click** "Execute GET" to test SNMP functionality

---

## **Support**

If you encounter any issues:
1. Check the terminal output for error messages
2. Verify all dependencies are installed correctly
3. Ensure ports 3000 and 5001 are available
4. Check the troubleshooting section above

**Happy SNMP Managing!** 🎉
