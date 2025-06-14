// Configuration
const API_KEY = ''; 
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Global variables
let selectedMood = '';
let loadingEl = document.getElementById('loading');
let resultsEl = document.getElementById('results');

// Mood to search terms mapping
const moodKeywords = {
    'adventure': ['adventure', 'expedition', 'journey', 'exploration', 'quest'],
    'romance': ['romance', 'love', 'relationship', 'wedding', 'dating'],
    'mystery': ['mystery', 'detective', 'crime', 'thriller', 'suspense'],
    'fantasy': ['fantasy', 'magic', 'wizard', 'dragon', 'medieval'],
    'science': ['science', 'physics', 'biology', 'technology', 'research'],
    'history': ['history', 'biography', 'war', 'ancient', 'civilization'],
    'self-help': ['self help', 'motivation', 'success', 'productivity', 'mindfulness'],
    'horror': ['horror', 'scary', 'ghost', 'supernatural', 'dark']
};

// Event Listeners
function initializeEventListeners() {
    // Mood selection handler
    document.getElementById('moodGrid').addEventListener('click', function(e) {
        if (e.target.classList.contains('mood-btn')) {
            handleMoodSelection(e.target);
        }
    });

    // Get books based on mood
    document.getElementById('getMoodBooks').addEventListener('click', function() {
        if (!selectedMood) {
            alert('Please select a mood first!');
            return;
        }
        
        const keywords = moodKeywords[selectedMood];
        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
        fetchBooks(randomKeyword, selectedMood);
    });

    // Get random books
    document.getElementById('getRandomBooks').addEventListener('click', function() {
        const randomTopics = ['bestseller', 'award winner', 'classic', 'popular', 'recommended'];
        const randomTopic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
        fetchBooks(randomTopic, 'random');
    });
}

// Handle mood button selection
function handleMoodSelection(button) {
    // Remove active class from all buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    button.classList.add('active');
    selectedMood = button.dataset.mood;
}

// Main API function to fetch books
async function fetchBooks(query, type) {
    showLoading();
    
    try {
        const url = buildApiUrl(query);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayBooks(data.items || [], type);
    } catch (error) {
        handleApiError(error);
    }
}

// Build API URL
function buildApiUrl(query) {
    const params = new URLSearchParams({
        q: query,
        maxResults: '4',
        orderBy: 'relevance'
    });
    
    if (API_KEY) {
        params.append('key', API_KEY);
    }
    
    return `${BASE_URL}?${params.toString()}`;
}

// Display loading state
function showLoading() {
    loadingEl.style.display = 'block';
    resultsEl.innerHTML = '';
}

// Hide loading state
function hideLoading() {
    loadingEl.style.display = 'none';
}

// Display books in the UI
function displayBooks(books, type) {
    hideLoading();
    
    if (books.length === 0) {
        showError('No books found. Try a different mood or random selection!');
        return;
    }

    const booksHtml = books.map(book => createBookCard(book)).join('');
    resultsEl.innerHTML = booksHtml;
    
    // Add staggered animation to book cards
    animateBookCards();
}

// Create individual book card HTML
function createBookCard(book) {
    const info = book.volumeInfo;
    const bookData = extractBookData(info);
    
    return `
        <div class="book-card">
            ${createBookImage(bookData.imageUrl, bookData.title)}
            <h3 class="book-title">${bookData.title}</h3>
            <p class="book-author">by ${bookData.authors}</p>
            <p class="book-description">${bookData.description}</p>
            <div class="book-info">
                <span>📅 ${bookData.publishedDate}</span>
                <span>📖 ${bookData.pageCount} pages</span>
                <div class="rating">
                    <span>⭐ ${bookData.rating}</span>
                </div>
            </div>
            ${createPurchaseLinks(bookData)}
        </div>
    `;
}

// Extract and format book data
function extractBookData(info) {
    return {
        title: info.title || 'Unknown Title',
        authors: info.authors ? info.authors.join(', ') : 'Unknown Author',
        description: formatDescription(info.description),
        imageUrl: info.imageLinks?.thumbnail || '',
        pageCount: info.pageCount || 'Unknown',
        rating: info.averageRating || 'N/A',
        publishedDate: info.publishedDate ? new Date(info.publishedDate).getFullYear() : 'Unknown',
        isbn: extractISBN(info.industryIdentifiers),
        googleBooksId: info.infoLink || '',
        canonicalVolumeLink: info.canonicalVolumeLink || ''
    };
}

