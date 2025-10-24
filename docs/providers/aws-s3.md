# AWS S3 Configuration Guide

## Service Overview

Amazon Simple Storage Service (S3) is Amazon Web Services' object storage service and the creator and standard definer of the S3 protocol.

**Official Website**: [https://aws.amazon.com/s3/](https://aws.amazon.com/s3/)

**Official Documentation**: [https://docs.aws.amazon.com/s3/](https://docs.aws.amazon.com/s3/)

## Configuration Parameters

### Endpoint

AWS S3 endpoint format:
```
https://s3.<region>.amazonaws.com
```

**Special Cases**:
- The `us-east-1` region can use `https://s3.amazonaws.com`

### Region

**Common Regions List**:

| Region Code | Location |
|-------------|----------|
| `us-east-1` | US East (N. Virginia) |
| `us-west-2` | US West (Oregon) |
| `ap-northeast-1` | Asia Pacific (Tokyo) |
| `ap-southeast-1` | Asia Pacific (Singapore) |
| `eu-west-1` | Europe (Ireland) |
| `eu-central-1` | Europe (Frankfurt) |

[View complete regions list](https://docs.aws.amazon.com/general/latest/gr/s3.html)

## Obtaining Access Keys

### Via IAM User (Recommended)

1. **Log into AWS Console**
   - Visit [AWS Management Console](https://console.aws.amazon.com/)

2. **Open IAM Service**
   - Search for "IAM"
   - Click to enter Identity and Access Management console

3. **Create IAM User**
   - Click "Users" → "Create user"
   - Enter username (e.g., `s3-file-viewer-user`)

4. **Set Permissions**
   - Select "Attach policies directly"
   - Search and select `AmazonS3FullAccess` or `AmazonS3ReadOnlyAccess`

5. **Create Access Key**
   - After user creation, enter user details page
   - "Security credentials" → "Create access key"
   - Select use case: "Third-party service"

6. **Save Keys**
   - **Access Key ID**: Similar to `AKIAIOSFODNN7EXAMPLE`
   - **Secret Access Key**: Similar to `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   - ⚠️ **Important**: Secret Key is only shown once, save immediately

## Configuration Examples

### Basic Configuration

```
Connection Name: AWS S3 Production
Endpoint: https://s3.us-east-1.amazonaws.com
Access Key: AKIAIOSFODNN7EXAMPLE
Secret Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Region: us-east-1
```

### Different Region Configuration

**Tokyo Region**:
```
Connection Name: AWS S3 Tokyo
Endpoint: https://s3.ap-northeast-1.amazonaws.com
Access Key: AKIAIOSFODNN7EXAMPLE
Secret Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Region: ap-northeast-1
```

## Related Resources

- [AWS S3 Official Documentation](https://docs.aws.amazon.com/s3/)
- [IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [Complete Regions List](https://docs.aws.amazon.com/general/latest/gr/s3.html)
