// State management
let allSnippets = [];
let filteredSnippets = [];
let currentCategory = 'all';
let searchQuery = '';

// DOM elements
const snippetsGrid = document.getElementById('snippetsGrid');
const categoryFilters = document.getElementById('categoryFilters');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const toastContainer = document.getElementById('toastContainer');

// Initialize marked for markdown rendering
if (typeof marked !== 'undefined') {
    // Configure marked with extensions
    const renderer = new marked.Renderer();
    
    // Custom renderer for text highlighting (==text==)
    marked.use({
        extensions: [{
            name: 'highlight',
            level: 'inline',
            start(src) { return src.match(/==/)?.index; },
            tokenizer(src) {
                const rule = /^==([^=]+)==/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'highlight',
                        raw: match[0],
                        text: match[1]
                    };
                }
            },
            renderer(token) {
                return `<mark class="bg-yellow-400/30 text-[#F5F5F0] px-1 rounded">${token.text}</mark>`;
            }
        }]
    });
    
    // Configure marked with syntax highlighting
    if (typeof markedHighlight !== 'undefined' && typeof hljs !== 'undefined') {
        marked.use(markedHighlight.markedHighlight({
            highlight: (code, lang) => {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('Highlight error:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        }));
    }
    
    marked.setOptions({
        breaks: true,
        gfm: true,
        renderer: renderer
    });
}

// Load snippets from JSON
async function loadSnippets() {
    try {
        const response = await fetch('snippets.json');
        const data = await response.json();
        
        // Flatten snippets with category info
        allSnippets = [];
        data.categories.forEach(category => {
            category.snippets.forEach(snippet => {
                allSnippets.push({
                    ...snippet,
                    categoryId: category.id,
                    categoryName: category.name
                });
            });
        });
        
        // Sort by priority (high first), then by title
        allSnippets.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
            if (priorityDiff !== 0) return priorityDiff;
            return a.title.localeCompare(b.title);
        });
        
        renderCategoryFilters(data.categories);
        filterSnippets();
    } catch (error) {
        console.error('Error loading snippets:', error);
        showToast('Error loading snippets', 'error');
    }
}

// Render category filter buttons
function renderCategoryFilters(categories) {
    // Add "All" button if not already present, or add event listener if it exists
    const allBtn = document.querySelector('[data-category="all"]');
    if (!allBtn) {
        const btn = document.createElement('button');
        btn.className = 'category-btn active';
        btn.setAttribute('data-category', 'all');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'true');
        btn.textContent = 'All';
        btn.addEventListener('click', () => setCategory('all'));
        categoryFilters.appendChild(btn);
    } else {
        // If "All" button already exists in HTML, add the event listener
        allBtn.addEventListener('click', () => setCategory('all'));
    }
    
    // Add category buttons
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.setAttribute('data-category', category.id);
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.textContent = category.name;
        btn.addEventListener('click', () => setCategory(category.id));
        categoryFilters.appendChild(btn);
    });
}

// Set active category
function setCategory(categoryId) {
    currentCategory = categoryId;
    
    // Update active state
    document.querySelectorAll('.category-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-category') === categoryId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
    
    filterSnippets();
}

// Filter snippets based on category and search
function filterSnippets() {
    filteredSnippets = allSnippets.filter(snippet => {
        // Category filter
        const categoryMatch = currentCategory === 'all' || snippet.categoryId === currentCategory;
        
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = snippet.title.toLowerCase().includes(searchLower);
        const descMatch = snippet.description.toLowerCase().includes(searchLower);
        const markdownMatch = snippet.markdown.toLowerCase().includes(searchLower);
        
        return categoryMatch && (titleMatch || descMatch || markdownMatch);
    });
    
    renderSnippets();
}

// Render snippet cards
function renderSnippets() {
    snippetsGrid.innerHTML = '';
    
    if (filteredSnippets.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    }
    
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
    
    filteredSnippets.forEach(snippet => {
        const card = createSnippetCard(snippet);
        snippetsGrid.appendChild(card);
    });
}

