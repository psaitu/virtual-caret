;(function () {
  "use strict";

  const CONTAINER_ID = "textarea";
  const CARET_ID = "virtual-caret";

  const textarea = document.getElementById(CONTAINER_ID);
  const caret = document.getElementById(CARET_ID);

  // Properties copied onto the mirror div so wrapping/metrics match the textarea 1:1.
  const MIRRORED_PROPS = [
    "boxSizing", "width", "height",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing",
    "lineHeight", "textTransform", "wordSpacing", "textIndent",
    "whiteSpace", "wordWrap", "overflowWrap", "tabSize",
  ];

  let mirror = null;

  function buildMirror() {
    mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    const s = mirror.style;
    s.position = "absolute";
    s.visibility = "hidden";
    s.whiteSpace = "pre-wrap";
    s.overflowWrap = "break-word";
    s.overflow = "hidden";
    document.body.appendChild(mirror);
  }

  // Compute the caret's pixel position relative to the viewport using a mirror div.
  function caretCoords(offset) {
    const cs = window.getComputedStyle(textarea);
    for (const prop of MIRRORED_PROPS) {
      mirror.style[prop] = cs[prop];
    }

    const rect = textarea.getBoundingClientRect();
    mirror.style.left = rect.left + "px";
    mirror.style.top = rect.top + "px";

    const before = textarea.value.substring(0, offset);
    // Trailing newline needs a placeholder so the marker lands on the new line.
    mirror.textContent = before.endsWith("\n") ? before + "\u200b" : before;

    const marker = document.createElement("span");
    // A zero-width space gives the span a real box to measure.
    marker.textContent = "\u200b";
    mirror.appendChild(marker);

    const markerRect = marker.getBoundingClientRect();

    // Account for the textarea's own scrolling.
    const x = markerRect.left - textarea.scrollLeft;
    const y = markerRect.top - textarea.scrollTop;

    return { x, y };
  }

  let movingTimer = null;

  function moveCaret(animate) {
    const { x, y } = caretCoords(textarea.selectionStart);

    if (animate) {
      const current = caret.getBoundingClientRect();
      caret.animate(
        [
          { left: current.left + "px", top: current.top + "px" },
          { left: x + "px", top: y + "px" },
        ],
        { duration: 90, easing: "ease-out" }
      );
      // Pause blinking while gliding, then resume.
      caret.classList.add("moving");
      clearTimeout(movingTimer);
      movingTimer = setTimeout(() => caret.classList.remove("moving"), 120);
    }

    caret.style.left = x + "px";
    caret.style.top = y + "px";
  }

  function update() {
    moveCaret(true);
  }

  function init() {
    buildMirror();

    const events = [
      "keydown", "keyup", "keypress", "input", "paste", "cut",
      "mousedown", "mouseup", "mousemove", "touchstart",
      "select", "selectionchange", "focus", "scroll",
    ];
    for (const ev of events) {
      textarea.addEventListener(ev, update);
    }
    document.addEventListener("selectionchange", () => {
      if (document.activeElement === textarea) update();
    });
    window.addEventListener("resize", () => moveCaret(false));

    textarea.focus();
    // Initial placement (no animation).
    moveCaret(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
