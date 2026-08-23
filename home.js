const SVG_NS = "http://www.w3.org/2000/svg";

const fallbackData = {
  snapshotDate: "2026-08-23",
  views: [],
  themes: [],
  themeConnections: [],
  judgmentConnections: [],
};

const nodes = {
  snapshotDate: document.querySelector("#snapshot-date"),
  viewCount: document.querySelector("#view-count"),
  themeCount: document.querySelector("#theme-count"),
  connectionCount: document.querySelector("#connection-count"),
  publishedCount: document.querySelector("#published-count"),
  themeGrid: document.querySelector("#theme-grid"),
  graph: document.querySelector("#knowledge-graph"),
  graphCaption: document.querySelector("#graph-caption"),
  graphInspector: document.querySelector("#graph-inspector"),
  graphModeButtons: document.querySelectorAll("[data-graph-mode]"),
  graphThemeSelect: document.querySelector("#graph-theme-select"),
  viewGrid: document.querySelector("#view-grid"),
  viewSummary: document.querySelector("#view-summary"),
  viewSearch: document.querySelector("#view-search"),
  viewFilterButtons: document.querySelectorAll("[data-view-filter]"),
  clearTheme: document.querySelector("#clear-theme"),
};

const themeLayout = {
  T001: [160, 170],
  T004: [430, 105],
  T006: [710, 145],
  T005: [955, 230],
  T007: [930, 500],
  T009: [670, 545],
  T008: [500, 365],
  T003: [330, 555],
  T002: [135, 455],
};

const mobileThemeLayout = {
  T001: [210, 60],
  T004: [210, 170],
  T006: [210, 280],
  T005: [210, 390],
  T007: [210, 500],
  T002: [70, 60],
  T003: [70, 170],
  T008: [70, 390],
  T009: [350, 390],
};

const mobileGraphMedia = window.matchMedia("(max-width: 680px)");

let radarData = fallbackData;
let graphMode = "themes";
let selectedThemeId = "T001";
let viewFilter = "all";
let selectedViewTheme = null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

function createSvg(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function getTheme(themeId) {
  return radarData.themes.find((theme) => theme.id === themeId);
}

function getView(viewId) {
  return radarData.views.find((view) => view.id === viewId);
}

function getThemeViews(themeId) {
  return radarData.views.filter((view) => view.themeIds.includes(themeId));
}

function renderMetrics() {
  nodes.snapshotDate.textContent = radarData.snapshotDate;
  nodes.snapshotDate.dateTime = radarData.snapshotDate;
  nodes.viewCount.textContent = radarData.views.length;
  nodes.themeCount.textContent = radarData.themes.length;
  nodes.connectionCount.textContent = radarData.judgmentConnections.length;
  nodes.publishedCount.textContent = radarData.views.filter((view) => view.published).length;
}

function activateTheme(themeId, openGraph = true) {
  selectedThemeId = themeId;
  selectedViewTheme = themeId;
  nodes.graphThemeSelect.value = themeId;

  document.querySelectorAll("[data-theme-id]").forEach((element) => {
    element.classList.toggle("is-selected", element.dataset.themeId === themeId);
  });

  if (openGraph) {
    setGraphMode("judgments");
    document.querySelector("#graph").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    renderGraph();
  }

  renderViews();
}

function renderThemes() {
  nodes.themeGrid.innerHTML = "";

  radarData.themes.forEach((theme) => {
    const views = getThemeViews(theme.id);
    const card = createElement("button", "theme-card");
    card.type = "button";
    card.dataset.themeId = theme.id;
    card.style.setProperty("--theme-color", theme.color);
    card.setAttribute("aria-label", `${theme.id} ${theme.name}，${views.length} 条相关判断`);

    const header = createElement("span", "theme-card-head");
    header.append(
      createElement("strong", "theme-id", theme.id),
      createElement("span", "theme-count", `${views.length} 条判断`)
    );

    const title = createElement("span", "theme-name", theme.name);
    const question = createElement("span", "theme-question", theme.question);
    const chips = createElement("span", "theme-view-chips");
    views.slice(0, 5).forEach((view) => chips.append(createElement("span", "theme-view-chip", view.id)));
    if (views.length > 5) chips.append(createElement("span", "theme-view-chip more", `+${views.length - 5}`));

    card.append(header, title, question, chips);
    card.addEventListener("click", () => activateTheme(theme.id));
    nodes.themeGrid.append(card);
  });
}

function setupGraphSelect() {
  nodes.graphThemeSelect.innerHTML = "";
  radarData.themes.forEach((theme) => {
    const option = createElement("option", "", `${theme.id}｜${theme.name}`);
    option.value = theme.id;
    nodes.graphThemeSelect.append(option);
  });
  nodes.graphThemeSelect.value = selectedThemeId;
}

function addGraphDefinitions() {
  const defs = createSvg("defs");
  const marker = createSvg("marker", {
    id: "arrowhead",
    markerWidth: "8",
    markerHeight: "8",
    refX: "7",
    refY: "4",
    orient: "auto",
  });
  marker.append(createSvg("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#94a3b8" }));
  defs.append(marker);
  nodes.graph.append(defs);
}

