const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

// Initialize variables
let ffmpegReady = false;
let mainWindow;

// Set FFmpeg and FFprobe paths with proper error handling
function setupFFmpegPaths() {
  try {
    console.log('Setting up FFmpeg paths...');
    console.log('App is packaged:', app.isPackaged);
    console.log('Process platform:', process.platform);
    console.log('Process arch:', process.arch);
    
    let ffmpegPath, ffprobePath;
    
    if (app.isPackaged) {
      console.log('App path:', app.getAppPath());
      console.log('Resources path:', process.resourcesPath);
      
      // Try multiple possible locations for packaged app
      const possibleFFmpegPaths = [
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg'),
        path.join(process.resourcesPath, 'ffmpeg-static', 'ffmpeg'),
        path.join(process.resourcesPath, 'ffmpeg-static', 'bin', process.platform, process.arch, 'ffmpeg'),
        require('ffmpeg-static')
      ];
      
      const possibleFFprobePaths = [
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffprobe-static', 'bin', process.platform, process.arch, 'ffprobe'),
        path.join(process.resourcesPath, 'ffprobe-static', 'bin', process.platform, process.arch, 'ffprobe'),
        require('ffprobe-static').path
      ];
      
      // Find working FFmpeg path
      for (let testPath of possibleFFmpegPaths) {
        console.log('Testing FFmpeg path:', testPath);
        if (testPath && fs.existsSync(testPath)) {
          const stats = fs.statSync(testPath);
          if (stats.isFile()) {
            ffmpegPath = testPath;
            console.log('Found working FFmpeg at:', ffmpegPath);
            break;
          }
        }
      }
      
      // Find working FFprobe path
      for (let testPath of possibleFFprobePaths) {
        console.log('Testing FFprobe path:', testPath);
        if (testPath && fs.existsSync(testPath)) {
          const stats = fs.statSync(testPath);
          if (stats.isFile()) {
            ffprobePath = testPath;
            console.log('Found working FFprobe at:', ffprobePath);
            break;
          }
        }
      }
    } else {
      // In development, use the npm packages
      ffmpegPath = ffmpegStatic;
      ffprobePath = ffprobeStatic.path;
      console.log('Development mode - using npm packages');
    }
    
    console.log('Final FFmpeg path:', ffmpegPath);
    console.log('Final FFprobe path:', ffprobePath);
    
    // Verify and set paths
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      try {
        fs.chmodSync(ffmpegPath, '755');
      } catch (chmodError) {
        console.log('Could not set execute permissions on FFmpeg:', chmodError.message);
      }
      
      ffmpeg.setFfmpegPath(ffmpegPath);
      console.log('✅ FFmpeg path set successfully');
    } else {
      console.error('❌ FFmpeg binary not found at any expected location');
      throw new Error('FFmpeg binary not found');
    }
    
    if (ffprobePath && fs.existsSync(ffprobePath)) {
      try {
        fs.chmodSync(ffprobePath, '755');
      } catch (chmodError) {
        console.log('Could not set execute permissions on FFprobe:', chmodError.message);
      }
      
      ffmpeg.setFfprobePath(ffprobePath);
      console.log('✅ FFprobe path set successfully');
    } else {
      console.error('❌ FFprobe binary not found at any expected location');
      throw new Error('FFprobe binary not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up FFmpeg paths:', error);
    return false;
  }
}

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// App lifecycle events
app.whenReady().then(() => {
  ffmpegReady = setupFFmpegPaths();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers - Register all handlers here once
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v']
      }
    ]
  });
  return result;
});

