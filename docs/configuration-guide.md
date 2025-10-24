# S3 File Viewer Configuration Guide

Welcome to the S3 File Viewer configuration guide! This guide will help you configure connections to various S3-compatible storage services.

## Quick Start

S3 File Viewer is a modern desktop application for browsing and managing S3-compatible object storage services. Whether you're using AWS S3, MinIO, Cloudflare R2, or other S3-compatible services, this guide will help you quickly set up connections.

### Basic Concepts

Before getting started, it's important to understand the following basic concepts:

**S3 Protocol**
- S3 (Simple Storage Service) was originally created by Amazon
- Has become the de facto standard for object storage
- Many cloud providers offer S3-compatible APIs

**Object Storage**
- Stores data as objects (files)
- Each object has a unique key (path)
- Suitable for storing large amounts of unstructured data

**Bucket (Storage Container)**
- Container for objects, similar to folders
- Each service account can have multiple buckets
- Bucket names typically need to be globally unique

### Configuration Parameters

Connecting to S3 services typically requires the following parameters:

#### 1. Endpoint

The endpoint is the API address of the S3 service, typically formatted as:
```
https://s3.<region>.example.com
```

**Examples**:
- AWS S3: `https://s3.us-east-1.amazonaws.com`
- MinIO: `http://localhost:9000`
- Cloudflare R2: `https://abc123.r2.cloudflarestorage.com`

**Notes**:
- Must include protocol (`http://` or `https://`)
- HTTPS is recommended for production environments
- Some services may use non-standard ports

#### 2. Access Key ID

The access key is your account identifier used for authentication.

**Characteristics**:
- Used publicly (but should not be publicly shared)
- Typically a string of letters and numbers
- Similar to: `AKIAIOSFODNN7EXAMPLE`

**Aliases**:
Different services may use different names:
- AWS: Access Key ID
- Alibaba Cloud: AccessKey ID
- Tencent Cloud: SecretId
- MinIO: Access Key

#### 3. Secret Access Key

The secret key is the private key paired with the access key, used for signing requests.

**Characteristics**:
- Must be kept strictly confidential
- Typically only displayed once after creation
- Similar to: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**Aliases**:
- AWS: Secret Access Key
- Alibaba Cloud: AccessKey Secret
- Tencent Cloud: SecretKey
- MinIO: Secret Key

**⚠️ Security Tips**:
- Save immediately after creation
- Don't commit to code repositories
- Rotate regularly
- Use principle of least privilege

#### 4. Region

Region identifies the geographic location of the service.

**Examples**:
- AWS: `us-east-1` (US East), `ap-northeast-1` (Tokyo)
- Alibaba Cloud: `cn-hangzhou` (Hangzhou), `cn-beijing` (Beijing)
- Cloudflare R2: `auto` (automatic selection)

**Notes**:
- Choosing the closest region to users provides best performance
- Some services don't require a region; you can use `us-east-1` or `auto`
- If unsure, check the service provider's documentation

## Major S3 Service Configuration Guides

We provide detailed configuration guides for major S3-compatible services, including how to obtain access keys, configuration examples, and common issues.

### Cloud Providers

#### [AWS S3](./providers/aws-s3.md)
Amazon's object storage service, the creator and standard definer of the S3 protocol.

**Use Cases**: Enterprise applications, global distribution, AWS ecosystem integration

**Key Features**:
- Most complete features and ecosystem
- Global data center coverage
- High availability and durability
- Rich storage classes

[View detailed configuration guide →](./providers/aws-s3.md)

---

#### [Cloudflare R2](./providers/cloudflare-r2.md)
Cloudflare's object storage service with **zero egress fees**.

**Use Cases**: Public file hosting, CDN origin, large file distribution

**Key Features**:
- Zero egress fees
- Globally distributed
- Cloudflare Workers integration
- S3-compatible API

[View detailed configuration guide →](./providers/cloudflare-r2.md)

---

