// scene.jsx — the office: furniture placement, workers (walk/sit/state),
// the amber progress line, and the flying-paper handoff.

const { useState, useEffect, useRef } = React;

// Pipeline order is AGENTS order. Each desk: where furniture sits, where the
// worker's chair is, and which way the figure faces.
// `seat` is offset down/right of the desk origin so a working figure lands on
// the chair tucked under the desk (not floating above the tabletop).
const DESKS = {
  analyst: { desk: [430, 250], seat: [452, 332], flip: false },
  scout: { desk: [690, 188], seat: [712, 270], flip: false },
  ideator: { desk: [918, 286], seat: [940, 368], flip: false },
  writer: { desk: [902, 506], seat: [924, 588], flip: false },
  illustrator: { desk: [648, 560], seat: [670, 642], flip: false },
  critic: { desk: [424, 506], seat: [446, 588], flip: false },
};

// Idle hangout per agent: distinct spots so nobody overlaps, each with a pose.
// `prop` draws a characteristic object beside them so the lounge reads at a
// glance: scout takes coffee, illustrator paints.
const LOUNGE = {
  analyst: { pos: [132, 352], pose: "sofasit" },
  ideator: { pos: [198, 352], pose: "sofasit" },
  writer: { pos: [340, 318], pose: "stand" },
  scout: { pos: [150, 500], pose: "stand" },
  critic: { pos: [258, 640], pose: "stand" },
  illustrator: { pos: [345, 476], pose: "stand", prop: "easel" },
};

const DESK_CENTER = ([x, y]) => [x + 60, y - 6]; // approx top-center of desk

function Worker({ agent, status, accent, liveliness, onClick }) {
  const lounge = LOUNGE[agent.id] || { pos: [150, 250], pose: "stand" };
  const home = lounge.pos;
  const seat = DESKS[agent.id].seat;
  const flip = DESKS[agent.id].flip;
  const idlePose = lounge.pose;
  const idleProp = lounge.prop;

  const atDesk =
    status === "working" || status === "done" || status === "blocked";
  const target = atDesk ? seat : home;

  // local walking phase so figure shows "walk" pose mid-glide, then settles
  const [phase, setPhase] = useState(atDesk ? "settled" : "settled");
  const prevAtDesk = useRef(atDesk);
  useEffect(() => {
    if (prevAtDesk.current !== atDesk) {
      setPhase("walking");
      const t = setTimeout(() => setPhase("settled"), 1150);
      prevAtDesk.current = atDesk;
      return () => clearTimeout(t);
    }
  }, [atDesk]);

  let pose,
    doodle = null,
    working = false;
  if (phase === "walking") {
    pose = "walk";
  } else if (status === "working") {
    pose = "sit";
    doodle = "scribble";
    working = true;
  } else if (status === "done") {
    pose = "lean";
    doodle = "check";
  } else if (status === "blocked") {
    pose = "stand";
    doodle = "question";
  } else {
    pose = idlePose;
  }

  const [x, y] = target;
  const bob = 1 + liveliness * 0.45; // px

  return (
    <g
      className="worker"
      style={{ transform: `translate(${x}px, ${y}px)`, cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(agent.id);
      }}
    >
      {/* idle prop beside an idle, settled worker */}
      {!atDesk && phase !== "walking" && idleProp === "easel" ? (
        <g transform="translate(30,-18) scale(0.85)">
          <Easel />
        </g>
      ) : null}
      {status === "blocked" ? (
        <g className="pace" style={{ "--bob": bob + "px" }}>
          <g className="bobber" style={{ "--bob": bob + "px" }}>
            <g
              transform={`translate(0,-100) scale(0.95)`}
              style={{ color: accent ? "var(--ink)" : "var(--ink)" }}
            >
              <Figure pose={pose} doodle={doodle} flip={flip} />
            </g>
          </g>
        </g>
      ) : (
        <g
          className={phase === "walking" ? "stepper" : "bobber"}
          style={{ "--bob": bob + "px" }}
        >
          <g
            transform={`translate(0,-100) scale(0.95)`}
            style={{ color: "var(--ink)" }}
          >
            <Figure pose={pose} doodle={doodle} flip={flip} />
          </g>
        </g>
      )}
      {/* nameplate */}
      <text className="nameplate" x="0" y="22" textAnchor="middle">
        {agent.name}
      </text>
    </g>
  );
}

function FlyingPaper({ handoff }) {
  // handoff = { from, to, key } ; animates from desk[from] -> desk[to]
  const [pos, setPos] = useState(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!handoff) {
      setVis(false);
      return;
    }
    const fromC = DESK_CENTER(DESKS[AGENTS[handoff.from].id].desk);
    const toC = DESK_CENTER(DESKS[AGENTS[handoff.to].id].desk);
    setPos(fromC);
    setVis(true);
    // next frame -> glide to destination
    const r = requestAnimationFrame(() =>
      requestAnimationFrame(() => setPos(toC)),
    );
    const t = setTimeout(() => setVis(false), 1200);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [handoff && handoff.key]);

  if (!vis || !pos) return null;
  return (
    <g
      className="flying-paper"
      style={{ transform: `translate(${pos[0]}px, ${pos[1] - 20}px)` }}
    >
      <PaperSheet />
    </g>
  );
}

function Office({
  statuses,
  progress,
  handoff,
  accent,
  liveliness,
  onWorker,
  onBackdrop,
}) {
  return (
    <svg
      className="office-svg"
      viewBox="0 0 1100 720"
      preserveAspectRatio="xMidYMid meet"
      onClick={onBackdrop}
    >
      <defs>
        <filter id="roughen" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011 0.014"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="3.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="roughen2" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.013 0.01"
            numOctaves="2"
            seed="31"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="3.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <radialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.42" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* floor hint */}
      <g className="ink floor" filter="url(#roughen2)">
        <path d="M40,150 L1060,150 L1060,690 L40,690 Z" />
      </g>

      {/* furniture (static line art) */}
      <g className="ink" filter="url(#roughen)">
        <g transform="translate(70,560)">
          <WhiteboardIso />
        </g>
        <g transform="translate(70,300)">
          <SofaIso />
        </g>
        <g transform="translate(60,476)">
          <CoffeeTable />
        </g>
        <g transform="translate(980,150)">
          <PlantIso />
        </g>
        <g transform="translate(360,650)">
          <PlantIso />
        </g>

        {AGENTS.map((a) => {
          const [dx, dy] = DESKS[a.id].desk;
          return (
            <g key={a.id} transform={`translate(${dx},${dy})`}>
              <DeskIso on={statuses[a.id] === "working"} />
            </g>
          );
        })}
      </g>

      {/* workers — no roughen filter: they animate, and re-rasterizing a
          displacement map every frame for six moving, bobbing figures is what
          made Simulate stutter. The static furniture keeps its wobble. */}
      <g className="ink workers">
        {AGENTS.map((a) => (
          <Worker
            key={a.id}
            agent={a}
            status={statuses[a.id]}
            accent={accent}
            liveliness={liveliness}
            onClick={onWorker}
          />
        ))}
      </g>

      <FlyingPaper handoff={handoff} />
    </svg>
  );
}

Object.assign(window, { Office });
