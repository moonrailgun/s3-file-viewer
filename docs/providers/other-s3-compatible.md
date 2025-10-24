# Other S3-Compatible Services Configuration Guide

This guide applies to other object storage services that support the S3 protocol.

## General Configuration Method

Most S3-compatible services require the following information:

1. **Endpoint** - API endpoint URL provided by the service provider
2. **Access Key ID** - Public key for authentication
3. **Secret Access Key** - Private key for signing requests
4. **Region** - Some services require it; try `us-east-1` or `auto` if unsure

## Common S3-Compatible Services

### Wasabi

**Official Website**: [https://wasabi.com/](https://wasabi.com/)

**Endpoint Format**:
```
https://s3.<region>.wasabisys.com
```

**Available Regions**:
- `us-east-1` - US East (Virginia)
- `us-east-2` - US East (Virginia)
- `us-central-1` - US Central (Texas)
- `us-west-1` - US West (Oregon)
- `ca-central-1` - Canada (Toronto)
- `eu-central-1` - Europe (Amsterdam)
- `eu-central-2` - Europe (Frankfurt)
- `eu-west-1` - Europe (London)
- `eu-west-2` - Europe (Paris)
- `ap-northeast-1` - Asia Pacific (Tokyo)
- `ap-northeast-2` - Asia Pacific (Osaka)
- `ap-southeast-1` - Asia Pacific (Singapore)
- `ap-southeast-2` - Asia Pacific (Sydney)

**Configuration Example**:
```
Connection Name: Wasabi
Endpoint: https://s3.us-east-1.wasabisys.com
Access Key: [Your Access Key]
Secret Key: [Your Secret Key]
Region: us-east-1
```

---

### Linode Object Storage

**Official Website**: [https://www.linode.com/products/object-storage/](https://www.linode.com/products/object-storage/)

**Endpoint Format**:
```
https://<cluster-id>.linodeobjects.com
```

**Available Clusters**:
- `us-east-1` - Newark
- `us-southeast-1` - Atlanta
- `eu-central-1` - Frankfurt
- `ap-south-1` - Singapore

**Obtaining Keys**: Linode Cloud Manager → Object Storage → Access Keys

**Configuration Example**:
```
Connection Name: Linode Object Storage
Endpoint: https://us-east-1.linodeobjects.com
Access Key: [Your Access Key]
Secret Key: [Your Secret Key]
Region: us-east-1
```

---

### Vultr Object Storage

**Official Website**: [https://www.vultr.com/products/object-storage/](https://www.vultr.com/products/object-storage/)

**Endpoint Format**:
```
https://<region>.vultrobjects.com
```

**Available Regions**:
- `ewr1` - New Jersey
- `sjc1` - Silicon Valley
- `ams1` - Amsterdam
- `sgp1` - Singapore

**Configuration Example**:
```
Connection Name: Vultr Object Storage
Endpoint: https://ewr1.vultrobjects.com
Access Key: [Your Access Key]
Secret Key: [Your Secret Key]
Region: ewr1
```

---

### Scaleway Object Storage

**Official Website**: [https://www.scaleway.com/en/object-storage/](https://www.scaleway.com/en/object-storage/)

**Endpoint Format**:
```
https://s3.<region>.scw.cloud
```

**Available Regions**:
- `fr-par` - Paris
- `nl-ams` - Amsterdam
- `pl-waw` - Warsaw

**Configuration Example**:
```
Connection Name: Scaleway Object Storage
Endpoint: https://s3.fr-par.scw.cloud
Access Key: [Your Access Key]
Secret Key: [Your Secret Key]
Region: fr-par
```

---

### Storj DCS (Decentralized)

**Official Website**: [https://www.storj.io/](https://www.storj.io/)

**Features**:
- Decentralized storage
- S3-compatible gateway
- High security and privacy

**Endpoint**:
```
https://gateway.storjshare.io
```

**Configuration Example**:
```
Connection Name: Storj DCS
Endpoint: https://gateway.storjshare.io
Access Key: [Your Access Key]
Secret Key: [Your Secret Key]
Region: global
```

**Note**: Need to generate S3 credentials in Storj console first.

---

### IBM Cloud Object Storage

**Official Website**: [https://www.ibm.com/cloud/object-storage](https://www.ibm.com/cloud/object-storage)

**Endpoint Format**:
```
https://s3.<region>.cloud-object-storage.appdomain.cloud
```

**Example Regions**:
- `us-south` - US South (Dallas)
- `us-east` - US East
- `eu-gb` - United Kingdom
- `eu-de` - Germany
- `jp-tok` - Tokyo

**Obtaining Keys**: IBM Cloud Console → Service Credentials

**Configuration Example**:
```
Connection Name: IBM Cloud Object Storage
Endpoint: https://s3.us-south.cloud-object-storage.appdomain.cloud
Access Key: [Your Access Key]
Secret Key: [Your Secret Key]
Region: us-south
```

---

### Oracle Cloud Infrastructure Object Storage

**Official Website**: [https://www.oracle.com/cloud/storage/object-storage/](https://www.oracle.com/cloud/storage/object-storage/)

**Endpoint Format**:
```
https://<namespace>.compat.objectstorage.<region>.oraclecloud.com
```

**Configuration Example**:
```
Connection Name: Oracle Cloud Object Storage
Endpoint: https://my-namespace.compat.objectstorage.us-ashburn-1.oraclecloud.com
Access Key: [Your Access Key]
Secret Key: [Your Secret Key]
Region: us-ashburn-1
```

---

### Google Cloud Storage (S3-Compatible API)

**Official Website**: [https://cloud.google.com/storage](https://cloud.google.com/storage)

**Endpoint**:
```
https://storage.googleapis.com
```

**Note**: Need to create HMAC keys in GCS console.

**Configuration Example**:
```
Connection Name: Google Cloud Storage
Endpoint: https://storage.googleapis.com
Access Key: [HMAC Access Key]
Secret Key: [HMAC Secret]
Region: auto
```

---

### Huawei Cloud OBS

**Official Website**: [https://www.huaweicloud.com/product/obs.html](https://www.huaweicloud.com/product/obs.html)

**Endpoint Format**:
```
https://obs.<region>.myhuaweicloud.com
```

**Common Regions**:
- `cn-north-1` - Beijing 1
- `cn-north-4` - Beijing 4
- `cn-east-3` - Shanghai 1
- `cn-south-1` - Guangzhou

**Configuration Example**:
```
Connection Name: Huawei Cloud OBS
Endpoint: https://obs.cn-north-4.myhuaweicloud.com
Access Key: [AK]
Secret Key: [SK]
Region: cn-north-4
```

---

### Baidu Intelligent Cloud BOS

**Official Website**: [https://cloud.baidu.com/product/bos.html](https://cloud.baidu.com/product/bos.html)

**Endpoint Format**:
```
https://<region>.bcebos.com
```

**Common Regions**:
- `bj` - Beijing
- `gz` - Guangzhou
- `su` - Suzhou
- `bd` - Baoding

**Configuration Example**:
```
Connection Name: Baidu Intelligent Cloud BOS
Endpoint: https://bj.bcebos.com
Access Key: [Access Key ID]
Secret Key: [Secret Access Key]
Region: bj
```

---

## Private/Self-Hosted S3-Compatible Services

If you're using self-hosted or privately deployed S3-compatible services:

#### Ceph RADOS Gateway

```
Connection Name: Ceph RGW
Endpoint: https://ceph.example.com:7480
Access Key: [Access Key]
Secret Key: [Secret Key]
Region: default
```

#### OpenStack Swift (S3 API)

```
Connection Name: OpenStack Swift
Endpoint: https://swift.example.com/swift/v1
Access Key: [Access Key]
Secret Key: [Secret Key]
Region: RegionOne
```

#### SeaweedFS

```
Connection Name: SeaweedFS
Endpoint: http://localhost:8333
Access Key: [Access Key]
Secret Key: [Secret Key]
Region: us-east-1
```

## Configuration Tips

### Finding Endpoint Information

- Look for "S3 Compatible API" or "S3 Endpoint" in provider documentation
- Check API documentation or developer guides
- Contact technical support

### Testing Connection

Test using AWS CLI:

```bash
aws s3 ls \
  --endpoint-url https://your-endpoint.com \
  --region your-region
```

### Common Ports

- HTTPS: Usually port 443
- HTTP: Usually port 80
- Custom: e.g., MinIO default uses 9000

### Region Settings

If unsure about region, try:
- `us-east-1` (most common default)
- `auto`
- `default`
- Check service documentation

## S3 File Viewer Core Feature Requirements

As long as the service supports these basic operations, S3 File Viewer will work:

- ✅ ListBuckets - List all buckets
- ✅ ListObjectsV2 - List objects
- ✅ GetObject - Download objects
- ✅ PutObject - Upload objects
- ✅ DeleteObject - Delete objects
- ✅ HeadObject - Get object metadata

## Getting Help

If you successfully configured an S3-compatible service not listed in this guide, please:

1. Submit an [Issue on GitHub](https://github.com/moonrailgun/s3-file-viewer/issues) to share configuration information
2. Submit a Pull Request to add to documentation
3. Help other users