#### [MinIO](./providers/minio.md)
Open-source high-performance object storage server that can be self-hosted.

**Use Cases**: Private cloud, local development, edge computing, data sovereignty

**Key Features**:
- 100% open source
- Fully S3-compatible
- High performance
- Easy to deploy

[View detailed configuration guide →](./providers/minio.md)

---

#### [Alibaba Cloud OSS](./providers/aliyun-oss.md)
Alibaba Cloud's object storage service with fast access in China.

**Use Cases**: Mainland China applications, Alibaba Cloud ecosystem

**Key Features**:
- Fast domestic access
- Alibaba Cloud product integration
- S3-compatible API
- Image processing service

[View detailed configuration guide →](./providers/aliyun-oss.md)

---

#### [Tencent Cloud COS](./providers/tencent-cos.md)
Tencent Cloud's object storage service with deep WeChat ecosystem integration.

**Use Cases**: Mini programs/Official accounts, Tencent Cloud ecosystem

**Key Features**:
- Fast domestic access
- WeChat ecosystem integration
- Data Insight (media processing)
- S3-compatible API

[View detailed configuration guide →](./providers/tencent-cos.md)

---

#### [Backblaze B2](./providers/backblaze-b2.md)
Highly cost-effective object storage service, priced at 1/4 of S3.

**Use Cases**: Backup and archiving, cost-sensitive projects

**Key Features**:
- Very affordable
- Generous free download quota
- S3-compatible API
- Simple to use

[View detailed configuration guide →](./providers/backblaze-b2.md)

---

#### [DigitalOcean Spaces](./providers/digitalocean-spaces.md)
DigitalOcean's object storage service with fixed pricing including CDN.

**Use Cases**: Small to medium projects, static website hosting

**Key Features**:
- Fixed pricing ($5/month)
- Built-in free CDN
- Simple to use
- Fully S3-compatible

[View detailed configuration guide →](./providers/digitalocean-spaces.md)

---

### Other S3-Compatible Services

#### [General Configuration Guide](./providers/other-s3-compatible.md)

Including but not limited to:
- **Wasabi** - Low cost, no egress fees
- **Linode Object Storage** - Linode cloud platform
- **Vultr Object Storage** - Vultr cloud platform
- **IBM Cloud Object Storage** - IBM cloud service
- **Google Cloud Storage** - GCS S3-compatible API
- **Huawei Cloud OBS** - Huawei Cloud object storage
- **Oracle Cloud** - Oracle cloud storage
- **Private Deployments** - Ceph, OpenStack Swift, SeaweedFS, etc.

[View general configuration guide →](./providers/other-s3-compatible.md)

## Quick Configuration Process

### 1. Create New Connection

In S3 File Viewer:
1. Click the "+" button at the bottom of the sidebar
2. Or right-click in empty space and select "New Connection"

### 2. Fill in Connection Information

Based on your chosen service provider, fill in the following information:

```
Connection Name: [Custom name, e.g., "My AWS S3"]
Endpoint: [Service API endpoint URL]
Access Key: [Access Key ID]
Secret Key: [Secret Access Key]
Region: [Service region code]
```

### 3. Save and Connect

1. Click "Save" to save the connection configuration
2. The connection will appear in the sidebar
3. Click the connection name to connect and view buckets

### 4. Browse and Manage

After successful connection, you can:
- 📂 Browse buckets and objects
- ⬆️ Upload files and folders
- ⬇️ Download objects
- 🗑️ Delete objects
- 📋 Copy object URLs
- 👁️ Preview files
- ➕ Create folders

## Security Best Practices

### 1. Use Sub-accounts/IAM Users

**❌ Don't use main account keys**
- Main accounts have all permissions
- Very high risk if keys are leaked

**✅ Create dedicated sub-accounts**
- AWS: IAM users
- Alibaba Cloud: RAM users
- Tencent Cloud: CAM sub-users
- MinIO: Service Accounts

### 2. Principle of Least Privilege

