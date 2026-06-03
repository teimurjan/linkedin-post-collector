// figures.jsx — hand-drawn sketch figures (worker poses) + isometric furniture.
// Pure stroke art (no fill), currentColor so the scene can tint active workers.
// The wobble/hand-drawn feel comes from the #roughen SVG filter applied in scene.

// ---- Worker poses -------------------------------------------------------
// Local frame: head near top (y~14), feet near bottom (y~96), centered on x=0.
// Each pose returns an array of <path>/<circle>/<line> children.

function poseChildren(pose) {
  const cap = { strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  switch (pose) {
    case "stand": // neutral standing
      return (
        <g {...cap}>
          <circle cx="0" cy="14" r="9" />
          <path d="M0,23 L0,58" />
          <path d="M0,30 L-13,46" />
          <path d="M0,30 L13,47" />
          <path d="M0,58 L-9,95" />
          <path d="M0,58 L10,95" />
        </g>
      );
    case "walk": // mid-stride, arms swinging
      return (
        <g {...cap}>
          <circle cx="2" cy="14" r="9" />
          <path d="M2,23 L3,56" />
          <path d="M3,31 L-12,40" />
          <path d="M3,31 L16,45" />
          <path d="M3,56 L-13,92" />
          <path d="M3,56 L17,88" />
        </g>
      );
    case "coffee": // standing, cup raised toward face
      return (
        <g {...cap}>
          <circle cx="0" cy="14" r="9" />
          <path d="M0,23 L0,58" />
          <path d="M0,31 L-13,47" />
          <path d="M0,31 L-9,21" />
          <rect x="-15" y="17" width="8" height="7" rx="1" />
          <path d="M0,58 L-9,95" />
          <path d="M0,58 L10,95" />
        </g>
      );
    case "cooler": // bent slightly, arm down to fill a cup
      return (
        <g {...cap}>
          <circle cx="-2" cy="16" r="9" />
          <path d="M-2,25 C0,38 4,46 6,52" />
          <path d="M1,33 L-12,49" />
          <path d="M3,38 L14,58" />
          <rect x="11" y="58" width="7" height="6" rx="1" />
          <path d="M6,52 L-6,93" />
          <path d="M6,52 L14,93" />
        </g>
      );
    case "sofasit": // upright, seated on the sofa facing the viewer
      return (
        <g {...cap}>
          <circle cx="0" cy="14" r="9" />
          <path d="M0,23 L0,48" />
          <path d="M0,30 L-12,42" />
          <path d="M0,30 L12,42" />
          <path d="M0,48 L-14,58 L-14,80" />
          <path d="M0,48 L14,58 L14,80" />
        </g>
      );
    case "sit": // seated at desk, hunched toward laptop (faces +x)
      return (
        <g {...cap}>
          <circle cx="0" cy="16" r="9" />
          <path d="M0,25 C3,37 6,44 9,50" />
          <path d="M4,33 L20,43" />
          <path d="M9,50 L28,51" />
          <path d="M28,51 L28,74" />
          <path d="M9,50 L22,53 L22,75" />
        </g>
      );
    case "lean": // leaning back, hands behind head (done)
      return (
        <g {...cap}>
          <circle cx="-2" cy="18" r="9" />
          <path d="M-3,27 C0,38 5,46 9,52" />
          <path d="M-2,30 L-15,20" />
          <path d="M0,31 L13,21" />
          <path d="M9,52 L28,55" />
          <path d="M28,55 L28,77" />
          <path d="M9,52 L21,55 L21,77" />
        </g>
      );
    default:
      return poseChildren("stand");
  }
}

// Above-head status doodle: scribble (working), check (done), question (blocked)
function StatusDoodle({ kind }) {
  const cap = { strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  if (kind === "scribble") {
    return (
      <g {...cap} className="doodle-scribble">
        <path d="M-14,-12 q6,-9 12,0 t12,0" />
        <path d="M-12,-4 q7,-8 13,-1" />
      </g>
    );
  }
  if (kind === "check") {
    return (
      <g {...cap} className="doodle-pop">
        <path d="M-9,-8 L-2,-1 L11,-16" strokeWidth="3" />
      </g>
    );
  }
  if (kind === "question") {
    return (
      <g {...cap} className="doodle-bob">
        <path
          d="M-6,-16 q0,-9 7,-9 q8,0 8,7 q0,6 -7,8 l0,4"
          strokeWidth="2.6"
        />
        <circle cx="2" cy="2" r="0.8" strokeWidth="2.6" />
      </g>
    );
  }
  return null;
}

// A single worker figure. `pose` drives the body; `doodle` the thought above.
function Figure({ pose, doodle, flip }) {
  return (
    <g transform={flip ? "scale(-1,1)" : undefined}>
      {poseChildren(pose)}
      {doodle ? (
        <g transform="translate(0,2)">
          <StatusDoodle kind={doodle} />
        </g>
      ) : null}
    </g>
  );
}

// ---- Furniture (isometric-ish line art) ---------------------------------
// All drawn at a local origin; positioned by the scene with translate().
// iso unit vectors: right = (cos30, sin30)*s ; depth = (-cos30, sin30)*s

function DeskIso({ on }) {
  // tabletop parallelogram ~ 120 wide
  const solid = "var(--paper)";
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* chair first, so the opaque desk occludes its tucked-in part */}
      <g transform="translate(8,30)">
        {/* seat */}
        <path style={{ fill: solid }} d="M0,0 L24,-12 L46,-1 L22,11 Z" />
        {/* legs */}
        <path d="M2,1 L2,24" />
        <path d="M23,-11 L23,12" />
        <path d="M44,-1 L44,22" />
        <path d="M22,11 L22,34" />
        {/* backrest */}
        <path d="M0,0 L0,-32" />
        <path d="M22,11 L22,-21" />
        <path d="M0,-32 L22,-21" />
        <path d="M0,-16 L22,-5" strokeWidth="1.6" />
      </g>
      {/* desk surfaces, filled so they occlude whatever sits behind */}
      <path style={{ fill: solid }} d="M0,0 L0,10 L80,48 L80,38 Z" />
      <path style={{ fill: solid }} d="M150,4 L150,14 L80,48 L80,38 Z" />
      {/* top face */}
      <path style={{ fill: solid }} d="M0,0 L70,-34 L150,4 L80,38 Z" />
      {/* legs */}
      <path d="M6,8 L6,40" />
      <path d="M74,46 L74,80" />
      <path d="M144,12 L144,44" />
      {/* laptop on top */}
      <g
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(58,-6)"
      >
        <path d="M0,0 L26,-12 L44,-3 L18,9 Z" />
        <path d="M18,9 L18,-2 L44,-14 L44,-3" />
        <path d="M44,-14 L26,-23 L0,-11 L18,-2" />
        {on ? (
          <path className="screen-glow" d="M22,-4 L40,-12 L30,-17 L13,-9 Z" />
        ) : null}
      </g>
    </g>
  );
}

