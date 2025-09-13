# Deployment Guide
## Full Stack SNMP Implementation Project

### Quick Start

#### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- Python 3.9+ (for development)
- kubectl (for Kubernetes deployment)
- Git

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd SDN_Project
cp env.example .env
# Edit .env with your configuration
```

#### 2. Development Mode
```bash
# Install dependencies
make install

# Start development environment
make dev
```

#### 3. Docker Mode
```bash
# Build and run with Docker
make docker-build
make docker-run

# Access the application
open http://localhost:3000
```

#### 4. Kubernetes Mode
```bash
# Deploy to Kubernetes
make k8s-deploy

# Check status
make k8s-status
```

### Detailed Deployment Instructions

#### Docker Deployment

1. **Build Images**
   ```bash
   docker build -f docker/Dockerfile.web-client -t snmp-project/web-client:latest .
   docker build -f docker/Dockerfile.web-server -t snmp-project/web-server:latest .
   docker build -f docker/Dockerfile.snmp-manager -t snmp-project/snmp-manager:latest .
   docker build -f docker/Dockerfile.snmp-agent -t snmp-project/snmp-agent:latest .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access Services**
   - Web Client: http://localhost:3000
   - Web Server API: http://localhost:5000
   - SNMP Agent: localhost:161 (UDP)

#### Kubernetes Deployment

1. **Create Namespace**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Deploy Components**
   ```bash
   kubectl apply -f k8s/redis-deployment.yaml
   kubectl apply -f k8s/snmp-agent-deployment.yaml
   kubectl apply -f k8s/snmp-manager-deployment.yaml
   kubectl apply -f k8s/web-server-deployment.yaml
   kubectl apply -f k8s/web-client-deployment.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

3. **Check Deployment**
   ```bash
   kubectl get pods -n snmp-system
   kubectl get services -n snmp-system
   ```

### Configuration

#### Environment Variables
- Copy `env.example` to `.env`
- Update configuration values as needed
- Key variables:
  - `NODE_ENV`: development/production
  - `PORT`: Web server port (default: 5000)
  - `CLIENT_URL`: Frontend URL
  - `SNMP_COMMUNITY`: SNMP community string
  - `REDIS_URL`: Redis connection string

#### SNMP Configuration
- **Community String**: Default is "public"
- **SNMP Version**: Supports v1, v2c, v3
- **Ports**: 161 (SNMP), 162 (Traps)
- **MIB**: Custom MIB definitions in `mib/` directory

### Monitoring and Logging

#### Health Checks
- Web Client: http://localhost:3000
- Web Server: http://localhost:5000/health
- SNMP Manager: Internal health check
- SNMP Agent: Internal health check

#### Logs
- Docker: `docker-compose logs -f [service-name]`
- Kubernetes: `kubectl logs -f deployment/[deployment-name] -n snmp-system`
- Log files: `logs/` directory

### Troubleshooting

#### Common Issues

1. **Port Conflicts**
   - Ensure ports 3000, 5000, 161 are available
   - Check with `netstat -tulpn | grep :PORT`

2. **Docker Issues**
   - Clean up: `docker-compose down -v`
   - Rebuild: `make docker-build`

3. **Kubernetes Issues**
   - Check pods: `kubectl describe pod [pod-name] -n snmp-system`
   - Check logs: `kubectl logs [pod-name] -n snmp-system`

4. **SNMP Issues**
   - Verify SNMP agent is running
   - Check community string configuration
   - Test with SNMP tools: `snmpwalk -v2c -c public localhost`

#### Performance Tuning

1. **Docker Resources**
   - Adjust memory/CPU limits in `docker-compose.yml`
   - Scale services: `docker-compose up --scale web-server=3`

2. **Kubernetes Resources**
   - Update resource requests/limits in deployment files
   - Use horizontal pod autoscaler for scaling

### Security Considerations

1. **Change Default Passwords**
   - Update community strings
   - Use strong JWT secrets
   - Enable HTTPS in production

2. **Network Security**
   - Use firewalls to restrict access
   - Enable SNMP v3 with encryption
   - Use VPN for remote access

3. **Container Security**
   - Run containers as non-root users
   - Use security scanning tools
   - Keep base images updated

### Backup and Recovery

1. **Data Backup**
   ```bash
   make backup
   ```

2. **Database Backup**
   ```bash
   # Redis backup
   redis-cli --rdb backup.rdb
   ```

3. **Configuration Backup**
   - Backup `.env` files
   - Backup Kubernetes configurations
   - Backup MIB definitions

### Scaling

#### Horizontal Scaling
- **Web Server**: Scale with load balancer
- **SNMP Manager**: Multiple instances for high availability
- **SNMP Agent**: One instance per device/network segment

#### Vertical Scaling
- Increase CPU/memory resources
- Optimize database queries
- Use caching (Redis)

### Maintenance

#### Regular Tasks
1. **Update Dependencies**
   ```bash
   npm update
   pip install --upgrade -r requirements.txt
   ```

2. **Security Updates**
   ```bash
   make security-scan
   ```

3. **Performance Monitoring**
   - Monitor resource usage
   - Check response times
   - Review logs for errors

#### Updates
1. **Code Updates**
   ```bash
   git pull origin main
   make docker-build
   make docker-run
   ```

2. **Configuration Updates**
   - Update `.env` files
   - Restart services
   - Verify functionality

### Support

#### Documentation
- SRS: `docs/SRS.md`
- Test Plan: `docs/System_Test_Plan.md`
- API Documentation: Available at `/api/docs`

#### Logs and Debugging
- Enable debug logging: `LOG_LEVEL=debug`
- Use browser developer tools for frontend issues
- Check SNMP packet captures for network issues

#### Contact
- Project Team: [team-email]
- Issues: GitHub Issues
- Documentation: Project Wiki

---

**Last Updated**: December 2024  
**Version**: 1.0
