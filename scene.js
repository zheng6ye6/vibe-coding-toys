/**
 * 根据答题与匹配角色构建场景描述，并生成 AI 插画 URL（Pollinations）
 */
const YSTIScene = (function () {
  const IMAGE_BASE = "https://image.pollinations.ai/prompt/";
  const IMAGE_OPTS = "width=1024&height=576&nologo=true&model=flux";

  const ELEMENT_MOOD = {
    pyro: "warm golden and crimson light, passionate atmosphere",
    hydro: "flowing blue reflections, dynamic water light",
    anemo: "gentle wind, floating petals or leaves",
    electro: "violet lightning accents, dramatic contrast",
    cryo: "cool mist, crystalline snow or frost",
    geo: "amber stone architecture, ancient grandeur",
    dendro: "lush green sanctuary, soft natural glow",
  };

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function questionSceneHint(questionText) {
    const rules = [
      [/社交|聚会/, "a lively social gathering in a fantasy tavern plaza"],
      [/周末|空闲/, "a peaceful weekend moment in a scenic open world"],
      [/问题|讨论|倾诉/, "contemplating a dilemma with companions nearby"],
      [/印象|接近/, "first meeting others on a city street"],
      [/社交之后|疲惫|透支/, "after a long event, quiet rooftop rest"],
      [/学习|工作|信任/, "study or work at a desk with books and tools"],
      [/描述|关注|细节/, "listening carefully to someone's story"],
      [/欣赏/, "watching a respected figure from afar"],
      [/新任务/, "starting a new quest at an adventurers guild"],
      [/觉得自己/, "self reflection at a scenic overlook"],
      [/朋友|伤害|批评/, "an emotional conversation between friends"],
      [/团队|决策/, "a group meeting around a strategy table"],
      [/批评/, "standing alone after receiving harsh words"],
      [/打动/, "a moment of quiet admiration"],
      [/争论/, "a heated debate in a formal hall"],
      [/任务|到期/, "racing against time before a deadline"],
      [/房间|桌面/, "personal room showing lifestyle habits"],
      [/旅行/, "traveling on a road through fantastical lands"],
      [/规则|约定/, "standing before ancient laws or contracts"],
      [/人生节奏/, "a long path stretching toward the horizon"],
    ];
    for (const [re, hint] of rules) {
      if (re.test(questionText)) return hint;
    }
    return "a cinematic moment in a fantasy open world";
  }

  /** 取最能体现性格底色的 3 道题 */
  function getDefiningMoments(answers) {
    const moments = [];
    QUESTIONS.forEach((q, qi) => {
      const optIdx = answers[qi];
      if (optIdx == null) return;
      const opt = q.options[optIdx];
      let strength = 0;
      DIMENSIONS.forEach((dim) => {
        const s = opt.scores[dim];
        if (s != null) strength += Math.abs(s);
      });
      moments.push({
        question: q.text,
        choice: opt.label,
        hint: questionSceneHint(q.text),
        strength,
        index: qi,
      });
    });
    return moments.sort((a, b) => b.strength - a.strength).slice(0, 3);
  }

  function buildSceneNarrative(character, moments, userMbti) {
    const lines = moments.map(
      (m, i) =>
        `Moment ${i + 1}: when asked "${m.question.replace(/[？?]/g, "")}", the person chose "${m.choice}" — setting: ${m.hint}.`
    );
    return {
      zh: moments
        .map((m) => `当「${m.question}」你选择了「${m.choice}」`)
        .join("；"),
      en: lines.join(" "),
    };
  }

  function buildImagePrompt(character, moments, userMbti) {
    const mood = ELEMENT_MOOD[character.element] || "fantasy cinematic lighting";
    const visual = character.visual || "fantasy anime traveler";
    const momentDesc = moments
      .map((m) => `${m.hint}, the figure acts as if they "${m.choice}"`)
      .join("; ");

    return [
      "High quality anime fantasy illustration, single cinematic scene, no text no watermark.",
      `Main character: ${visual}, personality like ${character.traits.join(", ")}, ${character.element} element aesthetic.`,
      `The scene recreates the test taker's life choices: ${momentDesc}.`,
      `Atmosphere: ${mood}. MBTI vibe ${userMbti}.`,
      "Detailed background, expressive pose, Genshin Impact inspired open world style, original character design.",
    ].join(" ");
  }

  function buildImageUrl(prompt, seed) {
    const encoded = encodeURIComponent(prompt.slice(0, 900));
    return `${IMAGE_BASE}${encoded}?${IMAGE_OPTS}&seed=${seed}`;
  }

  function buildResultPackage(character, answers, userMbti) {
    const moments = getDefiningMoments(answers);
    const narrative = buildSceneNarrative(character, moments, userMbti);
    const prompt = buildImagePrompt(character, moments, userMbti);
    const seed = hashSeed(
      `${character.id}|${userMbti}|${answers.join(",")}|${prompt.slice(0, 120)}`
    );
    const imageUrl = buildImageUrl(prompt, seed);

    return {
      moments,
      narrative,
      prompt,
      seed,
      imageUrl,
    };
  }

  function preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("scene image load failed"));
      img.src = url;
    });
  }

  return {
    getDefiningMoments,
    buildSceneNarrative,
    buildImagePrompt,
    buildImageUrl,
    buildResultPackage,
    preloadImage,
    hashSeed,
  };
})();
