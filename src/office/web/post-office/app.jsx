// app.jsx — runner state machine + page shell + tweaks.

const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accent: "#d2873b",
  hand: "Caveat",
  grain: 0.5,
  liveliness: 5,
} /*EDITMODE-END*/;

const ACCENTS = ["#d2873b", "#c2562f", "#b08a2e", "#8a7d63"];

function SketchButton({ children, onClick, disabled, variant }) {
  return (
    <button
      className={
        "sketch-btn " + (variant || "") + (disabled ? " is-disabled" : "")
      }
      onClick={onClick}
      disabled={disabled}
    >
      <svg
        className="sketch-btn-border"
        viewBox="0 0 240 70"
        preserveAspectRatio="none"
      >
        <path
          d="M8,10 Q120,4 232,9 Q236,35 231,61 Q120,66 9,60 Q4,34 8,10 Z"
          fill="none"
          filter="url(#roughen2)"
        />
      </svg>
      <span className="sketch-btn-label">{children}</span>
    </button>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const blank = () =>
    Object.fromEntries(
      AGENTS.map((a) => [
        a.id,
        { status: "idle", startedAt: null, finishedAt: null, streamed: "" },
      ]),
    );

  const [runtimes, setRuntimes] = useState(blank);
  const [progress, setProgress] = useState(0);
  const [handoff, setHandoff] = useState(null);
  const [selected, setSelected] = useState(null);
  const [running, setRunning] = useState(false);
  const [isLive, setIsLive] = useState(false); // a real Claude Code run is driving
  const [live, setLive] = useState(null); // { agents: {id: server-agent}, overview }
  const runIdRef = useRef(0);

  const statuses = Object.fromEntries(
    AGENTS.map((a) => [a.id, runtimes[a.id].status]),
  );

  const patch = (id, fields) =>
    setRuntimes((prev) => ({ ...prev, [id]: { ...prev[id], ...fields } }));

  // ---- SWAP POINT 1: real md artifacts (idle inspector) + overview -------
  // Pull the latest real briefing/idea/draft/concept/retro per agent from the
  // repo so an idle worker's panel shows what's actually on disk. Falls back to
  // the canned data.jsx strings if the server isn't reachable (static demo).
  useEffect(() => {
    let alive = true;
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d || !d.agents) return;
        const byId = {};
        for (const a of d.agents) byId[a.id] = a;
        setLive({ agents: byId, overview: d.overview });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // ---- live driver — mirror the running Claude Code session ----------------
  // The office reflects real pipeline state pushed from `office emit` over SSE.
  // Each frame is the whole state, so reconnects self-heal. When no run is
  // active, the board sits idle in the lounge until the next `office emit`.
  const sseRunId = useRef(null);
  const revealed = useRef({});
  const liveRef = useRef(false);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const es = new EventSource("/api/stream");
    es.addEventListener("state", (e) => {
      let state;
      try {
        state = JSON.parse(e.data);
      } catch {
        return;
      }
      applyLiveState(state);
    });
    return () => es.close();
  }, []);

  function applyLiveState(state) {
    const ids = AGENTS.map((a) => a.id);
    const active = ids.some(
      (id) => state.agents[id] && state.agents[id].status !== "idle",
    );

    if (sseRunId.current !== state.runId) {
      sseRunId.current = state.runId;
      revealed.current = {};
    }

    if (!active) {
      // Board is idle. If a live run just ended/reset, return everyone to the
      // lounge; otherwise leave a local demo run untouched.
      if (liveRef.current) {
        liveRef.current = false;
        setIsLive(false);
        setRunning(false);
        setHandoff(null);
        setProgress(0);
        setRuntimes(blank());
      }
      return;
    }

    liveRef.current = true;
    setIsLive(true);
    runIdRef.current++; // cancel any in-flight demo loop
    setRunning(true);

    const done = ids.filter((id) => state.agents[id]?.status === "done").length;
    const working = ids.some((id) => state.agents[id]?.status === "working");
    setRuntimes((prev) => {
      const next = {};
      ids.forEach((id) => {
        const a = state.agents[id] || { status: "idle" };
        next[id] = {
          status: a.status,
          startedAt: a.startedAt ? Date.parse(a.startedAt) : null,
          finishedAt: a.finishedAt ? Date.parse(a.finishedAt) : null,
          // preserve any text already being revealed; reveal handles the rest
          streamed: prev[id] ? prev[id].streamed : "",
        };
      });
      return next;
    });
    setProgress((done + (working ? 0.5 : 0)) / ids.length);

    // Typewriter-reveal each newly-finished response into its inspector.
    ids.forEach((id) => {
      const a = state.agents[id];
      if (!a) return;
      if (
        a.status === "done" &&
        a.response &&
        revealed.current[id] !== a.response
      ) {
        revealed.current[id] = a.response;
        revealLive(id, a.response);
      } else if (a.status !== "done") {
        revealed.current[id] = undefined;
        patch(id, { streamed: "" });
      }
    });
  }

  function revealLive(id, text) {
    const steps = Math.max(12, Math.floor(text.length / 6));
    let s = 0;
    const tick = () => {
      s += 1;
      const n = Math.ceil((text.length * s) / steps);
      patch(id, { streamed: text.slice(0, n) });
      if (s < steps) setTimeout(tick, 22);
    };
    tick();
  }

  // Simulate is a local demo: send every agent to their desk and put them to
  // work, no server run required. liveRef stays false so idle SSE frames won't
  // clobber it (same trick the live driver uses to leave demos alone).
  function simulate() {
    runIdRef.current++;
    liveRef.current = false;
    setIsLive(false);
    setRunning(true);
    setHandoff(null);
    setSelected(null);
    setProgress(0.5);
    setRuntimes(() =>
      Object.fromEntries(
        AGENTS.map((a) => [
          a.id,
          {
            status: "working",
            startedAt: Date.now(),
            finishedAt: null,
            streamed: "",
          },
        ]),
      ),
    );
  }

  // Reset clears the shared server board (.office/state.json); the SSE frame it
  // triggers then returns every tab to the lounge. Local state is cleared
  // immediately so the click feels instant even before the round-trip lands.
  function reset() {
    runIdRef.current++;
    liveRef.current = false;
    setIsLive(false);
    setRunning(false);
    setHandoff(null);
    setProgress(0);
    setSelected(null);
    setRuntimes(blank());
    fetch("/api/reset", { method: "POST" }).catch(() => {});
  }

  // Merge each agent's real latest artifact (from /api/agents) onto its static
  // identity, so the inspector can show on-disk content when the worker is idle.
  const mergedAgent = (id) => {
    const base = AGENTS.find((a) => a.id === id);
    const srv = live && live.agents[id];
    if (!base || !srv) return base || null;
    return {
      ...base,
      currentInstruction: srv.currentInstruction || base.currentInstruction,
      latest: srv.latest || null,
    };
  };
  const selectedAgent = selected ? mergedAgent(selected) : null;
  const overview = live && live.overview;

  const stageStyle = {
    "--accent": t.accent,
    "--hand": `'${t.hand}', cursive`,
    "--grain-opacity": t.grain,
  };

  const doneCount = AGENTS.filter(
    (a) => runtimes[a.id].status === "done",
  ).length;
  const workingAgent = AGENTS.find((a) => runtimes[a.id].status === "working");

  return (
    <div className="stage" style={stageStyle}>
      <div className="paper-grain" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <svg
              viewBox="0 0 60 60"
              width="46"
              height="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8,18 L52,14 L52,46 L8,50 Z" filter="url(#roughen)" />
              <path d="M8,18 L30,34 L52,14" filter="url(#roughen)" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>The Post Office</h1>
            <p>
              {running
                ? workingAgent
                  ? `${workingAgent.name} is working\u2026`
                  : "running the loop\u2026"
                : doneCount === AGENTS.length
                  ? "post approved \u2014 ready to ship"
                  : "everyone's on break"}
              {isLive ? " \u00b7 live" : ""}
            </p>
          </div>
        </div>

        <div className="controls">
          {overview ? (
            <div className="stage-count" title="from your markdown archive">
              {`${overview.posts} posts \u00b7 ${overview.medianImpressions} median`}
            </div>
          ) : null}
          <div className="stage-count">
            {doneCount}/{AGENTS.length} stages
          </div>
          <SketchButton onClick={simulate}>Simulate</SketchButton>
          <SketchButton variant="ghost" onClick={reset}>
            Reset
          </SketchButton>
        </div>
      </header>

      <main className="scene-wrap">
        <Office
          statuses={statuses}
          progress={progress}
          handoff={handoff}
          accent={t.accent}
          liveliness={t.liveliness}
          onWorker={(id) => setSelected(id)}
          onBackdrop={() => setSelected(null)}
        />
        <p className="hint">click any worker to open their desk</p>
      </main>

      <Inspector
        agent={selectedAgent}
        runtime={selected ? runtimes[selected] : null}
        onClose={() => setSelected(null)}
      />

      <TweaksPanel>
        <TweakSection label="Look" />
        <TweakColor
          label="Accent (active state)"
          value={t.accent}
          options={ACCENTS}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakRadio
          label="Sketch font"
          value={t.hand}
          options={["Caveat", "Gaegu"]}
          onChange={(v) => setTweak("hand", v)}
        />
        <TweakSlider
          label="Paper grain"
          value={t.grain}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setTweak("grain", v)}
        />
        <TweakSection label="Motion" />
        <TweakSlider
          label="Idle liveliness"
          value={t.liveliness}
          min={0}
          max={10}
          step={1}
          onChange={(v) => setTweak("liveliness", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
