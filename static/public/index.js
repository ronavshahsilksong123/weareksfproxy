"use strict";

const form         = document.getElementById("uv-form");
const address      = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = search(address.value, searchEngine.value);
  address.value = "";
  showProxy();
  newTab("/tab?page=" + __uv$config.encodeUrl(url));
});

function goHome() { closeAllTabs(); hideProxy(); }

function showProxy() {
  const d = document.getElementById("proxy-div");
  d.classList = ["show-proxy-div"];
  d.style.display = "block";
}

function hideProxy() {
  const d = document.getElementById("proxy-div");
  d.classList = ["hide-proxy-div"];
  d.style.display = "none";
}

function quickNav(rawUrl) {
  const url = search(rawUrl, searchEngine.value);
  showProxy();
  newTab("/tab?page=" + __uv$config.encodeUrl(url));
}

const DEFAULT_BOOKMARKS = [
  { name: "Blooket",  url: "https://blooket.com" },
  { name: "Kahoot",   url: "https://kahoot.it" },
  { name: "Quizlet",  url: "https://quizlet.com" },
  { name: "YouTube",  url: "https://youtube.com" },
];

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem("ksf_bookmarks")) || DEFAULT_BOOKMARKS;
  } catch { return DEFAULT_BOOKMARKS; }
}

function saveBookmarks(arr) {
  localStorage.setItem("ksf_bookmarks", JSON.stringify(arr));
}

