/* BoniVerso: reprodutor interno para videos PUBLICOS de aulas gratuitas.
 * Nao libera conteudo pago nem altera matriculas ou pagamentos.
 */
(() => {
  'use strict';
  const LABEL = 'Assistir à videoaula pública';
  const watched = new WeakSet();
  const parseEmbed = raw => {
    try {
      const u = new URL(raw, window.location.href);
      if (u.protocol !== 'https:') return null;
      const h = u.hostname.toLowerCase();
      let video = null;
      if (h === 'youtu.be') video = u.pathname.split('/')[1];
      if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(h)) {
        if (u.pathname === '/watch') video = u.searchParams.get('v');
        else if (/^\/(embed|live|shorts)\//.test(u.pathname)) video = u.pathname.split('/')[2];
      }
      if (video && /^[\w-]{11}$/.test(video)) return 'https://www.youtube-nocookie.com/embed/' + video + '?rel=0';
      if (h === 'vimeo.com' || h === 'www.vimeo.com' || h === 'player.vimeo.com') {
        const match = u.pathname.match(/^\/(?:video\/)?(\d{6,12})(?:\/|$)/);
        if (match) return 'https://player.vimeo.com/video/' + match[1] + (u.searchParams.has('h') ? '?h=' + encodeURIComponent(u.searchParams.get('h')) : '');
      }
    } catch (_) { /* URL invalida */ }
    return null;
  };
  function upgrade() {
    document.querySelectorAll('a[href]').forEach(a => {
      if (watched.has(a) || a.textContent.trim() !== LABEL) return;
      watched.add(a);
      const src = parseEmbed(a.href);
      if (!src) return;
      const holder = document.createElement('div');
      holder.className = 'bv-video-holder';
      holder.style.cssText = 'width:100%;aspect-ratio:16/9;background:#0b1529;border-radius:16px;overflow:hidden;';
      const frame = document.createElement('iframe');
      frame.title = 'Reprodutor da videoaula';
      frame.src = src;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.style.cssText = 'display:block;width:100%;height:100%;border:0';
      holder.append(frame);
      const info = document.createElement('p');
      info.textContent = 'Assista diretamente no BoniVerso. Alguns vídeos podem bloquear a reprodução incorporada por decisão do proprietário.';
      info.style.cssText = 'font-size:13px;line-height:1.5;color:#72819a;margin:10px 0';
      a.replaceWith(holder);
      holder.after(info);
    });
  }
  const observer = new MutationObserver(upgrade);
  const init = () => {
    observer.observe(document.body, { childList:true, subtree:true });
    upgrade();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
