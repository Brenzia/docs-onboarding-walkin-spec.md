/* Walk-in onboarding — MOTION.
   Every duration, easing and parallax factor in the prototype. Claude Code ports these values 1:1.
   Change timings here only; keep the beat names. */
/* =====================================================================
   MOTION — the single source of truth Claude Code ports into the app.
   Durations in ms. Easing names map to the functions in EASE.
   ===================================================================== */
const MOTION = {
  parallax: { sky: 0.15, far: 0.45, mid: 0.75, scene: 1.0, fore: 1.5 },
  tiltMaxPx: 10,
  beats: {
    gateOpen:      { ms: 650,  ease: 'back' },     // gate panel slides on its rail
    gateDolly:     { ms: 1000, ease: 'in', zoom: 2.8, crossfadeAt: 0.55 },
    cabinSettle:   { ms: 700,  ease: 'out', fromZoom: 1.18 },
    guardNod:      { ms: 350 },                    // x2
    guardDeny:     { ms: 420 },
    lineHold:      { ms: 900 },                    // guard speech line on approval
    boomLift:      { ms: 450,  ease: 'out' },
    panToLobby:    { ms: 900,  ease: 'inOut', dx: 415 },
    glassDoors:    { ms: 380,  ease: 'out' },
    lobbyPush:     { ms: 650,  ease: 'in', zoom: 2.4, crossfadeAt: 0.5 },
    liftDoorsClose:{ ms: 600,  ease: 'inOut' },
    ascent:        { ms: 1100, floors: 12 },
    liftDoorsOpen: { ms: 450,  ease: 'out' },
    corridorPush:  { ms: 700,  ease: 'inOut', zoom: 1.9, crossfadeAt: 0.55 },
    corridorSettle:{ ms: 600,  ease: 'out', fromZoom: 1.15 },
    engrave:       { ms: 700,  ease: 'out' },
    bellRing:      { ms: 500 },
    doorAjar:      { ms: 600,  ease: 'back', deg: 28 },
    peek:          { ms: 450,  ease: 'out' },
    emailDeny:     { ms: 400 },
    unchain:       { ms: 500,  ease: 'back' },
    doorOpen:      { ms: 900,  ease: 'inOut', deg: 82 },
    homePush:      { ms: 900,  ease: 'inOut', zoom: 1.8 },   // resident steps aside as the camera enters
    doneHold:      { ms: 1500 },
    whipPan:       { ms: 600 },
    back:          { ms: 400 },
    reducedFade:   { ms: 150 }
  },
  haptics: { gateOpen: 'light', footsteps: 'light x2', deny: 'error', doorOpen: 'success' }
};
