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
    const accessToken = params.get("access_token");

    if (accessToken) {
        localStorage.setItem("spotify_access_token", accessToken); // Store token
    }

    return accessToken;
}

function getStoredAccessToken() {
    return localStorage.getItem("spotify_access_token"); // Retrieve token
}

window.onload = () => {
    let accessToken = getAccessTokenFromUrl();

    if (!accessToken) {
        accessToken = getStoredAccessToken(); // Try retrieving from storage
    }

    if (!accessToken) {
        console.error("❌ No access token found. User needs to log in.");
        return;
    }

    console.log("✅ Using Spotify Access Token:", accessToken);
    fetchRecentlyPlayed(accessToken);
};


// Function to fetch recently played tracks
async function fetchRecentlyPlayed(accessToken) {
    if (!accessToken) {
        console.error("❌ No access token provided. Please log in.");
        return;
    }

    const response = await fetch("https://api.spotify.com/v1/me/player/recently-played", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    if (response.status === 401) {
        console.error("❌ Invalid or expired access token! User needs to reauthenticate.");
        localStorage.removeItem("spotify_access_token"); // Clear invalid token
        return;
    }

    if (!response.ok) {
        console.error(`❌ Failed to fetch recently played tracks: ${response.status}`);
        return;
    }

    const data = await response.json();
    console.log("✅ Recently played tracks:", data);
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

// GENERATE AI IMAGE

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Script is loaded!");

    const generateBtn = document.getElementById("generate-btn");
    const canvas = document.getElementById("playlistCanvas");
    const ctx = canvas.getContext("2d");

    generateBtn.addEventListener("click", async () => {
        console.log("🚀 Sending request to backend to generate image...");
        
        const prompt = "A futuristic city with flying cars";  // Example prompt
        try {
            const response = await fetch("http://localhost:5000/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (data.error) {
                console.error("❌ API Error:", data.error);
                return;
            }

            console.log("✅ Received AI Image:", data.image_url);
            
            // Load the AI-generated image into the canvas
            const img = new Image();
            img.crossOrigin = "anonymous"; // To prevent CORS issues when downloading
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = data.image_url;

            // Show Download Button
            const downloadLink = document.getElementById("download-art");
            downloadLink.href = data.image_url;
            downloadLink.download = "playlist_art.png";
            downloadLink.style.display = "block";
            downloadLink.innerText = "Download AI Artwork";
            
        } catch (error) {
            console.error("❌ Error:", error);
        }
    });
});


async function generateAIImageFromPlaylist() {
    try {
        const prompt = "A futuristic city with flying cars"; // Example prompt for AI generation
        console.log("🚀 Sending request to backend with prompt:", prompt);

        const response = await fetch("http://localhost:5000/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        // ✅ Fix: Ensure JSON response is valid
        if (!response.ok) {
            throw new Error(`❌ Backend Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Backend Response:", data);

        // ✅ Fix: Check if the API returned an image
        if (!data.image_url || data.image_url.trim() === "") {
            throw new Error("❌ No valid image URL received from Replicate API.");
        }

        // ✅ Fix: Render Image
        const imageElement = document.getElementById("ai-image");
        imageElement.src = data.image_url;
        imageElement.alt = "Generated AI Image";
        imageElement.style.display = "block"; // Ensure image is visible

        console.log("🖼️ Image rendered successfully:", data.image_url);
    } catch (error) {
        console.error("❌ Error:", error);
        alert("Failed to generate AI image. Check console logs for details.");
    }
}

// ✅ Fix: Global Error Debugging
window.onerror = function(message, source, lineno, colno, error) {
    console.error(`❌ JS Error: ${message} at ${source}:${lineno}:${colno}`, error);
};

// Step 1: Combine playlist images into a single blended image
async function blendPlaylistImages(images) {
    const canvas = document.getElementById("playlistCanvas");
    const ctx = canvas.getContext("2d");

    // Set background color
    ctx.fillStyle = "#000"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let size = 256; // Each image size
    let x = 0, y = 0;

    for (let i = 0; i < Math.min(images.length, 4); i++) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.src = images[i].src;

        await new Promise(resolve => {
            img.onload = function () {
                ctx.globalAlpha = 0.5; // Blending effect
                ctx.drawImage(img, x, y, size, size);
                x += size;
                if (x >= canvas.width) {
                    x = 0;
                    y += size;
                }
                resolve();
            };
        });
    }

    return canvas.toDataURL("image/png");
}

// Step 2: Send blended image to Replicate AI for img2img transformation
async function sendToReplicateAI(baseImageUrl) {
    console.log("🚀 Sending request to backend with:", baseImageUrl);

    const response = await fetch("http://localhost:5000/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: "A stunning AI-generated artwork inspired by a Spotify playlist.",
            image: baseImageUrl
        })
    });

    const data = await response.json();
    console.log("✅ Backend Response:", data);

    if (data.error) {
        console.error("❌ Error generating AI image:", data.error);
        return;
    }

    // ✅ Validate the response contains a correct image URL
    if (!data.image_url || !data.image_url.startsWith("http")) {
        console.error("❌ Invalid image URL received:", data.image_url);
        return;
    }

    // ✅ Display the generated image
    const imgElement = document.getElementById("generated-image");
    if (imgElement) {
        imgElement.src = data.image_url;
        imgElement.style.display = "block";
    } else {
        console.error("❌ Image element not found in DOM.");
    }
}


// Step 3: Poll the API to check when the AI image is ready
async function checkAIImageStatus(predictionId) {
    while (true) {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { "Authorization": `Token ${REPLICATE_API_KEY}` }
        });

        const data = await response.json();

        if (data.status === "succeeded") {
            return data.output[0]; // Return generated AI image URL
        } else if (data.status === "failed") {
            console.error("AI image generation failed.");
            return null;
        }

        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait before polling again
    }
}

// Step 4: Display the AI-generated image
function displayGeneratedImage(imageUrl) {
    const generatedImage = document.getElementById("generatedImage");
    generatedImage.src = imageUrl;
    generatedImage.style.display = "block";

    // Enable download
    const downloadLink = document.getElementById("download-art");
    downloadLink.href = imageUrl;
    downloadLink.download = "playlist-ai-art.png";
    downloadLink.innerText = "Download AI Artwork";
    downloadLink.style.display = "block";
}
