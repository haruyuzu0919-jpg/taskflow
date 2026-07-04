/**
 * Service Worker — オフラインキャッシュ
 * v3: JSファイルは常にネットワークから取得してPWAの古いキャッシュ問題を解決
 */

const CACHE_NAME = 'taskflow-v3';

// 静的アセット（アイコン・CSSのみキャッシュ）
const STATIC_ASSETS = [
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.0/dist/fonts/tabler-icons.woff2',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// インストール
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// アクティベート: 古いキャッシュをすべて削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('SW: deleting old cache', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Supabase・chrome-extension はスルー
  if (url.includes('supabase.co')) return;
  if (!url.startsWith('http')) return;

  // JS・HTMLファイルは常にネットワークから取得（古いキャッシュを使わない）
  // → PWAでも最新コードが確実に動く
  if (
    url.includes('/js/') ||
    url.endsWith('.html') ||
    url.endsWith('/')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // オフライン時はキャッシュにフォールバック
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 静的アセット（アイコン・フォント・CDN）はキャッシュファースト
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
