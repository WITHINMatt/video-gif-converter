const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  
  // Video operations
  getVideoInfo: (filePath) => ipcRenderer.invoke('get-video-info', filePath),
  convertToGif: (options) => ipcRenderer.invoke('convert-to-gif', options),
  
  // Event listeners
  onConversionProgress: (callback) => {
    ipcRenderer.on('conversion-progress', callback);
  },
  
  // Remove event listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});