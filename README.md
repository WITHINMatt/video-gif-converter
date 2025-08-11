# Video to GIF Converter

A powerful and user-friendly desktop application for converting videos to optimized GIFs with batch processing support. Built with Electron and FFmpeg for reliable, high-quality conversions on macOS.

![Video to GIF Converter](https://img.shields.io/badge/platform-macOS-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Electron](https://img.shields.io/badge/built%20with-Electron-47848F)

## ✨ Features

- **🎬 Multiple Format Support**: Convert MP4, MOV, AVI, MKV, WMV, FLV, WebM, and M4V files
- **📱 Smart Presets**: Optimized presets for web, mobile, email, and social media
- **🔧 Custom Settings**: Fine-tune resolution, quality, frame rate, and color depth
- **📦 Batch Processing**: Convert multiple videos simultaneously
- **🎯 Aspect Ratio Protection**: Never stretch or distort your videos
- **🗂️ Flexible Output**: Choose custom output directories or use source locations
- **⚡ Fast Processing**: Powered by FFmpeg for efficient conversions
- **🖱️ Drag & Drop**: Simple drag-and-drop interface

## 📋 System Requirements

- **macOS**: 10.15 (Catalina) or later
- **Architecture**: Intel x64 or Apple Silicon (M1/M2)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 100MB for app installation + space for converted files

## 🚀 Installation

### Option 1: Download Release (Recommended)
1. Download the latest `Video to GIF Converter-1.0.0.dmg` from the [Releases page](https://github.com/WITHINMatt/video-gif-converter/releases)
2. Open the DMG file
3. Drag the app to your Applications folder
4. **First Launch**: Right-click the app and choose "Open" to bypass the security warning (only needed once)
5. **Be Patient**: The initial launch might take about 15 seconds, but after that, you're all set!

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/WITHINMatt/video-gif-converter.git
cd video-gif-converter

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
```

## 🎯 Preset Guide

### 🌟 Recommended Presets
- **Web Medium (720x405)** - Perfect for blogs and websites
- **Mobile Optimized (640x360)** - Ideal for mobile viewing
- **Email Friendly (320x180)** - Small size for email attachments

### 📱 Social Media Optimized
- **Instagram Post (1080x1080)** - Square format for feed posts
- **Instagram Story (1080x1920)** - Vertical format for stories
- **Twitter (1280x720)** - Optimized for Twitter timeline

### 🌐 Web & General Use
- **Web Small (480x270)** - Fast loading for bandwidth-limited users
- **Web Large (1280x720)** - High quality for modern web
- **HD Quality (1920x1080)** - Maximum quality preservation

## 📊 Quality Settings

| Setting | Frame Rate | Colors | Use Case |
|---------|------------|--------|----------|
| Ultra High | 20fps | 256 | Maximum quality, presentations |
| High Quality | 15fps | 256 | Excellent quality, detailed animations |
| **Balanced** | 12fps | 128 | **Recommended** - Great quality, reasonable size |
| Compact | 10fps | 64 | Good quality, email-friendly |
| Ultra Compact | 8fps | 32 | Smallest possible size |

## 💡 Tips for Best Results

- **File Size**: Choose "Balanced" quality for most use cases
- **Web Use**: Use "Web Medium" preset for optimal loading speed
- **Social Media**: Use platform-specific presets for best compatibility
- **Email**: Use "Email Friendly" preset to avoid size limits
- **Batch Processing**: Process similar videos together for consistent results

## 🛠️ Technical Details

- **Engine**: FFmpeg with optimized encoding parameters
- **Formats**: Supports all major video formats via FFmpeg
- **Output**: High-quality GIF with optimized palette generation
- **Processing**: Multi-threaded conversion for improved performance
- **Memory**: Efficient memory usage with stream processing

## 📝 Usage

1. **Add Videos**: Drag and drop video files or click "Choose Files"
2. **Select Preset**: Choose from optimized presets or use custom settings
3. **Set Quality**: Adjust quality/compression based on your needs
4. **Choose Output**: Select where to save converted GIFs
5. **Convert**: Click "Convert All" to start batch processing

## 🐛 Troubleshooting

### App Won't Open
- **First time**: Right-click the app and select "Open" to bypass Gatekeeper (only needed once)
- **Slow start**: Initial launch takes ~15 seconds - this is normal!
- Check System Preferences > Security & Privacy if blocked

### Conversion Fails
- Ensure input video files are not corrupted
- Check that you have write permissions to the output directory
- Try converting one file at a time to isolate issues

### Performance Issues
- Close unnecessary applications during conversion
- Use lower quality settings for faster processing
- Process smaller batches if system becomes unresponsive

## 🏗️ Built With

- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [FFmpeg](https://ffmpeg.org/) - Multimedia processing library
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) - Node.js FFmpeg wrapper

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/WITHINMatt/video-gif-converter/issues) page for known problems
2. Create a new issue with detailed information about your problem
3. Include your macOS version, app version, and steps to reproduce

## 🔄 Version History

- **v1.0.0** - Initial release with batch processing and preset support

---

Made with ❤️ for the macOS community