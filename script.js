// ====================================================================
// === Whispers of Aurorachrome - Museum Terminal Script v5.0       ===
// ====================================================================

// --- Global State ---
let siteData = []; // Flat array of database items from shows.json
let activeCategory = 'lore'; // Default starting tab
let activeCharacter = 'all'; // Current character filter ('all', 'jaxx', 'dax', 'echo')
let ytPlayer = null; // Single, unified YouTube player instance
let isMuted = true; // Universal master mute

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch your streamlined shows.json
    fetch('shows.json')
        .then(response => {
            if (!response.ok) throw new Error('Network error loading database');
            return response.json();
        })
        .then(data => {
            // Support both a flat array or their older object-based structure
            siteData = Array.isArray(data) ? data : Object.values(data.content || {});
            console.log("Terminal Database Loaded:", siteData);
            
            initializeTerminal();
        })
        .catch(error => {
            console.error("Fatal Terminal Error:", error);
            showTerminalError("Could not retrieve system database. Please refresh.");
        });
});

function initializeTerminal() {
    setupTabNavigation();
    setupCharacterFilters();
    setupUniversalMute();
    setupAmbianceMixer();
    
    // Render the initial menu list based on defaults (Category: 'lore', Character: 'all')
    renderMenuList();
}

// ===================================================================
// ===                  NAVIGATION & FILTERING                     ===
// ===================================================================

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.console-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Update active state in UI
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active state in memory and re-render
            activeCategory = tab.getAttribute('data-category');
            renderMenuList();
        });
    });
}

function setupCharacterFilters() {
    const charBadges = document.querySelectorAll('.char-badge');
    charBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            const selectedChar = badge.getAttribute('data-char');
            
            // Toggle logic: Clicking an already active character clears the filter
            if (activeCharacter === selectedChar) {
                activeCharacter = 'all';
                badge.classList.remove('active');
            } else {
                charBadges.forEach(b => b.classList.remove('active'));
                activeCharacter = selectedChar;
                badge.classList.add('active');
            }
            
            renderMenuList();
        });
    });
}

// ===================================================================
// ===                     MENU RENDERING                           ===
// ===================================================================

function renderMenuList() {
    const menuList = document.getElementById('terminal-menu-list');
    if (!menuList) return;
    
    menuList.innerHTML = ''; // Clear previous menu items

    // Filter data by BOTH active category AND active character (if set)
    const filteredItems = siteData.filter(item => {
        const matchesCategory = item.category === activeCategory;
        const matchesCharacter = (activeCharacter === 'all') || 
                                 (item.character && item.character.toLowerCase() === activeCharacter);
        return matchesCategory && matchesCharacter;
    });

    if (filteredItems.length === 0) {
        menuList.innerHTML = `<div class="no-records">No logs found for this system configuration.</div>`;
        return;
    }

    // Build modern, clickable terminal directory listings
    filteredItems.forEach(item => {
        const button = document.createElement('button');
        button.className = `menu-item-btn char-theme-${item.character ? item.character.toLowerCase() : 'system'}`;
        
        // Custom inner HTML to make it look like a sci-fi museum listing
        button.innerHTML = `
            <span class="item-tag">[${item.character || 'SYSTEM'}]</span>
            <span class="item-title">${item.title}</span>
        `;
        
        button.addEventListener('click', () => loadExhibit(item));
        menuList.appendChild(button);
    });
}

// ===================================================================
// ===                  EXHIBIT LOADER ENGINE                       ===
// ===================================================================

function loadExhibit(item) {
    const viewport = document.getElementById('display-content-viewport');
    const nowPlayingLabel = document.getElementById('display-now-playing');
    if (!viewport) return;

    // Clean up any old YouTube player memory before switching
    if (ytPlayer) {
        try { ytPlayer.destroy(); } catch(e) {}
        ytPlayer = null;
    }

    // Update terminal label
    nowPlayingLabel.textContent = `Accessing: ${item.title} (${item.character || 'System File'})`;

    // Render based on transmission payload type
    if (item.type === 'youtube') {
        // Render a clean placeholder and launch single YouTube instance
        viewport.innerHTML = `<div id="terminal-yt-player"></div>`;
        
        ytPlayer = new YT.Player('terminal-yt-player', {
            videoId: item.videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'mute': isMuted ? 1 : 0
            },
            events: {
                'onReady': (event) => {
                    if (!isMuted) event.target.unMute();
                }
            }
        });
    } 
    else if (item.type === 'iframe') {
        // Safely embed your external applications (Google Looker Studio Kaomoji Maker, etc.)
        viewport.innerHTML = `
            <iframe 
                src="${item.url}" 
                class="embedded-app-frame" 
                frameborder="0" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
            </iframe>`;
    } 
    else if (item.type === 'text') {
        // Render direct rich text stories / lore logs / descriptions
        viewport.innerHTML = `
            <div class="terminal-text-log">
                <h2>${item.title}</h2>
                <div class="meta-stamp">STAMP: FILE_${item.id.toUpperCase()} // AUTH: ${item.character || 'ANONYMOUS'}</div>
                <div class="log-body">${item.content || item.description || 'Empty log transmission.'}</div>
            </div>`;
    }
}

// ===================================================================
// ===                     AUDIO CONTROLS                           ===
// ===================================================================

function setupUniversalMute() {
    const muteBtn = document.getElementById('universal-mute-btn');
    const rainAudio = document.getElementById('audio-rain');
    const fireplaceAudio = document.getElementById('audio-fireplace');

    if (!muteBtn) return;

    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted; // Toggle system master state

        if (isMuted) {
            muteBtn.classList.add('muted');
            if (ytPlayer && typeof ytPlayer.mute === 'function') ytPlayer.mute();
            if (rainAudio) rainAudio.muted = true;
            if (fireplaceAudio) fireplaceAudio.muted = true;
        } else {
            muteBtn.classList.remove('muted');
            if (ytPlayer && typeof ytPlayer.unMute === 'function') ytPlayer.unMute();
            if (rainAudio) rainAudio.muted = false;
            if (fireplaceAudio) fireplaceAudio.muted = false;
        }
    });
}

function setupAmbianceMixer() {
    const rainAudio = document.getElementById('audio-rain');
    const fireplaceAudio = document.getElementById('audio-fireplace');
    const rainSlider = document.getElementById('rain-slider');
    const fireplaceSlider = document.getElementById('fireplace-slider');

    if (!rainAudio || !fireplaceAudio || !rainSlider || !fireplaceSlider) return;

    // Standardize volumes matching the initial slider value (0)
    rainAudio.volume = rainSlider.value;
    fireplaceAudio.volume = fireplaceSlider.value;

    rainSlider.addEventListener('input', (e) => {
        rainAudio.volume = e.target.value;
    });
    fireplaceSlider.addEventListener('input', (e) => {
        fireplaceAudio.volume = e.target.value;
    });

    // To comply with browser auto-play policies, unlock HTML5 audio on first user tap
    document.body.addEventListener('click', () => {
        if (rainAudio.paused) rainAudio.play().catch(() => {});
        if (fireplaceAudio.paused) fireplaceAudio.play().catch(() => {});
    }, { once: true });
}

// ===================================================================
// ===                       SYSTEM HELPER                          ===
// ===================================================================

function showTerminalError(message) {
    const viewport = document.getElementById('display-content-viewport');
    if (viewport) {
        viewport.innerHTML = `
            <div class="terminal-error">
                <h3>[CRITICAL SYSTEM ERROR]</h3>
                <p>${message}</p>
            </div>`;
    }
}

// Required empty placeholder for YouTube API architecture
function onYouTubeIframeAPIReady() {}

