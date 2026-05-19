(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("r");
  const imgParam = params.get("img");

  const loadingEl = document.getElementById("share-loading");
  const contentEl = document.getElementById("share-content");
  const errorEl = document.getElementById("share-error");
  const heroImg = document.getElementById("share-hero-img");
  const charName = document.getElementById("share-char-name");
  const meta = document.getElementById("share-meta");
  const sceneText = document.getElementById("share-scene-text");
  const desc = document.getElementById("share-desc");
  const imageLink = document.getElementById("share-image-link");

  function showError() {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
  }

  function setOg(title, description, imageUrl) {
    document.title = title;
    document.getElementById("og-title").setAttribute("content", title);
    document.getElementById("og-desc").setAttribute("content", description);
    document.getElementById("meta-desc").setAttribute("content", description);
    if (imageUrl) document.getElementById("og-image").setAttribute("content", imageUrl);
  }

  function render(character, payload, scenePackage) {
    const imageUrl = scenePackage.imageUrl;
    heroImg.src = imageUrl;
    charName.textContent = character.name;
    meta.textContent = `倾向 ${payload.mbti} · 同调 ${payload.match}% · ${character.mbti}`;
    sceneText.textContent = `场景重现：${scenePackage.narrative.zh}`;
    desc.textContent = character.desc;
    imageLink.href = imgParam || imageUrl;
    imageLink.textContent = "打开纯图片链接（可直接转发图片 URL）";

    setOg(
      `YSTI · 我的同调者是 ${character.name}`,
      scenePackage.narrative.zh.slice(0, 100),
      imageUrl
    );

    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
  }

  if (imgParam && !token) {
    heroImg.src = imgParam;
    setOg("YSTI 原神性格试炼", "分享结果图", imgParam);
    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
    charName.textContent = "YSTI 试炼结果";
    meta.textContent = "";
    sceneText.textContent = "";
    desc.textContent = "";
    imageLink.href = imgParam;
    return;
  }

  if (!token) {
    showError();
    return;
  }

  try {
    const payload = YSTIShare.decodePayload(token);
    const character = CHARACTERS.find((c) => c.id === payload.cid);
    if (!character || !payload.answers) throw new Error("bad payload");

    const scenePackage = YSTIScene.buildResultPackage(
      character,
      payload.answers,
      payload.mbti
    );
    render(character, payload, scenePackage);
  } catch {
    showError();
  }
})();
