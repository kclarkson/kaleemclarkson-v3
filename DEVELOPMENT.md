# Kaleem Clarkson Website - Development Guide

Complete guide for setting up and working with your Cecil static site locally.

---

## 📋 Prerequisites

Before you begin, ensure you have these installed on your computer:

- **PHP 8.1+** with extensions (intl, mbstring, json)
  - Check: `php --version`
- **Composer** (PHP package manager)
  - Check: `composer --version`
- **Node.js 16+** (for the markdown editor)
  - Check: `node --version`
- **Git**
  - Check: `git --version`

---

## 🚀 Initial Setup (First Time Only)

### Step 1: Clone the Repository

```bash
# Navigate to your projects folder
cd ~/Projects  # or wherever you keep your code

# Clone from GitHub
git clone https://github.com/kclarkson/kaleemclarkson-v3.git
cd kaleemclarkson-v3
```

### Step 2: Merge Feature Branch into Main (One-Time)

All the code is currently on a feature branch. Merge it into main:

**Option A: Via GitHub (Recommended)**
1. Go to: https://github.com/kclarkson/kaleemclarkson-v3/pulls
2. Click "New pull request"
3. Set Base: `main`, Compare: `claude/open-source-project-setup-011CUzAfvtWLwEQXfk2FuxL4`
4. Create and merge the pull request

**Option B: Via Command Line**
```bash
git checkout main
git merge origin/claude/open-source-project-setup-011CUzAfvtWLwEQXfk2FuxL4
git push origin main
```

### Step 3: Pull Latest Code

```bash
# Make sure you're on main branch
git checkout main

# Get the latest code
git pull origin main
```

### Step 4: Install Dependencies

```bash
# Install PHP dependencies (Cecil, themes)
composer install

# Install Bootstrap dependencies for the theme
cd themes/comingsoon/static && npm install && cd ../../..

# Install Node.js dependencies (editor)
npm install
```

### Step 5: Verify Installation

```bash
# Test Cecil
composer exec cecil -- --version
# Should show: Cecil 8.x-dev

# Check files
ls -la
# You should see: editor/, pages/, docs/, config.yml, etc.
```

### Step 6: Configure GitHub Pages

1. Go to: https://github.com/kclarkson/kaleemclarkson-v3/settings/pages
2. Set:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/docs`
3. Click **Save**

---

## 💻 Daily Development Workflow

Choose the workflow that fits your needs:

---

### **Workflow A: Visual Editor** (Easier, Recommended)

Best for: Content editing, blog posts, page updates

#### Start Your Environment

```bash
cd ~/Projects/kaleemclarkson-v3

# Terminal 1: Start the Cecil development server
composer exec cecil serve
# Site runs at: http://localhost:8000

# Terminal 2: Start the markdown editor
npm run editor
# Editor runs at: http://localhost:3000/editor
```

#### Edit Content

1. Open **http://localhost:3000/editor** in your browser
2. Click a page from the sidebar (e.g., `index.md`)
3. Edit content in the visual WYSIWYG editor
4. Update the page title in the top toolbar
5. Click **💾 Save** or press `Ctrl+S`
6. The site rebuilds automatically!
7. View changes at **http://localhost:8000**

#### Create New Pages

1. In the "Create New Page" section, enter a path:
   - `about.md` - creates pages/about.md
   - `blog/first-post.md` - creates pages/blog/first-post.md
2. Click **✨ Create Page**
3. Write your content
4. Click **💾 Save**

#### Deploy Your Changes

```bash
# Stop both servers (Ctrl+C in each terminal)

# Check what changed
git status

# Stage your changes
git add pages/ docs/

# Commit with a descriptive message
git commit -m "Add new blog post about X"

# Push to GitHub (triggers live deployment)
git push origin main
```

---

### **Workflow B: Direct File Editing** (Traditional)

Best for: Developers comfortable with markdown and terminal

#### Edit Files Directly

```bash
cd ~/Projects/kaleemclarkson-v3

# Edit files in your favorite editor (VS Code, Sublime, etc.)
code pages/index.md
# or
vim pages/index.md
```

#### Markdown File Format

```markdown
---
title: "Your Page Title"
date: 2025-11-10
published: true
---

