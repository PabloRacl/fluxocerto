const CACHE_NAME = "fluxocerto-v1";
const STATIC_ASSETS = ["/", "/entrar", "/cadastro", "/painel"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Não cachear requisições de API
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Não cachear requisições de autenticação
  if (url.pathname.startsWith("/api/auth/")) {
    return;
  }

  // Strategy: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear resposta bem-sucedida
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback para cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se não tiver cache, retornar página offline básica
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
      }),
  );
});
