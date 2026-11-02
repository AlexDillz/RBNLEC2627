(async function () {

  const DEV_MODE = false; // временно можно поставить true для локальной отладки

  // определение темы (тёмная/светлая)
  function detectTheme() {
    try {
      const s = localStorage.getItem('theme');
      if (s === 'dark' || s === 'light') return s;
    } catch (_) {
      // localStorage может быть недоступен — просто игнорируем
    }

    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }

  const theme = detectTheme();
  const isDark = theme === 'dark';

  // палитра под две темы
  const pageBg    = isDark ? '#020617' : '#f3f4f6';
  const cardBg    = isDark ? '#111827' : '#ffffff';
  const textColor = isDark ? '#e5e7eb' : '#111827';
  const muted     = isDark ? '#9ca3af' : '#475569';
  const shadow    
    = isDark
    ? '0 24px 80px rgba(0,0,0,0.85)'
    : '0 24px 80px rgba(15,23,42,0.18)';
  const btnBg     = isDark ? '#f9fafb' : '#111827';
  const btnText   = isDark ? '#111827' : '#f9fafb';

  // проверка локального запуска
  // file://  — открыли HTML двойным кликом
  // localhost / 127.0.0.1 / ::1 — локальный сервер (python -m http.server)
  const isLocal =
    location.protocol === 'file:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '::1';

  const tag = document.querySelector('script[data-lecture-id]');
  if (!tag) return;

  const lectureId = tag.getAttribute('data-lecture-id');

  function prepareOverlay() {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.maxWidth = 'none';
    document.body.style.width = '100%';
    document.body.style.background = pageBg;
    document.body.style.color = textColor;
    document.body.style.fontFamily =
      "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  }

  function renderOverlay(title, lead, details, actionHtml) {
    prepareOverlay();

    document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:${pageBg};
        padding:24px;
      ">
        <div style="
          max-width:720px;
          width:100%;
          background:${cardBg};
          box-shadow:${shadow};
          border-radius:24px;
          padding:28px 24px 24px;
        ">
          <div style="
            font-size:12px;
            letter-spacing:0.08em;
            text-transform:uppercase;
            color:${muted};
            margin-bottom:8px;
          ">
            Школа вожатского мастерства ОЛАС «РУБИН»
          </div>
          <h1 style="
            margin:0 0 12px;
            font-size:24px;
            line-height:1.25;
          ">
            ${title}
          </h1>
          <p style="
            margin:0 0 12px;
            font-size:16px;
            line-height:1.6;
            color:${muted};
          ">
            ${lead}
          </p>
          <p style="
            margin:0 0 20px;
            font-size:15px;
            line-height:1.6;
            color:${muted};
          ">
            ${details}
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${actionHtml}
          </div>
        </div>
      </div>
    `;
  }

  if (DEV_MODE) {
    console.warn('⚠ protect-local.js: DEV_MODE включён — защита отключена');
    return;
  }

  if (isLocal) {
    renderOverlay(
      'Файл открыт локально',
      'Ты запускаешь страницу напрямую с компьютера (<code style="font-family:monospace;">file://</code> или <code style="font-family:monospace;">localhost</code>).',
      'Для честного прохождения курса и корректной работы ограничений по доступу лекции нужно открывать через <strong>официальную ссылку</strong>, а не как локальные файлы. Иначе любой желающий сможет пролистать всё просто так.',
      `
        <button
          type="button"
          onclick="history.back();"
          style="
            display:inline-flex;
            align-items:center;
            justify-content:center;
            padding:10px 18px;
            border-radius:999px;
            border:none;
            cursor:pointer;
            background:${btnBg};
            color:${btnText};
            font-weight:500;
            font-size:15px;
          "
        >
          ← Назад
        </button>
      `
    );
    return;
  }

  try {
    const r = await fetch('../lectures.json', { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = await r.json();
    const L = data.lectures.find((x) => x.id === lectureId);
    if (!L) return;

    if (L.locked) {
      renderOverlay(
        'Эта лекция пока закрыта',
        'Похоже, ты нашёл прямую ссылку или открыл файл из репозитория. Но по плану смены эта лекция ещё не выложена для свободного доступа.',
        'Чтобы всё шло по честной траектории, дождись её выхода на официальной странице школы. Там она появится в нужный момент, с нужным контекстом и пояснениями.',
        `
          <a
            href="../index.html"
            style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              padding:10px 18px;
              border-radius:999px;
              text-decoration:none;
              background:${btnBg};
              color:${btnText};
              font-weight:500;
              font-size:15px;
            "
          >
            ← На главную
          </a>
        `
      );
    }
  } catch (err) {
    console.error('protect-local.js error:', err);
  }
})();
