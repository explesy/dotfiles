// ==UserScript==
// @name         MeTube Download Button
// @namespace    metube-downloader
// @version      2.5
// @description  Отправляет YouTube-видео в MeTube одним кликом
// @match        https://www.youtube.com/*
// @grant        GM_xmlhttpRequest
// @connect      creo.tailc45050.ts.net
// ==/UserScript==

(function () {
  'use strict';

  const METUBE_API = 'http://creo.tailc45050.ts.net:8081/add';

  // ── Тост-уведомление ─────────────────────────────────────────────────────

  function showToast(message, isError = false) {
    const existing = document.getElementById('metube-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'metube-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position:     'fixed',
      bottom:       '28px',
      right:        '28px',
      padding:      '10px 18px',
      borderRadius: '8px',
      background:   isError ? '#c0392b' : '#1db954',
      color:        'white',
      fontSize:     '14px',
      fontFamily:   'Roboto, sans-serif',
      zIndex:       '2147483647',
      boxShadow:    '0 3px 10px rgba(0,0,0,0.35)',
      opacity:      '1',
      transition:   'opacity 0.4s ease',
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; }, 2800);
    setTimeout(() => toast.remove(), 3200);
  }

  // ── Отправка в MeTube ────────────────────────────────────────────────────

  function sendToMeTube(url, btn) {
    const original = btn.textContent;
    btn.textContent = '⏳';
    btn.disabled = true;

    GM_xmlhttpRequest({
      method:  'POST',
      url:     METUBE_API,
      headers: { 'Content-Type': 'application/json' },
      data:    JSON.stringify({ url, quality: 'best' }),
      onload(res) {
        btn.disabled = false;
        if (res.status === 200) {
          btn.textContent = '✓';
          showToast('Добавлено в MeTube!');
          setTimeout(() => { btn.textContent = original; }, 2000);
        } else {
          btn.textContent = original;
          showToast(`Ошибка MeTube: HTTP ${res.status}`, true);
        }
      },
      onerror() {
        btn.disabled = false;
        btn.textContent = original;
        showToast('Не удалось подключиться к MeTube — проверь Tailscale', true);
      },
      ontimeout() {
        btn.disabled = false;
        btn.textContent = original;
        showToast('MeTube не отвечает (таймаут)', true);
      },
      timeout: 8000,
    });
  }

  // ── Стиль кнопки ─────────────────────────────────────────────────────────

  const BTN_STYLE = `
    position: absolute;
    bottom: 8px;
    left: 8px;
    z-index: 100;
    display: block;
    background: rgba(0,0,0,0.78);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    font-family: sans-serif;
    box-shadow: 0 1px 4px rgba(0,0,0,0.5);
  `;

  // ── Извлечение URL видео ─────────────────────────────────────────────────

  function getVideoUrl(container) {
    const a = container.querySelector('a[href*="/watch?v="]');
    if (!a) return null;
    const href = a.getAttribute('href');
    return href ? 'https://www.youtube.com' + href : null;
  }

  // ── Прикрепление кнопки к превью ─────────────────────────────────────────

  function attachButton(thumbEl, container) {
    if (thumbEl.dataset.metubeOk) return;
    thumbEl.dataset.metubeOk = '1';

    const videoUrl = getVideoUrl(container);
    if (!videoUrl) return;

    // Убедиться что у превью есть position: relative для абсолютной кнопки
    if (getComputedStyle(thumbEl).position === 'static') {
      thumbEl.style.position = 'relative';
    }

    const btn = document.createElement('button');
    btn.textContent = '⬇';
    btn.title = 'Скачать через MeTube';
    btn.setAttribute('style', BTN_STYLE);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sendToMeTube(videoUrl, btn);
    });

    thumbEl.appendChild(btn);
  }

  // ── Кнопка на странице видео ─────────────────────────────────────────────

  function attachWatchButton() {
    if (document.getElementById('metube-watch-btn')) return;
    if (!location.pathname.startsWith('/watch')) return;

    const actionsRow = document.querySelector(
      'ytd-watch-metadata #actions, ' +
      '#above-the-fold #actions-inner, ' +
      '#top-level-buttons-computed'
    );
    if (!actionsRow) return;

    const btn = document.createElement('button');
    btn.id = 'metube-watch-btn';
    btn.textContent = '⬇ MeTube';
    btn.title = 'Скачать через MeTube';
    Object.assign(btn.style, {
      background:    '#ff0000',
      color:         '#fff',
      border:        'none',
      borderRadius:  '20px',
      padding:       '8px 18px',
      fontSize:      '14px',
      fontWeight:    '500',
      fontFamily:    'Roboto, sans-serif',
      cursor:        'pointer',
      marginLeft:    '12px',
      verticalAlign: 'middle',
      flexShrink:    '0',
    });

    btn.addEventListener('click', () => {
      sendToMeTube(location.href, btn);
    });

    actionsRow.appendChild(btn);
  }

  // ── Общий проход по странице ─────────────────────────────────────────────

  function processPage() {
    // Новая разметка YouTube (2025+): yt-lockup-view-model → yt-thumbnail-view-model
    // Важно: метка ставится на thumb, а не на lockup — иначе если thumb ещё не
    // отрендерился при первом проходе, lockup будет помечен и пропущен навсегда.
    document.querySelectorAll('yt-lockup-view-model').forEach((lockup) => {
      const thumb = lockup.querySelector('yt-thumbnail-view-model');
      if (!thumb || thumb.dataset.metubeOk) return;
      attachButton(thumb, lockup);
    });

    // Старая разметка (всё ещё используется в некоторых местах)
    document.querySelectorAll('ytd-thumbnail:not([data-metube-ok])').forEach((thumbEl) => {
      const container =
        thumbEl.closest(
          'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ' +
          'ytd-compact-video-renderer, ytd-reel-item-renderer'
        ) || thumbEl.parentElement;
      const wrap = thumbEl.querySelector('#thumbnail') || thumbEl;
      attachButton(wrap, container || thumbEl);
    });

    // Кнопка на странице видео
    attachWatchButton();
  }

  // ── Наблюдение за DOM (YouTube — SPA) ───────────────────────────────────

  let rafId = null;
  const observer = new MutationObserver(() => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      processPage();
      rafId = null;
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('yt-navigate-finish', () => {
    const old = document.getElementById('metube-watch-btn');
    if (old) old.remove();
    processPage();
  });

  processPage();
})();
