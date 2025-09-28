/**
 * File handling module for AlgoPush extension
 */

window.FileHandler = class FileHandler {
    constructor() {
        this.storedFile = null;
        this.fileInput = null;
        this.callbacks = {
            onFileSelected: [],
            onFileError: []
        };
    }

    /**
     * Initialize file handler with file input element
     * @param {HTMLInputElement} fileInput - The file input element
     */
    init(fileInput) {
        if (!fileInput) {
            throw new Error('File input element is required');
        }

        this.fileInput = fileInput;
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.fileInput.addEventListener('change', this.handleFileSelection.bind(this));
        this.fileInput.addEventListener('dragover', this.handleDragOver.bind(this));
        this.fileInput.addEventListener('drop', this.handleFileDrop.bind(this));
    }

    handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    handleFileDrop(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            window.showError(`File validation failed: ${validation.error}`);
            this.triggerCallback('onFileError', validation.error);
            return;
        }

        this.storedFile = file;
        const sanitizedName = window.sanitizeFilename(file.name);
        
        console.log("File selected:", sanitizedName);
        window.showSuccess(`📄 File selected: ${sanitizedName}`);
        
        this.triggerCallback('onFileSelected', {
            file,
            sanitizedName,
            size: this.formatFileSize(file.size),
            type: file.type || 'Unknown'
        });
    }

    validateFile(file) {
        // Check file size (max 1MB)
        if (file.size > 1024 * 1024) {
            return { isValid: false, error: 'File too large (max 1MB)' };
        }

        // Check if it's a text file
        if (!this.isTextFile(file)) {
            return { isValid: false, error: 'Please select a text/code file' };
        }

        return { isValid: true };
    }

    isTextFile(file) {
        const textTypes = [
            'text/',
            'application/javascript',
            'application/json',
            'application/xml'
        ];

        const textExtensions = [
            '.txt', '.cpp', '.c', '.java', '.py', '.js', '.ts', 
            '.html', '.css', '.php', '.rb', '.go', '.rs', 
            '.kt', '.swift', '.cs', '.vb', '.pl', '.sh'
        ];

        // Check MIME type
        if (file.type) {
            if (textTypes.some(type => file.type.startsWith(type))) {
                return true;
            }
        }

        // Check file extension
        const fileName = file.name.toLowerCase();
        return textExtensions.some(ext => fileName.endsWith(ext));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Read file content as text
     * @returns {Promise<string>} File content
     */
    async readFileContent() {
        if (!this.storedFile) {
            throw new Error('No file selected');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (err) => {
                reject(new Error(`Failed to read file: ${err.message || 'Unknown error'}`));
            };
            
            reader.readAsText(this.storedFile);
        });
    }

    /**
     * Get stored file information
     * @returns {Object|null} File information or null
     */
    getFileInfo() {
        if (!this.storedFile) return null;

        return {
            name: this.storedFile.name,
            sanitizedName: window.sanitizeFilename(this.storedFile.name),
            size: this.storedFile.size,
            formattedSize: this.formatFileSize(this.storedFile.size),
            type: this.storedFile.type,
            lastModified: new Date(this.storedFile.lastModified)
        };
    }

    /**
     * Add callback for file events
     * @param {string} event - Event name ('onFileSelected' or 'onFileError')
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    triggerCallback(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    /**
     * Clear stored file
     */
    clear() {
        this.storedFile = null;
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }

    /**
     * Check if file is selected
     * @returns {boolean} True if file is selected
     */
    hasFile() {
        return this.storedFile !== null;
    }
};