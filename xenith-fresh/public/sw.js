const CACHE_NAME = 'xn-academy-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/manifest.json'
];

// Install: Cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-cache non-fatal note:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Safe Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1. Only intercept GET requests
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // 2. Ignore non-HTTP/HTTPS (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Completely bypass API calls and websocket connections
  if (url.pathname.startsWith('/api') || url.pathname.includes('socket')) {
    return;
  }

  // 4. In development mode or vite internal requests, let network handle directly
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) {
    return;
  }

  // 5. Handle Navigation / HTML documents
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 6. Static image assets (e.g. logo.jpg) - Cache First
  if (req.destination === 'image' || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // 7. For all other resources, let standard fetch execute safely
  event.respondWith(
    fetch(req).catch(async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      return new Response('', { status: 408, statusText: 'Network request failed' });
    })
  );
});