// ---- Idle props ---------------------------------------------------------
// Drawn at a floor origin (0,0 = where it stands), placed beside an idle
// worker so the lounge reads at a glance: scout takes coffee, illustrator
// paints.

// A big front-facing mug with rising steam — the universal "coffee break" icon.
function CoffeeMug() {
  const cap = { strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <g fill="none" {...cap}>
      {/* handle (behind the body) */}
      <path d="M15,-8 C28,-9 28,7 14,6" />
      {/* body: tapered cup */}
      <path
        style={{ fill: "var(--paper)" }}
        d="M-15,-13 L15,-13 L12,9 Q12,14 6,14 L-6,14 Q-12,14 -12,9 Z"
      />
      {/* rim */}
      <ellipse
        style={{ fill: "var(--paper)" }}
        cx="0"
        cy="-13"
        rx="15"
        ry="4"
      />
      {/* steam rising straight up */}
      <g className="doodle-bob" transform="translate(-6,-22)">
        <path d="M0,0 q-5,-7 0,-14 q5,-7 0,-14" strokeWidth="2" />
        <path d="M12,0 q-5,-7 0,-14 q5,-7 0,-14" strokeWidth="2" />
      </g>
    </g>
  );
}

// A tripod easel holding a framed canvas with a picture on it.
function Easel() {
  const cap = { strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <g fill="none" {...cap}>
      {/* back leg */}
      <path d="M28,14 L36,-52" />
      {/* two front legs splayed into an A-frame */}
      <path d="M2,16 L22,-56" />
      <path d="M44,16 L26,-56" />
      {/* ledge the canvas rests on */}
      <path d="M6,-14 L42,-14" />
      {/* canvas */}
      <path
        style={{ fill: "var(--paper)" }}
        d="M6,-52 L42,-52 L42,-16 L6,-16 Z"
      />
      {/* the picture on it: sun over mountains */}
      <g strokeWidth="1.6">
        <circle cx="14" cy="-44" r="4" />
        <path d="M8,-18 L20,-36 L26,-27 L33,-37 L40,-18 Z" />
      </g>
    </g>
  );
}

