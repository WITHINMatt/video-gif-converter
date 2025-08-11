// Application state
let selectedFiles = [];
let outputDirectory = null;
let isConverting = false;

// DOM elements
const dropZone = document.getElementById('dropZone');
const dropZoneNotification = document.getElementById('dropZoneNotification');
const notificationText = document.getElementById('notificationText');
const notificationSubtext = document.getElementById('notificationSubtext');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const resolutionSelect = document.getElementById('resolutionSelect');
const customResolution = document.getElementById('customResolution');
const customWidth = document.getElementById('customWidth');
const customHeight = document.getElementById('customHeight');
const qualitySelect = document.getElementById('qualitySelect');
const outputPath = document.getElementById('outputPath');
const selectOutputBtn = document.getElementById('selectOutputBtn');
const fileList = document.getElementById('fileList');
const clearAllBtn = document.getElementById('clearAllBtn');
const convertAllBtn = document.getElementById('convertAllBtn');
const progressModal = document.getElementById('progressModal');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const currentFile = document.getElementById('currentFile');
const conversionStats = document.getElementById('conversionStats');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupDropZone();
    updateUI();
    updatePresetDescription(); // Show initial preset description
});

// Setup all event listeners
function setupEventListeners() {
    // File selection
    selectFilesBtn.addEventListener('click', handleFileSelection);
    
    // Settings
    resolutionSelect.addEventListener('change', handleResolutionChange);
    qualitySelect.addEventListener('change', handleQualityChange);
    customWidth.addEventListener('input', updateSizePredictions);
    customHeight.addEventListener('input', updateSizePredictions);
    selectOutputBtn.addEventListener('click', handleOutputDirectorySelection);
    
    // File list actions
    clearAllBtn.addEventListener('click', clearAllFiles);
    convertAllBtn.addEventListener('click', startConversion);
    
    // Listen for conversion progress
    window.electronAPI.onConversionProgress((event, data) => {
        updateConversionProgress(data);
    });
}

// Setup drag and drop functionality
function setupDropZone() {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        addFilesToList(files.map(file => file.path));
    });
    
    dropZone.addEventListener('click', handleFileSelection);
}

// Handle file selection through dialog
async function handleFileSelection() {
    try {
        const result = await window.electronAPI.selectFiles();
        if (!result.canceled && result.filePaths.length > 0) {
            addFilesToList(result.filePaths);
        }
    } catch (error) {
        console.error('Error selecting files:', error);
        showNotification('Error selecting files', 'error');
    }
}

// Add files to the conversion list
async function addFilesToList(filePaths) {
    const addedFiles = [];
    const skippedFiles = [];
    
    for (const filePath of filePaths) {
        // Check if file is already in the list
        if (selectedFiles.find(file => file.path === filePath)) {
            skippedFiles.push(getFileName(filePath));
            continue;
        }
        
        try {
            // Get video information
            const videoInfo = await window.electronAPI.getVideoInfo(filePath);
            
            const fileObj = {
                path: filePath,
                name: getFileName(filePath),
                info: videoInfo,
                status: 'ready',
                progress: 0,
                outputPath: null
            };
            
            selectedFiles.push(fileObj);
            addedFiles.push(fileObj.name);
        } catch (error) {
            console.error('Error getting video info for', filePath, error);
            // Add file anyway with limited info
            const fileObj = {
                path: filePath,
                name: getFileName(filePath),
                info: null,
                status: 'error',
                progress: 0,
                outputPath: null,
                error: 'Could not read video information'
            };
            selectedFiles.push(fileObj);
            addedFiles.push(fileObj.name);
        }
    }
    
    // Show drop zone notification
    if (addedFiles.length > 0) {
        showDropZoneNotification(addedFiles.length, skippedFiles.length);
    } else if (skippedFiles.length > 0) {
        showDropZoneNotification(0, skippedFiles.length);
    }
    
    updateUI();
}

// Show notification in the drop zone
function showDropZoneNotification(addedCount, skippedCount) {
    if (addedCount > 0) {
        notificationText.textContent = `${addedCount} file${addedCount > 1 ? 's' : ''} added to queue!`;
        notificationSubtext.textContent = skippedCount > 0 
            ? `${skippedCount} duplicate${skippedCount > 1 ? 's' : ''} skipped`
            : 'Ready for conversion';
        dropZoneNotification.querySelector('.notification-icon').textContent = '✅';
    } else {
        notificationText.textContent = 'Files already in queue';
        notificationSubtext.textContent = `${skippedCount} duplicate${skippedCount > 1 ? 's' : ''} skipped`;
        dropZoneNotification.querySelector('.notification-icon').textContent = '⚠️';
    }
    
    // Show notification
    dropZoneNotification.classList.add('show');
    
    // Hide after 2.5 seconds
    setTimeout(() => {
        dropZoneNotification.classList.remove('show');
    }, 2500);
}

