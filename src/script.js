const CLIENT_ID = "40bd2e9684d64209ba4d5939f4266629";
const REDIRECT_URI = "http://127.0.0.1:5500/src/callback.html"; // Same as in Spotify Dashboard
const SCOPES = "user-read-recently-played playlist-read-private"; 

document.getElementById("login-button").addEventListener("click", () => {
     // Hide login button
     document.getElementById("login-button").style.display = "none";
     //Redirect to Spotify login page
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
     // Hide login button
     //document.getElementById("login-button").style.display = "none";
});

// Function to extract the access token from URL
function getAccessTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get("access_token");
}

// Function to fetch recently played tracks
async function fetchRecentlyPlayed(accessToken) {
    const response = await fetch("https://api.spotify.com/v1/me/player/recently-played", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();

    displayTracks(data.items);
}

// Function to display tracks
function displayTracks(tracks) {
    const container = document.getElementById("playlist-container");
    container.innerHTML = ""; // Clear existing content

    tracks.forEach(track => {
        const song = track.track;
        const trackElement = document.createElement("div");
        trackElement.classList.add("playlist-item");

        trackElement.innerHTML = `
            <img src="${song.album.images[0].url}" alt="${song.name}">
            <div class="playlist-item-info">
                <h3>${song.name}</h3>
                <p>${song.artists.map(artist => artist.name).join(", ")}</p>
            </div>
        `;

        container.appendChild(trackElement);
    });

    document.getElementById("playlist-section").style.display = "block";
}

// If redirected back after login, fetch token and display tracks
window.onload = () => {
    const accessToken = getAccessTokenFromUrl();
    if (accessToken) {
        fetchRecentlyPlayed(accessToken);
    }
};
