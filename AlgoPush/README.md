# AlgoPush - Codeforces to GitHub Chrome Extension 🚀

A beautifully redesigned Chrome extension that automatically pushes your Codeforces solutions to GitHub with modern UI and enhanced functionality.

## ✨ Features

### Core Functionality
- 🔄 **Automatic GitHub Push**: Seamlessly pushes your Codeforces solutions to your GitHub repository
- 📁 **Smart File Organization**: Organizes solutions by contest ID and problem name
- ⚡ **Real-time Validation**: Validates files, GitHub configuration, and connections
- 🎯 **Problem Detection**: Automatically extracts contest and problem information

### Modern UI/UX
- 🎨 **Beautiful Design**: Modern gradient-based design with smooth animations
- 📱 **Responsive Layout**: Works perfectly on different screen sizes
- 🌙 **Dark Mode Support**: Automatic dark/light theme detection
- ♿ **Accessibility**: Full keyboard navigation and screen reader support
- 🍞 **Smart Notifications**: Beautiful toast notifications with different types

### Enhanced Features
- 🔐 **Secure Token Handling**: Password field with visibility toggle
- ✅ **Input Validation**: Real-time validation with visual feedback
- 🔄 **Auto-save**: Automatic configuration saving
- 🧪 **Connection Testing**: Test GitHub connectivity before pushing
- 📊 **Rate Limit Monitoring**: GitHub API rate limit awareness
- 🔄 **Loading States**: Beautiful loading animations and progress indicators

## 🏗️ Architecture

The extension has been completely refactored into modular components:

### File Structure
```
AlgoPush/
├── manifest.json          # Extension manifest (v3)
├── background.js          # Service worker
├── popup.html            # Modern popup interface
├── popup.js              # Enhanced popup functionality
├── styles.css            # Beautiful CSS styling
├── content.js            # Main content script
├── utils.js              # Utility functions and constants
├── toast-system.js       # Toast notification system
├── file-handler.js       # File handling and validation
├── github-api.js         # GitHub API integration
└── icons/               # Extension icons (placeholder)
```

### Modular Components

#### 🛠️ **Utils Module** (`utils.js`)
- Constants and configuration
- DOM selectors
- Problem detail extraction
- File extension handling
- Validation functions
- Error formatting

#### 🍞 **Toast System** (`toast-system.js`)
- Modern toast notifications
- Multiple notification types (success, error, warning, info)
- Smooth animations and transitions
- Auto-dismissal with customizable duration
- Beautiful gradient backgrounds

#### 📁 **File Handler** (`file-handler.js`)
- File selection and validation
- Drag & drop support
- File type detection
- Size validation (max 1MB)
- File information display
- Event-based architecture

#### 🐙 **GitHub API** (`github-api.js`)
- Complete GitHub API integration
- Authentication handling
- Repository operations (commit, tree, blob creation)
- Connection testing
- Rate limit monitoring
- Error handling and retry logic

#### 🎮 **Main Content Script** (`content.js`)
- Orchestrates all components
- Event handling
- Form submission interception
- Progress tracking
- Error recovery

#### 🖼️ **Enhanced Popup** (`popup.js`)
- Modern form handling
- Real-time validation
- Auto-save functionality
- Connection testing
- Loading states
- Beautiful error handling

## 🚀 Installation

1. Clone or download the AlgoPush folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the AlgoPush folder
5. The extension icon should appear in your toolbar

## ⚙️ Configuration

1. Click the AlgoPush icon in your Chrome toolbar
2. Fill in your GitHub credentials:
   - **GitHub Token**: Generate at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` permissions
   - **Username**: Your GitHub username
   - **Repository**: Repository name for storing solutions
   - **Branch**: Target branch (default: main)
3. Click "Test Connection" to verify setup
4. Click "Save Configuration"

## 📝 Usage

1. Navigate to any Codeforces problem page
2. Select your solution file using the file input
3. The extension will show a beautiful file preview
4. Click the submit button as usual
5. AlgoPush will automatically:
   - Validate your GitHub configuration
   - Read and process your file
   - Push it to your GitHub repository
   - Submit the form to Codeforces
   - Show progress notifications

## 🎨 UI Improvements

### Before vs After

**Before**: Basic popup with minimal styling
**After**: Modern, beautiful interface with:
- Gradient backgrounds
- Smooth animations
- Professional typography
- Visual feedback
- Loading states
- Toast notifications

### Design Features
- **Color Palette**: Modern gradient themes
- **Typography**: Inter font family for clean readability  
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Works on different screen sizes
- **Accessibility**: WCAG compliant with proper focus indicators

## 🔧 Technical Improvements

### Code Quality
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive error management
- **Async/Await**: Modern JavaScript patterns
- **Event-Driven**: Proper event handling and cleanup
- **Documentation**: Extensive JSDoc comments

### Performance
- **Lazy Loading**: Components load only when needed
- **Memory Management**: Proper cleanup and garbage collection
- **Caching**: Configuration and state caching
- **Rate Limiting**: Respect GitHub API limits

### Security
- **Token Protection**: Secure token storage and handling
- **Input Sanitization**: Prevent XSS and injection attacks
- **Permission Model**: Minimal required permissions
- **Content Security Policy**: Strict CSP implementation

## 🐛 Error Handling

The extension includes comprehensive error handling:
- **Network Errors**: Retry logic and user feedback
- **API Errors**: Detailed error messages and recovery suggestions
- **File Errors**: Validation and helpful error messages
- **Configuration Errors**: Clear validation feedback

## 📱 Browser Support

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ❓ Firefox (would need Manifest V2 adaptation)
- ❓ Safari (would need different architecture)

## 🔄 Version History

### v2.0.0 (Current)
- Complete UI/UX redesign
- Modular architecture refactor
- Enhanced error handling
- Real-time validation
- Auto-save functionality
- Connection testing
- Modern toast notifications
- Dark mode support
- Accessibility improvements

### v1.0.0 (Original)
- Basic functionality
- Simple popup interface
- GitHub integration

## 🤝 Contributing

Feel free to contribute to this project by:
1. Reporting bugs
2. Suggesting new features  
3. Improving the code
4. Enhancing the UI/UX

## 📜 License

This project is open-source. Please check the repository for license details.

## 🎉 Acknowledgments

- Original AlgoPush concept and functionality
- Codeforces platform for competitive programming
- GitHub for providing the API
- Chrome Extension API documentation
- Modern CSS techniques and design patterns

---

**Happy Coding! 🚀✨**

*Made with ❤️ for the competitive programming community*