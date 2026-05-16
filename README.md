# Nova Chat

Nova Chat is a modern AI chatbot portfolio assistant built with Node.js, Express, Gemini, Groq, HTML, CSS, and JavaScript.

The chatbot is designed to answer questions about **Ahmed Ghroubi**, including his CV, skills, projects, education, experience, languages, and career goals. It can also answer general questions like a normal AI chatbot.

This project was created as a portfolio project to demonstrate AI integration, frontend design, backend development, API usage, and interactive chatbot functionality.

---
## Main Purpose

Nova Chat was built to help recruiters, employers, and visitors learn more about me in an interactive way.

The chatbot can answer questions such as:

- Who is Ahmed Ghroubi?
- What are Ahmed's technical skills?
- What projects has Ahmed worked on?
- What is Ahmed's educational background?
- Why should we hire Ahmed?
- What programming languages does Ahmed know?
- What experience does Ahmed have with data science and web development?
- What are Ahmed's career goals?

Besides portfolio questions, the chatbot can also answer general questions.

---

## Project Preview

The following images show the main parts of the chatbot interface, including the login page, the home dashboard, and the chat interface with model selection.

### Login Page

The login page provides a clean entry point for users. Since this is a demo project, users can enter any username and password to access the chatbot dashboard.

![Login Page](https://github.com/ahmed-ghroubi/chatbot-project/blob/main/screenshots/dashboard.png)

---

### Home Dashboard

The home dashboard introduces the AI portfolio assistant and provides recruiter-focused suggestion cards. These cards help users quickly ask about skills, projects, education, experience, and career background.

![Home Dashboard](https://github.com/ahmed-ghroubi/chatbot-project/blob/main/screenshots/dashboard.png)

---

### Chat Interface with Model Selection

The chat interface allows users to send messages, receive streaming AI responses, manage conversations, delete chats, and choose between available AI models such as Gemini and Groq.

![Chat Interface with Model Selection](https://github.com/ahmed-ghroubi/chatbot-project/blob/main/screenshots/dashoard%20with%20models%20.png)

## Features

- Modern responsive chatbot interface
- Login page
- Chat dashboard
- Chat history using localStorage
- Delete individual conversations
- Clear all conversations
- Search conversations
- Model selector
- Gemini model support
- Groq model support
- Streaming AI responses
- Recruiter-focused suggestion cards
- Portfolio assistant for Ahmed Ghroubi
- Answers questions about my CV, skills, education, experience, and projects
- General chatbot functionality
- Environment variable configuration with `.env`
- Separated frontend files: HTML, CSS, and JavaScript
- Separated backend and data files

---

## Technologies Used

- Node.js
- Express.js
- JavaScript
- HTML
- CSS
- Gemini API
- Groq API
- dotenv
- localStorage

---

## Project Structure

```text
chatbot-project/
│
├── data/
│   ├── ahmedProfile.js
│   └── aiModels.js
│
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
│
├── assets/
│   └── screenshots/
│       ├── login-page.png
│       ├── home-dashboard.png
│       └── chat-interface.png
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

---

## Requirements

Before running this project, make sure you have:

- Node.js installed
- npm installed
- A Gemini API key
- Optional: a Groq API key

Gemini is required because it is the default model provider.

Groq is optional. If no Groq API key is provided, the app can still run with Gemini, but Groq models will not appear in the model selector.

---

## API Keys

This project uses API keys through environment variables.

The real `.env` file is not included in this repository for security reasons.

You must create your own `.env` file locally.

---

## How to Get a Gemini API Key

1. Go to Google AI Studio.
2. Sign in with your Google account.
3. Create an API key.
4. Copy the key.
5. Paste it into your `.env` file as `GEMINI_API_KEY`.

Search online for:

```text
Google AI Studio API key
```

---

## How to Get a Groq API Key

1. Go to GroqCloud.
2. Create or log in to your account.
3. Open the API Keys section.
4. Create a new API key.
5. Copy the key.
6. Paste it into your `.env` file as `GROQ_API_KEY`.

Search online for:

```text
GroqCloud API key
```

Groq keys usually start with:

```text
gsk_
```

---

## Environment Variables

This repository includes a file called:

```text
.env.example
```

It shows which environment variables are needed.

Your `.env.example` should look like this:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

To run the project, copy `.env.example` and rename the copy to `.env`.

---

## Running the Project

Start the server:

```bash
npm start
```

Then open this in your browser:

```text
http://localhost:5000
```

The app will open with a login page.

For the demo login, you can enter any username and any password.

---

## Model Selection

Nova Chat supports multiple AI providers.

The available models are loaded from the backend.

If only the Gemini key is configured, only Gemini models will appear.

If both Gemini and Groq keys are configured, Gemini and Groq models will appear in the model selector.

---

## Portfolio Assistant Data

The chatbot uses a local profile file:

```text
data/ahmedProfile.js
```

This file contains information about Ahmed Ghroubi, including:

- Personal profile
- Education
- Technical skills
- Projects
- Experience
- Languages
- Career goals

The AI uses this information to answer recruiter-focused questions about Ahmed.

---

## Author

Ahmed Ghroubi

GitHub: https://github.com/ahmed-ghroubi