Only grant necessary permissions:

**Basic read/write permissions**:
```json
{
  "permissions": [
    "ListBuckets",
    "ListObjects",
    "GetObject",
    "PutObject",
    "DeleteObject"
  ]
}
```

**Read-only permissions**:
```json
{
  "permissions": [
    "ListBuckets",
    "ListObjects",
    "GetObject"
  ]
}
```

### 3. Regular Key Rotation

- Recommend changing every 90 days
- Delete unused old keys
- Monitor key usage

### 4. Protect Key Security

**✅ Should do**:
- Use password manager to save
- Use environment variables (development)
- Regularly review access logs

**❌ Should not do**:
- Commit to Git repositories
- Hard-code in code
- Share through insecure channels
- Display in public

## Common Issues

### Connection Failed?

**Checklist**:
1. ✓ Endpoint URL format is correct
2. ✓ Access key and secret key copied correctly
3. ✓ No extra spaces or line breaks
4. ✓ Region code is correct
5. ✓ Network can access the endpoint
6. ✓ Firewall allows connection
7. ✓ System time is accurate (deviation not more than 15 minutes)

### How to Choose the Right Service?

**Considerations**:

1. **Geographic Location**
   - Choose service closest to users
   - Consider data sovereignty and compliance requirements

2. **Pricing**
   - Storage fees
   - Traffic fees
   - API request fees
   - Free quotas

3. **Feature Requirements**
   - CDN needed?
   - Image processing needed?
   - Advanced features needed?

4. **Ecosystem Integration**
   - Using other services from cloud provider?
   - Need specific integrations?

**Price Comparison** (100GB storage + 100GB download/month):

| Service | Approx. Cost | Features |
|---------|--------------|----------|
| Backblaze B2 | ~$1.5 | Cheapest, free download quota |
| Cloudflare R2 | ~$1.5 | Zero egress fees |
| DigitalOcean | $5 | Fixed price, includes CDN |
| Wasabi | ~$6 | No egress fees |
| AWS S3 | ~$12 | Most features |
| Alibaba Cloud OSS | ~¥17 | Fast in China |

*Prices are for reference only, please check official pricing*

### Performance Optimization Tips

1. **Choose Nearby Region**
   - Lower latency
   - Faster speed

2. **Use CDN**
   - Accelerate global access
   - Reduce traffic costs

3. **Enable Compression**
   - Reduce storage space
   - Speed up transfers

4. **Reasonable File Organization**
   - Use prefixes for classification
   - Avoid too many objects in single bucket

## Getting Help

### Documentation and Resources

- 📚 [GitHub Repository](https://github.com/moonrailgun/s3-file-viewer)
- 🐛 [Issue Tracker](https://github.com/moonrailgun/s3-file-viewer/issues)
- 💬 [Discussions](https://github.com/moonrailgun/s3-file-viewer/discussions)

### Submitting Issues

When submitting issues, please include:
- S3 service name being used
- Error messages or screenshots
- Configuration information (hide sensitive data)
- Operating system and app version

### Contributing Documentation

Pull requests welcome for:
- Additional configuration guides
- Error corrections
- Adding new services
- Improving instructions

## Next Steps

Choose your service to view the detailed configuration guide:

- [AWS S3 Configuration Guide](./providers/aws-s3.md)
- [Cloudflare R2 Configuration Guide](./providers/cloudflare-r2.md)
- [MinIO Configuration Guide](./providers/minio.md)
- [Alibaba Cloud OSS Configuration Guide](./providers/aliyun-oss.md)
- [Tencent Cloud COS Configuration Guide](./providers/tencent-cos.md)
- [Backblaze B2 Configuration Guide](./providers/backblaze-b2.md)
- [DigitalOcean Spaces Configuration Guide](./providers/digitalocean-spaces.md)
- [Other S3-Compatible Services Configuration Guide](./providers/other-s3-compatible.md)

Enjoy using S3 File Viewer! 🚀
