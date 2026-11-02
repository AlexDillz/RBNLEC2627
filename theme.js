// единая логика темы
function currentTheme() {
  const s = localStorage.getItem('theme');
  if (s === 'dark' || s === 'light') return s;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark' : 'light';
}
function applyTheme(t){ document.body.classList.toggle('dark', t==='dark'); }
function updateToggleLabel(btn){ if(btn) btn.textContent = document.body.classList.contains('dark') ? '☀️ Светлая тема' : '🌙 Тёмная тема'; }
function initTheme(){
  applyTheme(currentTheme());
  const btn = document.getElementById('theme-toggle');
  updateToggleLabel(btn);
  if(btn){
    btn.addEventListener('click', ()=>{
      const t = document.body.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(t); localStorage.setItem('theme', t); updateToggleLabel(btn);
    });
  }
}
// если скрипт подключён поздно, запустим сразу
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
// синхронизация между вкладками
window.addEventListener('storage', (e)=>{ if(e.key==='theme'){ applyTheme(currentTheme()); updateToggleLabel(document.getElementById('theme-toggle')); }});
