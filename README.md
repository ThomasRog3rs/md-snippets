# Markdown Snippets

A beautiful, modern static website for easily copying markdown syntax snippets. Features a dark mode design, search functionality, category organization, and live previews of rendered markdown.

## Features

- 🎨 **Beautiful Dark Mode** - Modern, easy-on-the-eyes dark theme
- 🔍 **Search Functionality** - Real-time search across snippet titles, descriptions, and markdown content
- 📂 **Category Filtering** - Filter snippets by category (Tables, Code Blocks, Links, Lists, etc.)
- 👁️ **Live Preview** - See how markdown renders before copying
- 📋 **One-Click Copy** - Copy snippets to clipboard with visual feedback
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight** - Pure vanilla JavaScript, no build step required

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/ThomasRog3rs/md-snippets.git
cd md-snippets
```

2. Serve the files using a local web server. You can use Python's built-in server:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Or use Node.js's `http-server`:
```bash
npx http-server
```

3. Open your browser and navigate to `http://localhost:8000`

### GitHub Pages Deployment

1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select the branch (usually `main`) and folder (`/` root)
4. Your site will be available at `https://yourusername.github.io/md-snippets`

## Project Structure

```
md-snippets/
├── index.html          # Main HTML file
├── styles.css          # All styling (dark mode theme)
├── script.js           # JavaScript functionality
├── snippets.json       # Snippet data organized by categories
├── README.md           # This file
└── LICENSE             # MIT License
```

## Usage

### Searching Snippets

- Type in the search bar to filter snippets by title, description, or markdown content
- Use `Cmd/Ctrl + K` to quickly focus the search bar
- Press `Escape` to clear the search

### Filtering by Category

- Click on category buttons to filter snippets
- Click "All" to show all snippets
- Categories include: Tables, Code Blocks, Links & Images, Lists, Text Formatting, Headers, Blockquotes, Horizontal Rules, Escaping, Footnotes, Math Formulas, and Advanced

### Copying Snippets

- Click the "Copy" button that appears when hovering over a code block
- Or click anywhere on the code block to select and copy manually
- A toast notification confirms successful copying

### Viewing Previews

- Click "Show Preview" on any snippet card to see the rendered markdown
- Click "Hide Preview" to collapse the preview

## Adding New Snippets

Edit `snippets.json` to add new snippets. The structure is:

```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Category Name",
      "snippets": [
        {
          "title": "Snippet Title",
          "description": "Brief description",
          "markdown": "Your markdown code here",
          "priority": "high|medium|low"
        }
      ]
    }
  ]
}
```

Priority levels:
- `high` - Shown first, typically for commonly used or complex syntax
- `medium` - Standard priority
- `low` - Less common or advanced syntax

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid
- Fetch API
- Clipboard API (with fallback for older browsers)

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and custom properties
- **Vanilla JavaScript** - No frameworks or build tools
- **Marked.js** - Lightweight markdown parser (loaded via CDN)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to:
- Add new markdown snippets
- Improve the design
- Fix bugs
- Enhance functionality

## Credits

Created by Thomas Rogers
