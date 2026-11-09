// Serveur du Fortnite Tracker — Node 18+, aucune dépendance.
// Lance : FORTNITE_API_KEY=ta_cle node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const KEY = process.env.FORTNITE_API_KEY || "";
const BASE = "https://fortnite-api.com";
const cache = new Map();

async function upstream(url, ttlMs) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v;
  const r = await fetch(BASE + url, { headers: KEY ? { Authorization: KEY } : {} });
  const v = { status: r.status, body: await r.json().catch(() => ({})) };
  if (r.status === 200) cache.set(url, { t: Date.now(), v });
  return v;
}

function send(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

async function stats(q, res) {
  const name = q.get("name");
  const type = ["epic", "psn", "xbl"].includes(q.get("platform")) ? q.get("platform") : "epic";
  if (!name) return send(res, 400, { error: "Pseudo manquant." });
  const r = await upstream(`/v2/stats/br/v2?name=${encodeURIComponent(name)}&accountType=${type}`, 60000);
  if (r.status === 404) return send(res, 404, { error: "Joueur introuvable." });
  if (r.status === 403) return send(res, 403, { error: "Profil privé : les stats sont masquées." });
  if (r.status !== 200) return send(res, 502, { error: "Erreur de l’API Fortnite (" + r.status + ")." });
  const d = r.body.data || {};
  const s = d.stats || {};
  const pick = (m) => m ? {
    wins: m.wins, kills: m.kills, kd: m.kd, winRate: m.winRate, matches: m.matches,
    minutesPlayed: m.minutesPlayed, top10: m.top10, score: m.score
  } : {};
  send(res, 200, {
    account: { name: d.account && d.account.name },
    level: d.battlePass ? d.battlePass.level : null,
    modes: {
      all: pick(s.all && s.all.overall), solo: pick(s.all && s.all.solo),
      duo: pick(s.all && s.all.duo), squad: pick(s.all && s.all.squad)
    }
  });
}

async function shop(res) {
  const r = await upstream("/v2/shop", 300000);
  if (r.status !== 200) return send(res, 502, { error: "Boutique indisponible." });
  const entries = (r.body.data && r.body.data.entries) || [];
  const items = entries.map((e) => {
    const it = (e.brItems && e.brItems[0]) || {};
    return {
      name: (e.bundle && e.bundle.name) || it.name || "Objet",
      price: e.finalPrice,
      rarity: (it.rarity && it.rarity.value) || "common",
      image: (e.newDisplayAsset && e.newDisplayAsset.renderImages && e.newDisplayAsset.renderImages[0] && e.newDisplayAsset.renderImages[0].image) || (it.images && it.images.icon) || null
    };
  });
  send(res, 200, { items });
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  try {
    if (u.pathname === "/api/stats") return await stats(u.searchParams, res);
    if (u.pathname === "/api/shop") return await shop(res);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
  } catch (e) {
    send(res, 500, { error: "Erreur serveur." });
  }
}).listen(PORT, () => console.log("Fortnite Tracker sur http://localhost:" + PORT));
