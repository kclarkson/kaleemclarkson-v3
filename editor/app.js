// Configuration
const API_URL = 'http://localhost:3000/api';

// State
let editor;
let currentPage = null;
let currentFrontMatter = {};
let currentFrontMatterRaw = '';
let pages = [];
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
            ['code', 'codeblock'],
            ['scrollSync']
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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            savePage();
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
