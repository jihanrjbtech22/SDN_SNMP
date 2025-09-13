# Full Stack SNMP Implementation Project

## Project Overview
This project implements a complete SNMP (Simple Network Management Protocol) system with web-based management interface, supporting all 4 SNMP PDU types: GET, SET, GETNEXT, and TRAP.

## Architecture Components

### 1. Web Client
- Modern React-based frontend
- OID input interface
- Real-time SNMP operation results
- Device management dashboard

### 2. Web Server
- Node.js/Express REST API
- SNMP operation endpoints
- Authentication and authorization
- WebSocket support for real-time updates

### 3. SNMP Manager
- Python-based SNMP manager
- Implements all 4 PDU types
- Device discovery and management
- Trap handling and processing

### 4. SNMP Agent
- Python SNMP agent implementation
- MIB data management
- OID value storage and retrieval
- Trap generation capabilities

### 5. MIB (Management Information Base)
- Custom MIB definitions
- OID mappings and data types
- Device-specific information storage

## DevOps Tools Used
- **Git & GitHub**: Version control and collaboration
- **GitHub Actions**: CI/CD pipeline
- **Docker**: Containerization
- **Docker Hub**: Container registry
- **Kubernetes**: Orchestration and deployment

## Project Structure
```
SDN_Project/
├── web-client/          # React frontend
├── web-server/          # Node.js API server
├── snmp-manager/        # Python SNMP manager
├── snmp-agent/          # Python SNMP agent
├── mib/                 # MIB definitions
├── k8s/                 # Kubernetes configurations
├── docker/              # Docker configurations
├── docs/                # Documentation
└── tests/               # Test files
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.9+
- kubectl (for Kubernetes deployment)

### Development Setup
1. Clone the repository
2. Run `docker-compose up` for local development
3. Access web client at http://localhost:3000
4. API server runs on http://localhost:5000

### Production Deployment
1. Build and push Docker images
2. Deploy to Kubernetes using configurations in `k8s/` directory
3. Configure ingress and load balancing

## Team Information
- **Team Size**: 3 members
- **Project Type**: Full-stack SNMP implementation
- **Duration**: Semester 7 project

## Deliverables
- [x] Software Requirements Specification (SRS)
- [x] System Test Plan
- [x] Complete source code
- [x] Docker containerization
- [x] Kubernetes deployment
- [x] CI/CD pipeline
