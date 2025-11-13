// Configuration
const API_URL = 'http://localhost:3000/api';

// State
let editor;
let currentPage = null;
let currentFrontMatter = {};
let currentFrontMatterRaw = '';
let pages = [];
let dataFiles = [];
let currentDataFile = null;
let currentDataContent = null;
let dataEditors = {}; // Store multiple editor instances for data fields
let currentMode = 'pages'; // 'pages' or 'data'
let frontmatterVisible = true;

/**
 * Initialize the editor on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Toast UI Editor
    editor = new toastui.Editor({
        el: document.getElementById('editor'),
        initialValue: '# Welcome to Cecil Editor\n\nSelect a page from the sidebar to start editing, or create a new page.',
        previewStyle: 'vertical',
        height: '100%',
        initialEditType: 'wysiwyg',
        useCommandShortcut: true,
        usageStatistics: false,
        toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task', 'indent', 'outdent'],
            ['table', 'image', 'link'],
            ['code', 'codeblock']
        ],
        hooks: {
            // Auto-save on content change (debounced)
            addImageBlobHook: async (blob, callback) => {
                // Handle image uploads if needed
                callback('', '');
            }
        }
    });

    // Load page list
    await loadPages();
    await loadDataFiles();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (currentMode === 'pages') {
                savePage();
            } else {
                saveDataFile();
            }
        }
    });
});

/**
 * Load all pages from the API
 */
async function loadPages() {
    try {
        const response = await fetch(`${API_URL}/pages`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load pages');
        }

        pages = data.pages;
        renderPageList();

        document.getElementById('pages-loading').style.display = 'none';
        document.getElementById('page-list').style.display = 'block';

    } catch (error) {
        showStatus('Error loading pages: ' + error.message, 'error');
        document.getElementById('pages-loading').textContent = 'Error loading pages';
    }
}

/**
 * Render the page list in the sidebar
 */
function renderPageList() {
    const pageList = document.getElementById('page-list');
    pageList.innerHTML = '';

    if (pages.length === 0) {
        pageList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <h3>No pages yet</h3>
                <p>Create your first page above!</p>
            </div>
        `;
        return;
    }

    // Sort pages: index.md first, then alphabetically
    const sortedPages = [...pages].sort((a, b) => {
        if (a === 'index.md') return -1;
        if (b === 'index.md') return 1;
        return a.localeCompare(b);
    });

    sortedPages.forEach(page => {
        const li = document.createElement('li');
        li.className = 'page-item';
        if (currentPage === page) {
            li.classList.add('active');
        }

        const icon = page === 'index.md' ? '🏠' : page.includes('/') ? '📁' : '📄';
        li.innerHTML = `<span class="page-item-icon">${icon}</span>${page}`;

        li.onclick = () => loadPage(page);
        pageList.appendChild(li);
    });
}

/**
 * Load a specific page
 */
async function loadPage(pagePath) {
    try {
        showStatus('Loading page...', 'info');

        const response = await fetch(`${API_URL}/pages/${pagePath}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load page');
        }

        // Update editor content
        editor.setMarkdown(data.markdown);

        // Update current page state
        currentPage = pagePath;
        currentFrontMatter = data.frontMatter || {};
        currentFrontMatterRaw = data.frontMatterRaw || '';

        // Update title input
        document.getElementById('page-title').value = currentFrontMatter.title || '';

        // Update frontmatter editor
        document.getElementById('frontmatter-editor').value = currentFrontMatterRaw;

        // Update UI
        renderPageList();

        showStatus(`✅ Loaded: ${pagePath}`, 'success');

    } catch (error) {
        showStatus('Error loading page: ' + error.message, 'error');
    }
}

/**
 * Save the current page
 */