// Extract ISBN from industry identifiers
function extractISBN(identifiers) {
    if (!identifiers || !Array.isArray(identifiers)) return '';
    
    // Prefer ISBN_13, fallback to ISBN_10
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    
    return isbn13?.identifier || isbn10?.identifier || '';
}

// Create purchase links section
function createPurchaseLinks(bookData) {
    const { title, authors, isbn } = bookData;
    const searchQuery = encodeURIComponent(`${title} ${authors}`);
    
    // Build purchase URLs
    const purchaseUrls = {
        amazon: `https://www.amazon.com/s?k=${searchQuery}&i=stripbooks&ref=nb_sb_noss`,
        google: bookData.googleBooksId || `https://books.google.com/books?q=${searchQuery}`,
        barnes: `https://www.barnesandnoble.com/s/${searchQuery}?Ntk=P_key_Contributor_List&Ns=P_Sales_Rank&Ntx=mode+matchall`,
        goodreads: `https://www.goodreads.com/search?q=${searchQuery}&search_type=books`
    };
    
    // If we have ISBN, use more specific Amazon link
    if (isbn) {
        purchaseUrls.amazon = `https://www.amazon.com/s?k=${isbn}&i=stripbooks&ref=nb_sb_noss`;
    }
    
    return `
        <div class="purchase-links">
            <div class="purchase-title">📖 Buy This Book</div>
            <div class="purchase-buttons">
                <a href="${purchaseUrls.amazon}" target="_blank" rel="noopener noreferrer" class="purchase-btn amazon-btn">
                    🛒 Amazon
                </a>
                <a href="${purchaseUrls.google}" target="_blank" rel="noopener noreferrer" class="purchase-btn google-btn">
                    📚 Google
                </a>
                <a href="${purchaseUrls.barnes}" target="_blank" rel="noopener noreferrer" class="purchase-btn barnes-btn">
                    🏪 B&N
                </a>
                <a href="${purchaseUrls.goodreads}" target="_blank" rel="noopener noreferrer" class="purchase-btn goodreads-btn">
                    ⭐ Goodreads
                </a>
            </div>
        </div>
    `;
}

// Format book description
function formatDescription(description) {
    if (!description) return 'No description available.';
    return description.length > 200 ? description.substring(0, 200) + '...' : description;
}

// Create book image element
function createBookImage(imageUrl, title) {
    if (imageUrl) {
        return `<img src="${imageUrl}" alt="${title}" class="book-image">`;
    } else {
        return `<div class="placeholder-image">No Image<br>Available</div>`;
    }
}

// Animate book cards with staggered effect
function animateBookCards() {
    const bookCards = document.querySelectorAll('.book-card');
    bookCards.forEach((card, index) => {
        card.style.animationDelay = `${0.1 * index}s`;
        card.style.animation = 'fadeInUp 0.6s ease-out both';
    });
}

// Handle API errors
function handleApiError(error) {
    console.error('Error fetching books:', error);
    
    let errorMessage = 'Sorry, we couldn\'t fetch books at the moment. Please try again later.';
    
    // Provide more specific error messages
    if (error.message.includes('403')) {
        errorMessage = 'API quota exceeded. Please try again later or add an API key.';
    } else if (error.message.includes('404')) {
        errorMessage = 'Books service is temporarily unavailable. Please try again later.';
    } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection and try again.';
    }
    
    showError(errorMessage);
}

// Display error message
function showError(message) {
    hideLoading();
    resultsEl.innerHTML = `<div class="error">${message}</div>`;
}

// Initialize animations on page load
function initializeAnimations() {
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach((btn, index) => {
        btn.style.animationDelay = `${0.1 * index}s`;
        btn.style.animation = 'fadeInUp 0.6s ease-out both';
    });
}

// Initialize the application
function initializeApp() {
    initializeEventListeners();
    initializeAnimations();
    
    // Check if elements exist
    if (!loadingEl || !resultsEl) {
        console.error('Required DOM elements not found');
        return;
    }
    
    console.log('Readify initialized successfully!');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Optional: Add keyboard navigation
document.addEventListener('keydown', function(e) {
    // Press 'r' for random books
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.altKey) {
        document.getElementById('getRandomBooks').click();
    }
    
    // Press 'm' to focus on mood selection
    if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.altKey) {
        const firstMoodBtn = document.querySelector('.mood-btn');
        if (firstMoodBtn) firstMoodBtn.focus();
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchBooks,
        extractBookData,
        formatDescription,
        extractISBN,
        createPurchaseLinks,
    moodKeywords
};
}