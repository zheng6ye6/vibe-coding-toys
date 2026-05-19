/**
 * 分享：生成可访问的图片直链 + 结果页链接，并支持系统分享
 */
const YSTIShare = (function () {
  const CATBOX_URL = "https://catbox.moe/user/api.php";

  function encodePayload(payload) {
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  function decodePayload(token) {
    let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  }

  function getPageBase() {
    const path = window.location.pathname.replace(/[^/]*$/, "");
    return `${window.location.origin}${path}`;
  }

  function buildSharePageUrl(payload) {
    return `${getPageBase()}share.html?r=${encodePayload(payload)}`;
  }

  function buildPayload(character, answers, userMbti, matchPct, scenePackage) {
    return {
      v: 1,
      cid: character.id,
      answers,
      mbti: userMbti,
      match: matchPct,
      seed: scenePackage.seed,
      ts: Date.now(),
    };
  }

  async function fetchImageBlob(url) {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("fetch image failed");
    return res.blob();
  }

  async function uploadToCatbox(blob, filename) {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", blob, filename);
    const res = await fetch(CATBOX_URL, { method: "POST", body: form });
    if (!res.ok) throw new Error("upload failed");
    const text = (await res.text()).trim();
    if (!text.startsWith("http")) throw new Error("invalid upload response");
    return text;
  }

  /** 将场景图 + 结果信息合成分享卡片并尝试上传，返回图片直链 */
  async function createShareCardImageBlob(options) {
    const {
      sceneImageUrl,
      characterName,
      userMbti,
      matchPct,
      narrativeZh,
    } = options;

    const W = 1080;
    const H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#12182b");
    grad.addColorStop(0.45, "#1a2240");
    grad.addColorStop(1, "#0a0e1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(212, 168, 83, 0.15)";
    ctx.fillRect(0, 0, W, 4);

    try {
      const img = await YSTIScene.preloadImage(sceneImageUrl);
      const imgH = Math.round(W * 0.56);
      ctx.drawImage(img, 0, 120, W, imgH);
      const fade = ctx.createLinearGradient(0, 120 + imgH - 80, 0, 120 + imgH);
      fade.addColorStop(0, "rgba(10,14,26,0)");
      fade.addColorStop(1, "rgba(10,14,26,0.95)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 120 + imgH - 80, W, 80);
    } catch {
      ctx.fillStyle = "#1e2642";
      ctx.fillRect(40, 120, W - 80, Math.round(W * 0.5));
      ctx.fillStyle = "#9aa3b8";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("场景图生成中…", W / 2, 120 + W * 0.25);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#f0d78c";
    ctx.font = "bold 72px Georgia, serif";
    ctx.fillText("YSTI", W / 2, 100);

    ctx.fillStyle = "#e8e4dc";
    ctx.font = "bold 56px Georgia, serif";
    ctx.fillText(characterName, W / 2, 120 + W * 0.56 + 90);

    ctx.fillStyle = "#5b8def";
    ctx.font = "32px sans-serif";
    ctx.fillText(`倾向 ${userMbti} · 同调 ${matchPct}%`, W / 2, 120 + W * 0.56 + 145);

    ctx.textAlign = "left";
    ctx.fillStyle = "#9aa3b8";
    ctx.font = "26px sans-serif";
    wrapText(
      ctx,
      narrativeZh.slice(0, 120) + (narrativeZh.length > 120 ? "…" : ""),
      60,
      120 + W * 0.56 + 210,
      W - 120,
      36
    );

    ctx.fillStyle = "rgba(212, 168, 83, 0.7)";
    ctx.font = "24px sans-serif";
    ctx.fillText("原神性格试炼 · 打开链接查看完整结果", W / 2, H - 80);

    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 0.92);
    });
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split("");
    let line = "";
    let cy = y;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, cy);
        line = chars[i];
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, cy);
  }

  async function publishShareAssets(payload, scenePackage, character, matchPct) {
    const sceneImageUrl = scenePackage.imageUrl;
    const sharePageUrl = buildSharePageUrl(payload);

    let imageLink = sceneImageUrl;
    let cardLink = null;

    try {
      const blob = await createShareCardImageBlob({
        sceneImageUrl,
        characterName: character.name,
        userMbti: payload.mbti,
        matchPct,
        narrativeZh: scenePackage.narrative.zh,
      });
      cardLink = await uploadToCatbox(blob, `ysti-${character.id}.png`);
      imageLink = cardLink;
    } catch {
      /* 上传失败则使用场景 AI 图直链 */
    }

    return {
      sharePageUrl,
      imageLink,
      sceneImageUrl,
      cardLink,
    };
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  async function nativeShare(title, text, url, imageUrl) {
    if (!navigator.share) return false;
    const shareData = { title, text, url };
    try {
      if (imageUrl && navigator.canShare) {
        const blob = await fetchImageBlob(imageUrl);
        const file = new File([blob], "ysti-result.png", { type: "image/png" });
        const withFile = { ...shareData, files: [file] };
        if (navigator.canShare(withFile)) {
          await navigator.share(withFile);
          return true;
        }
      }
      await navigator.share(shareData);
      return true;
    } catch (e) {
      if (e.name === "AbortError") return true;
      return false;
    }
  }

  return {
    encodePayload,
    decodePayload,
    buildSharePageUrl,
    buildPayload,
    publishShareAssets,
    copyText,
    nativeShare,
    createShareCardImageBlob,
  };
})();
