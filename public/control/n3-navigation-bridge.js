// APULAB_CONTROL_N3_NAVIGATION_BRIDGE_V1
// Emit the legacy completion message even when the direct parent bridge exists.
// Mission01Screen deduplicates a pending transition to the same next level.
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest('#control-n3-continue')) return;
  try {
    window.parent.postMessage(
      { type: 'apulab-level-complete', level: 3, nextLevel: 4 },
      window.location.origin,
    );
  } catch (_) {}
}, true);