// Handle resolution setting changes
function handleResolutionChange() {
    const isCustom = resolutionSelect.value === 'custom';
    customResolution.style.display = isCustom ? 'block' : 'none';
    
    // Update preset description
    updatePresetDescription();
    
    // Update size predictions for all files
    updateSizePredictions();
}

// Handle quality setting changes
function handleQualityChange() {
    // Update size predictions when quality changes
    updateSizePredictions();
}

// Update size predictions for all files
function updateSizePredictions() {
    if (selectedFiles.length > 0) {
        updateFileList();
    }
}

// Update preset description based on selected option
function updatePresetDescription() {
    const presetDescription = document.getElementById('presetDescription');
    const selectedValue = resolutionSelect.value;
    
    const descriptions = {
        'original': '📏 Keeps the exact original dimensions and quality of your video',
        'web-medium': '📝 Best balance of quality and file size for most web uses',
        'mobile': '📱 Optimized for mobile devices and social messaging apps',
        'email': '📧 Very small file size perfect for email attachments and quick sharing',
        'instagram-post': '📸 Perfect square format for Instagram feed posts',
        'instagram-story': '📖 Vertical format optimized for Instagram and Facebook stories',
        'twitter': '🐦 Optimized for Twitter posts and social media timelines',
        'web-small': '🚀 Ultra-fast loading for websites where speed is critical',
        'web-large': '💎 High quality for professional websites and portfolios',
        'hd': '🎬 Maximum quality preservation for archival or high-end uses',
        '720p': '📺 Standard HD quality, widely compatible and good balance',
        '480p': '📺 Standard definition, good for older devices and slower connections',
        '360p': '📺 Basic quality for simple animations and small displays',
        'ultra-compact': '🗜️ Absolute smallest file size for bandwidth-critical uses',
        'custom': '⚙️ Set your own exact dimensions (aspect ratio will be preserved)'
    };
    
    const description = descriptions[selectedValue] || '📝 Custom resolution setting';
    presetDescription.innerHTML = `<small>${description}</small>`;
}

// Handle output directory selection
async function handleOutputDirectorySelection() {
    try {
        const result = await window.electronAPI.selectOutputDir();
        if (!result.canceled && result.filePaths.length > 0) {
            outputDirectory = result.filePaths[0];
            outputPath.value = outputDirectory;
        }
    } catch (error) {
        console.error('Error selecting output directory:', error);
        showNotification('Error selecting output directory', 'error');
    }
}

// Clear all files from the list
function clearAllFiles() {
    selectedFiles = [];
    updateUI();
}

// Start the conversion process
async function startConversion() {
    if (isConverting || selectedFiles.length === 0) {
        return;
    }
    
    // Validate settings
    const settings = getConversionSettings();
    if (!validateSettings(settings)) {
        return;
    }
    
    isConverting = true;
    showProgressModal();
    
    let completedCount = 0;
    const totalCount = selectedFiles.filter(file => file.status === 'ready').length;
    
    updateConversionStats(completedCount, totalCount);
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        if (file.status !== 'ready') {
            continue;
        }
        
        try {
            // Update current file display
            currentFile.textContent = `Converting: ${file.name}`;
            file.status = 'converting';
            file.progress = 0;
            updateFileItem(i);
            
            // Generate output path
            const outputFileName = generateOutputFileName(file.path);
            const finalOutputPath = outputDirectory 
                ? `${outputDirectory}/${outputFileName}`
                : `${getDirectoryPath(file.path)}/${outputFileName}`;
            
            // Convert the file
            const result = await window.electronAPI.convertToGif({
                inputPath: file.path,
                outputPath: finalOutputPath,
                settings: settings
            });
            
            if (result.success) {
                file.status = 'completed';
                file.progress = 100;
                file.outputPath = result.outputPath;
                completedCount++;
                
                showNotification(`Converted: ${file.name}`, 'success');
            } else {
                throw new Error('Conversion failed');
            }
            
        } catch (error) {
            console.error('Conversion error for', file.name, error);
            file.status = 'error';
            file.error = error.message || 'Conversion failed';
            showNotification(`Failed to convert: ${file.name}`, 'error');
        }
        
        updateFileItem(i);
        updateConversionStats(completedCount, totalCount);
    }
    
    isConverting = false;
    hideProgressModal();
    
    if (completedCount > 0) {
        showNotification(`Successfully converted ${completedCount} of ${totalCount} files!`, 'success');
    }
}

