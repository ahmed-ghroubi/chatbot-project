const loginPage = document.getElementById("loginPage");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");

const sidebarUsername = document.getElementById("sidebarUsername");
const profileAvatar = document.getElementById("profileAvatar");
const logoutBtn = document.getElementById("logoutBtn");
const newChatBtn = document.getElementById("newChatBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const sessionList = document.getElementById("sessionList");
const searchInput = document.getElementById("searchInput");

const mainContent = document.getElementById("mainContent");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const STORAGE_USER = "chatbotUsername";
const STORAGE_SESSIONS = "chatbotSessions";
const STORAGE_ACTIVE = "chatbotActiveSession";
const STORAGE_MODEL = "chatbotSelectedModel";

const TYPING_DELAY = 25;

let chatSessions = JSON.parse(localStorage.getItem(STORAGE_SESSIONS)) || [];
let activeSessionId = localStorage.getItem(STORAGE_ACTIVE) || null;
let searchTerm = "";
let selectedModelId = localStorage.getItem(STORAGE_MODEL) || "gemini-flash";

function saveSessions() {
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(chatSessions));
}

function saveActiveSession() {
  if (activeSessionId) {
    localStorage.setItem(STORAGE_ACTIVE, activeSessionId);
  } else {
    localStorage.removeItem(STORAGE_ACTIVE);
  }
}

function saveSelectedModel() {
  localStorage.setItem(STORAGE_MODEL, selectedModelId);
}

function getUsername() {
  return localStorage.getItem(STORAGE_USER) || "User";
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "U";
}

function createSession() {
  return {
    id: "chat_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    title: "New chat",
    messages: [],
    createdAt: new Date().toISOString()
  };
}

function getActiveSession() {
  return chatSessions.find(session => session.id === activeSessionId);
}

function ensureSession() {
  if (chatSessions.length === 0) {
    const session = createSession();

    chatSessions.push(session);
    activeSessionId = session.id;

    saveSessions();
    saveActiveSession();
  }

  const exists = chatSessions.some(session => session.id === activeSessionId);

  if (!exists) {
    activeSessionId = chatSessions[0].id;
    saveActiveSession();
  }
}

function updateSessionTitle(session) {
  const firstUserMessage = session.messages.find(message => {
    return message.role === "user";
  });

  if (firstUserMessage) {
    session.title =
      firstUserMessage.text.length > 40
        ? firstUserMessage.text.slice(0, 40) + "..."
        : firstUserMessage.text;
  } else {
    session.title = "New chat";
  }
}

function deleteSession(sessionId) {
  chatSessions = chatSessions.filter(session => session.id !== sessionId);

  if (chatSessions.length === 0) {
    const newSession = createSession();
    chatSessions.push(newSession);
    activeSessionId = newSession.id;
  } else if (activeSessionId === sessionId) {
    activeSessionId = chatSessions[0].id;
  }

  saveSessions();
  saveActiveSession();
  renderSessionList();
  renderMainView();
}

async function setupModelSelect() {
  if (document.getElementById("modelSelect")) {
    return;
  }

  const topbar = document.querySelector(".topbar");
  const onlinePill = document.querySelector(".online-pill");

  if (!topbar || !onlinePill) {
    return;
  }

  const actions = document.createElement("div");
  actions.className = "topbar-actions";

  const select = document.createElement("select");
  select.id = "modelSelect";
  select.className = "model-select";

  let models = [
    {
      id: "gemini-flash",
      label: "Gemini 2.5 Flash"
    }
  ];

  try {
    const response = await fetch("/api/models");
    const data = await response.json();

    if (data.models && data.models.length > 0) {
      models = data.models;
    }
  } catch (error) {
    console.error("Could not load models:", error);
  }

  models.forEach(model => {
    const option = document.createElement("option");

    option.value = model.id;
    option.textContent = model.label;

    select.appendChild(option);
  });

  const selectedModelExists = models.some(model => {
    return model.id === selectedModelId;
  });

  if (!selectedModelExists) {
    selectedModelId = models[0].id;
    saveSelectedModel();
  }

  select.value = selectedModelId;

  select.addEventListener("change", event => {
    selectedModelId = event.target.value;
    saveSelectedModel();
  });

  actions.appendChild(select);
  actions.appendChild(onlinePill);

  topbar.appendChild(actions);
}

