# Tencent Cloud COS Configuration Guide

## Service Overview

Tencent Cloud Object Storage (COS) is a massive, secure, low-cost, and highly reliable cloud storage service provided by Tencent Cloud. COS is compatible with the S3 API.

**Official Website**: [https://cloud.tencent.com/product/cos](https://cloud.tencent.com/product/cos)

**Official Documentation**: [https://cloud.tencent.com/document/product/436](https://cloud.tencent.com/document/product/436)

## Configuration Parameters

### Endpoint

COS endpoint format:
```
https://cos.<region>.myqcloud.com
```

### Region

**Common Regions List**:

| Region ID | Region Name | Location |
|-----------|-------------|----------|
| `ap-guangzhou` | South China (Guangzhou) | Guangzhou |
| `ap-shanghai` | East China (Shanghai) | Shanghai |
| `ap-nanjing` | East China (Nanjing) | Nanjing |
| `ap-beijing` | North China (Beijing) | Beijing |
| `ap-chengdu` | Southwest China (Chengdu) | Chengdu |
| `ap-chongqing` | Southwest China (Chongqing) | Chongqing |
| `ap-shenzhen-fsi` | Shenzhen Finance | Shenzhen (Finance Zone) |
| `ap-shanghai-fsi` | Shanghai Finance | Shanghai (Finance Zone) |
| `ap-beijing-fsi` | Beijing Finance | Beijing (Finance Zone) |
| `ap-hongkong` | Hong Kong | Hong Kong |
| `ap-singapore` | Asia Pacific (Singapore) | Singapore |
| `ap-mumbai` | Asia Pacific (Mumbai) | India |
| `ap-seoul` | Asia Pacific (Seoul) | South Korea |
| `ap-bangkok` | Asia Pacific (Bangkok) | Thailand |
| `ap-tokyo` | Asia Pacific (Tokyo) | Japan |
| `na-siliconvalley` | US West (Silicon Valley) | United States |
| `na-ashburn` | US East (Virginia) | United States |
| `sa-saopaulo` | South America (São Paulo) | Brazil |
| `eu-frankfurt` | Europe (Frankfurt) | Germany |
| `eu-moscow` | Europe (Moscow) | Russia |

[View complete regions list](https://cloud.tencent.com/document/product/436/6224)

## Obtaining Access Keys

### Via Sub-account (CAM User) (Recommended)

1. **Log into Tencent Cloud Console**
   - Visit [CAM Console](https://console.cloud.tencent.com/cam/user)
   - Log in with main account

2. **Create Sub-user**
   - Click "Users" → "User List" → "Create User"
   - Select "Custom Create"
   - Select "Access resources and receive messages"
   - Enter user information:
     - Username: `cos-file-viewer`
     - Access method: Check "Programmatic access"
   - Click "Next"

3. **Set Permissions**
   - Search and add one of the following policies:
     - `QcloudCOSFullAccess` - COS full access
     - `QcloudCOSReadOnlyAccess` - COS read-only access

4. **Save Keys**
   - **SecretId**: e.g., `AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **SecretKey**: Only shown once, must save immediately

## Configuration Examples

### Basic Configuration

```
Connection Name: Tencent Cloud COS Guangzhou
Endpoint: https://cos.ap-guangzhou.myqcloud.com
Access Key: AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Region: ap-guangzhou
```

### Different Region Configuration

```
Connection Name: Tencent Cloud COS Shanghai
Endpoint: https://cos.ap-shanghai.myqcloud.com
Access Key: AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Region: ap-shanghai
```

## Related Resources

- [Tencent Cloud COS Official Documentation](https://cloud.tencent.com/document/product/436)
- [COS API Documentation](https://cloud.tencent.com/document/product/436/7751)
- [CAM User Guide](https://cloud.tencent.com/document/product/598)
- [COS Pricing](https://buy.cloud.tencent.com/price/cos)
