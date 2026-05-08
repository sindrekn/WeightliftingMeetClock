const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8082;

// Simple HTTP server to serve the HTML files
const httpServer = http.createServer((req, res) => {
  let filePath = "./display.html";
  if (req.url === "/remote") filePath = "./remote.html";

  fs.readFile(path.join(__dirname, filePath), (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

// WebSocket server for relaying commands
const wss = new WebSocketServer({ server: httpServer });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);

  ws.on("message", (msg) => {
    // Relay every message to all OTHER clients
    for (const client of clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(msg.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  let localIP = "localhost";
  for (const name of Object.values(nets)) {
    for (const net of name) {
      if (net.family === "IPv4" && !net.internal) {
        localIP = net.address;
      }
    }
  }
  console.log(`\n✅ Timer server running!`);
  console.log(`\n   Display (put THIS on the Mac fullscreen):`);
  console.log(`   http://${localIP}:${PORT}\n`);
  console.log(`   Remote control (open on your phone):`);
  console.log(`   http://${localIP}:${PORT}/remote\n`);
});
