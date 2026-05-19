/**
 * 结算页元素意象装饰：同元素不同角色使用不同 decor 主题
 */
const YSTIDecor = (function () {
  const ELEMENT_PALETTE = {
    pyro: { c1: "#ff6b3d", c2: "#ffca28", glow: "rgba(255,107,61,0.35)" },
    hydro: { c1: "#4fc3f7", c2: "#81d4fa", glow: "rgba(79,195,247,0.35)" },
    anemo: { c1: "#69f0ae", c2: "#b9f6ca", glow: "rgba(105,240,174,0.3)" },
    electro: { c1: "#b388ff", c2: "#ea80fc", glow: "rgba(179,136,255,0.35)" },
    cryo: { c1: "#b3e5fc", c2: "#e1f5fe", glow: "rgba(179,229,252,0.35)" },
    geo: { c1: "#d4a853", c2: "#f0d78c", glow: "rgba(212,168,83,0.4)" },
    dendro: { c1: "#aed581", c2: "#dce775", glow: "rgba(174,213,129,0.35)" },
  };

  const MOTIFS = {
    furina: {
      shapes:
        '<path d="M20 180 Q60 120 100 180" fill="none" stroke="CURRENT" stroke-width="1.5" opacity="0.5"/><circle cx="280" cy="60" r="28" fill="CURRENT" opacity="0.08"/><path d="M300 200 Q340 140 380 200" fill="CURRENT" opacity="0.06"/>',
      extra: "opera-mask",
    },
    mavuika: {
      shapes:
        '<polygon points="40,40 70,90 10,90" fill="CURRENT" opacity="0.15"/><path d="M350 30 L380 80 L320 80 Z" fill="CURRENT" opacity="0.12"/>',
      extra: "flame-crown",
    },
    hutao: {
      shapes:
        '<ellipse cx="50" cy="200" rx="35" ry="12" fill="CURRENT" opacity="0.1"/><path d="M360 150 Q390 120 420 160" stroke="CURRENT" fill="none" opacity="0.4"/>',
      extra: "ghost-flame",
    },
    sigewinne: {
      shapes:
        '<circle cx="30" cy="50" r="8" fill="CURRENT" opacity="0.2"/><circle cx="50" cy="45" r="6" fill="CURRENT" opacity="0.15"/><rect x="320" y="160" width="60" height="40" rx="20" fill="CURRENT" opacity="0.06"/>',
      extra: "bubble",
    },
    arlecchino: {
      shapes:
        '<path d="M30 30 L50 70 L10 70 Z" fill="CURRENT" opacity="0.2"/><path d="M370 170 L400 220 L340 220 Z" fill="CURRENT" opacity="0.15"/>',
      extra: "crimson-moon",
    },
    neuvillette: {
      shapes:
        '<path d="M0 120 Q200 80 400 120" stroke="CURRENT" fill="none" opacity="0.25"/><circle cx="200" cy="100" r="50" fill="CURRENT" opacity="0.05"/>',
      extra: "water-dragon",
    },
    yae: {
      shapes:
        '<path d="M360 40 Q400 80 360 120 Q320 80 360 40" fill="CURRENT" opacity="0.1"/><circle cx="40" cy="160" r="20" fill="CURRENT" opacity="0.08"/>',
      extra: "sakura-tail",
    },
    zhongli: {
      shapes:
        '<rect x="20" y="40" width="50" height="8" rx="2" fill="CURRENT" opacity="0.2"/><polygon points="350,180 380,220 320,220" fill="CURRENT" opacity="0.12"/>',
      extra: "geo-rune",
    },
    kazuha: {
      shapes:
        '<path d="M10 80 Q80 40 150 90" stroke="CURRENT" fill="none" opacity="0.35"/><ellipse cx="370" cy="70" rx="40" ry="15" fill="CURRENT" opacity="0.08" transform="rotate(-20 370 70)"/>',
      extra: "maple",
    },
    raiden: {
      shapes:
        '<path d="M200 20 L210 60 L190 60 Z" fill="CURRENT" opacity="0.3"/><circle cx="380" cy="180" r="35" fill="none" stroke="CURRENT" opacity="0.2"/>',
      extra: "electro-musou",
    },
    wanderer: {
      shapes:
        '<ellipse cx="60" cy="50" rx="45" ry="18" fill="CURRENT" opacity="0.08"/><path d="M330 30 L360 10 L390 40" stroke="CURRENT" opacity="0.35"/>',
      extra: "wind-hat",
    },
    nahida: {
      shapes:
        '<circle cx="40" cy="180" r="25" fill="CURRENT" opacity="0.08"/><path d="M300 50 Q340 90 300 130" stroke="CURRENT" fill="none" opacity="0.25"/>',
      extra: "leaf-circle",
    },
    wriothesley: {
      shapes:
        '<rect x="15" y="150" width="30" height="50" rx="4" fill="CURRENT" opacity="0.1"/><path d="M350 40 L380 90 L320 90 Z" fill="CURRENT" opacity="0.15"/>',
      extra: "ice-chain",
    },
    nilou: {
      shapes:
        '<ellipse cx="200" cy="220" rx="120" ry="25" fill="CURRENT" opacity="0.06"/><circle cx="50" cy="80" r="15" fill="CURRENT" opacity="0.12"/>',
      extra: "dance-ring",
    },
    yelan: {
      shapes:
        '<path d="M20 100 Q100 60 180 100" stroke="CURRENT" opacity="0.3"/><ellipse cx="350" cy="120" rx="50" ry="20" fill="CURRENT" opacity="0.07"/>',
      extra: "dice",
    },
    lyney: {
      shapes:
        '<rect x="30" y="30" width="40" height="55" rx="4" fill="CURRENT" opacity="0.12"/><circle cx="370" cy="50" r="18" fill="CURRENT" opacity="0.1"/>',
      extra: "magic-card",
    },
    chasca: {
      shapes:
        '<path d="M10 40 L40 10 L70 40 L40 70 Z" fill="CURRENT" opacity="0.1"/><path d="M320 150 L360 110 L400 150" stroke="CURRENT" opacity="0.3"/>',
      extra: "sky-glider",
    },
    kinich: {
      shapes:
        '<path d="M50 200 Q90 160 130 200" stroke="CURRENT" opacity="0.35"/><polygon points="340,30 370,70 310,70" fill="CURRENT" opacity="0.12"/>',
      extra: "saurian",
    },
  };

  function buildSvg(character) {
    const pal = ELEMENT_PALETTE[character.element] || ELEMENT_PALETTE.geo;
    const motif = MOTIFS[character.decor] || { shapes: "", extra: "default" };
    const uid = `decor-${character.id}`;

    return `
<svg class="result-deco-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <radialGradient id="${uid}-g" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${pal.c2}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${pal.c1}" stop-opacity="0"/>
    </radialGradient>
    <filter id="${uid}-blur"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="400" height="240" fill="url(#${uid}-g)"/>
  <g color="${pal.c1}" style="color:${pal.c1}">${motif.shapes}</g>
  <g class="motif-${motif.extra}" color="${pal.c2}" style="color:${pal.c2}">
    ${elementMotifExtra(character.element, motif.extra)}
  </g>
  <circle cx="200" cy="120" r="90" fill="none" stroke="${pal.c1}" stroke-opacity="0.12" stroke-width="1"/>
  <circle cx="200" cy="120" r="110" fill="none" stroke="${pal.c2}" stroke-opacity="0.08" stroke-width="0.5"/>
</svg>`;
  }

  function elementMotifExtra(element, extra) {
    const map = {
      pyro: '<path d="M200 20 Q220 50 200 75 Q180 50 200 20" fill="currentColor" opacity="0.2"/>',
      hydro: '<ellipse cx="200" cy="200" rx="80" ry="12" fill="currentColor" opacity="0.15"/>',
      anemo: '<path d="M50 120 Q200 80 350 120" stroke="currentColor" fill="none" stroke-width="2" opacity="0.2"/>',
      electro: '<path d="M190 30 L200 55 L210 30 L205 50 L215 35" stroke="currentColor" fill="none" opacity="0.35"/>',
      cryo: '<path d="M180 200 L200 175 L220 200 L200 225 Z" fill="currentColor" opacity="0.12"/>',
      geo: '<polygon points="185,185 200,165 215,185 200,205" fill="currentColor" opacity="0.18"/>',
      dendro: '<circle cx="200" cy="50" r="18" fill="currentColor" opacity="0.15"/>',
    };
    return map[element] || "";
  }

  function mount(cardEl, character) {
    let layer = cardEl.querySelector(".result-deco-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "result-deco-layer";
      cardEl.insertBefore(layer, cardEl.firstChild);
    }
    layer.innerHTML = buildSvg(character);
    const pal = ELEMENT_PALETTE[character.element];
    if (pal) {
      cardEl.style.setProperty("--element-c1", pal.c1);
      cardEl.style.setProperty("--element-c2", pal.c2);
      cardEl.style.setProperty("--element-glow", pal.glow);
    }
  }

  return { mount, ELEMENT_PALETTE };
})();
