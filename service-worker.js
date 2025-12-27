// Service Worker - Gerenciador PRO v9.3
// Estratégia: Cache-First com Network Fallback

const CACHE_NAME = 'gerenciador-pro-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/offline.html',
    '/style.css',
    '/sidebar.css',
    '/animations.css',
    '/main.js',
    '/manifest.json'
];

// ================================================================
// INSTALL - Cachear assets essenciais
// ================================================================
self.addEventListener('install', event => {
    console.log('📦 Service Worker: Instalando...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cache aberto:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Assets cacheados com sucesso!');
            })
            .catch(error => {
                console.error('❌ Erro ao cachear assets:', error);
            })
    );
});

// ================================================================
// FETCH - Servir do cache, fallback para network
// ================================================================
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - retorna do cache
                if (response) {
                    console.log('📦 Servindo do cache:', event.request.url);
                    return response;
                }

                // Não está no cache - busca na network
                console.log('🌐 Buscando na network:', event.request.url);
                return fetch(event.request).catch(() => {
                    // Se offline e não tem cache, mostra offline.html
                    if (event.request.mode === 'navigate') {
                        console.log('📡 Offline detectado, mostrando offline.html');
                        return caches.match('/offline.html');
                    }
                });
            })
    );
});

// ================================================================
// ACTIVATE - Limpar cache antigo
// ================================================================
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker: Ativando...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => {
                console.log('✅ Service Worker ativado!');
            })
    );
});
