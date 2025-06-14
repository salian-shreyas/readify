const API_KEY = ''; 
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

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

// Initialize mood selection
document.getElementById('moodGrid').addEventListener('click', function(e) {
    if (e.target.classList.contains('mood-btn')) {
        // Remove active class from all buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        e.target.classList.add('active');
        selectedMood = e.target.dataset.mood;
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

async function fetchBooks(query, type) {
    showLoading();
    
    try {
        const url = `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=6&orderBy=relevance${API_KEY ? '&key=' + API_KEY : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        
        const data = await response.json();
        displayBooks(data.items || [], type);
    } catch (error) {
        showError('Sorry, we couldn\'t fetch books at the moment. Please try again later.');
        console.error('Error fetching books:', error);
    }
}

function showLoading() {
    loadingEl.style.display = 'block';
    resultsEl.innerHTML = '';
}

function hideLoading() {
    loadingEl.style.display = 'none';
}

function displayBooks(books, type) {
    hideLoading();
    
    if (books.length === 0) {
        showError('No books found. Try a different mood or random selection!');
        return;
    }

    const booksHtml = books.map(book => {
        const info = book.volumeInfo;
        const title = info.title || 'Unknown Title';
        const authors = info.authors ? info.authors.join(', ') : 'Unknown Author';
        const description = info.description ? 
            (info.description.length > 200 ? info.description.substring(0, 200) + '...' : info.description) : 
            'No description available.';
        const imageUrl = info.imageLinks?.thumbnail || '';
        const pageCount = info.pageCount || 'Unknown';
        const rating = info.averageRating || 'N/A';
        const publishedDate = info.publishedDate ? new Date(info.publishedDate).getFullYear() : 'Unknown';

        return `
            <div class="book-card">
                ${imageUrl ? 
                    `<img src="${imageUrl}" alt="${title}" class="book-image">` :
                    `<div class="placeholder-image">No Image<br>Available</div>`
                }
                <h3 class="book-title">${title}</h3>
                <p class="book-author">by ${authors}</p>
                <p class="book-description">${description}</p>
                <div class="book-info">
                    <span>📅 ${publishedDate}</span>
                    <span>📖 ${pageCount} pages</span>
                    <div class="rating">
                        <span>⭐ ${rating}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    resultsEl.innerHTML = booksHtml;
}

function showError(message) {
    hideLoading();
    resultsEl.innerHTML = `<div class="error">${message}</div>`;
}

// Add some initial animation
document.addEventListener('DOMContentLoaded', function() {
    // Animate mood buttons on load
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach((btn, index) => {
        btn.style.animationDelay = `${0.1 * index}s`;
        btn.style.animation = 'fadeInUp 0.6s ease-out both';
    });
});