function renderBookmarks() {
  const container = document.getElementById("bookmarks");
  const bookmarks = getBookmarks();
  container.innerHTML = "";

  bookmarks.forEach((bm, i) => {
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(bm.url).hostname)}&sz=48`;
    const btn = document.createElement("button");
    btn.className = "bookmark-btn";
    btn.innerHTML = `<img src="${favicon}" alt="${bm.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\'><rect width=\\'48\\' height=\\'48\\' rx=\\'10\\' fill=\\'%234e4e52\\'/>\\</svg>'"><p>${bm.name}</p>`;
    btn.onclick = () => quickNav(bm.url);
    btn.oncontextmenu = (e) => { e.preventDefault(); removeBookmark(i); };
    container.appendChild(btn);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "bookmark-btn";
  addBtn.id = "add-bookmark-btn";
  addBtn.innerHTML = `<div class="add-icon">+</div><p>Add</p>`;
  addBtn.onclick = openAddModal;
  container.appendChild(addBtn);
}

function removeBookmark(index) {
  const arr = getBookmarks();
  arr.splice(index, 1);
  saveBookmarks(arr);
  renderBookmarks();
}

function openAddModal() {
  document.getElementById("add-modal-overlay").style.display = "block";
  document.getElementById("add-modal").style.display        = "flex";
  document.getElementById("modal-name").value = "";
  document.getElementById("modal-url").value  = "";
  document.getElementById("modal-name").focus();
}

function closeAddModal() {
  document.getElementById("add-modal-overlay").style.display = "none";
  document.getElementById("add-modal").style.display        = "none";
}

function saveBookmark() {
  let name = document.getElementById("modal-name").value.trim();
  let url  = document.getElementById("modal-url").value.trim();
  if (!url) return;
  if (!url.startsWith("http")) url = "https://" + url;
  if (!name) name = new URL(url).hostname;
  const arr = getBookmarks();
  arr.push({ name, url });
  saveBookmarks(arr);
  renderBookmarks();
  closeAddModal();
}

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const s    = now.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = (h % 12) || 12;
  const pad  = n => String(n).padStart(2, "0");
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");
  if (timeEl) timeEl.textContent = `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`;
  if (dateEl) {
    const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
  }
}
updateClock();
setInterval(updateClock, 1000);

function openAIChat() {
  document.getElementById("ai-overlay").style.display = "block";
  document.getElementById("ai-panel").classList.add("open");
  document.getElementById("ai-input").focus();
}

function closeAIChat() {
  document.getElementById("ai-overlay").style.display = "none";
  document.getElementById("ai-panel").classList.remove("open");
}

async function sendAIMessage() {
  const input = document.getElementById("ai-input");
  const msgs  = document.getElementById("ai-messages");
  const text  = input.value.trim();
  if (!text) return;
  input.value = "";

  const userEl = document.createElement("div");
  userEl.className = "ai-msg user";
  userEl.textContent = text;
  msgs.appendChild(userEl);

  const typingEl = document.createElement("div");
  typingEl.className = "ai-msg bot ai-typing";
  typingEl.innerHTML = '<div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>';
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a helpful assistant embedded in KSF Proxy. Keep answers concise." },
          { role: "user",   content: text }
        ],
        max_tokens: 512
      })
    });
    const data = await res.json();
    typingEl.remove();
    const botEl = document.createElement("div");
    botEl.className = "ai-msg bot";
    const reply = data.choices?.[0]?.message?.content
      || (typeof data.error === "string" ? data.error : data.error?.message)
      || "No response.";
    botEl.textContent = reply;
    msgs.appendChild(botEl);
  } catch (err) {
    typingEl.remove();
    const errEl = document.createElement("div");
    errEl.className = "ai-msg bot";
    errEl.textContent = "⚠ " + err.message;
    msgs.appendChild(errEl);
  }
  msgs.scrollTop = msgs.scrollHeight;
}

const CMD_ITEMS = [
  { icon: "fa-home",     label: "Go Home",          action: () => { goHome(); closeCommandPalette(); } },
  { icon: "fa-gamepad",  label: "Games",             action: () => { window.location.href = "/games"; } },
  { icon: "fa-th",       label: "Apps",              action: () => { window.location.href = "/apps"; } },
  { icon: "fa-gear",     label: "Settings",          action: () => { window.location.href = "/settings"; } },
  { icon: "fa-robot",    label: "Open AI Chat",      action: () => { openAIChat(); closeCommandPalette(); } },
  { icon: "fa-music",    label: "Music",             action: () => { quickNav("https://monochrome.tf/"); closeCommandPalette(); } },
  { icon: "fa-bookmark", label: "Add Bookmark",      action: () => { openAddModal(); closeCommandPalette(); } },
  { icon: "fa-search",   label: "Search...",         shortcut: "type to search", action: null },
  { icon: "fa-sign-out", label: "Lock / Re-prompt",  action: () => { localStorage.removeItem("ksf_authed"); location.reload(); } },
];

function openCommandPalette() {
  document.getElementById("cmd-overlay").style.display = "block";
  const pal = document.getElementById("cmd-palette");
  pal.style.display = "block";
  const inp = document.getElementById("cmd-input");
  inp.value = "";
  renderCmdResults("");
  inp.focus();
}

function closeCommandPalette() {
  document.getElementById("cmd-overlay").style.display = "none";
  document.getElementById("cmd-palette").style.display = "none";
}

function renderCmdResults(q) {
  const container = document.getElementById("cmd-results");
  container.innerHTML = "";
  const filtered = q
    ? CMD_ITEMS.filter(i => i.label.toLowerCase().includes(q.toLowerCase()))
    : CMD_ITEMS;

  if (!filtered.length) {
    container.innerHTML = '<div class="cmd-section-label">No results</div>';
    return;
  }

  filtered.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "cmd-item" + (idx === 0 ? " active" : "");
    el.innerHTML = `<i class="fa ${item.icon}"></i><span>${item.label}</span>${item.shortcut ? `<span class="cmd-shortcut">${item.shortcut}</span>` : ""}`;
    el.onclick = () => {
      if (item.action) {
        item.action();
      } else {
        if (q) {
          const url = search(q, document.getElementById("uv-search-engine").value);
          showProxy();
          newTab("/tab?page=" + __uv$config.encodeUrl(url));
        }
        closeCommandPalette();
      }
    };
    container.appendChild(el);
  });

  if (q) {
    const searchEl = document.createElement("div");
    searchEl.className = "cmd-item";
    searchEl.innerHTML = `<i class="fa fa-search"></i><span>Search for "<b>${q}</b>"</span>`;
    searchEl.onclick = () => {
      const url = search(q, document.getElementById("uv-search-engine").value);
      showProxy();
      newTab("/tab?page=" + __uv$config.encodeUrl(url));
      closeCommandPalette();
    };
    container.insertBefore(searchEl, container.firstChild);
  }
}

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    const pal = document.getElementById("cmd-palette");
    if (pal && pal.style.display === "block") closeCommandPalette();
    else openCommandPalette();
  }
  if (e.key === "Escape") {
    closeCommandPalette();
    closeAIChat();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderBookmarks();

  document.getElementById("modal-url").addEventListener("keydown", e => {
    if (e.key === "Enter") saveBookmark();
  });
  document.getElementById("modal-name").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("modal-url").focus();
  });

  const aiIn = document.getElementById("ai-input");
  if (aiIn) aiIn.addEventListener("keydown", e => { if (e.key === "Enter") sendAIMessage(); });

  const cmdIn = document.getElementById("cmd-input");
  if (cmdIn) {
    cmdIn.addEventListener("input", () => renderCmdResults(cmdIn.value));
    cmdIn.addEventListener("keydown", e => {
      if (e.key === "Escape") closeCommandPalette();
      if (e.key === "Enter") {
        const active = document.querySelector(".cmd-item.active");
        if (active) active.click();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = [...document.querySelectorAll(".cmd-item")];
        const cur   = items.findIndex(i => i.classList.contains("active"));
        items[cur]?.classList.remove("active");
        const next  = e.key === "ArrowDown" ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length;
        items[next]?.classList.add("active");
        items[next]?.scrollIntoView({ block: "nearest" });
      }
    });
  }

  const stored = localStorage.getItem("ksf_search_engine");
  if (stored) {
    const se = document.getElementById("uv-search-engine");
    if (se) se.value = stored;
  }
});
