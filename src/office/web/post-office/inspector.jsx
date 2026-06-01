// inspector.jsx — sketched note-card panel that slides in from the right.

const { useState, useEffect, useRef } = React;

// Basename of a repo-relative artifact path, for the "Latest output" label.
function fileLabel(path) {
  return String(path).split("/").pop();
}

function fmtClock(ts) {
  if (!ts) return "\u2014";
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function fmtDur(ms) {
  if (!ms) return "\u2014";
  const s = ms / 1000;
  return s < 60
    ? s.toFixed(1) + "s"
    : Math.floor(s / 60) + "m " + Math.round(s % 60) + "s";
}

function StatusChip({ status }) {
  const map = {
    idle: { label: "Idle", cls: "chip-idle" },
    working: { label: "Working", cls: "chip-working" },
    done: { label: "Done", cls: "chip-done" },
    blocked: { label: "Waiting", cls: "chip-blocked" },
  };
  const s = map[status] || map.idle;
  return <span className={"chip " + s.cls}>{s.label}</span>;
}

function Inspector({ agent, runtime, onClose }) {
  // runtime: { status, startedAt, finishedAt, streamed }
  const open = !!agent;
  const rt = runtime || {};
  const now = useRef(Date.now());
  const [, tick] = useState(0);
  useEffect(() => {
    if (rt.status === "working") {
      const id = setInterval(() => tick((n) => n + 1), 250);
      return () => clearInterval(id);
    }
  }, [rt.status]);

  const dur = rt.startedAt ? (rt.finishedAt || Date.now()) - rt.startedAt : 0;

  // Follow the streaming response: keep the latest text (e.g. the critic's score
  // table at the very end) in view instead of staying parked on the first line.
  const cardRef = useRef(null);
  const prevLen = useRef(0);
  useEffect(() => {
    prevLen.current = 0;
  }, [agent && agent.id]);
  useEffect(() => {
    const len = (rt.streamed || "").length;
    if (len > prevLen.current && cardRef.current) {
      cardRef.current.scrollTop = cardRef.current.scrollHeight;
    }
    prevLen.current = len;
  });

  return (
    <div
      className={"inspector " + (open ? "open" : "")}
      onClick={(e) => e.stopPropagation()}
    >
      {agent ? (
        <div className="note-card" ref={cardRef}>
          <button className="close-x" onClick={onClose} aria-label="close">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M5,5 L19,19 M19,5 L5,19" filter="url(#roughen)" />
            </svg>
          </button>

          <div className="ins-tape" />
          <div className="ins-head">
            <div className="ins-name">{agent.name}</div>
            <div className="ins-role">{agent.role}</div>
          </div>

          <p className="ins-blurb">{agent.blurb}</p>

          <div className="ins-row">
            <span className="ins-label">Status</span>
            <StatusChip status={rt.status || "idle"} />
          </div>

          <div className="ins-row split">
            <div>
              <span className="ins-label">Started</span>
              <span className="ins-val">{fmtClock(rt.startedAt)}</span>
            </div>
            <div>
              <span className="ins-label">Duration</span>
              <span className="ins-val">
                {rt.startedAt ? fmtDur(dur) : "\u2014"}
              </span>
            </div>
          </div>

          <div className="ins-block">
            <div className="ins-label">Current instruction</div>
            <pre className="mono instruction">{agent.currentInstruction}</pre>
          </div>

          <div className="ins-block">
            <div className="ins-label">
              {rt.status === "idle" && agent.latest
                ? "Latest output"
                : "Response"}
              {rt.status === "working" ? (
                <span className="streaming-dot">{" streaming\u2026"}</span>
              ) : null}
              {rt.status === "idle" && agent.latest && agent.latest.file ? (
                <span className="streaming-dot">
                  {" "}
                  {fileLabel(agent.latest.file)}
                </span>
              ) : null}
            </div>
            <pre className="mono response">
              {rt.streamed ||
                (rt.status === "idle"
                  ? agent.latest && agent.latest.response
                    ? agent.latest.response
                    : "\u2014 nothing here yet \u2014"
                  : "")}
              {rt.status === "working" ? (
                <span className="caret">{"\u258a"}</span>
              ) : null}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}

Object.assign(window, { Inspector });
