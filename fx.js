// Category-themed roll animations, rendered with React (loaded from CDN as globals
// in index.html). If React didn't load, every export degrades to a harmless no-op so
// the generator keeps working.

const React = window.React;
const ReactDOM = window.ReactDOM;

// Each animal category bursts its own little set of emoji.
const THEMES = {
  mammal:   ["🐾", "🦴", "🐾", "✨"],
  bird:     ["🪶", "🐦", "☁️", "✨"],
  aquatic:  ["🫧", "💧", "🐟", "🌊"],
  bugs:     ["🐝", "✨", "🪲", "🍯"],
  reptamph: ["🦎", "🍃", "🐍", "✨"],
  feature:  ["✨", "⭐", "💫", "🌟"],
};

let pushBurst = null;   // set once <FxLayer/> mounts

function Burst({ burst, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, []);

  const particles = React.useMemo(() => {
    const set = THEMES[burst.type] || THEMES.feature;
    const n = 16;
    return Array.from({ length: n }, (_, i) => {
      const ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
      const dist = 55 + Math.random() * 95;
      return {
        emoji: set[i % set.length],
        tx: Math.cos(ang) * dist,
        ty: Math.sin(ang) * dist - 28,       // bias the burst slightly upward
        rot: (Math.random() * 2 - 1) * 200,
        delay: Math.random() * 70,
        size: 16 + Math.random() * 18,
      };
    });
  }, []);

  return React.createElement(
    "div",
    { className: "fx-burst", style: { left: burst.x + "px", top: burst.y + "px" } },
    particles.map((p, i) =>
      React.createElement(
        "span",
        {
          key: i,
          className: "fx-particle",
          style: {
            "--tx": p.tx + "px",
            "--ty": p.ty + "px",
            "--rot": p.rot + "deg",
            animationDelay: p.delay + "ms",
            fontSize: p.size + "px",
          },
        },
        p.emoji
      )
    )
  );
}

function FxLayer() {
  const [bursts, setBursts] = React.useState([]);
  React.useEffect(() => {
    pushBurst = (b) => setBursts((cur) => [...cur, b]);
    return () => { pushBurst = null; };
  }, []);
  const remove = (id) => setBursts((cur) => cur.filter((b) => b.id !== id));
  return React.createElement(
    React.Fragment,
    null,
    bursts.map((b) =>
      React.createElement(Burst, { key: b.id, burst: b, onDone: () => remove(b.id) })
    )
  );
}

if (React && ReactDOM) {
  let root = document.getElementById("fx-root");
  if (!root) { root = document.createElement("div"); root.id = "fx-root"; document.body.appendChild(root); }
  ReactDOM.createRoot(root).render(React.createElement(FxLayer));
}

// Spawn a category-themed burst centred on the given element.
export function playRoll(type, originEl) {
  if (!pushBurst || !originEl) return;
  const r = originEl.getBoundingClientRect();
  pushBurst({
    id: Math.random().toString(36).slice(2),
    type,
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
  });
}
