# MinIO Configuration Guide

## Service Overview

MinIO is a high-performance open-source object storage server that is fully compatible with the Amazon S3 cloud storage service API. MinIO can be deployed locally, in private clouds, or in public clouds.

**Official Website**: [https://min.io/](https://min.io/)

**Official Documentation**: [https://docs.min.io/](https://docs.min.io/)

## Installing MinIO

### Docker Method (Recommended)

```bash
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v ~/minio/data:/data \
  minio/minio server /data --console-address ":9001"
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.7'

services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - ./data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
```

Start:
```bash
docker-compose up -d
```

### Binary Installation

**Linux/macOS**:
```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server /data
```

**Windows**:
Download [minio.exe](https://dl.min.io/server/minio/release/windows-amd64/minio.exe) and run:
```cmd
minio.exe server D:\data
```

## Configuration Parameters

### Endpoint

MinIO endpoint format depends on your deployment:

**Local Deployment**:
```
http://localhost:9000
```

**LAN Deployment**:
```
http://192.168.1.100:9000
```

**Domain Deployment**:
```
https://minio.example.com
```

**Note**: 
- Default API port is 9000
- Default console port is 9001

### Region

MinIO uses `us-east-1` as the default region.

You can customize in server configuration:
```bash
export MINIO_REGION_NAME=my-region
minio server /data
```

For most use cases, the default value works fine.

## Obtaining Access Keys

### Method 1: Using Root Credentials (Development)

The simplest way is to use the root credentials set during installation:

- **Access Key**: Value of environment variable `MINIO_ROOT_USER` (default: `minioadmin`)
- **Secret Key**: Value of environment variable `MINIO_ROOT_PASSWORD` (default: `minioadmin`)

⚠️ **Warning**: Must change default credentials in production!

### Method 2: Create Service Account (Recommended)

1. **Log into MinIO Console**
   - Visit `http://localhost:9001` (or your MinIO console address)
   - Log in with root credentials

2. **Create Service Account**
   - Click "Identity" → "Service Accounts" in left menu
   - Click "Create Service Account" button
   - (Optional) Configure access policy to limit permissions
   - Click "Create"

3. **Save Credentials**
   - Page will display Access Key and Secret Key
   - ⚠️ **Important**: Save immediately, cannot view again after page refresh

## Configuration Examples

### Local Development Configuration

```
Connection Name: Local MinIO Dev
Endpoint: http://localhost:9000
Access Key: minioadmin
Secret Key: minioadmin
Region: us-east-1
```

### LAN Configuration

```
Connection Name: Office MinIO Server
Endpoint: http://192.168.1.100:9000
Access Key: myaccesskey
Secret Key: mysecretkey123
Region: us-east-1
```

### HTTPS Configuration

```
Connection Name: Production MinIO
Endpoint: https://minio.company.com
Access Key: AKIAIOSFODNN7EXAMPLE
Secret Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Region: us-east-1
```

## Related Resources

- [MinIO Official Documentation](https://docs.min.io/)
- [MinIO GitHub](https://github.com/minio/minio)
- [MinIO Client (mc) Documentation](https://docs.min.io/docs/minio-client-complete-guide.html)
- [MinIO Console Guide](https://github.com/minio/console)