// Get conversion settings from the UI
function getConversionSettings() {
    const resolution = resolutionSelect.value;
    const quality = qualitySelect.value;
    
    const settings = {
        resolution: resolution,
        quality: quality
    };
    
    if (resolution === 'custom') {
        settings.customWidth = parseInt(customWidth.value) || 640;
        settings.customHeight = parseInt(customHeight.value) || 360;
    }
    
    return settings;
}

// Validate conversion settings
function validateSettings(settings) {
    if (settings.resolution === 'custom') {
        if (!settings.customWidth || !settings.customHeight) {
            showNotification('Please enter valid custom dimensions', 'error');
            return false;
        }
        
        if (settings.customWidth < 100 || settings.customHeight < 100) {
            showNotification('Custom dimensions must be at least 100x100', 'error');
            return false;
        }
        
        if (settings.customWidth > 1920 || settings.customHeight > 1080) {
            showNotification('Custom dimensions cannot exceed 1920x1080', 'error');
            return false;
        }
    }
    
    return true;
}

// Update conversion progress
function updateConversionProgress(data) {
    const file = selectedFiles.find(f => f.path === data.inputPath);
    if (file) {
        file.progress = data.progress;
        const fileIndex = selectedFiles.findIndex(f => f.path === data.inputPath);
        updateFileItem(fileIndex);
        
        // Update overall progress
        progressFill.style.width = `${data.progress}%`;
        progressText.textContent = `${data.progress}%`;
    }
}

// Update conversion statistics
function updateConversionStats(completed, total) {
    conversionStats.textContent = `${completed} of ${total} files completed`;
}

// Show progress modal
function showProgressModal() {
    progressModal.style.display = 'flex';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    currentFile.textContent = 'Preparing conversion...';
}

// Hide progress modal
function hideProgressModal() {
    progressModal.style.display = 'none';
}

// Update the UI based on current state
function updateUI() {
    updateFileList();
    updateButtons();
}

// Update the file list display
function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '<div class="empty-state"><p>No files selected. Add some videos to get started!</p></div>';
        return;
    }
    
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        fileList.appendChild(fileItem);
    });
}

// Create a file item element
function createFileItem(file, index) {
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const statusClass = `status-${file.status}`;
    const statusText = {
        'ready': 'Ready',
        'converting': 'Converting...',
        'completed': 'Completed',
        'error': 'Error'
    }[file.status];
    
    const infoText = file.info 
        ? `${Math.round(file.info.duration)}s • ${file.info.width}×${file.info.height} • ${(file.info.width/file.info.height).toFixed(2)}:1 ratio • ${formatFileSize(file.info.size)}`
        : 'Unknown format';
    
    // Get current conversion settings for size prediction
    const currentSettings = getConversionSettings();
    const estimatedSize = estimateGifSize(file.info, currentSettings);
    const sizeWarning = estimatedSize ? getSizeWarningMessage(estimatedSize) : null;
    
    const progressBar = file.status === 'converting' 
        ? `<div class="progress-bar-small"><div class="progress-fill-small" style="width: ${file.progress}%"></div></div>`
        : '';
    
    // Size prediction display
    const sizePrediction = estimatedSize 
        ? `<div class="size-prediction ${needsSizeWarning(estimatedSize) ? 'size-warning' : ''}">
             📊 Predicted GIF size: ${formatFileSize(estimatedSize)}
           </div>`
        : '';
    
    // Warning message
    const warningMessage = sizeWarning 
        ? `<div class="file-warning">${sizeWarning}</div>`
        : '';
    
    item.innerHTML = `
        <div class="file-icon">🎬</div>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-details">${infoText}</div>
            ${sizePrediction}
            ${warningMessage}
            ${file.error ? `<div class="file-details" style="color: #e53e3e;">${file.error}</div>` : ''}
        </div>
        <div class="file-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
            ${progressBar}
            <button class="btn btn-danger" onclick="removeFile(${index})" ${isConverting ? 'disabled' : ''}>Remove</button>
        </div>
    `;
    
    return item;
}

// Update a specific file item
function updateFileItem(index) {
    updateFileList(); // For simplicity, rebuild the entire list
}

