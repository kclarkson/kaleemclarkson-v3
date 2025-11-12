const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const yaml = require('js-yaml');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from editor directory
app.use('/editor', express.static(path.join(__dirname)));

const PAGES_DIR = path.join(__dirname, '../pages');
const DATA_DIR = path.join(__dirname, '../data');
const PROJECT_ROOT = path.join(__dirname, '..');

// Utility: Get all markdown files recursively
async function getAllMarkdownFiles(dir, baseDir = dir) {
    const files = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            if (entry.isDirectory()) {
                const subFiles = await getAllMarkdownFiles(fullPath, baseDir);
                files.push(...subFiles);
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                files.push(relativePath);
            }
        }
    } catch (error) {
        console.error('Error reading directory:', error);
    }

    return files;
}

// GET /api/pages - List all markdown files
app.get('/api/pages', async (req, res) => {
    try {
        const pages = await getAllMarkdownFiles(PAGES_DIR);
        res.json({
            success: true,
            pages: pages.sort()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/pages/* - Get specific page content
app.get('/api/pages/*', async (req, res) => {
    try {
        const pagePath = req.params[0];
        const filepath = path.join(PAGES_DIR, pagePath);

        // Security check: ensure path is within PAGES_DIR
        if (!filepath.startsWith(PAGES_DIR)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const content = await fs.readFile(filepath, 'utf8');

        // Parse front matter
        let frontMatter = {};
        let frontMatterRaw = '';
        let markdown = content;

        if (content.startsWith('---')) {
            const endIndex = content.indexOf('---', 3);
            if (endIndex !== -1) {
                frontMatterRaw = content.substring(3, endIndex).trim();
                markdown = content.substring(endIndex + 3).trim();

                // Parse YAML using js-yaml
                try {
                    frontMatter = yaml.load(frontMatterRaw) || {};
                } catch (error) {
                    console.error('YAML parse error:', error);
                    frontMatter = {};
                }
            }
        }

        res.json({
            success: true,
            markdown,
            frontMatter,
            frontMatterRaw, // Send raw YAML for editing
            path: pagePath
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/pages/* - Save/create page
app.post('/api/pages/*', async (req, res) => {
    try {
        const pagePath = req.params[0];
        const { markdown, frontMatterRaw } = req.body;
        const filepath = path.join(PAGES_DIR, pagePath);

        // Security check
        if (!filepath.startsWith(PAGES_DIR)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Ensure directory exists
        const dir = path.dirname(filepath);
        await fs.mkdir(dir, { recursive: true });

        // Build full content with frontmatter
        let fullContent = '';

        if (frontMatterRaw) {
            // Use raw YAML as-is (user edited it directly)
            fullContent = '---\n' + frontMatterRaw + '\n---\n' + markdown;
        } else {
            // No frontmatter provided, just use markdown
            fullContent = markdown;
        }

        // Write file
        await fs.writeFile(filepath, fullContent, 'utf8');

        // Trigger Cecil rebuild
        const rebuildResult = await triggerCecilBuild();

        res.json({
            success: true,
            message: 'Page saved successfully',
            rebuilt: rebuildResult.success,
            path: pagePath
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/pages/* - Delete page
app.delete('/api/pages/*', async (req, res) => {
    try {
        const pagePath = req.params[0];
        const filepath = path.join(PAGES_DIR, pagePath);

        // Security check
        if (!filepath.startsWith(PAGES_DIR)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        await fs.unlink(filepath);

        // Trigger Cecil rebuild
        await triggerCecilBuild();

        res.json({
            success: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========== DATA FILES API ==========

// Utility: Get all YAML files recursively
async function getAllYamlFiles(dir, baseDir = dir) {
    const files = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            if (entry.isDirectory()) {
                const subFiles = await getAllYamlFiles(fullPath, baseDir);
                files.push(...subFiles);
            } else if (entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
                files.push(relativePath);
            }
        }
    } catch (error) {
        console.error('Error reading directory:', error);
    }

    return files;
}

// GET /api/data - List all data files
app.get('/api/data', async (req, res) => {
    try {
        const dataFiles = await getAllYamlFiles(DATA_DIR);
        res.json({
            success: true,
            files: dataFiles.sort()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/data/* - Get specific data file content
app.get('/api/data/*', async (req, res) => {
    try {
        const dataPath = req.params[0];
        const filepath = path.join(DATA_DIR, dataPath);

        // Security check: ensure path is within DATA_DIR
        if (!filepath.startsWith(DATA_DIR)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const content = await fs.readFile(filepath, 'utf8');
        const data = yaml.load(content);

        res.json({
            success: true,
            data: data,
            path: dataPath
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/data/* - Save data file
app.post('/api/data/*', async (req, res) => {
    try {
        const dataPath = req.params[0];
        const { data } = req.body;
        const filepath = path.join(DATA_DIR, dataPath);

        // Security check
        if (!filepath.startsWith(DATA_DIR)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Ensure directory exists
        const dir = path.dirname(filepath);
        await fs.mkdir(dir, { recursive: true });

        // Convert data to YAML with proper formatting
        const yamlContent = yaml.dump(data, {
            indent: 2,
            lineWidth: -1, // No line wrapping
            noRefs: true
        });

        // Write file
        await fs.writeFile(filepath, yamlContent, 'utf8');

        // Trigger Cecil rebuild
        const rebuildResult = await triggerCecilBuild();

        res.json({
            success: true,
            message: 'Data file saved successfully',
            rebuilt: rebuildResult.success,
            path: dataPath
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/data/* - Delete data file
app.delete('/api/data/*', async (req, res) => {
    try {
        const dataPath = req.params[0];
        const filepath = path.join(DATA_DIR, dataPath);

        // Security check
        if (!filepath.startsWith(DATA_DIR)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        await fs.unlink(filepath);

        // Trigger Cecil rebuild
        await triggerCecilBuild();

        res.json({
            success: true,
            message: 'Data file deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Trigger Cecil rebuild
function triggerCecilBuild() {
    return new Promise((resolve) => {
        exec('composer exec cecil build', { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
            if (error) {
                console.error('Cecil build error:', error);
                console.error('stderr:', stderr);
                resolve({ success: false, error: error.message });
            } else {
                console.log('Cecil rebuilt successfully');
                console.log('stdout:', stdout);

                // Move _site to docs
                exec('rm -rf docs && mv _site docs', { cwd: PROJECT_ROOT }, (mvError) => {
                    if (mvError) {
                        console.error('Error moving _site to docs:', mvError);
                        resolve({ success: true, moved: false });
                    } else {
                        console.log('Moved _site to docs');
                        resolve({ success: true, moved: true });
                    }
                });
            }
        });
    });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Cecil Markdown Editor API Running   ║
╚════════════════════════════════════════╝

📝 Editor Interface: http://localhost:${PORT}/editor
🔌 API Endpoint:     http://localhost:${PORT}/api/pages

Ready to edit your Cecil site!
    `);
});
