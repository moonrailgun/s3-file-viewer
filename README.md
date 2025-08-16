# S3 File Viewer

A professional, web-based S3 protocol file browser client that provides an intuitive interface for managing files across multiple S3-compatible storage services.

![S3 File Viewer](https://img.shields.io/badge/S3-File%20Viewer-blue?style=for-the-badge&logo=amazonaws)
![Web Technologies](https://img.shields.io/badge/Web-HTML%2FCSS%2FJS-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## ✨ Features

- **Multi-Platform Support**: Compatible with AWS S3, MinIO, Alibaba Cloud OSS, Tencent Cloud COS, and other S3-compatible services
- **Dual View Modes**: 
  - 📋 **List View**: Traditional table layout with detailed file information
  - 🖼️ **Thumbnail View**: Card-based layout perfect for image and document previews
- **Intuitive File Management**: Upload, download, delete, and organize files with ease
- **Folder Operations**: Create and manage folder structures
- **Secure Connection**: Encrypted credential management and secure S3 connections
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Status**: Live connection status indicators and error handling

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- S3-compatible storage service credentials
- No additional software installation required

### Installation
1. Clone or download this repository
2. Open `design/index.html` in your web browser
3. Configure your S3 connection settings
4. Start browsing your files!

## 📱 User Interface

### Welcome Page (`index.html`)
- Project overview and feature highlights
- Quick access to login and file browser
- Auto-redirect for existing connections

### Connection Page (`login.html`)
- S3 service configuration form
- Preset configurations for popular services
- Connection status monitoring
- Secure credential storage

### File Browser (`browser.html`)
- Bucket selection and navigation
- Dual view mode switching
- File operations and management
- Breadcrumb navigation

## 🔧 Configuration

### S3 Connection Parameters
```javascript
{
  "endpoint": "https://s3.amazonaws.com",    // S3 service endpoint
  "accessKey": "your-access-key",           // Access key ID
  "secretKey": "your-secret-key",           // Secret access key
  "region": "us-east-1"                     // Service region
}
```

### Supported Services
| Service | Endpoint | Region |
|---------|----------|---------|
| AWS S3 | `https://s3.amazonaws.com` | `us-east-1` |
| MinIO | `http://localhost:9000` | `us-east-1` |
| Alibaba Cloud OSS | `https://oss-cn-hangzhou.aliyuncs.com` | `cn-hangzhou` |
| Tencent Cloud COS | `https://cos.ap-beijing.myqcloud.com` | `ap-beijing` |

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage for connection persistence
- **UI Framework**: Custom CSS with responsive design
- **Icons**: Emoji-based icon system for cross-platform compatibility

### File Structure
```
s3-file-viewer/
├── design/
│   ├── index.html          # Welcome and entry page
│   ├── login.html          # S3 connection configuration
│   └── browser.html        # Main file browser interface
├── README.md               # Project documentation
└── LICENSE                 # MIT License
```

### Key Components
- **Connection Manager**: Handles S3 authentication and session management
- **File Browser**: Core file listing and management interface
- **View Controller**: Manages list/thumbnail view switching
- **Event Handler**: Processes file operations and user interactions

## 🔒 Security Features

- **Credential Encryption**: Sensitive data stored securely in localStorage
- **Connection Validation**: Input validation and error handling
- **Session Management**: Automatic connection status monitoring
- **Secure Logout**: Complete credential cleanup on disconnect

## 📱 Responsive Design

### Desktop Experience
- Full-featured interface with all controls visible
- Optimized grid layouts for file management
- Hover effects and smooth transitions

### Mobile Experience
- Touch-friendly interface elements
- Adaptive layouts for small screens
- Optimized navigation for mobile devices

## 🚧 Development

### Local Development
1. Clone the repository
2. Open files in your preferred code editor
3. Use a local web server for testing (optional)
4. Modify HTML, CSS, or JavaScript as needed

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Future Enhancements
- [ ] Drag & drop file upload
- [ ] File preview functionality
- [ ] Advanced search and filtering
- [ ] Multi-file selection and batch operations
- [ ] File sharing and collaboration features
- [ ] Dark mode theme
- [ ] Internationalization (i18n) support

## 🤝 Contributing

We welcome contributions! Please feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Development Guidelines
- Follow existing code style and structure
- Add comments for complex logic
- Test across different browsers
- Ensure responsive design compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular file management applications
- Designed for simplicity and usability
- Community-driven development approach

## 📞 Support

If you encounter any issues or have questions:

1. Check the existing documentation
2. Review browser compatibility requirements
3. Verify your S3 service configuration
4. Open an issue on GitHub

---

**S3 File Viewer** - Making S3 storage management simple and intuitive! 🚀
