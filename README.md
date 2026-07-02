# video-dico

SPA web mínima para tablets/móviles Android que alterna entre pantalla negra y reproducción de video al tocar la pantalla.

## Compatibilidad objetivo

- Chrome 71
- Android 4.1.2

Para mantener compatibilidad, el JavaScript está escrito en estilo ES5 (sin `async/await`, `const/let` ni funciones flecha).

## Uso

1. Colocá un video MP4 como `/video.mp4` en la raíz del proyecto (recomendado para uso offline y fijo en el dispositivo).
2. Serví el proyecto por `http://` o `https://` (no `file://`) para que el Service Worker pueda activarse.
3. Abrí la app con internet al menos una vez para que se cacheen `index.html`, `manifest.webmanifest` y los videos configurados.
4. Cuando veas que el video reproduce correctamente una vez, ya podés cortar internet y volver a abrir la app.
5. Tocá la pantalla para alternar:
   - Negro → reproduce video
   - Video → vuelve a negro

## Offline real (sin internet)

- La app registra un Service Worker (`sw.js`) y cachea recursos críticos para arranque offline.
- Los videos se cachean de forma que puedan reproducirse sin red, incluyendo solicitudes por rango (`Range`) del elemento `<video>`.
- Si un video no fue cacheado todavía y no hay red, el reproductor no podrá abrir ese recurso.

### Verificación rápida

1. Abrí la app online una vez y reproducí el video.
2. Desconectá internet.
3. Cerrá y volvé a abrir la app.
4. El video debería seguir reproduciendo sin depender de la red.

## Mantener pantalla encendida

La app solicita `Screen Wake Lock` (cuando el navegador lo soporta) para evitar suspensión/apagado mientras esté activa.

En navegadores antiguos donde Wake Lock no exista, la app sigue funcionando sin ese bloqueo de pantalla.

## Diagnóstico en pantalla (sin consola)

Si solo ves pantalla negra, abrí la app con:

- `index.html?debug=1`

Eso muestra un panel con eventos de video y estado interno (`readyState`, `networkState`, errores de códec, etc.).

Checklist rápido:

1. Si aparece `MEDIA_ERR_SRC_NOT_SUPPORTED`: el códec de ese MP4 no lo soporta el dispositivo.
2. Si no aparece `playing` después del toque: bloqueo de autoplay/gesture o formato no compatible.
3. Si queda en `waiting/stalled`: problema de lectura de archivo o red.

## Perfil de video recomendado (Android 4.1.2)

Para máxima compatibilidad, convierte tu archivo a:

- Contenedor: MP4
- Video: H.264 Baseline (nivel 3.0)
- Audio: AAC-LC, 44.1 kHz, estéreo
- Resolución sugerida: 854x480 o menor

Comando de ejemplo con FFmpeg:

`ffmpeg -i luis.mp4 -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -vf scale=854:-2 -r 30 -g 60 -c:a aac -ar 44100 -ac 2 -b:a 128k -movflags +faststart luis-android.mp4`

Luego reemplaza el archivo usado por la app (`luis.mp4`) con ese video convertido.
