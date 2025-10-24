# Backblaze B2 Configuration Guide

## Service Overview

Backblaze B2 Cloud Storage is a very low-cost object storage service, priced at 1/4 of AWS S3. B2 provides an S3-compatible API.

**Official Website**: [https://www.backblaze.com/b2/cloud-storage.html](https://www.backblaze.com/b2/cloud-storage.html)

**Official Documentation**: [https://www.backblaze.com/b2/docs/](https://www.backblaze.com/b2/docs/)

**Pricing** (as of 2024):
- Storage: $0.005/GB/month
- Download: $0.01/GB (first 3x storage amount per day free)

## Configuration Parameters

### Endpoint

Backblaze B2 S3-compatible endpoint:
```
https://s3.<region>.backblazeb2.com
```

**Available Regions**:
- `us-west-001` - US West (California)
- `us-west-002` - US West (Arizona)
- `us-west-004` - US West (Oregon)
- `us-east-005` - US East (Virginia)
- `eu-central-003` - Europe (Amsterdam)

### Region

Use region codes above, for example:
- `us-west-002`
- `eu-central-003`

## Obtaining Access Keys

### Create Application Key

1. **Log into Backblaze**
   - Visit [https://www.backblaze.com/](https://www.backblaze.com/)

2. **Enter App Keys Page**
   - Click "App Keys" in left menu
   - Or visit [https://secure.backblaze.com/app_keys.htm](https://secure.backblaze.com/app_keys.htm)

3. **Create New Key**
   - Click "Add a New Application Key"
   - Configure:
     - **Name**: e.g., `s3-file-viewer`
     - **Allow access to Bucket(s)**: Select "All" or specific bucket
     - **Type of Access**: `Read and Write` or `Read Only`

4. **Save Keys**
   - **keyID**: Similar to `0035a1b2c3d4e5f6000000001` (this is Access Key ID)
   - **applicationKey**: Similar to `K0035xxxxxxxxxxxxxxxxxxxxxxx` (this is Secret Access Key)
   - ⚠️ **Important**: applicationKey only shown once, must save immediately

## Configuration Examples

### Basic Configuration

```
Connection Name: Backblaze B2
Endpoint: https://s3.us-west-002.backblazeb2.com
Access Key: 0035a1b2c3d4e5f6000000001
Secret Key: K0035xxxxxxxxxxxxxxxxxxxxxxx
Region: us-west-002
```

### Europe Region Configuration

```
Connection Name: Backblaze B2 EU
Endpoint: https://s3.eu-central-003.backblazeb2.com
Access Key: 0035a1b2c3d4e5f6000000001
Secret Key: K0035xxxxxxxxxxxxxxxxxxxxxxx
Region: eu-central-003
```

## Related Resources

- [Backblaze B2 Official Documentation](https://www.backblaze.com/b2/docs/)
- [S3-Compatible API Documentation](https://www.backblaze.com/b2/docs/s3_compatible_api.html)
- [B2 Pricing](https://www.backblaze.com/b2/cloud-storage-pricing.html)
