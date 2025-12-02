class CatSwiperApp {
    constructor() {
        this.CAT_COUNT = 10;
        this.currentIndex = 0;
        this.likedCats = [];
        this.catsData = [];
        this.startX = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.isLoading = true;

        this.initElements();
        this.initEventListeners();
        this.loadCats();
    }

    initElements() {
        // Core UI elements
        this.swipeArea = document.getElementById('swipeArea');
        this.loading = document.getElementById('loading');
        this.likeOverlay = document.getElementById('likeOverlay');
        this.dislikeOverlay = document.getElementById('dislikeOverlay');
        this.summary = document.getElementById('summary');

        //buttons
        this.btnLike = document.getElementById('btn-like');
        this.btnDislike = document.getElementById('btn-dislike');
        this.undoBtn = document.getElementById('undo-btn');

        // Counters
        this.currentCount = document.getElementById('current-count');
        this.totalCount = document.getElementById('total-count');
        this.likesCount = document.getElementById('likes-count');
        this.summaryLikes = document.getElementById('summary-likes');
        this.summaryTotal = document.getElementById('summary-total');

        // Progress
        this.progressFill = document.getElementById('progress-fill');

        // Summary section
        this.likedCatsContainer = document.getElementById('liked-cats-container');
        this.restartBtn = document.getElementById('restart-btn');

        // Set initial values
        this.totalCount.textContent = this.CAT_COUNT;
        this.summaryTotal.textContent = this.CAT_COUNT;
    }

    initEventListeners() {
        // Restart button
        this.restartBtn.addEventListener('click', () => this.restartApp());

        // Keyboard support for accessibility
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // like and dislike button (if user cannot swipe)
        this.btnLike.addEventListener('click', () => this.handleLike());
        this.btnDislike.addEventListener('click', () => this.handleDislike());

        // undo button
        this.undoBtn.addEventListener('click', () => this.handleUndo());
    }

    async loadCats() {
        try {
            this.isLoading = true;
            this.loading.textContent = 'Loading cute cats...';

            // Fetch multiple cat images from Cataas API
            const promises = [];
            for (let i = 0; i < this.CAT_COUNT; i++) {
                const promise = this.fetchCatImage(i);
                promises.push(promise);
            }

            this.catsData = await Promise.all(promises);
            this.isLoading = false;
            this.loadCurrentCat();
        } catch (error) {
            console.error('Error loading cats:', error);
            this.loading.textContent = 'Failed to load cats. Please refresh.';
            this.loading.style.color = '#f44336';

            // Fallback to placeholder images
            this.catsData = Array(this.CAT_COUNT).fill(
                'https://placekitten.com/400/400'
            );
            this.isLoading = false;
            this.loadCurrentCat();
        }
    }

    async fetchCatImage(index) {
        try {
            // cache busting
            const timestamp = Date.now() + index;
            const url = `https://cataas.com/cat?width=400&height=400&timestamp=${timestamp}`;

            //test if image loads or not
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });

            return url;
        } catch {
            // Fallback to placekitten if Cataas fails
            return `https://placekitten.com/400/400?image=${index}`;
        }
    }

    loadCurrentCat() {
        if (this.isLoading) return;

        this.loading.style.display = 'none';
        this.swipeArea.innerHTML = '';

        const catCard = document.createElement('div');
        catCard.className = 'cat-card';
        catCard.setAttribute('data-index', this.currentIndex);
        catCard.style.transform = 'translateX(0) rotate(0deg)';
        catCard.style.zIndex = '1000';

        const img = document.createElement('img');
        img.className = 'cat-image';
        img.src = this.catsData[this.currentIndex];
        img.alt = `Cat ${this.currentIndex + 1}`;
        img.loading = 'eager';

        img.onerror = () => {
            img.src = `https://placekitten.com/400/400?image=${this.currentIndex}`;
        };

        catCard.appendChild(img);
        this.swipeArea.appendChild(catCard);

        this.updateProgress();

        this.setupSwipeEvents(catCard);
    }

    setupSwipeEvents(card) {
        card.removeEventListener('touchstart', this.handleTouchStart);
        card.removeEventListener('mousedown', this.handleMouseStart);

        card.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        card.addEventListener('mousedown', this.handleMouseStart.bind(this));
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.currentX = this.startX;
        this.isDragging = true;

        const card = document.querySelector('.cat-card');
        if (card) {
            card.style.transition = 'none';
        }

        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleMouseStart(e) {
        this.startX = e.clientX;
        this.currentX = this.startX;
        this.isDragging = true;

        const card = document.querySelector('.cat-card');
        if (card) {
            card.style.transition = 'none';
        }

        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseEnd.bind(this));
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.currentX = e.touches[0].clientX;
        this.updateCardPosition();
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        this.currentX = e.clientX;
        this.updateCardPosition();
    }

    handleTouchEnd() {
        if (!this.isDragging) return;
        this.handleSwipeEnd();
        this.isDragging = false;

        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }

    handleMouseEnd() {
        if (!this.isDragging) return;
        this.handleSwipeEnd();
        this.isDragging = false;

        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseEnd);
    }

    updateCardPosition() {
        const card = document.querySelector('.cat-card');
        if (!card) return;

        const deltaX = this.currentX - this.startX;
        const rotation = deltaX * 0.05;
        card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

        // Show overlay based on direction
        if (deltaX > 50) {
            this.likeOverlay.style.opacity = '0.9';
            this.dislikeOverlay.style.opacity = '0';
        } else if (deltaX < -50) {
            this.dislikeOverlay.style.opacity = '0.9';
            this.likeOverlay.style.opacity = '0';
        } else {
            this.likeOverlay.style.opacity = '0';
            this.dislikeOverlay.style.opacity = '0';
        }
    }

    handleSwipeEnd() {
        const card = document.querySelector('.cat-card');
        if (!card) return;

        const deltaX = this.currentX - this.startX;
        const threshold = 80; 

        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                this.handleLike();
            } else {
                this.handleDislike();
            }
        } else {
            card.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            card.style.transform = 'translateX(0) rotate(0deg)';
            setTimeout(() => {
                if (card) card.style.transition = '';
            }, 300);
        }
        
        this.likeOverlay.style.opacity = '0';
        this.dislikeOverlay.style.opacity = '0';
    }

    handleLike() {
        const currentCat = this.catsData[this.currentIndex];
        if (!this.likedCats.includes(currentCat)) {
            this.likedCats.push(currentCat);
            this.likesCount.textContent = this.likedCats.length;
        }

        this.animateCardSwipe('right');
    }

    handleDislike() {
        this.animateCardSwipe('left');
    }

    animateCardSwipe(direction) {
        const card = document.querySelector('.cat-card');
        if (!card) return;

        const screenWidth = window.innerWidth;
        const translateX = direction === 'right' ? screenWidth : -screenWidth;

        card.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        card.style.transform = `translateX(${translateX}px) rotate(${direction === 'right' ? '30' : '-30'}deg)`;

        setTimeout(() => {
            this.nextCat();
        }, 300);
    }

    nextCat() {
        this.currentIndex++;
        this.updateUndoButtonState();

        if (this.currentIndex < this.CAT_COUNT) {
            this.loadCurrentCat();
        } else {
            this.showSummary();
        }
    }

    updateProgress() {
        this.currentCount.textContent = this.currentIndex + 1;
        const progress = ((this.currentIndex + 1) / this.CAT_COUNT) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    showSummary() {
        // Hide main interface
        document.querySelector('.swipe-container').style.display = 'none';
        document.querySelector('.header').style.display = 'none';
        document.querySelector('.progress').style.display = 'none';
        document.querySelector('.instructions-container').style.display = 'none';

        // Show summary
        this.summary.style.display = 'flex';
        this.summaryLikes.textContent = this.likedCats.length;

        // Display liked cats
        this.likedCatsContainer.innerHTML = '';

        if (this.likedCats.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'No cats liked yet. Try again!';
            message.style.color = '#666';
            message.style.fontStyle = 'italic';
            this.likedCatsContainer.appendChild(message);
        } else {
            this.likedCats.forEach((catUrl, index) => {
                const img = document.createElement('img');
                img.className = 'liked-cat';
                img.src = catUrl;
                img.alt = `Liked cat ${index + 1}`;
                img.loading = 'lazy';

                // Add error handling
                img.onerror = () => {
                    img.src = `https://placekitten.com/400/400?image=${index}`;
                };

                this.likedCatsContainer.appendChild(img);
            });
        }
    }

    restartApp() {
        this.currentIndex = 0;
        this.likedCats = [];
        this.likesCount.textContent = '0';

        // Show main interface
        document.querySelector('.swipe-container').style.display = 'block';
        document.querySelector('.header').style.display = 'block';
        document.querySelector('.progress').style.display = 'flex';
        document.querySelector('.instructions-container').style.display = 'flex';
        
        this.summary.style.display = 'none';
        this.swipeArea.style.display = 'block';

        // Reload cats for variety
        this.catsData = [];
        this.loadCats();
    }

    handleKeyDown(e) {
        if (this.currentIndex >= this.CAT_COUNT) return;

        // Arrow keys for likes/dislikes
        if (e.key === 'ArrowRight' || e.key === 'd') {
            this.handleLike();
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
            this.handleDislike();
        }

        // Space/Enter for showing summary early
        if ((e.key === 'Enter' || e.key === ' ') && this.currentIndex === this.CAT_COUNT - 1) {
            this.showSummary();
        }
    }

    handleUndo() {
        if (this.currentIndex <= 0) return;

        // Decrement index to go back to previous cat
        this.currentIndex--;

        // Check if the cat we are undoing was in the 'liked' list
        const previousCatUrl = this.catsData[this.currentIndex];
        const likeIndex = this.likedCats.indexOf(previousCatUrl);

        // If we liked it previously, remove it from the list
        if (likeIndex > -1) {
            this.likedCats.splice(likeIndex, 1);
            this.likesCount.textContent = this.likedCats.length;
        }

        // Re-render the card
        this.loadCurrentCat();

        // Update button state
        this.updateUndoButtonState();
    }

    updateUndoButtonState() {
        // Disable if at start, enable if we have moved forward
        if (this.currentIndex > 0 && this.currentIndex < this.CAT_COUNT) {
            this.undoBtn.disabled = false;
        } else {
            this.undoBtn.disabled = true;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CatSwiperApp();

    // Make app available globally for debugging if needed
    window.catSwiperApp = app;

});
