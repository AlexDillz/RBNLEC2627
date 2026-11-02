<h1 align="center">RUBIN QR LEC</h1>

<p align="center">
  Статический сайт с лекциями и материалами Школы вожатского мастерства ОЛАС «Рубин».
</p>

<p align="center">
  <img src="https://img.shields.io/badge/GitHub%20Pages-ready-111827?style=for-the-badge" alt="GitHub Pages Ready">
  <img src="https://img.shields.io/badge/HTML%20%2F%20CSS%20%2F%20JS-vanilla-1f2937?style=for-the-badge" alt="Vanilla Stack">
  <img src="https://img.shields.io/badge/status-inactive-374151?style=for-the-badge" alt="Project Status">
</p>

---

## О проекте

**RUBIN QR LEC** — это сайт, через который участники быстро попадают к нужным лекциям, материалам и дополнительным разделам ШВМ.

Сценарий простой:

1. Участник сканирует QR-код.
2. Открывает главную страницу со списком лекций.
3. Переходит в нужную лекцию, карточки лекторов, контакты или экзаменационные билеты.

Проект специально сделан **максимально простым в поддержке**: без сборщиков, без backend, без сложной инфраструктуры.

---

## Что уже есть

- главная страница со списком лекций
- отдельные HTML-страницы для каждой лекции
- светлая и тёмная темы
- поддержка закрытых лекций
- защита от некорректного локального открытия части материалов
- разделы:
  - `Команда и лекторы`
  - `Исследователи`
  - `Наши контакты`
  - `Экзаменационные билеты`
- материалы, изображения и вспомогательные файлы в `assets/`

---

## Стек

- **HTML**
- **CSS**
- **Vanilla JavaScript**
- **GitHub Pages**

---

## Структура проекта

```text
.
├── index.html
├── lectures.json
├── style.css
├── theme.js
├── protect-local.js
├── contacts.html
├── researchers.html
├── exam-tickets.html
├── lectures/
│   ├── *.html
│   └── personas.html
└── assets/
    ├── lecs/
    ├── personas/
    ├── cards/
    └── ...

python3 -m http.server 8000