function configureGraph(width, height, titleText, descriptionText) {
  nodes.graph.setAttribute("viewBox", `0 0 ${width} ${height}`);
  nodes.graph.setAttribute("width", String(width));
  nodes.graph.setAttribute("height", String(height));

  const title = createSvg("title", { id: "graph-title" });
  title.textContent = titleText;
  const description = createSvg("desc", { id: "graph-desc" });
  description.textContent = descriptionText;
  nodes.graph.append(title, description);
}

function appendEdge(source, target, label, curved = false) {
  const [sx, sy] = source;
  const [tx, ty] = target;
  const path = createSvg("path", {
    class: "graph-edge",
    d: curved
      ? `M ${sx} ${sy} Q ${(sx + tx) / 2} ${Math.min(sy, ty) - 46} ${tx} ${ty}`
      : `M ${sx} ${sy} L ${tx} ${ty}`,
    "marker-end": "url(#arrowhead)",
  });
  nodes.graph.append(path);

  if (label) {
    const text = createSvg("text", {
      class: "graph-edge-label",
      x: String((sx + tx) / 2),
      y: String((sy + ty) / 2 - 8),
      "text-anchor": "middle",
    });
    text.textContent = label;
    nodes.graph.append(text);
  }
}

function makeInteractive(group, activate) {
  group.setAttribute("tabindex", "0");
  group.setAttribute("role", "button");
  group.addEventListener("click", activate);
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
}

function showThemeInspector(theme) {
  const views = getThemeViews(theme.id);
  nodes.graphInspector.innerHTML = "";
  const kicker = createElement("p", "inspector-kicker", `${theme.id} · ${views.length} 条相关判断`);
  kicker.style.color = theme.color;
  const title = createElement("h3", "", theme.name);
  const question = createElement("p", "", theme.question);
  const list = createElement("div", "inspector-list");
  views.slice(0, 6).forEach((view) => {
    const item = createElement(view.url ? "a" : "span", "inspector-item", `${view.id}｜${view.title}`);
    if (view.url) item.href = view.url;
    list.append(item);
  });
  nodes.graphInspector.append(kicker, title, question, list);
}

function showViewInspector(view) {
  nodes.graphInspector.innerHTML = "";
  const kicker = createElement("p", "inspector-kicker", view.id);
  const title = createElement("h3", "", view.title);
  const themeNames = view.themeIds.map((id) => getTheme(id)?.name).filter(Boolean).join(" · ");
  const meta = createElement("p", "", themeNames);
  nodes.graphInspector.append(kicker, title, meta);

  if (view.url) {
    const link = createElement("a", "inspector-link", "打开观点单页");
    link.href = view.url;
    nodes.graphInspector.append(link);
  } else {
    nodes.graphInspector.append(createElement("p", "inspector-note", "当前在公开索引中保留标题与关系。"));
  }
}

function renderThemeGraph() {
  const compact = mobileGraphMedia.matches;
  const layout = compact ? mobileThemeLayout : themeLayout;
  configureGraph(
    compact ? 420 : 1120,
    compact ? 560 : 680,
    "九个判断主题的关系图",
    "展示判断生成、传递、影响、改变与人机协同等主题之间的连接。"
  );
  nodes.graphCaption.textContent = "九个主题不是平铺目录，而是从判断生成、传递、影响到现实转化的连续问题。";

  radarData.themeConnections.forEach((edge) => {
    const source = layout[edge.source];
    const target = layout[edge.target];
    if (source && target) appendEdge(source, target, edge.label, true);
  });

  radarData.themes.forEach((theme) => {
    const [x, y] = layout[theme.id];
    const count = getThemeViews(theme.id).length;
    const group = createSvg("g", {
      class: `theme-node${theme.id === selectedThemeId ? " is-selected" : ""}`,
      transform: `translate(${x} ${y})`,
      "aria-label": `${theme.id} ${theme.name}`,
    });
    group.dataset.nodeId = theme.id;
    group.style.setProperty("--node-color", theme.color);

    group.append(
      createSvg("rect", {
        x: compact ? "-60" : "-78",
        y: compact ? "-30" : "-38",
        width: compact ? "120" : "156",
        height: compact ? "60" : "76",
        rx: "8",
      })
    );
    const idText = createSvg("text", {
      class: "theme-node-id",
      y: compact ? "-7" : "-9",
      "text-anchor": "middle",
    });
    idText.textContent = theme.id;
    const nameText = createSvg("text", {
      class: "theme-node-name",
      y: compact ? "11" : "13",
      "text-anchor": "middle",
    });
    const nameLimit = compact ? 11 : 12;
    nameText.textContent = theme.name.length > nameLimit ? `${theme.name.slice(0, nameLimit)}…` : theme.name;
    const countText = createSvg("text", {
      class: "theme-node-count",
      y: compact ? "25" : "31",
      "text-anchor": "middle",
    });
    countText.textContent = `${count} 条判断`;
    const tooltip = createSvg("title");
    tooltip.textContent = `${theme.id}｜${theme.name}\n${theme.question}`;
    group.append(idText, nameText, countText, tooltip);
    makeInteractive(group, () => activateTheme(theme.id));
    group.addEventListener("focus", () => showThemeInspector(theme));
    group.addEventListener("mouseenter", () => showThemeInspector(theme));
    nodes.graph.append(group);
  });

  showThemeInspector(getTheme(selectedThemeId) || radarData.themes[0]);
}

