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
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const questionText = document.getElementById("question-text");
  const optionsList = document.getElementById("options-list");
  const resultCard = document.getElementById("result-card");
  const resultAvatar = document.getElementById("result-avatar");
  const resultName = document.getElementById("result-name");
  const resultType = document.getElementById("result-type");
  const resultFlair = document.getElementById("result-flair");
  const resultDesc = document.getElementById("result-desc");
  const resultTraits = document.getElementById("result-traits");
  const resultMatch = document.getElementById("result-match");
  const radarCanvas = document.getElementById("radar-canvas");
  const radarLegend = document.getElementById("radar-legend");
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

  function setShareEnabled(enabled) {
    if (btnShare) btnShare.disabled = !enabled;
  }

  function renderRadar() {
    const { weights } = YSTIRadar.computeWeights(answers);
    const pal = YSTIDecor.ELEMENT_PALETTE[lastResult?.character?.element];
    YSTIRadar.draw(radarCanvas, weights, pal?.c1 || "#d4a853");
    YSTIRadar.renderLegend(radarLegend, weights);
    lastResult.weights = weights;
  }

  function loadSceneImage(scenePackage) {
    sceneSection.classList.remove("hidden");
    sceneLoading.classList.remove("hidden");
    sceneImage.classList.add("hidden");
    sceneCaption.textContent = `场景重现：${scenePackage.narrative.zh}`;
    setShareEnabled(false);
    if (shareStatus) shareStatus.textContent = "场景插画生成中，请稍候…";

    sceneImage.onload = async () => {
      sceneLoading.classList.add("hidden");
      sceneImage.classList.remove("hidden");
      if (!lastResult) return;
      lastResult.sceneReady = true;
      if (shareStatus) shareStatus.textContent = "正在生成可分享的试炼卡片…";
      try {
        const payload = YSTIShare.buildPayload(
          lastResult.character,
          [...answers],
          lastResult.userMbti,
          lastResult.matchPct,
          lastResult.scenePackage,
          null
        );
        lastResult.shareAssets = await YSTIShare.publishShareAssets(
          payload,
          lastResult.scenePackage,
          lastResult.character,
          lastResult.matchPct
        );
        setShareEnabled(true);
        if (shareStatus) {
          shareStatus.textContent =
            "分享链接已就绪：好友将看到结果卡片预览，点击即可开始 YSTI 试炼";
        }
      } catch {
        setShareEnabled(true);
        if (shareStatus) shareStatus.textContent = "可分享（请使用 npm start 启动服务以获得最佳卡片预览）";
      }
    };

    sceneImage.onerror = () => {
      sceneLoading.textContent = "场景图加载较慢，正在重试…";
      setTimeout(() => {
        sceneImage.src = scenePackage.imageUrl + "&retry=" + Date.now();
      }, 2500);
    };

    sceneImage.src = scenePackage.imageUrl;
  }

  async function handleShare() {
    if (!lastResult?.scenePackage) return;
    const { character, scenePackage } = lastResult;

    if (shareStatus) shareStatus.textContent = "正在准备分享…";
    btnShare.disabled = true;

    try {
      const assets =
        lastResult.shareAssets ||
        (await YSTIShare.publishShareAssets(
          YSTIShare.buildPayload(
            character,
            [...answers],
            lastResult.userMbti,
            lastResult.matchPct,
            scenePackage,
            null
          ),
          scenePackage,
          character,
          lastResult.matchPct
        ));
      lastResult.shareAssets = assets;

      const url = assets.socialShareUrl;
      const shared = await YSTIShare.nativeShare(
        `YSTI · 我的同调者是 ${character.name}`,
        "点击查看结果卡片，开启提瓦特性格试炼",
        url
      );

      if (!shared) {
        await YSTIShare.copyText(url);
        if (shareStatus) {
          shareStatus.textContent =
            "分享链接已复制。发到微信/QQ 后会显示结果图预览，好友点击即可开始试炼";
        }
      } else if (shareStatus) {
        shareStatus.textContent = "已通过系统分享发出";
      }
    } catch {
      if (shareStatus) shareStatus.textContent = "分享失败，请确认已用 npm start 启动服务后重试";
    } finally {
      btnShare.disabled = false;
    }
  }

  function showResult() {
    const userVector = computeUserVector();
    const { character, userMbti, distance: dist } = findBestCharacter(userVector);
    const matchPct = Math.max(55, Math.min(99, Math.round(100 - dist * 2.5)));
    const scenePackage = YSTIScene.buildResultPackage(character, answers, userMbti);

    lastResult = {
      character,
      userMbti,
      matchPct,
      scenePackage,
      sceneReady: false,
      shareAssets: null,
    };

    resultCard.className = `result-card element-${character.element} char-${character.id}`;
    YSTIDecor.mount(resultCard, character);

    resultAvatar.textContent = character.emoji;
    resultName.textContent = character.name;
    resultType.textContent = `你的倾向：${userMbti} · 同调档案 ${character.mbti}`;
    resultFlair.textContent = character.flair || "";
    resultDesc.textContent = character.desc;
    resultTraits.innerHTML = character.traits
      .map((t) => `<span class="trait-chip">${t}</span>`)
      .join("");
    resultMatch.textContent = `与 ${character.name} 的性格同调度约为 ${matchPct}%`;

    renderRadar();
    setShareEnabled(false);
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
    setShareEnabled(false);
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
})();
