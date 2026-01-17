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
    marked.setOptions({
        breaks: true,
        gfm: true,
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
    // Add "All" button if not already present
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
    card.className = 'bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-[#1f6feb] transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/10 flex flex-col gap-4';
    
    // Header with title, description, badge, and copy button
    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-4';
    
    const titleGroup = document.createElement('div');
    titleGroup.className = 'flex-1';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-[#f0f6fc] mb-1';
    title.textContent = snippet.title;
    
    const description = document.createElement('p');
    description.className = 'text-sm text-[#8b949e] leading-relaxed';
    description.textContent = snippet.description;
    
    titleGroup.appendChild(title);
    titleGroup.appendChild(description);
    
    const headerRight = document.createElement('div');
    headerRight.className = 'flex items-center gap-2 flex-shrink-0';
    
    const badge = document.createElement('span');
    badge.className = 'px-2.5 py-1 rounded-md text-xs font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]';
    badge.textContent = snippet.categoryName;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn px-3 py-1.5 rounded-md text-sm font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:bg-[#30363d] hover:text-[#e6edf3] hover:border-[#1f6feb] transition-all flex items-center gap-1.5';
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
    codeWrapper.className = 'relative bg-[#010409] border border-[#30363d] rounded-lg p-4 overflow-x-auto';
    
    const codeBlock = document.createElement('pre');
    codeBlock.className = 'text-sm font-mono text-[#e6edf3] whitespace-pre m-0';
    codeBlock.textContent = snippet.markdown;
    
    codeWrapper.appendChild(codeBlock);
    
    // Preview container (always visible)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'bg-[#010409] border border-[#30363d] rounded-lg p-4';
    
    const previewLabel = document.createElement('div');
    previewLabel.className = 'text-xs font-medium text-[#6e7681] mb-3 uppercase tracking-wide';
    previewLabel.textContent = 'Preview';
    
    const previewContent = document.createElement('div');
    previewContent.className = 'preview-content';
    
    // Render markdown preview
    if (typeof marked !== 'undefined') {
        previewContent.innerHTML = marked.parse(snippet.markdown);
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
    
    button.classList.add('bg-[#238636]', 'border-[#238636]', 'text-white', 'hover:bg-[#2ea043]', 'hover:border-[#2ea043]');
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="copy-text">Copied!</span>
    `;
    
    setTimeout(() => {
        button.classList.remove('bg-[#238636]', 'border-[#238636]', 'text-white', 'hover:bg-[#2ea043]', 'hover:border-[#2ea043]');
        button.innerHTML = originalHTML;
    }, 2000);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-[#161b22] border-[#238636]' : 'bg-[#161b22] border-[#da3633]';
    toast.className = `toast ${bgColor} border rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[250px]`;
    
    const icon = type === 'success' ? `
        <svg class="w-5 h-5 text-[#238636] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    ` : `
        <svg class="w-5 h-5 text-[#da3633] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    `;
    
    toast.innerHTML = `
        ${icon}
        <span class="text-[#e6edf3] text-sm">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
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