function renderSessionList() {
  sessionList.innerHTML = "";

  const filteredSessions = chatSessions.filter(session => {
    const title = (session.title || "New chat").toLowerCase();
    return title.includes(searchTerm.toLowerCase());
  });

  filteredSessions.forEach(session => {
    const button = document.createElement("button");

    button.className =
      "session-item" + (session.id === activeSessionId ? " active" : "");

    button.title = session.title || "New chat";

    const titleText = document.createElement("span");
    titleText.className = "session-title-text";
    titleText.textContent = session.title || "New chat";

    const deleteButton = document.createElement("span");
    deleteButton.className = "delete-session-btn";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete chat";

    deleteButton.addEventListener("click", event => {
      event.stopPropagation();
      event.preventDefault();
      deleteSession(session.id);
    });

    button.appendChild(titleText);
    button.appendChild(deleteButton);

    button.addEventListener("click", () => {
      activeSessionId = session.id;

      saveActiveSession();
      renderSessionList();
      renderMainView();
    });

    sessionList.appendChild(button);
  });
}

function createSuggestionCard(type, icon, title, text, prompt) {
  const card = document.createElement("button");
  card.className = "suggestion-card " + type;
  card.type = "button";

  const iconBox = document.createElement("div");
  iconBox.className = "suggestion-icon";
  iconBox.textContent = icon;

  const content = document.createElement("div");

  const cardTitle = document.createElement("div");
  cardTitle.className = "suggestion-title";
  cardTitle.textContent = title;

  const cardText = document.createElement("div");
  cardText.className = "suggestion-text";
  cardText.textContent = text;

  const arrow = document.createElement("div");
  arrow.className = "suggestion-arrow";
  arrow.textContent = "→";

  content.appendChild(cardTitle);
  content.appendChild(cardText);

  card.appendChild(iconBox);
  card.appendChild(content);
  card.appendChild(arrow);

  card.addEventListener("click", () => {
    messageInput.value = prompt;
    messageInput.focus();
  });

  return card;
}

function renderHomeScreen() {
  mainContent.innerHTML = "";

  const home = document.createElement("div");
  home.className = "home-screen";

  const badge = document.createElement("div");
  badge.className = "home-badge";
  badge.innerHTML = "<span>✦</span> Recruiter Q&A Assistant";

  const titleWrap = document.createElement("div");
  titleWrap.className = "hero-title-wrap";

  const title = document.createElement("h1");
  title.className = "hero-title";
  title.innerHTML = 'Discover Ahmed <span class="name-highlight">Ghroubi</span>';

  const titleStars = document.createElement("div");
  titleStars.className = "title-stars";
  titleStars.innerHTML = `
    <span class="sparkle sparkle-small">✦</span>
    <span class="sparkle sparkle-big">✧</span>
  `;

  titleWrap.appendChild(title);
  titleWrap.appendChild(titleStars);

  const subtitle = document.createElement("p");
  subtitle.textContent =
    "I help recruiters learn about Ahmed's skills, projects, education, and experience.";

  const suggestions = document.createElement("div");
  suggestions.className = "suggestion-grid";

  suggestions.appendChild(
    createSuggestionCard(
      "profile",
      "◎",
      "Who is Ahmed Ghroubi?",
      "Get a short professional introduction about Ahmed.",
      "Who is Ahmed Ghroubi?"
    )
  );

  suggestions.appendChild(
    createSuggestionCard(
      "skills",
      "</>",
      "What are Ahmed's skills?",
      "Learn about his data science, programming, and web development skills.",
      "What are Ahmed Ghroubi's technical skills?"
    )
  );

  suggestions.appendChild(
    createSuggestionCard(
      "projects",
      "▣",
      "Tell me about Ahmed's projects",
      "See his chatbot, data analysis, and university project experience.",
      "Tell me about Ahmed Ghroubi's projects."
    )
  );

  suggestions.appendChild(
    createSuggestionCard(
      "hire",
      "♕",
      "Why should we hire Ahmed?",
      "Get a recruiter-focused answer about his strengths and motivation.",
      "Why should we hire Ahmed Ghroubi?"
    )
  );

  home.appendChild(badge);
  home.appendChild(titleWrap);
  home.appendChild(subtitle);
  home.appendChild(suggestions);

  mainContent.appendChild(home);
}

