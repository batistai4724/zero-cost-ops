// ════════════════════════════════════════════════════════════════════
//  zero-cost-ops Service Worker
//  Provides offline capability and caching for the CTO Cockpit PWA.
//
//  Strategy:
//  - Shell (HTML/CSS/JS): Cache-first with network fallback
//  - API calls (n8n, Supabase): Network-first with stale cache fallback
// ════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'zero-cost-ops-v1';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for API responses

// Files to cache on install (the app shell)
const SHELL_FILES = [
  '/dashboard/cto-cockpit.html',
  '/dashboard/system-dashboard.html',
  '/dashboard/manifest.json',
];

// ── INSTALL ────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache the app shell — fail silently if files aren't available
      return cache.addAll(SHELL_FILES).catch(err => {
        console.warn('[SW] Some shell files could not be cached:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ───────────────────────────────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ──────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin API calls in network-first mode
  const isApiCall = url.hostname.includes('supabase.co') ||
                    url.hostname.includes('onrender.com') ||
                    url.hostname.includes('n8n.cloud');

  if (isApiCall) {
    // Network-first: try network, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed — return cached version if available
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Return a generic offline response for API calls
            return new Response(
              JSON.stringify({ error: 'offline', message: 'No network connection. Showing cached data.' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
  } else {
    // Cache-first: return cached version, fetch in background
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }
});

// ── BACKGROUND SYNC ────────────────────────────────────────────────
// Future: register background sync for when connectivity is restored

self.addEventListener('sync', event => {
  if (event.tag === 'refresh-status') {
    // Trigger a status refresh when back online
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'BACK_ONLINE' });
      });
    });
  }
});
