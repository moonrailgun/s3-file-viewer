# DigitalOcean Spaces Configuration Guide

## Service Overview

DigitalOcean Spaces is an object storage service provided by DigitalOcean, fully compatible with the S3 API. Spaces is known for simple, predictable pricing.

**Official Website**: [https://www.digitalocean.com/products/spaces](https://www.digitalocean.com/products/spaces)

**Official Documentation**: [https://docs.digitalocean.com/products/spaces/](https://docs.digitalocean.com/products/spaces/)

**Pricing** (as of 2024):
- $5/month fixed fee, including:
  - 250 GB storage
  - 1 TB egress traffic
- Overage:
  - Storage: $0.02/GB/month
  - Traffic: $0.01/GB

## Configuration Parameters

### Endpoint

DigitalOcean Spaces endpoint format:

**Standard Endpoint**:
```
https://<region>.digitaloceanspaces.com
```

**CDN Endpoint** (recommended for public access):
```
https://<space-name>.<region>.cdn.digitaloceanspaces.com
```

### Region

DigitalOcean Spaces available regions:

| Region Code | Location | Full Endpoint |
|-------------|----------|---------------|
| `nyc3` | New York 3 | `https://nyc3.digitaloceanspaces.com` |
| `sfo3` | San Francisco 3 | `https://sfo3.digitaloceanspaces.com` |
| `ams3` | Amsterdam 3 | `https://ams3.digitaloceanspaces.com` |
| `sgp1` | Singapore 1 | `https://sgp1.digitaloceanspaces.com` |
| `fra1` | Frankfurt 1 | `https://fra1.digitaloceanspaces.com` |
| `syd1` | Sydney 1 | `https://syd1.digitaloceanspaces.com` |

[View latest regions list](https://docs.digitalocean.com/products/spaces/)

## Obtaining Access Keys

### Create Spaces Access Keys

1. **Log into DigitalOcean**
   - Visit [https://cloud.digitalocean.com/](https://cloud.digitalocean.com/)
   - Log in with your account

2. **Enter API Settings**
   - Click avatar in bottom left → "API"
   - Or visit: [https://cloud.digitalocean.com/account/api/tokens](https://cloud.digitalocean.com/account/api/tokens)

3. **Generate Spaces Keys**
   - Scroll to "Spaces access keys" section
   - Click "Generate New Key"
   - Enter name (e.g., `s3-file-viewer`)
   - Click ✓ to confirm

4. **Save Keys**
   - **Key**: Similar to `DO00XXXXXXXXXXXXXXXXXXXX` (Access Key ID)
   - **Secret**: Long string (Secret Access Key)
   - ⚠️ **Important**: Secret only shown once, must save immediately

## Configuration Examples

### Using Standard Endpoint

```
Connection Name: DigitalOcean Spaces NYC
Endpoint: https://nyc3.digitaloceanspaces.com
Access Key: DO00XXXXXXXXXXXXXXXXXXXX
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Region: nyc3
```

### Using CDN Endpoint (for public access only)

⚠️ **Note**: S3 File Viewer should use standard endpoint, CDN endpoint is mainly for direct browser access.

```
Connection Name: My Space CDN
Endpoint: https://my-space.nyc3.cdn.digitaloceanspaces.com
Access Key: DO00XXXXXXXXXXXXXXXXXXXX
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Region: nyc3
```

### Singapore Region Configuration

```
Connection Name: DigitalOcean Spaces Singapore
Endpoint: https://sgp1.digitaloceanspaces.com
Access Key: DO00XXXXXXXXXXXXXXXXXXXX
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Region: sgp1
```

## Related Resources

- [DigitalOcean Spaces Official Documentation](https://docs.digitalocean.com/products/spaces/)
- [Spaces API Reference](https://docs.digitalocean.com/reference/api/spaces-api/)
- [Pricing Information](https://www.digitalocean.com/pricing/spaces)
- [AWS CLI with Spaces](https://docs.digitalocean.com/products/spaces/resources/s3-sdk-examples/)
