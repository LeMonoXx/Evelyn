const CACHE_NAME = 'offlinecache';

// Add list of files to cache here.
const FILES_TO_CACHE = [
  'offline.html',
  '/favicon.ico',
  // 'styles/colors.scss',
  // 'styles/variables.scss',
  '/assets/icon.png'
  // 'app/features/main-menu/page/mainmain-page.component.html'
];

self.addEventListener('install', e => {
  // console.log('[ServiceWorker] Install');
  // Precache static resources here maybe??. 'styles/variables.scss'

  self.skipWaiting();
});

self.addEventListener('activate', e => {
 // console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
    //  console.log('[ServiceWorker] Caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  // Remove previous cached data
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
         //   console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  return self.clients.claim();
});

//Returning Offline-Page from Cache
self.addEventListener('fetch', e => {
  // console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.open(CACHE_NAME).then(cache => {
        return cache.match('offline.html');
      });
    })
  );
});