function createMessageElement(role, text) {
  const cleanRole = role === "user" ? "user" : "bot";

  const row = document.createElement("div");
  row.className = "message-row " + cleanRole;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (text === "") {
    bubble.classList.add("typing");
    bubble.textContent = "Typing...";
  } else {
    bubble.textContent = text;
  }

  row.appendChild(bubble);

  return row;
}

function renderChatScreen() {
  mainContent.innerHTML = "";

  const chatArea = document.createElement("div");
  chatArea.className = "chat-area";

  const session = getActiveSession();

  if (!session) {
    return;
  }

  session.messages.forEach(message => {
    const role = message.role || message.type || "bot";
    const text = message.text || "";

    chatArea.appendChild(createMessageElement(role, text));
  });

  mainContent.appendChild(chatArea);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function renderMainView() {
  const session = getActiveSession();

  if (!session || session.messages.length === 0) {
    renderHomeScreen();
  } else {
    renderChatScreen();
  }
}

function showLogin() {
  loginPage.style.display = "flex";
  appShell.style.display = "none";
}

function showApp() {
  loginPage.style.display = "none";
  appShell.style.display = "block";

  const username = getUsername();

  sidebarUsername.textContent = username;
  profileAvatar.textContent = getInitial(username);

  ensureSession();
  renderSessionList();
  renderMainView();
  setupModelSelect();

  setTimeout(() => {
    messageInput.focus();
  }, 50);
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    return;
  }

  localStorage.setItem(STORAGE_USER, username);

  showApp();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_USER);
  showLogin();
});

newChatBtn.addEventListener("click", () => {
  const session = createSession();

  chatSessions.unshift(session);
  activeSessionId = session.id;

  saveSessions();
  saveActiveSession();
  renderSessionList();
  renderMainView();

  messageInput.value = "";
  messageInput.focus();
});

clearAllBtn.addEventListener("click", () => {
  chatSessions = [createSession()];
  activeSessionId = chatSessions[0].id;

  saveSessions();
  saveActiveSession();
  renderSessionList();
  renderMainView();

  messageInput.focus();
});

searchInput.addEventListener("input", event => {
  searchTerm = event.target.value;
  renderSessionList();
});

chatForm.addEventListener("submit", async event => {
  event.preventDefault();

  const userMessage = messageInput.value.trim();

  if (!userMessage) {
    return;
  }

  const session = getActiveSession();

  if (!session) {
    return;
  }

  session.messages.push({
    role: "user",
    text: userMessage
  });

  updateSessionTitle(session);
  saveSessions();
  renderSessionList();
  renderMainView();

  messageInput.value = "";
  sendButton.disabled = true;

  session.messages.push({
    role: "bot",
    text: ""
  });

  saveSessions();
  renderMainView();

  const chatArea = document.querySelector(".chat-area");
  const botBubble = chatArea.lastElementChild.querySelector(".message-bubble");

  try {
    const response = await fetch("/api/chat-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userMessage,
        model: selectedModelId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Request failed.");
    }

    if (!response.body) {
      throw new Error("No response stream received.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullReply = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, {
        stream: true
      });

      fullReply += chunk;

      session.messages[session.messages.length - 1].text = fullReply;

      botBubble.classList.remove("typing");
      botBubble.textContent = fullReply;

      chatArea.scrollTop = chatArea.scrollHeight;

      await new Promise(resolve => setTimeout(resolve, TYPING_DELAY));
    }

    saveSessions();
  } catch (error) {
    const errorMessage =
      error.message ||
      "Something went wrong. Please check your server and try again.";

    session.messages[session.messages.length - 1].text = errorMessage;

    botBubble.classList.remove("typing");
    botBubble.textContent = errorMessage;

    saveSessions();
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
});

function init() {
  const username = localStorage.getItem(STORAGE_USER);

  if (username) {
    showApp();
  } else {
    showLogin();
  }
}

init();