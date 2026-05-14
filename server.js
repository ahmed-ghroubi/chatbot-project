import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { exec } from "child_process";

import { AHMED_PROFILE } from "./data/ahmedProfile.js";
import { AI_MODELS } from "./data/aiModels.js";

dotenv.config();

const app = express();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log("GEMINI_API_KEY loaded:", Boolean(GEMINI_API_KEY));
console.log("GROQ_API_KEY loaded:", Boolean(GROQ_API_KEY));

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY. Check your .env file.");
  process.exit(1);
}

const gemini = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const groq = GROQ_API_KEY
  ? new Groq({
      apiKey: GROQ_API_KEY,
    })
  : null;

app.use(cors());
app.use(express.json());

function getSelectedModel(modelId) {
  if (modelId && AI_MODELS[modelId]) {
    return AI_MODELS[modelId];
  }

  return AI_MODELS["gemini-flash"];
}

function providerIsReady(provider) {
  if (provider === "gemini") {
    return Boolean(GEMINI_API_KEY);
  }

  if (provider === "groq") {
    return Boolean(GROQ_API_KEY && groq);
  }

  return false;
}

app.get("/api/models", (req, res) => {
  const availableModels = Object.entries(AI_MODELS)
    .filter(([id, modelConfig]) => {
      return providerIsReady(modelConfig.provider);
    })
    .map(([id, modelConfig]) => {
      return {
        id,
        label: modelConfig.label,
        provider: modelConfig.provider,
      };
    });

  res.json({
    models: availableModels,
    debug: {
      geminiReady: providerIsReady("gemini"),
      groqReady: providerIsReady("groq"),
    },
  });
});

app.get("/reset", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Resetting chatbot...</title>

        <style>
          body {
            margin: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            background: #eef4fb;
            color: #111827;
          }

          .box {
            background: white;
            padding: 28px 34px;
            border-radius: 18px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
            text-align: center;
          }

          .box h1 {
            margin: 0 0 8px;
            font-size: 24px;
          }

          .box p {
            margin: 0;
            color: #6b7280;
          }
        </style>
      </head>

      <body>
        <div class="box">
          <h1>Resetting chatbot...</h1>
          <p>Old data is being cleared.</p>
        </div>

        <script>
          localStorage.removeItem("chatbotUsername");
          localStorage.removeItem("chatbotSessions");
          localStorage.removeItem("chatbotActiveSession");
          localStorage.removeItem("chatbotSelectedModel");

          setTimeout(function () {
            window.location.href = "/";
          }, 500);
        </script>
      </body>
    </html>
  `);
});

app.use(express.static("public"));

async function generateGeminiReply(userMessage, modelName) {
  const response = await gemini.models.generateContent({
    model: modelName,
    contents: userMessage,
    config: {
      systemInstruction: AHMED_PROFILE,
    },
  });

  return response.text || "";
}

async function generateGroqReply(userMessage, modelName) {
  if (!groq) {
    throw new Error("Groq API key is missing.");
  }

  const completion = await groq.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content: AHMED_PROFILE,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return completion.choices?.[0]?.message?.content || "";
}

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const selectedModel = getSelectedModel(req.body.model);

    if (!userMessage) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    if (!providerIsReady(selectedModel.provider)) {
      return res.status(400).json({
        error: selectedModel.provider + " is not configured. Check your .env file.",
      });
    }

    let reply = "";

    if (selectedModel.provider === "gemini") {
      reply = await generateGeminiReply(userMessage, selectedModel.model);
    }

    if (selectedModel.provider === "groq") {
      reply = await generateGroqReply(userMessage, selectedModel.model);
    }

    res.json({
      reply,
      modelUsed: selectedModel.label,
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    res.status(500).json({
      error: error.message || "Something went wrong with the chatbot.",
    });
  }
});

async function streamGeminiReply(userMessage, modelName, res) {
  const stream = await gemini.models.generateContentStream({
    model: modelName,
    contents: userMessage,
    config: {
      systemInstruction: AHMED_PROFILE,
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      res.write(chunk.text);
    }
  }
}

async function streamGroqReply(userMessage, modelName, res) {
  if (!groq) {
    throw new Error("Groq API key is missing.");
  }

  const stream = await groq.chat.completions.create({
    model: modelName,
    stream: true,
    messages: [
      {
        role: "system",
        content: AHMED_PROFILE,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content;

    if (text) {
      res.write(text);
    }
  }
}

app.post("/api/chat-stream", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const selectedModel = getSelectedModel(req.body.model);

    if (!userMessage) {
      return res.status(400).send("Message is required.");
    }

    if (!providerIsReady(selectedModel.provider)) {
      return res
        .status(400)
        .send(selectedModel.provider + " is not configured. Check your .env file.");
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (selectedModel.provider === "gemini") {
      await streamGeminiReply(userMessage, selectedModel.model, res);
    }

    if (selectedModel.provider === "groq") {
      await streamGroqReply(userMessage, selectedModel.model, res);
    }

    res.end();
  } catch (error) {
    console.error("Streaming chatbot error:", error);

    if (!res.headersSent) {
      return res.status(500).send("Something went wrong while streaming the response.");
    }

    res.write("Something went wrong while streaming the response.");
    res.end();
  }
});

const PORT = process.env.PORT || 5000;

function openBrowser(url) {
  const platform = process.platform;

  if (platform === "win32") {
    exec(`cmd /c start "" "${url}"`);
  } else if (platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

app.listen(PORT, () => {
  const resetUrl = "http://localhost:" + PORT + "/reset";

  console.log("Gemini/Groq chatbot running at http://localhost:" + PORT);
  console.log("Opening clean login page...");
  console.log("Reset URL: " + resetUrl);

  openBrowser(resetUrl);
});