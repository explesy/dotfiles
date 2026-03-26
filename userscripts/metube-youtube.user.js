// ==UserScript==
// @name         MeTube Download Button
// @namespace    metube-downloader
// @version      2.6
// @description  Отправляет YouTube-видео в MeTube одним кликом
// @match        https://www.youtube.com/*
// @grant        GM_xmlhttpRequest
// @connect      creo.tailc45050.ts.net
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const METUBE_API = 'http://creo.tailc45050.ts.net:8081/add';
  const THUMB_BUTTON_CLASS = 'metube-thumb-btn';
  const WATCH_BUTTON_ID = 'metube-watch-btn';

  // ── Тост-уведомление ─────────────────────────────────────────────────────

  function showToast(message, isError = false) {
    const existing = document.getElementById('metube-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'metube-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      padding: '10px 18px',
      borderRadius: '8px',
      background: isError ? '#c0392b' : '#1db954',
      color: 'white',
      fontSize: '14px',
      fontFamily: 'Roboto, sans-serif',
      zIndex: '2147483647',
      boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
      opacity: '1',
      transition: 'opacity 0.4s ease',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2800);
    setTimeout(() => toast.remove(), 3200);
  }

  // ── URL видео ────────────────────────────────────────────────────────────

  function normalizeVideoUrl(rawUrl) {
    if (!rawUrl) return null;

    try {
      const url = new URL(rawUrl, location.origin);
      if (!/(^|\.)youtube\.com$/.test(url.hostname)) return null;

      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
      }

      const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shortsMatch) {
        return `https://www.youtube.com/shorts/${shortsMatch[1]}`;
      }

      return null;
    } catch {
      return null;
    }
  }

  function getVideoUrl(container) {
    if (!container) return null;

    const link = container.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
    return link ? normalizeVideoUrl(link.href || link.getAttribute('href')) : null;
  }

  function getCurrentPageVideoUrl() {
    return normalizeVideoUrl(location.href);
  }

  // ── Отправка в MeTube ────────────────────────────────────────────────────

  function getResponseError(res) {
    const body = typeof res.responseText === 'string' ? res.responseText.trim() : '';
    if (!body) return `HTTP ${res.status}`;

    try {
      const parsed = JSON.parse(body);
      if (typeof parsed.error === 'string' && parsed.error) return parsed.error;
      if (typeof parsed.detail === 'string' && parsed.detail) return parsed.detail;
    } catch {
      // not json
    }

    return body.slice(0, 140);
  }

  function sendToMeTube(url, btn) {
    if (!url) {
      showToast('Не удалось определить ссылку на видео', true);
      return;
    }

    const original = btn.textContent;
    btn.textContent = '⏳';
    btn.disabled = true;

    GM_xmlhttpRequest({
      method: 'POST',
      url: METUBE_API,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ url, quality: 'best' }),
      onload(res) {
        btn.disabled = false;
        if (res.status >= 200 && res.status < 300) {
          btn.textContent = '✓';
          showToast('Добавлено в MeTube');
          setTimeout(() => {
            btn.textContent = original;
          }, 2000);
          return;
        }

        btn.textContent = original;
        showToast(`Ошибка MeTube: ${getResponseError(res)}`, true);
      },
      onerror() {
        btn.disabled = false;
        btn.textContent = original;
        showToast('Не удалось подключиться к MeTube, проверь Tailscale', true);
      },
      ontimeout() {
        btn.disabled = false;
        btn.textContent = original;
        showToast('MeTube не отвечает (таймаут)', true);
      },
      timeout: 8000,
    });
  }

  // ── Кнопки ───────────────────────────────────────────────────────────────

  function ensureRelativePosition(el) {
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
  }

  function createThumbButton(urlResolver) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = THUMB_BUTTON_CLASS;
    btn.textContent = '⬇ Download';
    btn.title = 'Скачать через MeTube';
    btn.setAttribute('aria-label', 'Скачать через MeTube');

    Object.assign(btn.style, {
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      zIndex: '100',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      minHeight: '36px',
      background: 'rgba(220, 38, 38, 0.96)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.28)',
      borderRadius: '999px',
      padding: '8px 14px',
      fontSize: '15px',
      fontWeight: '700',
      lineHeight: '1',
      cursor: 'pointer',
      fontFamily: 'Roboto, sans-serif',
      letterSpacing: '0.01em',
      boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(6px)',
      opacity: '0.96',
      transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease, opacity 120ms ease',
    });

    const setIdleState = () => {
      btn.style.background = 'rgba(220, 38, 38, 0.96)';
      btn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.35)';
      btn.style.transform = 'translateY(0)';
      btn.style.opacity = '0.96';
    };

    const setActiveState = () => {
      btn.style.background = 'rgba(239, 68, 68, 0.98)';
      btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.42)';
      btn.style.transform = 'translateY(-1px)';
      btn.style.opacity = '1';
    };

    setIdleState();

    btn.addEventListener('mouseenter', setActiveState);
    btn.addEventListener('mouseleave', setIdleState);
    btn.addEventListener('focus', setActiveState);
    btn.addEventListener('blur', setIdleState);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      sendToMeTube(urlResolver(), btn);
    });

    return btn;
  }

  function attachThumbnailButton(mountEl, urlResolver) {
    if (!mountEl || mountEl.querySelector(`.${THUMB_BUTTON_CLASS}`)) return;
    if (!urlResolver()) return;

    ensureRelativePosition(mountEl);
    mountEl.appendChild(createThumbButton(urlResolver));
  }

  // ── Кнопка на странице видео ─────────────────────────────────────────────

  function attachWatchButton() {
    if (document.getElementById(WATCH_BUTTON_ID)) return;
    if (!location.pathname.startsWith('/watch')) return;
    if (!getCurrentPageVideoUrl()) return;

    const actionsRow = document.querySelector(
      'ytd-watch-metadata #actions, ' +
      '#above-the-fold #actions-inner, ' +
      '#top-level-buttons-computed'
    );
    if (!actionsRow) return;

    const btn = document.createElement('button');
    btn.id = WATCH_BUTTON_ID;
    btn.type = 'button';
    btn.textContent = '⬇ Download in MeTube';
    btn.title = 'Скачать через MeTube';
    btn.setAttribute('aria-label', 'Скачать через MeTube');
    Object.assign(btn.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minHeight: '40px',
      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: '999px',
      padding: '10px 18px',
      fontSize: '14px',
      fontWeight: '700',
      fontFamily: 'Roboto, sans-serif',
      cursor: 'pointer',
      marginLeft: '12px',
      verticalAlign: 'middle',
      flexShrink: '0',
      boxShadow: '0 6px 18px rgba(185, 28, 28, 0.3)',
      transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 10px 22px rgba(185, 28, 28, 0.38)';
      btn.style.filter = 'brightness(1.04)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 6px 18px rgba(185, 28, 28, 0.3)';
      btn.style.filter = 'none';
    });

    btn.addEventListener('click', () => {
      sendToMeTube(getCurrentPageVideoUrl(), btn);
    });

    actionsRow.appendChild(btn);
  }

  // ── Общий проход по странице ─────────────────────────────────────────────

  function findLegacyContainer(thumbEl) {
    return (
      thumbEl.closest(
        'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ' +
        'ytd-compact-video-renderer, ytd-reel-item-renderer'
      ) || thumbEl.parentElement || thumbEl
    );
  }

  function processPage() {
    document.querySelectorAll('yt-lockup-view-model').forEach((lockup) => {
      const mountEl = lockup.querySelector('yt-thumbnail-view-model');
      attachThumbnailButton(mountEl, () => getVideoUrl(lockup));
    });

    document.querySelectorAll('ytd-thumbnail').forEach((thumbEl) => {
      attachThumbnailButton(thumbEl, () => getVideoUrl(findLegacyContainer(thumbEl)));
    });

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
    const old = document.getElementById(WATCH_BUTTON_ID);
    if (old) old.remove();
    processPage();
  });

  processPage();
})();
