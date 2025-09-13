#!/bin/bash

echo "🚀 Starting SNMP Project..."
echo "=========================="

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "snmp_manager" 2>/dev/null || true
pkill -f "snmp_agent" 2>/dev/null || true
pkill -f "web-server" 2>/dev/null || true

# Wait a moment
sleep 2

# Start SNMP Agent
echo "🤖 Starting SNMP Agent..."
cd snmp-agent
python3 snmp_agent.py &
SNMP_AGENT_PID=$!
cd ..

# Wait for agent to start
sleep 3

# Start SNMP Manager (using fixed version)
echo "⚙️ Starting SNMP Manager..."
cd snmp-manager
python3 snmp_manager_fixed.py &
SNMP_MANAGER_PID=$!
cd ..

# Wait for manager to start
sleep 3

# Start Web Server
echo "🌐 Starting Web Server..."
cd web-server
PORT=5001 npm start &
WEB_SERVER_PID=$!
cd ..

# Wait for web server to start
sleep 5

# Start Web Client
echo "💻 Starting Web Client..."
cd web-client
npm start &
WEB_CLIENT_PID=$!
cd ..

echo ""
echo "🎉 All services started!"
echo "========================"
echo "📱 Web Client: http://localhost:3000"
echo "🔧 Web Server API: http://localhost:5001"
echo "🤖 SNMP Agent: localhost:161 (UDP)"
echo "⚙️ SNMP Manager: Running in background"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $SNMP_AGENT_PID 2>/dev/null || true
    kill $SNMP_MANAGER_PID 2>/dev/null || true
    kill $WEB_SERVER_PID 2>/dev/null || true
    kill $WEB_CLIENT_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
