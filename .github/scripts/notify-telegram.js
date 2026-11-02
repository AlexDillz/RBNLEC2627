#!/usr/bin/env node
'use strict';

// Usage: node notify-telegram.js <old lectures.json|-> <new lectures.json>
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SITE_URL, DRY_RUN=1

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
  const base = (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '') + '/';
  return base + String(url || '').replace(/^\/+/, '');
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

async function main(argv, env, send = sendMessage) {
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
      await send(token, chatId, text);
      console.log(`Отправлен пост: ${lecture.id}`);
    }
  }
  return opened.length;
}

module.exports = { findOpened, buildMessage, escapeHtml, main };

if (require.main === module) {
  main(process.argv.slice(2), process.env).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
