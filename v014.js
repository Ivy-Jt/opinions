const processBoard = document.querySelector("[data-process-board]");
const revealNodes = document.querySelectorAll("[data-reveal]");
const metaGraph = document.querySelector("[data-meta-graph]");

const setupReveal = () => {
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
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );

  revealNodes.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
    observer.observe(node);
  });
};

const setupProcessBoard = () => {
  if (!processBoard) return;

  const pills = [...processBoard.querySelectorAll(".process-pill")];
  const panels = [...processBoard.querySelectorAll(".stage-panel")];
  const stage = processBoard.querySelector(".process-stage");
  let activeIndex = 0;
  let timer = null;
  let isAnimating = false;

  const animateChain = (panel) => {
    const items = [...panel.querySelectorAll(".chain-item, .logic-loop")];
    items.forEach((item) => item.classList.remove("is-visible"));
    items.forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add("is-visible");
      }, 110 + index * 120);
    });
  };

  const syncStageHeight = (panel) => {
    if (!stage || !panel) return;
    stage.style.height = `${panel.scrollHeight + 4}px`;
  };

  const clearLeavingState = () => {
    panels.forEach((panel) => panel.classList.remove("is-leaving"));
  };

  const setActive = (index) => {
    if (index === activeIndex || isAnimating) return;

    isAnimating = true;
    const currentPanel = panels[activeIndex];
    const nextPanel = panels[index];

    pills.forEach((pill, pillIndex) => {
      pill.classList.toggle("is-active", pillIndex === index);
    });

    currentPanel.classList.add("is-leaving");
    currentPanel.classList.remove("is-active");
    syncStageHeight(nextPanel);

    window.setTimeout(() => {
      clearLeavingState();
      nextPanel.classList.add("is-active");
      animateChain(nextPanel);
      syncStageHeight(nextPanel);
      activeIndex = index;
      window.setTimeout(() => {
        isAnimating = false;
      }, 260);
    }, 120);
  };

  const forceActive = (index) => {
    pills.forEach((pill, pillIndex) => {
      pill.classList.toggle("is-active", pillIndex === index);
    });

    panels.forEach((panel, panelIndex) => {
      panel.classList.toggle("is-active", panelIndex === index);
      panel.classList.remove("is-leaving");
    });

    activeIndex = index;
    isAnimating = false;
    syncStageHeight(panels[index]);
    animateChain(panels[index]);
  };

  const stopAutoPlay = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    timer = window.setInterval(() => {
      const nextIndex = (activeIndex + 1) % pills.length;
      if (!isAnimating) setActive(nextIndex);
    }, 4400);
  };

  pills.forEach((pill, index) => {
    pill.addEventListener("click", () => {
      if (index === activeIndex) return;
      stopAutoPlay();
      setActive(index);
      window.setTimeout(startAutoPlay, 460);
    });
  });

  processBoard.addEventListener("mouseenter", stopAutoPlay);
  processBoard.addEventListener("mouseleave", startAutoPlay);
  processBoard.addEventListener("focusin", stopAutoPlay);
  processBoard.addEventListener("focusout", startAutoPlay);
  window.addEventListener("resize", () => syncStageHeight(panels[activeIndex]));

  forceActive(0);
  startAutoPlay();
};

const setupMetaGraph = () => {
  if (!metaGraph) return;

  const nodes = [...metaGraph.querySelectorAll(".meta-node")];
  const links = [...metaGraph.querySelectorAll(".meta-link")];
  const title = metaGraph.querySelector("[data-meta-title]");
  const body = metaGraph.querySelector("[data-meta-body]");
  const tags = [...metaGraph.querySelectorAll("[data-meta-tag]")];

  const metaContent = {
    source: {
      title: "主题源头",
      body: "这条观点来自 T009《认知资产的生命周期》。更大的主题不是表达技巧，而是一个判断、目标或成果在不同阶段应该被如何处理。",
      tags: ["认知资产", "生命周期", "阶段差异"],
      activeLinks: ["source-turn"],
    },
    turn: {
      title: "关键转折",
      body: "来自 E014 的关键转折是：问题不在于“说不说”，而在于“说的是什么”。一旦识别对象不同，统一策略就不再成立。",
      tags: ["对象分型", "问题重述", "策略转向"],
      activeLinks: ["source-turn", "turn-current"],
    },
    current: {
      title: "当前观点",
      body: "在连续排除“统一保密”与“统一公开”之后，最终保留下来的解释是：目标、观点、成果分属不同阶段的认知资产，因此必须分别采用保护、碰撞与传播策略。",
      tags: ["主题归属", "概念修正", "当前结论"],
      activeLinks: ["turn-current", "current-extension"],
    },
    extension: {
      title: "延伸问题",
      body: "下一步可以继续追问：团队或个人如何为三类对象设计不同机制，例如目标的保护边界、观点的小范围碰撞机制，以及成果的传播与复用路径。",
      tags: ["机制设计", "团队协作", "系统复利"],
      activeLinks: ["current-extension"],
    },
  };

  const setActiveNode = (key) => {
    nodes.forEach((node) => {
      const isActive = node.dataset.node === key;
      node.classList.toggle("is-active", isActive);
      node.classList.toggle("is-current", isActive && key === "current");
    });

    links.forEach((link) => {
      link.classList.toggle("is-active", metaContent[key].activeLinks.includes(link.dataset.link));
    });

    title.textContent = metaContent[key].title;
    body.textContent = metaContent[key].body;
    tags.forEach((tag, index) => {
      tag.textContent = metaContent[key].tags[index] || "";
    });
  };

  nodes.forEach((node) => {
    node.addEventListener("click", () => setActiveNode(node.dataset.node));
  });

  setActiveNode("current");
};

setupReveal();
setupProcessBoard();
setupMetaGraph();
