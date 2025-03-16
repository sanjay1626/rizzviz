import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Increase request size limits for large payloads
app.use(express.json({ limit: "50mb" }));  
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

// Replicate API Configuration
const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";
const MODEL_VERSION = "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_KEY;  

// Helper function to poll for result
const pollForImage = async (getUrl) => {
    let attempts = 0;
    const maxAttempts = 20; // Maximum polling attempts (~60 seconds)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`⏳ Polling Replicate API for image... Attempt ${attempts}`);

        try {
            const response = await fetch(getUrl, {
                headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
            });
            const result = await response.json();

            if (result.status === "succeeded" && result.output) {
                console.log("✅ Image successfully generated!");
                return result.output[0]; // Return the generated image URL
            } else if (result.status === "failed") {
                console.error("❌ Replicate API failed to generate an image.");
                return null;
            }
        } catch (error) {
            console.error("❌ Error while polling Replicate API:", error.message);
        }

        await delay(3000); // Wait 3 seconds before next attempt
    }

    return null; // Timeout if image is not ready
};

// AI Image Generation Route
app.post("/generate-image", async (req, res) => {
    try {
        const { prompt, image } = req.body;
        if (!prompt) return res.status(400).json({ error: "❌ Missing input prompt" });

        console.log(`🚀 Sending request to Replicate with prompt: "${prompt}"`);

        const response = await fetch(REPLICATE_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: MODEL_VERSION,
                input: {
                    prompt,
                    width: 512,
                    height: 512,
                    num_outputs: 1,
                    guidance_scale: 7.5,
                    num_inference_steps: 50,
                    init_image: image || undefined, 
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ Error from Replicate API:", data.error);
            return res.status(500).json({ error: data.error });
        }

        console.log("✅ Replicate API Initial Response:", data);

        // Extract polling URL
        const getUrl = data.urls.get;
        if (!getUrl) {
            return res.status(500).json({ error: "❌ Missing polling URL from Replicate API" });
        }

        // Poll for final image result
        const imageUrl = await pollForImage(getUrl);

        if (!imageUrl) {
            return res.status(500).json({ error: "❌ No image received from Replicate API" });
        }

        res.json({ image_url: imageUrl });

    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
