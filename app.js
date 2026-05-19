(function () {
  const screens = {
    welcome: document.getElementById("screen-welcome"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };

  const btnStart = document.getElementById("btn-start");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnRetry = document.getElementById("btn-retry");
  const btnShare = document.getElementById("btn-share");
  const btnCopyImage = document.getElementById("btn-copy-image");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const questionText = document.getElementById("question-text");
  const optionsList = document.getElementById("options-list");
  const resultCard = document.getElementById("result-card");
  const resultAvatar = document.getElementById("result-avatar");
  const resultName = document.getElementById("result-name");
  const resultType = document.getElementById("result-type");
  const resultDesc = document.getElementById("result-desc");
  const resultTraits = document.getElementById("result-traits");
  const resultMatch = document.getElementById("result-match");
  const sceneSection = document.getElementById("scene-section");
  const sceneImage = document.getElementById("scene-image");
  const sceneLoading = document.getElementById("scene-loading");
  const sceneCaption = document.getElementById("scene-caption");
  const shareStatus = document.getElementById("share-status");

  let currentIndex = 0;
  const answers = new Array(QUESTIONS.length).fill(null);
  let lastResult = null;

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function renderQuestion() {
    const q = QUESTIONS[currentIndex];
    const total = QUESTIONS.length;
    const pct = ((currentIndex + 1) / total) * 100;

    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${currentIndex + 1} / ${total}`;
    questionText.textContent = q.text;

    optionsList.innerHTML = "";
    q.options.forEach((opt, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", answers[currentIndex] === i ? "true" : "false");
      if (answers[currentIndex] === i) btn.classList.add("selected");

      const letter = String.fromCharCode(65 + i);
      btn.innerHTML = `<span class="option-letter">${letter}</span><span class="option-label">${opt.label}</span>`;

      btn.addEventListener("click", () => {
        answers[currentIndex] = i;
        renderQuestion();
        btnNext.disabled = false;
      });

      li.appendChild(btn);
      optionsList.appendChild(li);
    });

    btnPrev.disabled = currentIndex === 0;
    btnNext.textContent = currentIndex === total - 1 ? "揭晓结果" : "下一题";
    btnNext.disabled = answers[currentIndex] == null;
  }

  function computeUserVector() {
    const sum = { EI: 0, SN: 0, TF: 0, JP: 0 };
    QUESTIONS.forEach((q, qi) => {
      const optIdx = answers[qi];
      if (optIdx == null) return;
      const opt = q.options[optIdx];
      DIMENSIONS.forEach((dim) => {
        if (opt.scores[dim] != null) sum[dim] += opt.scores[dim];
      });
    });
    return sum;
  }

  function vectorToMbti(v) {
    return [
      v.EI >= 0 ? "E" : "I",
      v.SN >= 0 ? "S" : "N",
      v.TF >= 0 ? "T" : "F",
      v.JP >= 0 ? "J" : "P",
    ].join("");
  }

  function distance(a, b) {
    return DIMENSIONS.reduce((acc, dim) => acc + (a[dim] - b[dim]) ** 2, 0);
  }

  function findBestCharacter(userVector) {
    let best = CHARACTERS[0];
    let bestDist = Infinity;

    CHARACTERS.forEach((ch) => {
      const d = distance(userVector, ch.vector);
      if (d < bestDist) {
        bestDist = d;
        best = ch;
      }
    });

    const mbti = vectorToMbti(userVector);
    const mbtiMatch = CHARACTERS.find((c) => c.mbti === mbti);
    if (mbtiMatch) {
      const dMbti = distance(userVector, mbtiMatch.vector);
      if (dMbti <= bestDist + 2) best = mbtiMatch;
    }

    return { character: best, userMbti: mbti, distance: bestDist };
  }

  function setShareButtonsEnabled(enabled) {
    if (btnShare) btnShare.disabled = !enabled;
    if (btnCopyImage) btnCopyImage.disabled = !enabled;
  }

  function loadSceneImage(scenePackage) {
    sceneSection.classList.remove("hidden");
    sceneLoading.classList.remove("hidden");
    sceneImage.classList.add("hidden");
    sceneCaption.textContent = `场景重现：${scenePackage.narrative.zh}`;
    setShareButtonsEnabled(false);
    if (shareStatus) shareStatus.textContent = "场景插画生成中，请稍候…";

    sceneImage.onload = async () => {
      sceneLoading.classList.add("hidden");
      sceneImage.classList.remove("hidden");
      if (!lastResult) return;
      lastResult.sceneReady = true;
      setShareButtonsEnabled(true);
      if (shareStatus) shareStatus.textContent = "场景已生成，正在准备分享图片…";
      try {
        lastResult.shareAssets = await YSTIShare.publishShareAssets(
          lastResult.payload,
          lastResult.scenePackage,
          lastResult.character,
          lastResult.matchPct
        );
        if (shareStatus) {
          shareStatus.textContent =
            "可以分享了。图片直链已就绪（打开链接即为图片）";
        }
      } catch {
        if (shareStatus) shareStatus.textContent = "场景已生成，可以分享（将使用场景图直链）";
      }
    };

    sceneImage.onerror = () => {
      sceneLoading.textContent = "场景图加载较慢，正在重试…";
      const retry = scenePackage.imageUrl + "&retry=" + Date.now();
      setTimeout(() => {
        sceneImage.src = retry;
      }, 2000);
    };

    sceneImage.src = scenePackage.imageUrl;
  }

  async function handleShare() {
    if (!lastResult || !lastResult.scenePackage) return;
    const { character, userMbti, matchPct, scenePackage, payload } = lastResult;

    if (shareStatus) shareStatus.textContent = "正在生成分享图片链接…";
    btnShare.disabled = true;

    try {
      const assets =
        lastResult.shareAssets ||
        (await YSTIShare.publishShareAssets(
          payload,
          scenePackage,
          character,
          matchPct
        ));
      lastResult.shareAssets = assets;

      const shared = await YSTIShare.nativeShare(
        `YSTI · 我的同调者是 ${character.name}`,
        scenePackage.narrative.zh,
        assets.sharePageUrl,
        assets.imageLink
      );

      if (!shared) {
        await YSTIShare.copyText(assets.imageLink);
        if (shareStatus) {
          shareStatus.textContent =
            "已复制图片链接到剪贴板（打开即为图片）。结果页链接：" + assets.sharePageUrl;
        }
      } else if (shareStatus) {
        shareStatus.textContent = "已通过系统分享面板发出";
      }
    } catch (e) {
      if (shareStatus) shareStatus.textContent = "分享失败，请使用「复制图片链接」";
    } finally {
      btnShare.disabled = false;
    }
  }

  async function handleCopyImageLink() {
    if (!lastResult?.shareAssets && !lastResult?.scenePackage) return;
    const url =
      lastResult.shareAssets?.imageLink || lastResult.scenePackage.imageUrl;
    await YSTIShare.copyText(url);
    if (shareStatus) shareStatus.textContent = "图片直链已复制，粘贴到聊天即可作为图片链接打开";
  }

  function showResult() {
    const userVector = computeUserVector();
    const { character, userMbti, distance: dist } = findBestCharacter(userVector);
    const matchPct = Math.max(55, Math.min(99, Math.round(100 - dist * 2.5)));
    const scenePackage = YSTIScene.buildResultPackage(character, answers, userMbti);
    const payload = YSTIShare.buildPayload(
      character,
      [...answers],
      userMbti,
      matchPct,
      scenePackage
    );

    lastResult = {
      character,
      userMbti,
      matchPct,
      scenePackage,
      payload,
      sceneReady: false,
      shareAssets: null,
    };

    resultCard.className = `result-card element-${character.element}`;
    resultAvatar.textContent = character.emoji;
    resultName.textContent = character.name;
    resultType.textContent = `你的倾向：${userMbti} · 同调档案 ${character.mbti}`;
    resultDesc.textContent = character.desc;
    resultTraits.innerHTML = character.traits
      .map((t) => `<span class="trait-chip">${t}</span>`)
      .join("");
    resultMatch.textContent = `与 ${character.name} 的性格同调度约为 ${matchPct}%`;

    setShareButtonsEnabled(false);
    if (shareStatus) shareStatus.textContent = "";
    loadSceneImage(scenePackage);

    showScreen("result");
  }

  function resetQuiz() {
    currentIndex = 0;
    answers.fill(null);
    lastResult = null;
    sceneImage.src = "";
    sceneImage.classList.add("hidden");
    sceneLoading.classList.remove("hidden");
    sceneLoading.textContent = "正在根据你的二十问选择生成场景插画…";
    sceneSection.classList.add("hidden");
    setShareButtonsEnabled(false);
    if (shareStatus) shareStatus.textContent = "";
    renderQuestion();
    showScreen("welcome");
  }

  btnStart.addEventListener("click", () => {
    currentIndex = 0;
    answers.fill(null);
    renderQuestion();
    showScreen("quiz");
  });

  btnPrev.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  });

  btnNext.addEventListener("click", () => {
    if (answers[currentIndex] == null) return;
    if (currentIndex < QUESTIONS.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      showResult();
    }
  });

  btnRetry.addEventListener("click", resetQuiz);
  if (btnShare) btnShare.addEventListener("click", handleShare);
  if (btnCopyImage) btnCopyImage.addEventListener("click", handleCopyImageLink);
})();