async function savePage() {
    if (!currentPage && !document.getElementById('new-page-path').value) {
        showStatus('Please select a page or create a new one', 'error');
        return;
    }

    try {
        showStatus('Saving page...', 'info');

        const markdown = editor.getMarkdown();
        const frontMatterRaw = document.getElementById('frontmatter-editor').value.trim();

        // Determine the page path
        let pagePath = currentPage;
        if (!pagePath) {
            pagePath = document.getElementById('new-page-path').value.trim();
            if (!pagePath.endsWith('.md')) {
                pagePath += '.md';
            }
        }

        // Save via API
        const response = await fetch(`${API_URL}/pages/${pagePath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                markdown,
                frontMatterRaw
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to save page');
        }

        // Update state
        if (!currentPage) {
            currentPage = pagePath;
            await loadPages();
        }

        currentFrontMatterRaw = frontMatterRaw;

        showStatus(`✅ Saved successfully! ${data.rebuilt ? 'Site rebuilt.' : ''}`, 'success');

    } catch (error) {
        showStatus('Error saving page: ' + error.message, 'error');
    }
}

/**
 * Delete the current page
 */
async function deletePage() {
    if (!currentPage) {
        showStatus('No page selected', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${currentPage}"?`)) {
        return;
    }

    try {
        showStatus('Deleting page...', 'info');

        const response = await fetch(`${API_URL}/pages/${currentPage}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to delete page');
        }

        showStatus(`✅ Page deleted: ${currentPage}`, 'success');

        // Reset editor
        currentPage = null;
        currentFrontMatter = {};
        currentFrontMatterRaw = '';
        editor.setMarkdown('# Select or create a page');
        document.getElementById('page-title').value = '';
        document.getElementById('frontmatter-editor').value = '';
        document.getElementById('new-page-path').value = '';

        // Reload page list
        await loadPages();

    } catch (error) {
        showStatus('Error deleting page: ' + error.message, 'error');
    }
}

/**
 * Create a new page
 */
function createNewPage() {
    const pagePath = document.getElementById('new-page-path').value.trim();

    if (!pagePath) {
        showStatus('Please enter a page path (e.g., about.md or blog/post.md)', 'error');
        return;
    }

    // Validate path
    if (pagePath.includes('..') || pagePath.startsWith('/')) {
        showStatus('Invalid page path', 'error');
        return;
    }

    // Extract title from path
    let fileName = pagePath;
    if (!fileName.endsWith('.md')) {
        fileName += '.md';
    }

    const titleFromPath = fileName
        .replace('.md', '')
        .split('/')
        .pop()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

    // Set up new page
    currentPage = null;
    currentFrontMatter = {};
    currentFrontMatterRaw = `title: "${titleFromPath}"\ndate: ${new Date().toISOString().split('T')[0]}\npublished: true`;
    document.getElementById('page-title').value = titleFromPath;
    document.getElementById('frontmatter-editor').value = currentFrontMatterRaw;
    editor.setMarkdown(`# ${titleFromPath}\n\nStart writing your content here...`);

    showStatus(`Creating new page: ${fileName}`, 'info');
}

/**
 * Toggle frontmatter editor visibility
 */
function toggleFrontmatter() {
    frontmatterVisible = !frontmatterVisible;
    const container = document.getElementById('frontmatter-container');
    const toggleText = document.getElementById('frontmatter-toggle-text');

    if (frontmatterVisible) {
        container.style.display = 'block';
        toggleText.textContent = 'Hide';
    } else {
        container.style.display = 'none';
        toggleText.textContent = 'Show';
    }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;

    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            statusEl.className = 'status';
        }, 5000);
    }
}

/**
 * Show status message for data editor
 */
function showDataStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-data');
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;

    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            statusEl.className = 'status';
        }, 5000);
    }
}

/**
 * Utility: Slugify text for file names
 */
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// ============ DATA FILES FUNCTIONALITY ============

/**
 * Load all data files from the API
 */
async function loadDataFiles() {
    try {
        const response = await fetch(`${API_URL}/data`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load data files');
        }

        dataFiles = data.files;
        renderDataFileList();

        // Update UI to show the list
        const loadingEl = document.getElementById('data-loading');
        const listEl = document.getElementById('data-list');
        if (loadingEl) loadingEl.style.display = 'none';
        if (listEl) listEl.style.display = 'block';

    } catch (error) {
        console.error('Error loading data files:', error);
        showStatus('Error loading data files: ' + error.message, 'error');
        const loadingEl = document.getElementById('data-loading');
        if (loadingEl) loadingEl.textContent = 'Error loading data files';
    }
}

/**
 * Render the data file list in the sidebar
 */
function renderDataFileList() {
    const dataList = document.getElementById('data-list');
    if (!dataList) return;

    dataList.innerHTML = '';

    if (dataFiles.length === 0) {
        dataList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>No data files yet</p>
            </div>
        `;
        return;
    }

    dataFiles.forEach(file => {
        const li = document.createElement('li');
        li.className = 'page-item';
        if (currentDataFile === file) {
            li.classList.add('active');
        }

        const icon = '📊';
        li.innerHTML = `<span class="page-item-icon">${icon}</span>${file}`;

        li.onclick = () => loadDataFile(file);
        dataList.appendChild(li);
    });
}

/**
 * Load a specific data file
 */
async function loadDataFile(filePath) {
    try {
        showDataStatus('Loading data file...', 'info');

        const response = await fetch(`${API_URL}/data/${filePath}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load data file');
        }

        currentDataFile = filePath;
        currentDataContent = data.data;
        currentMode = 'data';

        // Switch to data editor view
        document.getElementById('editor-container').style.display = 'none';
        document.getElementById('data-editor-container').style.display = 'flex';

        // Render data fields
        renderDataFields(currentDataContent, filePath);

        // Update UI
        renderDataFileList();

        showDataStatus(`✅ Loaded: ${filePath}`, 'success');

    } catch (error) {
        showDataStatus('Error loading data file: ' + error.message, 'error');
    }
}

