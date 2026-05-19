/**
 * YSTI 本地服务：静态资源 + 公众号式分享页（OG 预览图 + 点击进入首页）
 * 启动：npm start  →  http://localhost:3456
 */
const express = require("express");
const path = require("path");

const app = express();
const ROOT = __dirname;
const PORT = process.env.PORT || 3456;
const CLOSE_DIV = "</" + "div>";

function decodeToken(token) {
  let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const json = decodeURIComponent(escape(Buffer.from(b64, "base64").toString("utf8")));
  return JSON.parse(json);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.use(express.static(ROOT));

app.get("/s/:token", (req, res) => {
  let data;
  try {
    data = decodeToken(req.params.token);
  } catch {
    return res.redirect("/index.html");
  }

  const name = escapeHtml(data.characterName || "提瓦特行者");
  const mbti = escapeHtml(data.mbti || "");
  const match = data.match != null ? data.match : "";
  const ogImage = escapeHtml(data.ogImage || "");
  const pageUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const title = `YSTI · 我的同调者是 ${name}`;
  const desc = `性格倾向 ${mbti}${match ? ` · 同调 ${match}%` : ""}。点击开启原神性格试炼`;

  const imgPart = ogImage
    ? `<img src="${ogImage}" alt="${title}" />`
    : `<div class="share-placeholder">${CLOSE_DIV}`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${ogImage}" />
  <style>
    body{margin:0;background:#0a0e1a;color:#e8e4dc;font-family:Georgia,serif}
    .share-landing{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:1rem}
    .share-landing a.card{display:block;max-width:420px;width:100%;text-decoration:none;color:inherit;border-radius:12px;overflow:hidden;border:1px solid rgba(212,168,83,.3)}
    .share-landing img{width:100%;display:block;aspect-ratio:5/7;object-fit:cover;background:#12182b}
    .share-placeholder{height:280px;background:#12182b}
    .share-landing .cta{padding:1.25rem;text-align:center;background:linear-gradient(180deg,rgba(22,28,48,.95),#0a0e1a)}
    .share-landing .cta h1{font-size:1.35rem;color:#f0d78c;margin:0 0 .5rem}
    .share-landing .cta p{font-size:.9rem;color:#9aa3b8;margin:0 0 1rem}
    .share-landing .btn{display:inline-block;padding:.75rem 2rem;background:linear-gradient(180deg,#f0d78c,#d4a853);color:#0a0e1a;border-radius:999px;font-weight:600}
  </style>
</head>
<body>
  <div class="share-landing">
    <a class="card" href="/index.html">
      ${imgPart}
      <${"motion" === "motion" ? "div" : "span"} class="cta">
        <h1>${title}</h1>
        <p>${desc}</p>
        <span class="btn">接受原神的考验 →</span>
      ${CLOSE_DIV}
    </a>
  ${CLOSE_DIV}
</body>
</html>`;

  res.type("html").send(html);
});

app.listen(PORT, () => {
  console.log(`YSTI 运行于 http://localhost:${PORT}`);
});
