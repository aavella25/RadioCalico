// ========== RADIO PLAYER ==========
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const playBtnText = playBtn.querySelector('span');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const status = document.getElementById('status');
const visualizer = document.getElementById('visualizer');

// Metadata elements
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackAlbum = document.getElementById('trackAlbum');
const trackYear = document.getElementById('trackYear');
const badges = document.getElementById('badges');
const bitDepth = document.getElementById('bitDepth');
const sampleRate = document.getElementById('sampleRate');
const historyList = document.getElementById('historyList');
const albumArt = document.getElementById('albumArt');

// Stream URL - replace with your own stream
// Back to Apple test stream (works reliably, but just test tones)
const streamUrl = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8';  // Apple test (beeps)
// const streamUrl = 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8';  // NASA TV
// const streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';  // Your CloudFront (needs setup)
const metadataUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json';
const albumArtUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg';

let isPlaying = false;
let hls;
let analyser;
let audioContext;
let dataArray;
let metadataInterval;
let currentSongId = null;
let userId = null;

// Generate or retrieve user ID
function getUserId() {
    if (!userId) {
        userId = localStorage.getItem('radioCalicoUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('radioCalicoUserId', userId);
        }
    }
    return userId;
}

// Get current song identifier
function getCurrentSongId() {
    const artist = trackArtist.textContent;
    const title = trackTitle.textContent;
    if (artist && title && artist !== '—' && title !== 'Loading...') {
        return btoa(artist + '::' + title); // Base64 encode for safe ID
    }
    return null;
}

// Create visualizer bars
for (let i = 0; i < 40; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = '10px';
    visualizer.appendChild(bar);
}

const bars = document.querySelectorAll('.bar');

// Fetch and display metadata
async function fetchMetadata() {
    try {
        const timestamp = Date.now();
        const response = await fetch(metadataUrl + '?t=' + timestamp);
        const data = await response.json();

        // Update current track
        trackTitle.textContent = data.title || 'Unknown Track';
        trackArtist.textContent = data.artist || 'Unknown Artist';
        trackAlbum.textContent = data.album ? `📀 ${data.album}` : '';
        trackYear.textContent = data.date ? `📅 ${data.date}` : '';

        // Update audio quality
        bitDepth.textContent = data.bit_depth ? `${data.bit_depth}-bit` : '16-bit';
        sampleRate.textContent = data.sample_rate ? `${(data.sample_rate / 1000).toFixed(1)}kHz` : '44.1kHz';

        // Update album art with cache busting
        albumArt.classList.add('loading');
        albumArt.src = albumArtUrl + '?t=' + timestamp;
        albumArt.onload = function() {
            albumArt.classList.remove('loading');
            albumArt.style.display = 'block';
        };

        // Update badges
        let badgeHTML = '';
        if (data.is_new) {
            badgeHTML += '<span class="badge badge-new">🆕 New</span>';
        }
        if (data.is_summer) {
            badgeHTML += '<span class="badge badge-summer">☀️ Summer Hit</span>';
        }
        if (data.is_vidgames) {
            badgeHTML += '<span class="badge badge-vidgames">🎮 Video Games</span>';
        }
        badges.innerHTML = badgeHTML;

        // Update history
        updateHistory(data);

        // Update ratings for new song
        const newSongId = getCurrentSongId();
        if (newSongId && newSongId !== currentSongId) {
            currentSongId = newSongId;
            fetchRatings();
        }

    } catch (error) {
        console.error('Metadata fetch error:', error);
    }
}

// Fetch ratings for current song
async function fetchRatings() {
    try {
        if (!currentSongId) return;

        const userId = getUserId();
        const response = await fetch(`${API_URL}/ratings/${currentSongId}?userId=${userId}`);
        const data = await response.json();

        if (response.ok) {
            updateRatingDisplay(data);
        }
    } catch (error) {
        console.error('Rating fetch error:', error);
    }
}

// Update rating display
function updateRatingDisplay(data) {
    const thumbsUpCount = document.querySelector('#thumbsUpCount .rating-number');
    const thumbsDownCount = document.querySelector('#thumbsDownCount .rating-number');
    const thumbsUpBtn = document.getElementById('thumbsUpBtn');
    const thumbsDownBtn = document.getElementById('thumbsDownBtn');
    const ratingMessage = document.getElementById('ratingMessage');

    thumbsUpCount.textContent = data.thumbsUp || 0;
    thumbsDownCount.textContent = data.thumbsDown || 0;

    // Reset buttons
    thumbsUpBtn.classList.remove('voted');
    thumbsDownBtn.classList.remove('voted');
    thumbsUpBtn.disabled = false;
    thumbsDownBtn.disabled = false;
    ratingMessage.textContent = '';
    ratingMessage.className = 'rating-message';

    // Highlight user's vote if they already voted
    if (data.userVote) {
        if (data.userVote === 'up') {
            thumbsUpBtn.classList.add('voted');
            ratingMessage.textContent = 'You liked this track (click 👎 to change)';
            ratingMessage.classList.add('success');
        } else if (data.userVote === 'down') {
            thumbsDownBtn.classList.add('voted');
            ratingMessage.textContent = 'You disliked this track (click 👍 to change)';
            ratingMessage.classList.add('success');
        }
    }
}

