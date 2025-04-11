// Mood to color mapping
export const moodColors = {
    mystery: 'bg-mystery',
    transformation: 'bg-transformation',
    wisdom: 'bg-wisdom',
    reflection: 'bg-reflection',
    insight: 'bg-insight',
    clarity: 'bg-clarity'
};

// Tag to color mapping
const tagColors = {
    technical: 'bg-technical',
    botanical: 'bg-botanical',
    architectural: 'bg-architectural',
    scientific: 'bg-scientific',
    geometric: 'bg-geometric',
    abstract: 'bg-abstract'
};

// Keywords to moods mapping
const moodKeywords = {
    mystery: ['mystery', 'unknown', 'hidden', 'secret', 'enigmatic'],
    transformation: ['change', 'transform', 'evolve', 'growth', 'transition'],
    wisdom: ['wisdom', 'knowledge', 'understanding', 'insight', 'learning'],
    reflection: ['reflect', 'contemplate', 'meditate', 'ponder', 'consider'],
    insight: ['insight', 'realization', 'discovery', 'awareness', 'perception'],
    clarity: ['clear', 'understand', 'comprehend', 'grasp', 'see']
};

class BackgroundManager {
    constructor() {
        this.isEnabled = true;
        this.currentClass = null;
        this.body = document.body;
    }

    // Enable/disable dynamic backgrounds
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.removeBackgroundClass();
        }
    }

    // Remove current background class
    removeBackgroundClass() {
        if (this.currentClass) {
            this.body.classList.remove(this.currentClass);
            this.currentClass = null;
        }
    }

    // Set background based on mood
    setMoodBackground(mood) {
        if (!this.isEnabled) return;
        
        const colorClass = moodColors[mood.toLowerCase()];
        if (colorClass) {
            this.removeBackgroundClass();
            this.body.classList.add(colorClass);
            this.currentClass = colorClass;
        }
    }

    // Set background based on tags
    setTagBackground(tags) {
        if (!this.isEnabled) return;
        
        // Find the first matching tag color
        for (const tag of tags) {
            const colorClass = tagColors[tag.toLowerCase()];
            if (colorClass) {
                this.removeBackgroundClass();
                this.body.classList.add(colorClass);
                this.currentClass = colorClass;
                return;
            }
        }
    }

    // Analyze text for mood keywords
    analyzeMood(text) {
        const words = text.toLowerCase().split(/\s+/);
        for (const [mood, keywords] of Object.entries(moodKeywords)) {
            if (keywords.some(keyword => words.includes(keyword))) {
                return mood;
            }
        }
        return null;
    }

    // Update background based on fortune text
    updateFromFortune(text) {
        if (!this.isEnabled) return;
        
        const mood = this.analyzeMood(text);
        if (mood) {
            this.setMoodBackground(mood);
        }
    }

    // Update background based on selected images
    updateFromImages(images) {
        if (!this.isEnabled) return;
        
        const tags = images.flatMap(img => img.tags || []);
        this.setTagBackground(tags);
    }

    // Generate a random color for the background
    generateRandomColor() {
        // Generate a random pastel color
        const hue = Math.floor(Math.random() * 360);
        const saturation = 25 + Math.floor(Math.random() * 20); // 25-45%
        const lightness = 85 + Math.floor(Math.random() * 10); // 85-95%
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
}

// Create and export singleton instance
const backgroundManager = new BackgroundManager();
export default backgroundManager; 