const CACHE_NAME = 'cift-wordle-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Cache edilecek statik dosyalar
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoint'leri
const API_ENDPOINTS = [
  '/api/words/validate',
  '/api/words/random',
  '/api/socket'
];

// Install event - statik dosyaları cache'le
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Static cache opened');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('Cache install failed:', error);
      })
  );
});

// Activate event - eski cache'leri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - network first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API istekleri için network first
  if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Başarılı response'u cache'le
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network hatası durumunda cache'den döndür
          return caches.match(request);
        })
    );
    return;
  }

  // Statik dosyalar için cache first
  if (request.method === 'GET' && request.destination !== 'document') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Sayfa istekleri için network first
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline durumunda offline sayfasını göster
          return caches.match('/offline');
        })
    );
    return;
  }

  // Diğer istekler için normal fetch
  event.respondWith(fetch(request));
});

// Background sync için
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notification için
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni bildirim!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Oyna',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Çift Wordle', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync fonksiyonu
async function doBackgroundSync() {
  try {
    // Offline verileri senkronize et
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      // Verileri sunucuya gönder
      await syncOfflineData(offlineData);
      // Offline verileri temizle
      await clearOfflineData();
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Offline veri alma
async function getOfflineData() {
  // IndexedDB'den offline verileri al
  return [];
}

// Offline veri senkronizasyonu
async function syncOfflineData(data) {
  // Verileri sunucuya gönder
  console.log('Syncing offline data:', data);
}

// Offline veri temizleme
async function clearOfflineData() {
  // IndexedDB'den offline verileri temizle
  console.log('Clearing offline data');
}

// Cache temizleme fonksiyonu
async function clearOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(
    name => name !== CACHE_NAME && name !== STATIC_CACHE && name !== DYNAMIC_CACHE
  );
  
  await Promise.all(
    oldCaches.map(name => caches.delete(name))
  );
}

// Her 24 saatte bir eski cache'leri temizle
setInterval(clearOldCaches, 24 * 60 * 60 * 1000);