/**
 * Detect field type based on name and value
 */
function detectFieldType(fieldName, value) {
    const name = fieldName.toLowerCase();

    // Array detection
    if (Array.isArray(value)) {
        return 'array';
    }

    // Object detection
    if (typeof value === 'object' && value !== null) {
        return 'object';
    }

    // Boolean detection
    if (typeof value === 'boolean') {
        return 'boolean';
    }

    // Number detection
    if (typeof value === 'number') {
        return 'number';
    }

    // Markdown field patterns
    const markdownPatterns = ['content', 'body', 'description', 'bio', 'summary', 'text', 'excerpt', 'message', 'quote', 'details', 'about'];
    if (markdownPatterns.includes(name)) {
        return 'markdown';
    }

    // Check for markdown indicators in content
    if (typeof value === 'string' && (
        value.includes('\n\n') ||
        value.includes('**') ||
        value.includes('*') ||
        value.includes('[') ||
        value.includes('#') ||
        (value.length > 100 && value.includes('\n'))
    )) {
        return 'markdown';
    }

    // URL/Link patterns
    const urlPatterns = ['link', 'url', 'href', 'image', 'video', 'src', 'path'];
    if (urlPatterns.some(pattern => name.includes(pattern))) {
        return 'url';
    }

    // Default to text
    return 'text';
}

/**
 * Render a single data field
 */
function renderDataField(fieldName, value, fieldPath) {
    const fieldType = detectFieldType(fieldName, value);
    const fieldId = `field-${fieldPath.replace(/\./g, '-')}`;

    let html = `<div class="data-field" data-path="${fieldPath}">`;
    html += `<label for="${fieldId}">${fieldName}</label>`;

    switch (fieldType) {
        case 'markdown':
            html += `<div id="${fieldId}" class="markdown-editor"></div>`;
            break;

        case 'text':
            html += `<input type="text" id="${fieldId}" class="form-control" value="${escapeHtml(value || '')}" data-type="text">`;
            break;

        case 'url':
            html += `<input type="url" id="${fieldId}" class="form-control" value="${escapeHtml(value || '')}" data-type="url">`;
            break;

        case 'number':
            html += `<input type="number" id="${fieldId}" class="form-control" value="${value}" data-type="number">`;
            break;

        case 'boolean':
            html += `<input type="checkbox" id="${fieldId}" ${value ? 'checked' : ''} data-type="boolean">`;
            break;

        case 'array':
            html += `<div class="array-container" id="${fieldId}">`;
            value.forEach((item, index) => {
                if (typeof item === 'object') {
                    html += `<div class="array-item"><h4>${fieldName} #${index + 1}</h4>`;
                    Object.keys(item).forEach(key => {
                        html += renderDataField(key, item[key], `${fieldPath}.${index}.${key}`);
                    });
                    html += `</div>`;
                } else {
                    html += `<input type="text" class="form-control array-simple-item" value="${escapeHtml(item)}" data-index="${index}">`;
                }
            });
            html += `</div>`;
            break;

        case 'object':
            html += `<div class="object-container">`;
            Object.keys(value).forEach(key => {
                html += renderDataField(key, value[key], `${fieldPath}.${key}`);
            });
            html += `</div>`;
            break;
    }

    html += `</div>`;
    return html;
}

/**
 * Render all data fields
 */
