import express from "express";
import { createServer } from "node:http";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { join } from "node:path";
import { hostname } from "node:os";
import { createBareServer } from "@nebula-services/bare-server-node";
import proxy from "express-http-proxy";
import session from "express-session";
import bodyParser from "body-parser";



const SITE_PASSWORD = "enter_passowrd_here";
const groq_api      = "enter_api_here";


const bare = createBareServer("/bare/");
const app  = express();

app.use(bodyParser.json());
app.use(session({
  secret: "changethistojustarandomkeyboardspamgit",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "strict" }
}));

function requireAuth(req, res, next) {
  if (req.session?.authed) return next();
  res.status(401).json({ error: "Unauthorized" });
}

app.post("/api/auth", (req, res) => {
  if (req.body?.password === SITE_PASSWORD) {
    req.session.authed = true;
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.get("/api/authed", (req, res) => {
  res.json({ ok: !!req.session?.authed });
});

app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groq_api}`
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/image/", proxy("https://images.crazygames.com", {
  proxyReqPathResolver: req => req.originalUrl.slice(6)
}));

app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));

app.use((req, res) => {
  res.status(404).sendFile(join(publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res);
  else app(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
  else socket.end();
});

let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8080;

server.on("listening", () => {
  const address = server.address();
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
});

process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);
function shutdown() {
  console.log("Shutting down...");
  server.close();
  bare.close();
  process.exit(0);
}

server.listen(port, "0.0.0.0");
