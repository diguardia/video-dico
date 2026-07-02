var APP_CACHE = "video-dico-app-v20260702-1";
var VIDEO_CACHE = "video-dico-video-v20260702-1";
var APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];
var VIDEO_PATH_RE = /\.(mp4|3gp)(\?|$)/i;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then(function (cache) {
        return cache.addAll(APP_ASSETS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key === APP_CACHE || key === VIDEO_CACHE) {
              return Promise.resolve();
            }
            return caches.delete(key);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) {
      return cached;
    }
    return fetch(request).then(function (response) {
      if (!response || response.status !== 200) {
        return response;
      }
      return caches.open(APP_CACHE).then(function (cache) {
        cache.put(request, response.clone());
        return response;
      });
    });
  });
}

function readRangeFromResponse(response, rangeHeader) {
  if (!rangeHeader || response.type === "opaque") {
    return Promise.resolve(response);
  }

  return response.arrayBuffer().then(function (buffer) {
    var size = buffer.byteLength;
    var parts = /bytes=(\d*)-(\d*)/i.exec(rangeHeader);
    var start;
    var end;
    var chunk;

    if (!parts) {
      return response;
    }

    if (parts[1] === "" && parts[2] === "") {
      return response;
    }

    if (parts[1] === "") {
      end = size - 1;
      start = size - parseInt(parts[2], 10);
    } else {
      start = parseInt(parts[1], 10);
      end = parts[2] ? parseInt(parts[2], 10) : size - 1;
    }

    if (isNaN(start) || isNaN(end) || start < 0 || end < start || start >= size) {
      return new Response(null, {
        status: 416,
        statusText: "Range Not Satisfiable",
        headers: {
          "Content-Range": "bytes */" + size
        }
      });
    }

    if (end >= size) {
      end = size - 1;
    }

    chunk = buffer.slice(start, end + 1);

    return new Response(chunk, {
      status: 206,
      statusText: "Partial Content",
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "video/mp4",
        "Content-Length": String(end - start + 1),
        "Content-Range": "bytes " + start + "-" + end + "/" + size,
        "Accept-Ranges": "bytes",
        "Cache-Control": response.headers.get("Cache-Control") || "public, max-age=31536000"
      }
    });
  });
}

function networkThenCacheVideo(request) {
  return fetch(request)
    .then(function (networkResponse) {
      if (networkResponse && networkResponse.status === 200) {
        caches.open(VIDEO_CACHE).then(function (cache) {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) {
          return cached;
        }
        return new Response("Offline y video no cacheado", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      });
    });
}

function handleVideo(request) {
  var rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    return caches.match(request).then(function (cached) {
      if (cached) {
        return readRangeFromResponse(cached, rangeHeader);
      }
      return networkThenCacheVideo(request).then(function (response) {
        return readRangeFromResponse(response, rangeHeader);
      });
    });
  }

  return caches.match(request).then(function (cached) {
    if (cached) {
      return cached;
    }
    return networkThenCacheVideo(request);
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (VIDEO_PATH_RE.test(url.pathname + url.search)) {
    event.respondWith(handleVideo(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match("./index.html");
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
});