ipcMain.handle('select-output-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('file-exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.handle('get-video-info', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    console.log(`Getting video info for: ${filePath}`);
    
    if (!ffmpegReady) {
      console.error('FFmpeg is not properly initialized');
      reject(new Error('Video processing tools are not available. Please restart the app.'));
      return;
    }
    
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      reject(new Error('File does not exist'));
      return;
    }
    
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File exists, running ffprobe...');
    
    const timeoutMs = 30000;
    const timeoutId = setTimeout(() => {
      console.error('FFprobe timeout after', timeoutMs, 'ms');
      reject(new Error('Video analysis timed out. The file may be corrupted or in an unsupported format.'));
    }, timeoutMs);
    
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      clearTimeout(timeoutId);
      
      if (err) {
        console.error('FFprobe error:', err);
        console.error('FFprobe error details:', {
          message: err.message,
          code: err.code,
          errno: err.errno,
          cmd: err.cmd
        });
        
        let userMessage = 'Could not read video file';
        if (err.message.includes('ENOTDIR')) {
          userMessage = 'Video processing tools are not properly installed. Please restart the app.';
        } else if (err.message.includes('ENOENT')) {
          userMessage = 'Video processing tools are missing. Please restart the app.';
        } else if (err.message.includes('Invalid data')) {
          userMessage = 'This file appears to be corrupted or is not a valid video file.';
        } else if (err.message.includes('Permission denied')) {
          userMessage = 'Permission denied accessing the video file.';
        }
        
        reject(new Error(userMessage));
        return;
      }
      
      console.log('FFprobe success, processing metadata...');
      
      try {
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        
        if (!videoStream) {
          console.error('No video stream found in file');
          reject(new Error('No video content found in this file. Please try a different video file.'));
          return;
        }
        
        const result = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: eval(videoStream.r_frame_rate) || 30,
          size: metadata.format.size || stats.size
        };
        
        console.log('Video info extracted successfully:', result);
        resolve(result);
      } catch (processingError) {
        console.error('Error processing metadata:', processingError);
        reject(new Error('Error processing video information. The file may be in an unsupported format.'));
      }
    });
  });
});

ipcMain.handle('convert-to-gif', async (event, options) => {
  const { inputPath, outputPath, settings } = options;
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);
    
    const qualitySettings = {
      'ultra-high': { fps: 20, colors: 256 },
      'high': { fps: 15, colors: 256 },
      'medium': { fps: 12, colors: 128 },
      'low': { fps: 10, colors: 64 },
      'ultra-low': { fps: 8, colors: 32 }
    };
    
    const quality = qualitySettings[settings.quality] || qualitySettings.medium;
    
    let videoFilter = '[0:v]';
    let filterChain = [];
    
    if (settings.resolution !== 'original') {
      const resolutions = {
        'instagram-story': '1080:1920',
        'instagram-post': '1080:1080', 
        'twitter': '1280:720',
        'web-small': '480:270',
        'web-medium': '720:405',
        'web-large': '1280:720',
        'mobile': '640:360',
        'email': '320:180',
        'hd': '1920:1080',
        'ultra-compact': '240:135',
        '720p': '1280:720',
        '480p': '854:480',
        '360p': '640:360'
      };
      
      let scaleFilter;
      if (resolutions[settings.resolution]) {
        const [width, height] = resolutions[settings.resolution].split(':');
        scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`;
      } else if (settings.customWidth && settings.customHeight) {
        scaleFilter = `scale=${settings.customWidth}:${settings.customHeight}:force_original_aspect_ratio=decrease:flags=lanczos`;
      }
      
      if (scaleFilter) {
        filterChain.push(`${videoFilter} ${scaleFilter} [scaled]`);
        videoFilter = '[scaled]';
      }
    }
    
    filterChain.push(`${videoFilter} fps=${quality.fps} [fps]`);
    videoFilter = '[fps]';
    
    filterChain.push(`${videoFilter} split [a][b]`);
    filterChain.push(`[a] palettegen=max_colors=${quality.colors}:reserve_transparent=0 [p]`);
    filterChain.push(`[b][p] paletteuse=dither=bayer:bayer_scale=5`);
    
    command
      .complexFilter(filterChain)
      .format('gif')
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('Spawned FFmpeg with command: ' + commandLine);
      })
      .on('progress', (progress) => {
        event.sender.send('conversion-progress', {
          inputPath,
          progress: Math.round(progress.percent || 0)
        });
      })
      .on('end', () => {
        console.log(`Conversion completed: ${outputPath}`);
        resolve({ success: true, outputPath });
      })
      .on('error', (err) => {
        console.error('Conversion error:', err);
        reject(err);
      })
      .run();
  });
});