const fallbackData = {
  snapshotDate: "2026-07-13",
  views: [],
  candidates: [],
  themes: [],
  weeklyReviews: [],
};

const revealNodes = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealNodes.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index * 60, 220)}ms`;
    observer.observe(node);
  });
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

const nodes = {
  snapshotDate: document.querySelector("#snapshot-date"),
  viewCount: document.querySelector("#view-count"),
  candidateCount: document.querySelector("#candidate-count"),
  themeCount: document.querySelector("#theme-count"),
  publishedCount: document.querySelector("#published-count"),
  viewGrid: document.querySelector("#view-grid"),
  themeList: document.querySelector("#theme-list"),
  candidateList: document.querySelector("#candidate-list"),
  weeklyStrip: document.querySelector("#weekly-strip"),
  filterButtons: document.querySelectorAll("[data-filter]"),
};

let radarData = fallbackData;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function renderMetrics(data) {
  const published = data.views.filter((view) => view.published).length;

  nodes.snapshotDate.textContent = data.snapshotDate;
  nodes.viewCount.textContent = data.views.length;
  nodes.candidateCount.textContent = data.candidates.length;
  nodes.themeCount.textContent = data.themes.length;
  nodes.publishedCount.textContent = published;
}

function renderViews(filter = "all") {
  nodes.viewGrid.innerHTML = "";

  const filteredViews = radarData.views.filter((view) => {
    if (filter === "published") return view.published;
    if (filter === "not-published") return !view.published;
    return true;
  });

  filteredViews.forEach((view) => {
    const card = createElement("article", "view-card");
    const head = createElement("div", "view-card-head");
    const id = createElement("span", "view-id", view.id);
    const badge = createElement(
      "span",
      view.published ? "status-badge published" : "status-badge",
      view.published ? "已发布" : "待可视化"
    );
    const title = createElement("h3", "", view.title);
    const meta = createElement("p", "view-meta", view.theme);

    head.append(id, badge);
    card.append(head, title, meta);

    if (view.published && view.url) {
      const link = createElement("a", "view-link", "打开汇报页");
      link.href = view.url;
      card.append(link);
    } else {
      const note = createElement("p", "quiet-note", "正文保留在 MyOS，公开页暂不复制。");
      card.append(note);
    }

    nodes.viewGrid.append(card);
  });
}

function renderSimpleList(container, items, className) {
  container.innerHTML = "";
  items.forEach((item) => {
    const row = createElement("div", className, item);
    container.append(row);
  });
}

function setupFilters() {
  nodes.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      nodes.filterButtons.forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      renderViews(button.dataset.filter);
    });
  });
}

function render(data) {
  radarData = data;
  renderMetrics(data);
  renderViews();
  renderSimpleList(nodes.themeList, data.themes, "theme-row");
  renderSimpleList(nodes.candidateList, data.candidates, "candidate-row");
  renderSimpleList(nodes.weeklyStrip, data.weeklyReviews, "weekly-pill");
  setupFilters();
}

fetch("./data/judgments.json")
  .then((response) => {
    if (!response.ok) throw new Error("Failed to load radar data");
    return response.json();
  })
  .then(render)
  .catch(() => {
    render(fallbackData);
  });
