// ====================================================================
// === Whispers of Aurorachrome - Hierarchical Terminal Script v5.1 ===
// ====================================================================

// --- Global State ---
let siteData = []; // Flat array of database items from shows.json
let activeChannel = 'main'; // Top level: 'main', 'jaxx', 'dax', 'echo'
let activeCategory = 'videos'; // Mid level 1: 'videos', 'podcasts', 'the_static', 'lab'
let activePlaylist = ''; // Mid level 2: e.g., 'Season 1', 'Shorts', 'Issue 1'
let ytPlayer = null; // Unified YouTube player
let isMuted = true; // Universal master mute
// === ADD THESE NEW PAGINATION STATES ===
let menuCurrentPage = 0; 
const EPISODES_PER_PAGE = 4; // Controls how many display at once
let currentPlaylistEpisodes = []; // Stores full list of active files




// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetch('shows.json')
        .then(response => {
            if (!response.ok) throw new Error('Network error loading database');
            return response.json();
        })
        .then(data => {
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
    setupChannelSelector();
    setupCategoryNavigation();
    setupUniversalMute();
    setupAmbianceMixer();

    // === ADDED: Tell the browser what to do when clicking pagination buttons ===
    document.getElementById('menu-prev-btn').addEventListener('click', () => {
        if (menuCurrentPage > 0) {
            menuCurrentPage--;
            renderMenuList();
        }
    });

    document.getElementById('menu-next-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(currentPlaylistEpisodes.length / EPISODES_PER_PAGE);
        if (menuCurrentPage < totalPages - 1) {
            menuCurrentPage++;
            renderMenuList();
        }
    });
    
    // Auto-select the first category and build the submenus
    selectCategory(activeCategory);
}

// ===================================================================
// ===               LEVEL 1: CHANNEL SELECTOR                     ===
// ===================================================================
function setupChannelSelector() {
    const channelButtons = document.querySelectorAll('.channel-btn');
    channelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            channelButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            activeChannel = btn.getAttribute('data-channel');
            // When changing channels, reset down the chain
            selectCategory(activeCategory);
        });
    });
}

// ===================================================================
// ===               LEVEL 2: CATEGORY NAVIGATION                  ===
// ===================================================================
function setupCategoryNavigation() {
    const tabs = document.querySelectorAll('.console-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.getAttribute('data-category');
            selectCategory(category);
        });
    });
}

function selectCategory(category) {
    activeCategory = category;
    
    // Find all unique playlists that exist for this Channel + Category
    const filteredItems = siteData.filter(item => {
        return item.channel === activeChannel && item.category === activeCategory;
    });
    
    // Extract unique playlist names
    const playlists = [...new Set(filteredItems.map(item => item.playlist).filter(Boolean))];
    
    // Render the Playlist Submenu
    renderPlaylistButtons(playlists);
    
    // Auto-select the first playlist in the list, or clear if empty
    if (playlists.length > 0) {
        selectPlaylist(playlists[0]);
    } else {
        activePlaylist = '';
        currentPlaylistEpisodes = []; // <-- UPDATE: Reset the global list
        renderMenuList(); // <-- UPDATE: Call without arguments
    }
}

// ===================================================================
// ===              LEVEL 3: PLAYLISTS / SUBMENU                   ===
// ===================================================================
function renderPlaylistButtons(playlists) {
    const container = document.getElementById('playlist-buttons-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    playlists.forEach(playlistName => {
        const btn = document.createElement('button');
        btn.className = 'playlist-sub-tab';
        btn.textContent = playlistName;
        
        if (playlistName === activePlaylist) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.playlist-sub-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectPlaylist(playlistName);
        });
        
        container.appendChild(btn);
    });
}

function selectPlaylist(playlistName) {
    activePlaylist = playlistName;
    
    // UPDATE: Save the filtered episodes straight to the global variable
    currentPlaylistEpisodes = siteData.filter(item => {
        return item.channel === activeChannel && 
               item.category === activeCategory && 
               item.playlist === activePlaylist;
    });
    
    menuCurrentPage = 0; // Reset pagination back to page 1
    renderMenuList(); // <-- UPDATE: Call without arguments
}

