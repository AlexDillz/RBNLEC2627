#!/usr/bin/env node
'use strict';

// Usage: node notify-telegram.js <old lectures.json|-> <new lectures.json>
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SITE_URL, DRY_RUN=1,
//      WAIT_INTERVAL_MS (15000), WAIT_TIMEOUT_MS (600000)

const fs = require('fs');

const DEFAULT_SITE_URL = 'https://alexdillz.github.io/RBNLEC2627/';

function readLectures(file) {
  if (!file || file === '-' || !fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8').trim();
  if (!text) return [];
  const data = JSON.parse(text);
  return Array.isArray(data.lectures) ? data.lectures : [];
}

function findOpened(oldList, newList) {
  const oldById = new Map(oldList.map((l) => [l.id, l]));
  return newList.filter((l) => {
    if (!l || !l.id || l.locked) return false;
    const prev = oldById.get(l.id);
    return !prev || prev.locked === true;
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLink(siteUrl, url) {
  return siteBase(siteUrl) + String(url || '').replace(/^\/+/, '');
}

function buildMessage(lecture, siteUrl) {
  const link = buildLink(siteUrl, lecture.url);
  const lines = [`<b>Открыта новая лекция: ${escapeHtml(lecture.title)}</b>`];
  if (lecture.summary) lines.push('', escapeHtml(lecture.summary));
  lines.push('', `<a href="${escapeHtml(link)}">Открыть лекцию</a>`);
  return lines.join('\n');
}

async function sendMessage(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    throw new Error(`Telegram API error ${res.status}: ${body.description || 'unknown'}`);
  }
}

function siteBase(siteUrl) {
  return (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '') + '/';
}

function numberEnv(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Waits until the live site serves lectures.json with the lecture unlocked.
async function waitForLecture(lecture, env, fetchImpl = fetch) {
  const interval = numberEnv(env.WAIT_INTERVAL_MS, 15000);
  const timeout = numberEnv(env.WAIT_TIMEOUT_MS, 600000);
  const base = siteBase(env.SITE_URL);
  const started = Date.now();
  let attempt = 0;

  for (;;) {
    attempt += 1;
    const url = `${base}lectures.json?t=${Date.now()}`;
    let state;
    try {
      const res = await fetchImpl(url, { cache: 'no-store' });
      if (res.status === 404) {
        throw Object.assign(
          new Error(`Сайт не найден (404): ${url}. Проверьте, что GitHub Pages включен и SITE_URL верный.`),
          { fatal: true },
        );
      }
      if (!res.ok) {
        state = `HTTP ${res.status}`;
      } else {
        const data = await res.json();
        const list = Array.isArray(data && data.lectures) ? data.lectures : [];
        const live = list.find((l) => l && l.id === lecture.id);
        if (live && live.locked === false) {
          console.log(`Лекция ${lecture.id} открыта на сайте (попытка ${attempt}).`);
          return;
        }
        state = live ? 'еще закрыта' : 'еще нет на сайте';
      }
    } catch (err) {
      if (err.fatal) throw err;
      state = `ошибка запроса: ${err.message}`;
    }

    const elapsed = Date.now() - started;
    console.log(`Ожидание деплоя ${lecture.id}: ${state} (попытка ${attempt}, ${Math.round(elapsed / 1000)} с).`);
    if (elapsed + interval > timeout) {
      throw new Error(
        `Лекция ${lecture.id} не открылась на сайте за ${Math.round(timeout / 1000)} с, пост не отправлен. ` +
          'Проверьте деплой GitHub Pages и перезапустите workflow.',
      );
    }
    await sleep(interval);
  }
}

async function main(argv, env, send = sendMessage, fetchImpl = fetch) {
  const [oldFile, newFile] = argv;
  const opened = findOpened(readLectures(oldFile), readLectures(newFile));

  if (opened.length === 0) {
    console.log('Нет новых открытых лекций.');
    return 0;
  }

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  const dryRun = env.DRY_RUN === '1';

  if (!dryRun && (!token || !chatId)) {
    console.log('TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы, пост не отправлен.');
    return 0;
  }

  for (const lecture of opened) {
    const text = buildMessage(lecture, env.SITE_URL);
    if (dryRun) {
      console.log(`[DRY_RUN] ${lecture.id}:\n${text}\n`);
    } else {
      await waitForLecture(lecture, env, fetchImpl);
      await send(token, chatId, text);
      console.log(`Отправлен пост: ${lecture.id}`);
    }
  }
  return opened.length;
}

module.exports = { findOpened, buildMessage, escapeHtml, waitForLecture, main };

if (require.main === module) {
  main(process.argv.slice(2), process.env).catch((err) => {
    console.error(process.env.GITHUB_ACTIONS ? `::error::${err.message}` : err.message);
    process.exit(1);
  });
}
