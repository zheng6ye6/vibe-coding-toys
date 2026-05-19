/**
 * 分享：公众号式卡片链接（/s/token）+ OG 预览图
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

  function getOrigin() {
    return window.location.origin;
  }

  function buildSocialShareUrl(payload) {
    return `${getOrigin()}/s/${encodePayload(payload)}`;
  }

  function buildPayload(character, answers, userMbti, matchPct, scenePackage, ogImage) {
    return {
      v: 2,
      cid: character.id,
      characterName: character.name,
      answers,
      mbti: userMbti,
      match: matchPct,
      seed: scenePackage.seed,
      ogImage: ogImage || scenePackage.imageUrl,
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

  function drawImageCover(ctx, img, dx, dy, dw, dh) {
    const ir = img.width / img.height;
    const dr = dw / dh;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (ir > dr) {
      sw = img.height * dr;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / dr;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  async function createShareCardImageBlob(options) {
    const {
      sceneImageUrl,
      characterName,
      userMbti,
      matchPct,
      flair,
      elementColor,
    } = options;

    const W = 1080;
    const H = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#12182b");
    grad.addColorStop(0.5, "#1a2240");
    grad.addColorStop(1, "#0a0e1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const imgAreaH = Math.round(W * (1248 / 832));
    try {
      const img = await YSTIScene.preloadImage(sceneImageUrl);
      drawImageCover(ctx, img, 0, 100, W, imgAreaH);
      const fade = ctx.createLinearGradient(0, 100 + imgAreaH - 100, 0, 100 + imgAreaH);
      fade.addColorStop(0, "rgba(10,14,26,0)");
      fade.addColorStop(1, "rgba(10,14,26,0.98)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 100 + imgAreaH - 100, W, 100);
    } catch {
      ctx.fillStyle = "#1e2642";
      ctx.fillRect(0, 100, W, imgAreaH);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = elementColor || "#f0d78c";
    ctx.font = "bold 64px Georgia, serif";
    ctx.fillText("YSTI", W / 2, 80);

    ctx.fillStyle = "#e8e4dc";
    ctx.font = "bold 52px Georgia, serif";
    ctx.fillText(characterName, W / 2, 100 + imgAreaH + 70);

    ctx.fillStyle = "#5b8def";
    ctx.font = "30px sans-serif";
    ctx.fillText(`倾向 ${userMbti} · 同调 ${matchPct}%`, W / 2, 100 + imgAreaH + 120);

    ctx.textAlign = "left";
    ctx.fillStyle = "#9aa3b8";
    ctx.font = "26px sans-serif";
    wrapText(ctx, (flair || "").slice(0, 100), 56, 100 + imgAreaH + 170, W - 112, 34);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(212, 168, 83, 0.85)";
    ctx.font = "24px sans-serif";
    ctx.fillText("点击链接 · 开启提瓦特性格试炼", W / 2, H - 48);

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
    let ogImage = sceneImageUrl;
    const pal = YSTIDecor.ELEMENT_PALETTE[character.element];

    try {
      const blob = await createShareCardImageBlob({
        sceneImageUrl,
        characterName: character.name,
        userMbti: payload.mbti,
        matchPct,
        flair: character.flair,
        elementColor: pal?.c1,
      });
      ogImage = await uploadToCatbox(blob, `ysti-${character.id}.png`);
    } catch {
      /* 使用场景竖图作为 OG */
    }

    const fullPayload = { ...payload, ogImage, characterName: character.name };
    const socialShareUrl = buildSocialShareUrl(fullPayload);

    return {
      socialShareUrl,
      ogImage,
      sceneImageUrl,
    };
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  async function nativeShare(title, text, url) {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      if (e.name === "AbortError") return true;
      return false;
    }
  }

  return {
    encodePayload,
    decodePayload,
    buildSocialShareUrl,
    buildPayload,
    publishShareAssets,
    copyText,
    nativeShare,
  };
})();