function renderDataFields(data, filePath) {
    const container = document.getElementById('data-fields');
    container.innerHTML = '';

    // Clear old editor instances
    Object.keys(dataEditors).forEach(key => {
        if (dataEditors[key] && typeof dataEditors[key].destroy === 'function') {
            dataEditors[key].destroy();
        }
    });
    dataEditors = {};

    // Add file header
    const header = document.createElement('div');
    header.className = 'data-file-header';
    header.innerHTML = `
        <h2>📊 ${filePath}</h2>
        <button onclick="saveDataFile()" class="btn btn-primary">Save</button>
    `;
    container.appendChild(header);

    // Render fields
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'fields-container';

    if (Array.isArray(data)) {
        // Root level array
        data.forEach((item, index) => {
            const itemHtml = `<div class="array-item"><h3>Item #${index + 1}</h3>`;
            fieldsContainer.innerHTML += itemHtml;
            if (typeof item === 'object') {
                Object.keys(item).forEach(key => {
                    fieldsContainer.innerHTML += renderDataField(key, item[key], `${index}.${key}`);
                });
            }
            fieldsContainer.innerHTML += `</div>`;
        });
    } else {
        // Root level object
        Object.keys(data).forEach(key => {
            fieldsContainer.innerHTML += renderDataField(key, data[key], key);
        });
    }

    container.appendChild(fieldsContainer);

    // Initialize markdown editors
    setTimeout(() => {
        document.querySelectorAll('.markdown-editor').forEach(editorEl => {
            const fieldPath = editorEl.closest('.data-field').dataset.path;
            const value = getNestedValue(data, fieldPath) || '';

            console.log('Creating editor for path:', fieldPath, 'with value:', value);

            const editorInstance = new toastui.Editor({
                el: editorEl,
                initialValue: value,
                previewStyle: 'vertical',
                height: '300px',
                initialEditType: 'wysiwyg',
                usageStatistics: false,
                toolbarItems: [
                    ['heading', 'bold', 'italic'],
                    ['ul', 'ol'],
                    ['link', 'code']
                ]
            });

            dataEditors[fieldPath] = editorInstance;
        });
        console.log('Total editors created:', Object.keys(dataEditors).length);
    }, 100);
}

/**
 * Save the current data file
 */
async function saveDataFile() {
    if (!currentDataFile) {
        showDataStatus('No data file selected', 'error');
        return;
    }

    try {
        showDataStatus('Saving data file...', 'info');

        // Collect all field values
        const updatedData = collectDataFieldValues();

        console.log('Collected data:', updatedData);

        // Save via API
        const response = await fetch(`${API_URL}/data/${currentDataFile}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: updatedData
            })
        });

        const data = await response.json();

        console.log('Save response:', data);

        if (!data.success) {
            throw new Error(data.error || 'Failed to save data file');
        }

        currentDataContent = updatedData;

        showDataStatus(`✅ Saved successfully! ${data.rebuilt ? 'Site rebuilt.' : ''}`, 'success');

    } catch (error) {
        console.error('Save error:', error);
        showDataStatus('Error saving data file: ' + error.message, 'error');
    }
}

/**
 * Collect values from all data fields
 */
function collectDataFieldValues() {
    const data = JSON.parse(JSON.stringify(currentDataContent)); // Deep clone

    console.log('Starting data collection from:', currentDataContent);
    console.log('Available editor instances:', Object.keys(dataEditors));

    // Collect markdown editor values
    Object.keys(dataEditors).forEach(fieldPath => {
        const value = dataEditors[fieldPath].getMarkdown();
        console.log(`Collecting markdown from ${fieldPath}:`, value);
        setNestedValue(data, fieldPath, value);
    });

    // Collect regular input values
    const inputs = document.querySelectorAll('.data-field input[data-type]');
    console.log('Found', inputs.length, 'input fields');

    inputs.forEach(input => {
        const fieldPath = input.closest('.data-field').dataset.path;
        let value = input.value;

        console.log(`Collecting input from ${fieldPath} (type: ${input.dataset.type}):`, value);

        switch (input.dataset.type) {
            case 'number':
                value = parseFloat(value);
                break;
            case 'boolean':
                value = input.checked;
                break;
        }

        setNestedValue(data, fieldPath, value);
    });

    console.log('Final collected data:', data);
    return data;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => current[key], obj);
    target[lastKey] = value;
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Switch between pages and data modes
 */
function switchToPages() {
    currentMode = 'pages';
    document.getElementById('editor-container').style.display = 'flex';
    document.getElementById('data-editor-container').style.display = 'none';
    document.getElementById('pages-tab').classList.add('active');
    document.getElementById('data-tab').classList.remove('active');
    document.getElementById('pages-content').classList.add('active');
    document.getElementById('data-content').classList.remove('active');
}

function switchToData() {
    currentMode = 'data';
    document.getElementById('editor-container').style.display = 'none';
    document.getElementById('data-editor-container').style.display = 'flex';
    document.getElementById('pages-tab').classList.remove('active');
    document.getElementById('data-tab').classList.add('active');
    document.getElementById('pages-content').classList.remove('active');
    document.getElementById('data-content').classList.add('active');
}