# Your Page Heading

Your content goes here in **Markdown** format.

- List item 1
- List item 2

[Link text](https://example.com)
```

#### Build and Preview

```bash
# Build the site
composer exec cecil build

# Preview locally
composer exec cecil serve
# Open: http://localhost:8000
```

#### Deploy Your Changes

```bash
# Stage changes
git add pages/ docs/

# Commit
git commit -m "Update homepage content"

# Push to GitHub
git push origin main
```

---

## 🔄 Common Tasks

### Pull Latest Changes from GitHub

Always do this before starting work:

```bash
git pull origin main
```

### Create a New Blog Post

**Via Editor:**
1. Start editor: `npm run editor`
2. Enter path: `blog/my-new-post.md`
3. Click "Create Page"
4. Write content and save

**Via File:**
```bash
# Create the blog directory if it doesn't exist
mkdir -p pages/blog

# Create the file
cat > pages/blog/my-new-post.md << 'EOF'
---
title: "My New Blog Post"
date: 2025-11-10
published: true
---

# My New Blog Post

This is my first blog post!
EOF

# Build and preview
composer exec cecil build
rm -rf docs && mv _site docs
composer exec cecil serve
```

### Update Site Configuration

Edit `config.yml` to change:
- Site title
- Colors (primary, secondary)
- Social media links
- Custom domain settings

```bash
# Edit config
code config.yml

# Rebuild
composer exec cecil build
rm -rf docs && mv _site docs
```

### View Build Logs

If something goes wrong:

```bash
composer exec cecil build --verbose
```

---

## 🌐 Deployment Process

Your site deploys automatically to GitHub Pages when you push to main.

### Deployment Checklist

```bash
# 1. Make your changes (edit pages, etc.)

# 2. Build the site (if not using editor)
composer exec cecil build

# 3. Review changes
git status
git diff

# 4. Stage changes
git add .

# 5. Commit with clear message
git commit -m "Descriptive message about what changed"

# 6. Push to GitHub
git push origin main

# 7. Wait 1-5 minutes for GitHub Pages to deploy

# 8. Verify live site
# Open: https://www.kaleemclarkson.com
```

### Check Deployment Status

1. Go to: https://github.com/kclarkson/kaleemclarkson-v3/actions
2. Look for the latest workflow run
3. Green checkmark = deployed successfully
4. Red X = deployment failed (check logs)

---

## 📁 Project Structure

```
kaleemclarkson-v3/
├── .git/                   # Git repository data
├── .gitignore              # Files to ignore in git
├── README.md               # Project readme
├── config.yml              # Cecil site configuration
├── composer.json           # PHP dependencies
├── package.json            # Node.js dependencies
│
├── pages/                  # Your markdown content (EDIT HERE)
│   ├── index.md           # Homepage
│   └── blog/              # Blog posts (create as needed)
│
├── docs/                   # Built site (DO NOT EDIT - auto-generated)
│   ├── index.html         # Generated HTML
│   ├── css/               # Compiled CSS
│   └── ...
│
├── editor/                 # Markdown editor system
│   ├── server.js          # Backend API
│   ├── index.html         # Editor UI
│   ├── app.js             # Frontend logic
│   └── README.md          # Editor documentation
│
├── layouts/                # Custom Twig templates (optional)
│   └── _default/
│       └── page.html.twig
│
├── static/                 # Static assets
│   └── CNAME              # Custom domain file
│
├── themes/                 # Cecil themes (gitignored, from Composer)
│   └── comingsoon/
│
└── vendor/                 # PHP dependencies (gitignored)
```

---

## 🛠️ Troubleshooting

### Issue: "Can't find stylesheet to import" or Bootstrap errors

**Error:**
```
Can't find stylesheet to import.
@import "bootstrap/scss/bootstrap.scss";
```

**Solution:** Install Bootstrap in the theme directory
```bash
cd themes/comingsoon/static && npm install && cd ../../..
```

This is required because the Coming Soon theme uses Bootstrap, which must be installed separately.

### Issue: "composer: command not found"

**Solution:** Install Composer
- Mac: `brew install composer`
- Windows: Download from https://getcomposer.org/
- Linux: `curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer`

### Issue: "node: command not found"

**Solution:** Install Node.js
- Download from: https://nodejs.org/ (LTS version)
- Or use a version manager like `nvm`

### Issue: Editor won't load pages

**Check:**
```bash
# Is the server running?
ps aux | grep node

# Can you access the API?
curl http://localhost:3000/api/pages

# Restart the server
pkill node
npm run editor
```

### Issue: Site doesn't rebuild after saving in editor

**Check terminal output:**
- Look for "Cecil rebuilt successfully" message
- Check for error messages
- Try manual build: `composer exec cecil build`

### Issue: Changes not showing on live site

**Checklist:**
1. Did you commit and push? `git status`
2. Did GitHub Pages deploy? Check: https://github.com/kclarkson/kaleemclarkson-v3/actions
3. Did you clear browser cache? Try `Ctrl+Shift+R`
4. Wait 5 minutes - DNS/CDN can be slow

### Issue: Port 3000 or 8000 already in use

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill
lsof -ti:8000 | xargs kill

# Or use different ports
composer exec cecil serve -- --port=8080
PORT=3001 npm run editor
```

---

## 🎨 Customization

### Change Site Colors

Edit `config.yml`:
```yaml
assets:
  compile:
    variables:
      primary: '#YOUR_COLOR_HERE'
      secondary: '#YOUR_COLOR_HERE'
```

### Update Social Media Links

Edit `config.yml`:
```yaml
social:
  twitter:
    site: YourTwitterHandle
  github:
    username: YourGitHubUsername
  facebook:
    username: YourFacebookUsername
  linkedin:
    username: YourLinkedInUsername
```

### Modify Page Layout

Edit `layouts/_default/page.html.twig` to customize the HTML structure.

---

## 📚 Quick Reference

### Start Working (Every Day)
```bash
cd ~/Projects/kaleemclarkson-v3
git pull
composer exec cecil serve  # Terminal 1
npm run editor             # Terminal 2
```

### Build Commands

#### Development Server
```bash
composer exec cecil serve
# or
php cecil.phar serve
# or
npm run dev
```
- Outputs to: `.cecil/preview/`
- URL: http://localhost:8000
- Features: Live reload, non-minified CSS
- Auto-rebuilds when files change

#### Production Build
```bash
composer exec cecil build
# or
php cecil.phar build
# or
npm run build
```
- Outputs to: `docs/` (per config.yml)
- Minifies CSS
- Generates production URLs
- Creates fingerprinted assets (e.g., `styles.[hash].css`)

#### Clean Build (Recommended after major changes)
```bash
composer exec cecil clear && composer exec cecil build
# or
php cecil.phar clear && php cecil.phar build
```
- Clears `.cecil/` cache first
- Forces fresh production build
- Use when: updating Bootstrap, changing SCSS structure, fixing missing assets

### Save & Deploy
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### Keyboard Shortcuts (in Editor)
- `Ctrl+S` - Save current page
- `Ctrl+B` - Bold text
- `Ctrl+I` - Italic text

---

## 🔗 Important Links

- **Live Site**: https://www.kaleemclarkson.com
- **GitHub Repo**: https://github.com/kclarkson/kaleemclarkson-v3
- **GitHub Actions**: https://github.com/kclarkson/kaleemclarkson-v3/actions
- **Cecil Docs**: https://cecil.app/documentation/
- **Toast UI Editor**: https://ui.toast.com/tui-editor

---

## 💡 Tips & Best Practices

1. **Always pull before starting work**: `git pull origin main`
2. **Test locally before pushing**: View at http://localhost:8000
3. **Write clear commit messages**: Describe what changed and why
4. **Commit often**: Small, focused commits are better than large ones
5. **Use the visual editor for content**: Faster and prevents syntax errors
6. **Back up your work**: Git is your backup, but push regularly
7. **Check GitHub Actions**: Ensure deployments succeed

---

## 🆘 Getting Help

If you encounter issues:
1. Check the Troubleshooting section above
2. Review terminal output for error messages
3. Check GitHub Actions logs for deployment issues
4. Review Cecil docs: https://cecil.app/documentation/
5. Check editor README: `editor/README.md`

---

**Happy editing!** 🚀