function judgmentLayout(views) {
  if (mobileGraphMedia.matches) {
    const positions = {};
    const center = [210, 78];
    const startY = 205;
    const rowGap = 92;
    const rows = Math.ceil(views.length / 2);

    views.forEach((view, index) => {
      const isLastOdd = views.length % 2 === 1 && index === views.length - 1;
      positions[view.id] = [isLastOdd ? 210 : index % 2 === 0 ? 90 : 330, startY + Math.floor(index / 2) * rowGap];
    });

    return {
      positions,
      center,
      width: 420,
      height: Math.max(430, startY + Math.max(0, rows - 1) * rowGap + 62),
    };
  }

  const positions = {};
  const center = [560, 330];
  const radiusX = views.length > 8 ? 430 : 360;
  const radiusY = views.length > 8 ? 260 : 220;

  views.forEach((view, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / views.length;
    positions[view.id] = [
      center[0] + Math.cos(angle) * radiusX,
      center[1] + Math.sin(angle) * radiusY,
    ];
  });
  return { positions, center, width: 1120, height: 680 };
}

function renderJudgmentGraph() {
  const theme = getTheme(selectedThemeId) || radarData.themes[0];
  const views = getThemeViews(theme.id);
  const compact = mobileGraphMedia.matches;
  const { positions, center, width, height } = judgmentLayout(views);
  const viewIds = new Set(views.map((view) => view.id));

  configureGraph(
    width,
    height,
    `${theme.id} ${theme.name}的观点关系图`,
    `展示${theme.name}主题与${views.length}条成熟判断之间的关系。`
  );

  nodes.graphCaption.textContent = `${theme.id}｜${theme.name}：${theme.question}`;

  views.forEach((view) => appendEdge(center, positions[view.id], "", false));
  radarData.judgmentConnections
    .filter((edge) => viewIds.has(edge.source) && viewIds.has(edge.target))
    .forEach((edge) => appendEdge(positions[edge.source], positions[edge.target], edge.label, true));

  const themeGroup = createSvg("g", {
    class: "judgment-hub",
    transform: `translate(${center[0]} ${center[1]})`,
  });
  themeGroup.style.setProperty("--node-color", theme.color);
  themeGroup.append(createSvg("circle", { r: compact ? "50" : "66" }));
  const themeId = createSvg("text", { y: "-7", "text-anchor": "middle" });
  themeId.textContent = theme.id;
  const themeName = createSvg("text", { class: "hub-name", y: "17", "text-anchor": "middle" });
  const themeNameLimit = compact ? 8 : 10;
  themeName.textContent = theme.name.length > themeNameLimit ? `${theme.name.slice(0, themeNameLimit)}…` : theme.name;
  themeGroup.append(themeId, themeName);
  makeInteractive(themeGroup, () => showThemeInspector(theme));
  nodes.graph.append(themeGroup);

  views.forEach((view) => {
    const [x, y] = positions[view.id];
    const group = createSvg("g", {
      class: `judgment-node${view.published ? " has-page" : ""}`,
      transform: `translate(${x} ${y})`,
      "aria-label": `${view.id} ${view.title}`,
    });
    group.style.setProperty("--node-color", theme.color);
    group.append(
      createSvg("rect", {
        x: compact ? "-56" : "-64",
        y: compact ? "-24" : "-27",
        width: compact ? "112" : "128",
        height: compact ? "48" : "54",
        rx: "8",
      })
    );
    const idText = createSvg("text", { y: compact ? "4" : "5", "text-anchor": "middle" });
    idText.textContent = view.id;
    if (view.published) {
      group.append(
        createSvg("circle", {
          class: "page-dot",
          cx: compact ? "44" : "50",
          cy: compact ? "-13" : "-15",
          r: compact ? "3.5" : "4",
        })
      );
    }
    const tooltip = createSvg("title");
    tooltip.textContent = `${view.id}｜${view.title}`;
    group.append(idText, tooltip);
    makeInteractive(group, () => {
      showViewInspector(view);
      document.querySelectorAll(".judgment-node").forEach((node) => node.classList.remove("is-open"));
      group.classList.add("is-open");
    });
    group.addEventListener("focus", () => showViewInspector(view));
    nodes.graph.append(group);
  });

  showThemeInspector(theme);
}