// Rate a song
async function rateSong(type) {
    try {
        if (!currentSongId) {
            showRatingMessage('Please wait for song to load', 'error');
            return;
        }

        const userId = getUserId();
        const artist = trackArtist.textContent;
        const title = trackTitle.textContent;

        const response = await fetch(`${API_URL}/ratings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                songId: currentSongId,
                artist: artist,
                title: title,
                userId: userId,
                rating: type
            })
        });

        const data = await response.json();

        if (response.ok) {
            const message = data.updated
                ? `Rating changed to ${type === 'up' ? '👍' : '👎'}!`
                : 'Rating saved!';
            showRatingMessage(message, 'success');
            fetchRatings(); // Refresh ratings
        } else {
            showRatingMessage(data.error || 'Failed to save rating', 'error');
        }

    } catch (error) {
        console.error('Rating error:', error);
        showRatingMessage('Network error', 'error');
    }
}

// Show rating message
function showRatingMessage(message, type) {
    const ratingMessage = document.getElementById('ratingMessage');
    ratingMessage.textContent = message;
    ratingMessage.className = 'rating-message ' + type;
}

// Make rateSong available globally
window.rateSong = rateSong;

// Update recently played history
function updateHistory(data) {
    let historyHTML = '';
    for (let i = 1; i <= 5; i++) {
        const artist = data[`prev_artist_${i}`];
        const title = data[`prev_title_${i}`];

        if (artist && title) {
            historyHTML += `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-title">${escapeHtml(title)}</div>
                        <div class="history-artist">${escapeHtml(artist)}</div>
                    </div>
                    <div class="history-number">#${i}</div>
                </div>
            `;
        }
    }

    if (historyHTML) {
        historyList.innerHTML = historyHTML;
    } else {
        historyList.innerHTML = '<p class="loading">No recent history</p>';
    }
}

// Start metadata polling
function startMetadataPolling() {
    fetchMetadata(); // Fetch immediately
    metadataInterval = setInterval(fetchMetadata, 10000); // Then every 10 seconds
}

// Stop metadata polling
function stopMetadataPolling() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
    }
}

// Initialize HLS
function initHLS() {
    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest loaded');
            status.textContent = 'STREAM READY';
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
                status.textContent = 'STREAM ERROR';
                status.classList.remove('playing');
            }
        });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = streamUrl;
    } else {
        status.textContent = 'HLS NOT SUPPORTED';
        alert('Your browser does not support HLS streaming');
    }
}

// Initialize Audio Context for visualizer
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 128;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
}

// Visualizer animation
function animate() {
    if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
        bars.forEach((bar, i) => {
            const index = Math.floor(i * dataArray.length / bars.length);
            const value = dataArray[index];
            const height = Math.max(10, (value / 255) * 80);
            bar.style.height = height + 'px';
        });
    } else {
        bars.forEach((bar, i) => {
            const baseHeight = 10 + Math.sin(Date.now() / 1000 + i * 0.3) * 5;
            bar.style.height = baseHeight + 'px';
        });
    }
    requestAnimationFrame(animate);
}

// Play/Pause toggle
playBtn.addEventListener('click', async () => {
    if (!isPlaying) {
        status.textContent = 'CONNECTING...';
        try {
            initAudioContext();
            await audio.play();
            isPlaying = true;
            playBtn.classList.add('playing');
            playBtnText.textContent = 'STOP STREAM';
            status.textContent = 'NOW STREAMING';
            status.classList.add('playing');
            startMetadataPolling();
        } catch (error) {
            console.error('Play error:', error);
            status.textContent = 'PLAYBACK FAILED';
        }
    } else {
        audio.pause();
        isPlaying = false;
        playBtn.classList.remove('playing');
        playBtnText.textContent = 'PLAY STREAM';
        status.textContent = 'STREAM PAUSED';
        status.classList.remove('playing');
        stopMetadataPolling();
    }
});

// Volume control
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audio.volume = volume;
    volumeValue.textContent = e.target.value + '%';
});

audio.volume = 0.7;
initHLS();
animate();
startMetadataPolling(); // Start polling immediately to show current track
getUserId(); // Initialize user ID

audio.addEventListener('playing', () => {
    status.textContent = 'NOW STREAMING';
});

audio.addEventListener('waiting', () => {
    status.textContent = 'BUFFERING...';
});

audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    status.textContent = 'STREAM ERROR';
});

// ========== USER MANAGEMENT ==========
const API_URL = '/api';
const addUserForm = document.getElementById('addUserForm');
const usersList = document.getElementById('usersList');

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Failed to add listener', 'error');
            return;
        }

        showMessage('Successfully joined the directory!', 'success');
        addUserForm.reset();
        loadUsers();

    } catch (error) {
        showMessage('Network error: ' + error.message, 'error');
    }
});

async function loadUsers() {
    try {
        usersList.innerHTML = '<p class="loading">Loading listeners...</p>';

        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load listeners');
        }

        if (data.users.length === 0) {
            usersList.innerHTML = '<p class="loading">No listeners yet. Be the first!</p>';
            return;
        }

        displayUsers(data.users);

    } catch (error) {
        usersList.innerHTML = `<div class="message error">Error: ${error.message}</div>`;
    }
}

function displayUsers(users) {
    usersList.innerHTML = users.map(user => `
        <div class="user-item" data-id="${user.id}">
            <div class="user-info">
                <h3>${escapeHtml(user.name)}</h3>
                <p>📧 ${escapeHtml(user.email)}</p>
                <p class="user-id">ID: ${user.id} • Joined: ${formatDate(user.created_at)}</p>
            </div>
            <button class="btn btn-danger" onclick="deleteUser(${user.id})">
                <span>Remove</span>
            </button>
        </div>
    `).join('');
}

async function deleteUser(id) {
    if (!confirm('Remove this listener from the directory?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Failed to remove listener', 'error');
            return;
        }

        showMessage('Listener removed successfully', 'success');
        loadUsers();

    } catch (error) {
        showMessage('Network error: ' + error.message, 'error');
    }
}

function showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) existingMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    const form = addUserForm;
    form.parentNode.insertBefore(messageDiv, form);

    setTimeout(() => messageDiv.remove(), 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.deleteUser = deleteUser;