// ===================================================================
// ===              LEVEL 4: EPISODE / SELECTION GRID              ===
// ===================================================================
// UPDATE: Ensure there are NO arguments inside the ()
function renderMenuList() {
    const menuList = document.getElementById('terminal-menu-list');
    const controls = document.getElementById('menu-pagination-controls');
    const pageIndicator = document.getElementById('menu-page-indicator');
    const prevBtn = document.getElementById('menu-prev-btn');
    const nextBtn = document.getElementById('menu-next-btn');
    
    if (!menuList) return;
    
    menuList.innerHTML = ''; // Clear previous episodes

    // UPDATE: We now check 'currentPlaylistEpisodes' instead of 'items'
    if (currentPlaylistEpisodes.length === 0) {
        menuList.innerHTML = `<div class="no-records">Select a playlist above to view files.</div>`;
        if (controls) controls.style.display = 'none';
        return;
    }

    // Calculate pagination totals
    const totalPages = Math.ceil(currentPlaylistEpisodes.length / EPISODES_PER_PAGE);
    
    // Dynamically show/hide pagination and update state indicators
    if (controls) {
        if (totalPages > 1) {
            controls.style.display = 'flex';
            if (pageIndicator) pageIndicator.textContent = `Page ${menuCurrentPage + 1} of ${totalPages}`;
            if (prevBtn) prevBtn.disabled = (menuCurrentPage === 0);
            if (nextBtn) nextBtn.disabled = (menuCurrentPage >= totalPages - 1);
        } else {
            controls.style.display = 'none';
        }
    }

    // Slice the array to display only the items for the current active page
    const startIndex = menuCurrentPage * EPISODES_PER_PAGE;
    const pageItems = currentPlaylistEpisodes.slice(startIndex, startIndex + EPISODES_PER_PAGE);

    // Build the 4 display buttons
    pageItems.forEach(item => {
        const button = document.createElement('button');
        button.className = `menu-item-btn char-theme-${item.character ? item.character.toLowerCase() : 'system'}`;
        
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

    if (ytPlayer) {
        try { ytPlayer.destroy(); } catch(e) {}
        ytPlayer = null;
    }

    nowPlayingLabel.textContent = `Accessing: ${item.title} (${item.character || 'System File'})`;

    if (item.type === 'youtube') {
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
        viewport.innerHTML = `
            <iframe 
                src="${item.url}" 
                class="embedded-app-frame" 
                frameborder="0" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
            </iframe>`;
    } 
     // === ADD THIS NEW TABLOID CODE CASE ===
    else if (item.type === 'tabloid') {
        // Since YouTube blocks iframe embeds on community posts, we display the cover image
        // and build a highly stylized terminal link to open the original post on YouTube!
        viewport.innerHTML = `
            <div class="terminal-tabloid-view">
                <img src="${item.content}" class="tabloid-cover-image" alt="${item.title}">
                <div class="tabloid-overlay-controls">
                    <p class="tabloid-desc">${item.description || 'Accessing encrypted tabloid feed...'}</p>
                    <a href="${item.url}" target="_blank" class="tabloid-portal-btn">
                        [ DECRYPT TRANSMISSION // OPEN ON YOUTUBE ]
                    </a>
                </div>
            </div>`;
    }
    // ======================================  
   
     else if (item.type === 'text') {
        viewport.innerHTML = `
            <div class="terminal-text-log">
                <h2>${item.title}</h2>
                <div class="meta-stamp">STAMP: FILE_${item.id.toUpperCase()} // AUTH: ${item.character || 'SYSTEM'}</div>
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
        isMuted = !isMuted;

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

    rainAudio.volume = rainSlider.value;
    fireplaceAudio.volume = fireplaceSlider.value;

    rainSlider.addEventListener('input', (e) => {
        rainAudio.volume = e.target.value;
    });
    fireplaceSlider.addEventListener('input', (e) => {
        fireplaceAudio.volume = e.target.value;
    });

    document.body.addEventListener('click', () => {
        if (rainAudio.paused) rainAudio.play().catch(() => {});
        if (fireplaceAudio.paused) fireplaceAudio.play().catch(() => {});
    }, { once: true });
}

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

function onYouTubeIframeAPIReady() {}
