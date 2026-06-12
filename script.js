const board = document.querySelector("[data-process-board]");
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
    {
      threshold: 0.16,
      rootMargin: "0px 0px -36px 0px",
    }
  );

  revealNodes.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index * 50, 260)}ms`;
    observer.observe(node);
  });
};

const setupProcessBoard = () => {
  if (!board) return;

  const pills = [...board.querySelectorAll(".process-pill")];
  const panels = [...board.querySelectorAll(".stage-panel")];
  const stage = board.querySelector(".process-stage");
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
    const nextHeight = panel.scrollHeight + 4;
    stage.style.height = `${nextHeight}px`;
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

  const startAutoPlay = () => {
    stopAutoPlay();
    timer = window.setInterval(() => {
      const nextIndex = (activeIndex + 1) % pills.length;
      if (!isAnimating) {
        setActive(nextIndex);
      }
    }, 4200);
  };

  const stopAutoPlay = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  pills.forEach((pill, index) => {
    pill.addEventListener("click", () => {
      if (index === activeIndex) return;
      stopAutoPlay();
      setActive(index);
      window.setTimeout(startAutoPlay, 460);
    });
  });

  board.addEventListener("mouseenter", stopAutoPlay);
  board.addEventListener("mouseleave", startAutoPlay);
  board.addEventListener("focusin", stopAutoPlay);
  board.addEventListener("focusout", startAutoPlay);
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
      body: "这条观点源于一个更大的主题：AI 时代的人到底该如何成长。最初关注的不是单个工具，而是长期竞争力会如何被重新定义。",
      tags: ["主题母题", "成长判断", "长期竞争力"],
      activeLinks: ["source-turn"],
    },
    turn: {
      title: "关键转折",
      body: "真正的转折点是发现“信任 AI”不足以构成结论。信任只是进入循环的门票，不能单独解释为什么有人会持续形成复利。",
      tags: ["中间修正", "否定旧结论", "进入推导链"],
      activeLinks: ["source-turn", "turn-current"],
    },
    current: {
      title: "当前观点",
      body: "在连续排除“模型版本”“提示词技巧”“使用频率”后，最终保留下来的解释是：真正竞争的，不是个人，而是人、AI、外脑与反馈机制组成的认知系统。",
      tags: ["主题归属", "概念修正", "当前结论"],
      activeLinks: ["turn-current", "current-extension"],
    },
    extension: {
      title: "延伸问题",
      body: "下一步要追问的不是“谁更会用 AI”，而是“什么样的记录、反馈、复盘机制，能让认知系统持续运转并扩大优势”。",
      tags: ["后续研究", "机制设计", "长期复利"],
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
    node.addEventListener("click", () => {
      setActiveNode(node.dataset.node);
    });
  });

  setActiveNode("current");
};

setupReveal();
setupProcessBoard();
setupMetaGraph();
