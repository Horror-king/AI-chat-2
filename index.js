const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// API route to handle AI chat requests
app.get("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) {
      return res.status(400).send({ error: "Prompt is required" });
    }

    // Use the local AI server's endpoint
    const response = await axios.get(
      `https://yau-ai-ordu.onrender.com/ai?prompt=${encodeURIComponent(prompt)}`
    );

    if (response.status !== 200 || !response.data || !response.data.response) {
      throw new Error("Failed to get a response from AI");
    }

    const messageText = response.data.response;

    // Check if the response contains image URLs
    const urls = messageText.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif)/gi);

    if (urls && urls.length > 0) {
      const imgData = [];
      const limitedUrls = urls.slice(0, 6); // Limit to 6 images

      for (let i = 0; i < limitedUrls.length; i++) {
        const imgResponse = await axios.get(limitedUrls[i], {
          responseType: "arraybuffer",
        });
        const imgPath = path.join(__dirname, "public", `image_${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        imgData.push(`image_${i + 1}.jpg`);
      }

      res.send({ images: imgData });
    } else {
      res.send({ message: messageText });
    }
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).send({ error: "Failed to get AI response" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