// Update button states
function updateButtons() {
    const hasFiles = selectedFiles.length > 0;
    const hasReadyFiles = selectedFiles.some(file => file.status === 'ready');
    
    clearAllBtn.disabled = !hasFiles || isConverting;
    convertAllBtn.disabled = !hasReadyFiles || isConverting;
}

// Remove a file from the list
function removeFile(index) {
    if (isConverting) return;
    
    selectedFiles.splice(index, 1);
    updateUI();
}

// Generate output filename
function generateOutputFileName(inputPath) {
    const name = getFileNameWithoutExtension(inputPath);
    return `${name}.gif`;
}

// Estimate GIF file size based on video properties and settings
function estimateGifSize(videoInfo, settings) {
    if (!videoInfo) return null;
    
    const { duration, width, height } = videoInfo;
    
    // Get target dimensions
    let targetWidth = width;
    let targetHeight = height;
    
    if (settings.resolution !== 'original') {
        const resolutions = {
            'instagram-story': [1080, 1920],
            'instagram-post': [1080, 1080], 
            'twitter': [1280, 720],
            'web-small': [480, 270],
            'web-medium': [720, 405],
            'web-large': [1280, 720],
            'mobile': [640, 360],
            'email': [320, 180],
            'hd': [1920, 1080],
            'ultra-compact': [240, 135],
            '720p': [1280, 720],
            '480p': [854, 480],
            '360p': [640, 360]
        };
        
        if (resolutions[settings.resolution]) {
            [targetWidth, targetHeight] = resolutions[settings.resolution];
            
            // Calculate actual dimensions maintaining aspect ratio
            const aspectRatio = width / height;
            if (targetWidth / targetHeight > aspectRatio) {
                targetWidth = Math.round(targetHeight * aspectRatio);
            } else {
                targetHeight = Math.round(targetWidth / aspectRatio);
            }
        } else if (settings.customWidth && settings.customHeight) {
            targetWidth = settings.customWidth;
            targetHeight = settings.customHeight;
            
            // Apply aspect ratio maintenance
            const aspectRatio = width / height;
            if (targetWidth / targetHeight > aspectRatio) {
                targetWidth = Math.round(targetHeight * aspectRatio);
            } else {
                targetHeight = Math.round(targetWidth / aspectRatio);
            }
        }
    }
    
    // Get quality settings
    const qualitySettings = {
        'ultra-high': { fps: 20, colors: 256, compression: 0.8 },
        'high': { fps: 15, colors: 256, compression: 0.9 },
        'medium': { fps: 12, colors: 128, compression: 1.0 },
        'low': { fps: 10, colors: 64, compression: 1.2 },
        'ultra-low': { fps: 8, colors: 32, compression: 1.5 }
    };
    
    const quality = qualitySettings[settings.quality] || qualitySettings.medium;
    
    // Estimate file size using empirical formula
    // Base calculation: pixels per frame × frames × color depth factor × compression factor
    const pixelsPerFrame = targetWidth * targetHeight;
    const totalFrames = Math.ceil(duration * quality.fps);
    const colorFactor = Math.log2(quality.colors) / 8; // Normalize color impact
    const compressionFactor = quality.compression;
    
    // Base bytes per pixel for GIF (empirically derived)
    const baseBytesPerPixel = 0.5;
    
    // Calculate estimated size in bytes
    const estimatedBytes = pixelsPerFrame * totalFrames * baseBytesPerPixel * colorFactor * compressionFactor;
    
    // Add GIF format overhead (headers, palette, etc.) - approximately 10%
    const finalSize = estimatedBytes * 1.1;
    
    return Math.round(finalSize);
}

// Format file size with appropriate units
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Check if file size warrants a warning
function needsSizeWarning(sizeInBytes) {
    const thirtyMB = 30 * 1024 * 1024; // 30MB in bytes
    return sizeInBytes > thirtyMB;
}

// Get size warning message
function getSizeWarningMessage(sizeInBytes) {
    if (needsSizeWarning(sizeInBytes)) {
        return "⚠️ Warning: Files over 30MB are not optimal for Google Slides";
    }
    return null;
}

// Utility functions
function getFileName(filePath) {
    return filePath.split('/').pop().split('\\').pop();
}

function getFileNameWithoutExtension(filePath) {
    const fileName = getFileName(filePath);
    return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
}

function getDirectoryPath(filePath) {
    return filePath.substring(0, filePath.lastIndexOf('/')) || filePath.substring(0, filePath.lastIndexOf('\\'));
}

// Simple notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        maxWidth: '400px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        info: '#667eea'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// Make removeFile function global for onclick handlers
window.removeFile = removeFile;