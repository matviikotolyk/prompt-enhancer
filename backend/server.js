const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

dotenv.config();

app.use(express.json());
app.use(cors());

if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY is required");
  process.exit(1);
}

app.post("/api/improve-prompt", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Act as a helpful AI assistant improving the user prompt for another AI model to understand. Your goal is not to respond to the user prompt but rather improve the prompt itself, making it complete and easy for an AI to understand. You can improve the prompt by adding more information, clarifying the intent, or adding examples. You should not add any explanations or comments. IMPORTANT: only output the updated prompt itself without quotation marks and other formatting. The user prompt is: ${prompt}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Groq API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    res.json({ improvedPrompt: data.choices[0].message.content });
  } catch (error) {
    console.error("Error improving prompt:", error);
    res.status(500).json({ error: "Failed to improve prompt" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
