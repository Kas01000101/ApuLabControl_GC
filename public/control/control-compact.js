/* APULAB_CONTROL_COMPACT_VIEWPORT_V1
   Parent-only injector for the GC compact visual overlay.
   Applies only to Mission 01 levels 2–7 and never mutates task state. */
(() => {
  const STYLE_ID = 'apulab-control-compact-style';
  const STYLE_HREF = '/control/control-compact.css';
  const LEVEL_PATH = /^\/missions\/mission01\/level([2-7])\.html$/;

  const applyToFrame = (frame) => {
    try {
      const doc = frame.contentDocument;
      if (!doc?.documentElement || !doc.head) return;
      if (!LEVEL_PATH.test(doc.location.pathname)) return;

      doc.documentElement.dataset.apulabCompact = 'true';
      if (doc.getElementById(STYLE_ID)) return;

      const link = doc.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = STYLE_HREF;
      link.dataset.apulabCompact = 'n2-n7';
      doc.head.appendChild(link);
    } catch (_) {
      // Same-origin Mission 01 frames are expected. Ignore transient navigation states.
    }
  };

  const bindFrame = (frame) => {
    if (!(frame instanceof HTMLIFrameElement)) return;
    if (!frame.classList.contains('mission01-frame')) return;
    if (frame.dataset.apulabCompactBound === '1') return;

    frame.dataset.apulabCompactBound = '1';
    frame.addEventListener('load', () => applyToFrame(frame));
    applyToFrame(frame);
  };

  const scan = () => {
    document.querySelectorAll('iframe.mission01-frame').forEach(bindFrame);
  };

  const start = () => {
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
