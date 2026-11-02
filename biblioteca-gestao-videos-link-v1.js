/* BoniVerso: a biblioteca preserva o controle de exibição do link por papel. */
(() => {
  const link = document.getElementById('manage');
  if (!link) return;
  link.href = './gestao-videos.html';
  link.textContent = '⚙️ Gerenciar todos os vídeos';
})();