function SofaIso() {
  const solid = "var(--paper)";
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* backrest slab (drawn first, sits behind) */}
      <path style={{ fill: solid }} d="M52,-28 L182,-2 L188,-56 L58,-82 Z" />
      <path style={{ fill: solid }} d="M58,-82 L64,-90 L194,-64 L188,-56" />
      {/* back cushion seams */}
      <path d="M95,-19 L101,-73" strokeWidth="1.6" />
      <path d="M139,-11 L145,-65" strokeWidth="1.6" />
      {/* seat slab top */}
      <path style={{ fill: solid }} d="M0,2 L52,-28 L182,-2 L130,28 Z" />
      {/* seat front + right thickness */}
      <path style={{ fill: solid }} d="M0,2 L0,26 L130,52 L130,28 Z" />
      <path style={{ fill: solid }} d="M130,28 L130,52 L182,22 L182,-2 Z" />
      {/* seat cushion seams */}
      <path d="M44,11 L96,-19" strokeWidth="1.6" />
      <path d="M88,20 L140,-10" strokeWidth="1.6" />
      {/* left armrest */}
      <path style={{ fill: solid }} d="M0,2 L52,-28 L56,-64 L4,-34 Z" />
      <path style={{ fill: solid }} d="M0,2 L4,-34 L4,-12 L0,26 Z" />
      {/* right armrest */}
      <path style={{ fill: solid }} d="M130,28 L182,-2 L186,-38 L134,-8 Z" />
      <path style={{ fill: solid }} d="M182,-2 L186,-38 L186,-16 L182,22 Z" />
    </g>
  );
}

// A plain little iso table with a steaming coffee cup on it — the lounge's
// coffee spot.
function CoffeeTable() {
  const solid = "var(--paper)";
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* tabletop top face */}
      <path style={{ fill: solid }} d="M0,0 L50,-25 L98,0 L48,25 Z" />
      {/* front thickness */}
      <path style={{ fill: solid }} d="M0,0 L0,8 L48,33 L48,25 Z" />
      <path style={{ fill: solid }} d="M48,25 L48,33 L98,8 L98,0 Z" />
      {/* legs */}
      <path d="M2,2 L2,36" />
      <path d="M96,2 L96,36" />
      <path d="M48,25 L48,60" />
      {/* coffee cup on top */}
      <g transform="translate(44,-12) scale(0.82)">
        <CoffeeMug />
      </g>
    </g>
  );
}

function WhiteboardIso() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path
        style={{ fill: "var(--paper)" }}
        d="M0,0 L150,-30 L150,58 L0,88 Z"
      />
      {/* mobile stand: a leg from each lower corner splayed to a foot, joined
          by a rail under the board — the old legs were disconnected stubs */}
      <path d="M6,86 L-6,126" />
      <path d="M144,62 L156,102" />
      <path d="M2,98 L150,74" strokeWidth="1.6" />
      <path d="M-14,128 L8,122" />
      <path d="M146,98 L168,104" />
      {/* board scribbles */}
      <g strokeWidth="1.8" opacity="0.85">
        <path d="M16,14 L120,-7" />
        <path d="M16,30 L96,14" />
        <path d="M16,46 L110,28" />
        <path d="M104,44 l10,8 l16,-14" className="board-arrow" />
        <rect x="20" y="56" width="40" height="18" transform="skewY(-11)" />
      </g>
    </g>
  );
}

function PlantIso() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0,0 L20,-9 L34,-2 L14,7 Z" />
      <path d="M2,0 L6,26 L26,34 L34,-2" />
      <path d="M14,7 L26,34" />
      <g transform="translate(16,-2)">
        <path d="M0,0 C-8,-22 -2,-34 0,-40" />
        <path d="M0,0 C8,-20 6,-30 4,-38" />
        <path d="M0,0 C-2,-18 -10,-26 -16,-30" />
        <path d="M0,0 C2,-16 12,-22 18,-26" />
      </g>
    </g>
  );
}

// Paper sheet that flies between desks during handoff
function PaperSheet() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-12,-16 L12,-16 L12,16 L-12,16 Z" />
      <path d="M-6,-9 L6,-9" strokeWidth="1.4" />
      <path d="M-6,-3 L6,-3" strokeWidth="1.4" />
      <path d="M-6,3 L4,3" strokeWidth="1.4" />
      <path d="M-6,9 L2,9" strokeWidth="1.4" />
    </g>
  );
}

Object.assign(window, {
  Figure,
  StatusDoodle,
  DeskIso,
  Easel,
  SofaIso,
  CoffeeTable,
  WhiteboardIso,
  PlantIso,
  PaperSheet,
});
