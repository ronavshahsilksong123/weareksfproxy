


(async function initPasswordGate() {
  const gate    = document.getElementById("password-gate");
  const mainApp = document.getElementById("main-app");

  try {
    const r = await fetch("/api/authed");
    const { ok } = await r.json();
    if (ok) { showApp(gate, mainApp, true); return; }
  } catch (_) {}

  gate.style.display = "";
  document.getElementById("pg-input")
    .addEventListener("keydown", e => { if (e.key === "Enter") checkPassword(); });
})();

async function checkPassword() {
  const input = document.getElementById("pg-input");
  const err   = document.getElementById("pg-error");

  try {
    const res  = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: input.value })
    });
    const { ok } = await res.json();

    if (ok) {
      showApp(document.getElementById("password-gate"),
              document.getElementById("main-app"), false);
    } else {
      err.textContent = "Incorrect password.";
      input.value = "";
      input.classList.add("pg-shake");
      setTimeout(() => input.classList.remove("pg-shake"), 500);
    }
  } catch (e) {
    err.textContent = "Server error. Is the server running?";
  }
}

function showApp(gate, mainApp, instant) {
  if (instant) {
    gate.style.display = "none";
    mainApp.style.display = "";
    return;
  }
  gate.style.transition = "opacity 0.4s, transform 0.4s";
  gate.style.opacity    = "0";
  gate.style.transform  = "scale(1.04)";
  setTimeout(() => {
    gate.style.display  = "none";
    mainApp.style.display = "";
    mainApp.style.opacity = "0";
    requestAnimationFrame(() => {
      mainApp.style.transition = "opacity 0.5s";
      mainApp.style.opacity    = "1";
    });
  }, 420);
}
