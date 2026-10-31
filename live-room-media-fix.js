/* BoniVerso Live v1.1.6: correção não invasiva de mídia no DOM.
   Compatível com a sala atual. Não altera token, matrícula ou publicação. */
(() => {
  'use strict';
  const panel = document.getElementById('videos');
  if (!panel) return;
  let updating = false;
  const reconcile = () => {
    if (updating) return;
    updating = true;
    try {
      for (const card of panel.querySelectorAll('.tile')) {
        // A mesma faixa recebida pode ser anexada em TrackSubscribed e no carregamento inicial.
        const seen = new Set();
        for (const media of [...card.querySelectorAll('video,audio')]) {
          const trackId = media.srcObject?.getTracks?.()[0]?.id || media.dataset.trackSid;
          const signature = (media.tagName || '') + '|' + (trackId || '');
          if (trackId && seen.has(signature)) { media.pause(); media.remove(); continue; }
          if (trackId) seen.add(signature);
        }
        const local = card.querySelector('.person-label')?.textContent?.includes('· Você');
        // Não criar um enorme quadro em branco para alunos espectadores.
        if (local && !card.querySelector('video')) card.hidden = true;
        else card.hidden = false;
      }
    } finally { updating = false; }
  };
  const obs = new MutationObserver(() => { if (!updating) queueMicrotask(reconcile); });
  obs.observe(panel, {childList:true, subtree:true});
  reconcile();
  // Reprodução de áudio remoto deve partir de gesto explícito do usuário em Safari/iPad.
  const audioButton = document.getElementById('unlockAudio');
  audioButton?.addEventListener('click', () => {
    for (const audio of panel.querySelectorAll('audio')) {
      audio.muted = false; audio.volume = 1;
      audio.play().catch(() => {});
    }
  });
})();