// Create a snippet card element
function createSnippetCard(snippet) {
    const card = document.createElement('article');
    card.className = 'bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#D4AF37] transition-all duration-500 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:scale-[1.02] flex flex-col gap-5';
    
    // Header with title, description, badge, and copy button
    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-4';
    
    const titleGroup = document.createElement('div');
    titleGroup.className = 'flex-1';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-[#F5F5F0] mb-2 tracking-tight';
    title.textContent = snippet.title;
    
    const description = document.createElement('p');
    description.className = 'text-sm text-[#B4B4B4] leading-relaxed';
    description.textContent = snippet.description;
    
    titleGroup.appendChild(title);
    titleGroup.appendChild(description);
    
    const headerRight = document.createElement('div');
    headerRight.className = 'flex items-center gap-2 flex-shrink-0';
    
    const badge = document.createElement('span');
    badge.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111111] text-[#B4B4B4] border border-[#1F1F1F]';
    badge.textContent = snippet.categoryName;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn px-4 py-2 rounded-lg text-sm font-medium bg-[#111111] text-[#B4B4B4] border border-[#2A2A2A] hover:bg-[#D4AF37] hover:text-[#111111] hover:border-[#D4AF37] transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-[#D4AF37]/20';
    copyBtn.setAttribute('aria-label', 'Copy to clipboard');
    copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="copy-text">Copy</span>
    `;
    
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(snippet.markdown, copyBtn);
    });
    
    headerRight.appendChild(badge);
    headerRight.appendChild(copyBtn);
    
    header.appendChild(titleGroup);
    header.appendChild(headerRight);
    
    // Code block
    const codeWrapper = document.createElement('div');
    codeWrapper.className = 'relative bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 overflow-x-auto';
    
    const codeBlock = document.createElement('pre');
    codeBlock.className = 'text-sm font-mono text-[#E8E6E1] whitespace-pre m-0 leading-relaxed';
    codeBlock.textContent = snippet.markdown;
    
    codeWrapper.appendChild(codeBlock);
    
    // Preview container (always visible)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'bg-[#111111] border border-[#2A2A2A] rounded-xl p-5';
    
    const previewLabel = document.createElement('div');
    previewLabel.className = 'text-xs font-medium text-[#8A8A8A] mb-3 uppercase tracking-wider';
    previewLabel.textContent = 'Preview';
    
    const previewContent = document.createElement('div');
    previewContent.className = 'preview-content';
    
    // Render markdown preview
    if (typeof marked !== 'undefined') {
        let html = marked.parse(snippet.markdown);
        
        // Render math formulas with KaTeX if available
        if (typeof katex !== 'undefined') {
            // Block math: $$...$$
            html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
                try {
                    return katex.renderToString(tex.trim(), {
                        displayMode: true,
                        throwOnError: false,
                        output: 'html'
                    });
                } catch (err) {
                    console.error('KaTeX error:', err);
                    return match;
                }
            });
            
            // Inline math: $...$
            html = html.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
                try {
                    return katex.renderToString(tex.trim(), {
                        displayMode: false,
                        throwOnError: false,
                        output: 'html'
                    });
                } catch (err) {
                    console.error('KaTeX error:', err);
                    return match;
                }
            });
        }
        
        previewContent.innerHTML = html;
    } else {
        previewContent.textContent = 'Markdown preview unavailable';
    }
    
    previewContainer.appendChild(previewLabel);
    previewContainer.appendChild(previewContent);
    
    card.appendChild(header);
    card.appendChild(codeWrapper);
    card.appendChild(previewContainer);
    
    return card;
}

// Copy to clipboard with fallback
async function copyToClipboard(text, button) {
    try {
        // Try modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showCopyFeedback(button);
            showToast('Copied to clipboard!', 'success');
            return;
        }
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopyFeedback(button);
            showToast('Copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy', 'error');
    }
}

// Show copy feedback on button
function showCopyFeedback(button) {
    const copyText = button.querySelector('.copy-text');
    const originalText = copyText ? copyText.textContent : 'Copy';
    const originalHTML = button.innerHTML;
    
    button.classList.remove('bg-[#111111]', 'text-[#B4B4B4]', 'border-[#2A2A2A]');
    button.classList.add('bg-[#4CAF50]', 'border-[#4CAF50]', 'text-white', 'shadow-lg');
    button.style.boxShadow = '0 10px 15px -3px rgba(76, 175, 80, 0.3)';
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="copy-text">Copied!</span>
    `;
    
    setTimeout(() => {
        button.classList.add('bg-[#111111]', 'text-[#B4B4B4]', 'border-[#2A2A2A]');
        button.classList.remove('bg-[#4CAF50]', 'border-[#4CAF50]', 'text-white', 'shadow-lg');
        button.style.boxShadow = '';
        button.innerHTML = originalHTML;
    }, 2000);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-[#1A1A1A] border-[#4CAF50]' : 'bg-[#1A1A1A] border-[#EF5350]';
    const iconColor = type === 'success' ? 'text-[#4CAF50]' : 'text-[#EF5350]';
    toast.className = `toast ${bgColor} border-2 rounded-xl px-5 py-4 shadow-2xl flex items-center gap-3 min-w-[280px] backdrop-blur-lg`;
    
    if (type === 'success') {
        toast.style.boxShadow = '0 25px 50px -12px rgba(76, 175, 80, 0.2)';
    } else {
        toast.style.boxShadow = '0 25px 50px -12px rgba(239, 83, 80, 0.2)';
    }
    
    const icon = type === 'success' ? `
        <svg class="w-5 h-5 ${iconColor} flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    ` : `
        <svg class="w-5 h-5 ${iconColor} flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    `;
    
    toast.innerHTML = `
        ${icon}
        <span class="text-[#F5F5F0] text-sm font-medium">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 3000);
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search input handler
const debouncedSearch = debounce((query) => {
    searchQuery = query;
    filterSnippets();
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus search on Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        searchQuery = '';
        filterSnippets();
    }
});

// Initialize app
loadSnippets();
