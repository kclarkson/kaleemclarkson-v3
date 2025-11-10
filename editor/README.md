# Cecil Markdown Page Editor

A web-based WYSIWYG editor for managing your Cecil static site's markdown pages.

## Features

✅ **Visual Markdown Editor** - Toast UI Editor with live preview
✅ **Universal Page Management** - Edit any markdown file in your `pages/` directory
✅ **Auto-Build** - Automatically triggers Cecil rebuild on save
✅ **Front Matter Support** - Manages YAML front matter (title, date, published, etc.)
✅ **Nested Pages** - Supports directory structures like `blog/post.md`
✅ **Real-time Preview** - See changes as you type

## Quick Start

### 1. Start the Editor

```bash
npm run editor
```

### 2. Open in Browser

Navigate to: **http://localhost:3000/editor**

### 3. Edit Your Pages

- **Select a page** from the sidebar to edit
- **Create new pages** using the "Create New Page" section
- **Save changes** with `Ctrl+S` or the Save button
- **Delete pages** with the Delete button

## How It Works

1. **Edit** - Write content in Toast UI Editor (WYSIWYG or Markdown mode)
2. **Save** - Content is saved to `pages/filename.md` with front matter
3. **Build** - Cecil automatically rebuilds your site
4. **Deploy** - Changes are in `docs/` ready for GitHub Pages

## Page Paths

When creating new pages, you can use:

- `about.md` - Creates `pages/about.md`
- `blog/first-post.md` - Creates `pages/blog/first-post.md`
- `projects/project-name.md` - Creates nested structure

The `.md` extension is optional - it will be added automatically.

## Front Matter

The editor automatically manages YAML front matter:

```yaml
---
title: "Your Page Title"
date: 2025-11-10
published: true
---
```

You can edit the title in the toolbar. Additional front matter fields are preserved.

## API Endpoints

The editor runs a Node.js/Express API:

- `GET /api/pages` - List all pages
- `GET /api/pages/:path` - Get page content
- `POST /api/pages/:path` - Save/create page
- `DELETE /api/pages/:path` - Delete page

## Security Note

⚠️ **For development use only!** This editor has no authentication. Do not expose it to the internet without adding proper security measures.

## Troubleshooting

**Editor won't load pages:**
- Check that `pages/` directory exists
- Ensure Node.js server is running (`npm run editor`)

**Cecil not rebuilding:**
- Check console output in terminal
- Verify `composer exec cecil build` works manually
- Ensure `composer.json` and `vendor/` are present

**Changes not showing in browser:**
- Cecil rebuilds automatically
- Check `docs/` folder for updated files
- Hard refresh browser (`Ctrl+Shift+R`)

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Toast UI Editor + Vanilla JavaScript
- **Build**: Cecil (PHP) static site generator
- **Deployment**: GitHub Pages (via `docs/` folder)

---

Happy editing! 📝