function renderGraph() {
  nodes.graph.innerHTML = "";
  nodes.graph.dataset.mode = graphMode;
  addGraphDefinitions();
  if (!radarData.themes.length) {
    nodes.graphCaption.textContent = "图谱数据暂未加载。";
    return;
  }
  if (graphMode === "themes") renderThemeGraph();
  else renderJudgmentGraph();
}

function setGraphMode(mode) {
  graphMode = mode;
  nodes.graphModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.graphMode === mode);
  });
  nodes.graphThemeSelect.disabled = mode !== "judgments";
  renderGraph();
}

function renderViews() {
  const query = nodes.viewSearch.value.trim().toLowerCase();
  const filtered = radarData.views.filter((view) => {
    if (viewFilter === "published" && !view.published) return false;
    if (viewFilter === "index" && view.published) return false;
    if (selectedViewTheme && !view.themeIds.includes(selectedViewTheme)) return false;
    if (query && !`${view.id} ${view.title}`.toLowerCase().includes(query)) return false;
    return true;
  });

  nodes.viewGrid.innerHTML = "";
  filtered.forEach((view) => {
    const card = createElement("article", `view-card${view.published ? " has-page" : ""}`);
    const header = createElement("div", "view-card-head");
    header.append(createElement("span", "view-id", view.id));
    if (view.published) header.append(createElement("span", "page-label", "单页"));

    const title = createElement("h3", "", view.title);
    const themes = createElement("div", "view-themes");
    view.themeIds.forEach((themeId) => {
      const theme = getTheme(themeId);
      if (!theme) return;
      const chip = createElement("button", "view-theme", theme.id);
      chip.type = "button";
      chip.title = theme.name;
      chip.style.setProperty("--theme-color", theme.color);
      chip.addEventListener("click", () => activateTheme(theme.id));
      themes.append(chip);
    });
    card.append(header, title, themes);

    if (view.published && view.url) {
      const link = createElement("a", "view-link", "展开阅读");
      link.href = view.url;
      card.append(link);
    }
    nodes.viewGrid.append(card);
  });

  const theme = selectedViewTheme ? getTheme(selectedViewTheme) : null;
  nodes.viewSummary.textContent = theme
    ? `${theme.id}｜${theme.name} · 当前显示 ${filtered.length} 条判断`
    : `当前显示 ${filtered.length} 条成熟判断`;
  nodes.clearTheme.hidden = !selectedViewTheme;
}

function setupInteractions() {
  nodes.graphModeButtons.forEach((button) => {
    button.addEventListener("click", () => setGraphMode(button.dataset.graphMode));
  });
  nodes.graphThemeSelect.addEventListener("change", () => activateTheme(nodes.graphThemeSelect.value, false));

  nodes.viewFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      viewFilter = button.dataset.viewFilter;
      nodes.viewFilterButtons.forEach((node) => node.classList.toggle("is-active", node === button));
      renderViews();
    });
  });
  nodes.viewSearch.addEventListener("input", renderViews);
  nodes.clearTheme.addEventListener("click", () => {
    selectedViewTheme = null;
    document.querySelectorAll(".theme-card").forEach((card) => card.classList.remove("is-selected"));
    renderViews();
  });
  mobileGraphMedia.addEventListener("change", () => renderGraph());
}

function setupReveal() {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
  );
  revealNodes.forEach((node) => observer.observe(node));
}

function render(data) {
  radarData = data;
  renderMetrics();
  renderThemes();
  setupGraphSelect();
  renderGraph();
  renderViews();
  setupInteractions();
  setupReveal();
}

fetch("./data/judgments.json")
  .then((response) => {
    if (!response.ok) throw new Error("Failed to load judgment data");
    return response.json();
  })
  .then(render)
  .catch(() => render(fallbackData));
