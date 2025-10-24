# Cloudflare R2 Configuration Guide

## Service Overview

Cloudflare R2 is Cloudflare's object storage service, compatible with the S3 API. R2's biggest feature is **zero egress fees** - reading data from R2 requires no traffic fees.

**Official Website**: [https://www.cloudflare.com/products/r2/](https://www.cloudflare.com/products/r2/)

**Official Documentation**: [https://developers.cloudflare.com/r2/](https://developers.cloudflare.com/r2/)

**Pricing** (as of 2024):
- Storage: $0.015/GB/month
- Class A operations (write): $4.50/million requests
- Class B operations (read): $0.36/million requests
- ✅ **Egress traffic: Completely free**

## Configuration Parameters

### Endpoint

R2 endpoint format:
```
https://<account-id>.r2.cloudflarestorage.com
```

**Finding Account ID**:

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. View right sidebar, Account ID is displayed below account name
3. Or get from R2 page URL: `https://dash.cloudflare.com/<account-id>/r2`

Example endpoint:
```
https://abc123def456789.r2.cloudflarestorage.com
```

### Region

Recommended to use `auto`, R2 will automatically select the best location.

Optional region values:
- `auto` - Automatic selection (recommended)
- `wnam` - Western North America
- `enam` - Eastern North America
- `weur` - Western Europe
- `eeur` - Eastern Europe
- `apac` - Asia Pacific

## Obtaining Access Keys

### Create R2 API Token

1. **Enter R2 Management Page**
   - Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Click "R2" in left menu
   - If first time, need to purchase R2 subscription (can choose free plan)

2. **Manage API Tokens**
   - Click "Manage R2 API Tokens" in top right
   - Or go directly to: Settings → R2 → API Tokens

3. **Create Token**
   - Click "Create API Token" button
   - Enter token name (e.g., `s3-file-viewer-token`)

4. **Configure Permissions**
   
   **Permission Types**:
   - **Admin Read & Write**: Full access to all buckets (not recommended)
   - **Object Read & Write**: Read/write objects (recommended)
   - **Object Read only**: Read-only access

5. **Save Keys**
   - **Access Key ID**: 32 characters, e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - **Secret Access Key**: 64 characters
   - ⚠️ **Important**: Secret Key is only shown once, must save immediately

## Configuration Examples

### Basic Configuration

```
Connection Name: Cloudflare R2
Endpoint: https://abc123def456789.r2.cloudflarestorage.com
Access Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Secret Key: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
Region: auto
```

### Specified Region Configuration

```
Connection Name: R2 Asia Pacific
Endpoint: https://abc123def456789.r2.cloudflarestorage.com
Access Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Secret Key: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
Region: apac
```

## Related Resources

- [Cloudflare R2 Official Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://www.cloudflare.com/products/r2/)
- [R2 API Documentation](https://developers.cloudflare.com/r2/api/)
- [Workers and R2 Integration](https://developers.cloudflare.com/r2/api/workers/)
- [R2 Limits and Quotas](https://developers.cloudflare.com/r2/platform/limits/)
