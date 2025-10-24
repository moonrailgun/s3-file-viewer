# Alibaba Cloud OSS Configuration Guide

## Service Overview

Alibaba Cloud Object Storage Service (OSS) is a massive, secure, low-cost, and highly reliable cloud storage service provided by Alibaba Cloud. OSS is partially compatible with the S3 API.

**Official Website**: [https://www.aliyun.com/product/oss](https://www.aliyun.com/product/oss)

**Official Documentation**: [https://help.aliyun.com/product/31815.html](https://help.aliyun.com/product/31815.html)

## Configuration Parameters

### Endpoint

OSS endpoint format:

**Public Network Access**:
```
https://oss-<region-id>.aliyuncs.com
```

**Internal Network Access (ECS, etc.)**:
```
https://oss-<region-id>-internal.aliyuncs.com
```

**Accelerate Endpoint (requires Transfer Acceleration)**:
```
https://oss-<region-id>-accelerate.aliyuncs.com
```

**Bucket Domain (Recommended)**:
```
https://<bucket-name>.oss-<region-id>.aliyuncs.com
```

### Region

**Common Regions List**:

| Region ID | Region Name | Location |
|-----------|-------------|----------|
| `oss-cn-hangzhou` | China East 1 | Hangzhou |
| `oss-cn-shanghai` | China East 2 | Shanghai |
| `oss-cn-nanjing` | China East 5 | Nanjing Local Region |
| `oss-cn-beijing` | China North 2 | Beijing |
| `oss-cn-zhangjiakou` | China North 3 | Zhangjiakou |
| `oss-cn-shenzhen` | China South 1 | Shenzhen |
| `oss-cn-guangzhou` | China South 2 | Guangzhou |
| `oss-cn-chengdu` | China Southwest 1 | Chengdu |
| `oss-cn-hongkong` | Hong Kong | Hong Kong |
| `oss-ap-southeast-1` | Asia Pacific Southeast 1 | Singapore |
| `oss-ap-southeast-2` | Asia Pacific Southeast 2 | Sydney |
| `oss-ap-southeast-3` | Asia Pacific Southeast 3 | Kuala Lumpur |
| `oss-ap-northeast-1` | Asia Pacific Northeast 1 | Tokyo |
| `oss-us-west-1` | US West 1 | Silicon Valley |
| `oss-us-east-1` | US East 1 | Virginia |
| `oss-eu-central-1` | Europe Central 1 | Frankfurt |

[View complete regions list](https://help.aliyun.com/document_detail/31837.html)

**⚠️ Note**: When using S3-compatible API with S3 File Viewer, region format should be **without** the `oss-` prefix, for example:
- China East 1: `cn-hangzhou`
- China North 2: `cn-beijing`
- Singapore: `ap-southeast-1`

## Obtaining Access Keys

### Via RAM User (Recommended)

1. **Log into Alibaba Cloud Console**
   - Visit [RAM Console](https://ram.console.aliyun.com/)

2. **Create RAM User**
   - Click "Identities" → "Users" → "Create User"
   - Enter login name (e.g., `oss-file-viewer`)
   - Check "Programmatic access" (OpenAPI access key)

3. **Save AccessKey**
   - **AccessKey ID**: e.g., `LTAI5tFxxxxxxxxxxxxxx`
   - **AccessKey Secret**: Only shown once, must save immediately

4. **Add Permissions**
   - In user list, find user and click "Add Permissions"
   - Select `AliyunOSSFullAccess` or `AliyunOSSReadOnlyAccess`

## Configuration Examples

### Public Network Access Configuration

```
Connection Name: Alibaba Cloud OSS Hangzhou
Endpoint: https://oss-cn-hangzhou.aliyuncs.com
Access Key: LTAI5tFxxxxxxxxxxxxxx
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Region: cn-hangzhou
```

### Internal Network Access Configuration

```
Connection Name: Alibaba Cloud OSS Internal
Endpoint: https://oss-cn-beijing-internal.aliyuncs.com
Access Key: LTAI5tFxxxxxxxxxxxxxx
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Region: cn-beijing
```

## Related Resources

- [Alibaba Cloud OSS Official Documentation](https://help.aliyun.com/product/31815.html)
- [OSS Developer Guide](https://help.aliyun.com/document_detail/31883.html)
- [RAM User Management](https://help.aliyun.com/document_detail/93720.html)
- [OSS Pricing](https://www.aliyun.com/price/product#/oss/detail)
