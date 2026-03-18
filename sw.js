/* TradePro Service Worker v1.0 */
var CACHE = ‘tradepro-v1’;
var ASSETS = [
‘/’,
‘/index.html’,
‘/manifest.json’,
‘https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js’,
‘https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js’,
‘https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js’,
‘https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500;600&display=swap’
];

/* Install — cache core assets */
self.addEventListener(‘install’, function(e) {
e.waitUntil(
caches.open(CACHE).then(function(cache) {
return cache.addAll(ASSETS).catch(function(err) {
console.log(‘Cache add failed for some assets:’, err);
});
})
);
self.skipWaiting();
});

/* Activate — clean old caches */
self.addEventListener(‘activate’, function(e) {
e.waitUntil(
caches.keys().then(function(keys) {
return Promise.all(
keys.filter(function(k) { return k !== CACHE; })
.map(function(k) { return caches.delete(k); })
);
})
);
self.clients.claim();
});

/* Fetch — serve from cache, fallback to network */
self.addEventListener(‘fetch’, function(e) {
/* Skip Firebase and non-GET requests */
if (e.request.method !== ‘GET’) return;
if (e.request.url.includes(‘firebaseio.com’)) return;
if (e.request.url.includes(‘googleapis.com/identitytoolkit’)) return;

e.respondWith(
caches.match(e.request).then(function(cached) {
if (cached) return cached;
return fetch(e.request).then(function(response) {
/* Cache successful responses */
if (response && response.status === 200 && response.type !== ‘opaque’) {
var clone = response.clone();
caches.open(CACHE).then(function(cache) {
cache.put(e.request, clone);
});
}
return response;
}).catch(function() {
/* Offline fallback for navigation */
if (e.request.mode === ‘navigate’) {
return caches.match(’/index.html’);
}
});
})
);
});

/* Push notifications (future use) */
self.addEventListener(‘push’, function(e) {
var data = e.data ? e.data.json() : {};
var title = data.title || ‘TradePro’;
var options = {
body: data.body || ‘You have a new notification’,
icon: ‘/icon-192.png’,
badge: ‘/icon-192.png’,
vibrate: [200, 100, 200],
data: { url: data.url || ‘/’ }
};
e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener(‘notificationclick’, function(e) {
e.notification.close();
e.waitUntil(
clients.openWindow(e.notification.data.url || ‘/’)
);
});
