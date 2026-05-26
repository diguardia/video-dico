# video-dico

SPA web mínima para tablets/móviles Android que alterna entre pantalla negra y reproducción de video al tocar la pantalla.

## Compatibilidad objetivo

- Chrome 71
- Android 4.1.2

Para mantener compatibilidad, el JavaScript está escrito en estilo ES5 (sin `async/await`, `const/let` ni funciones flecha).

## Uso

1. Colocá un video MP4 como `/video.mp4` en la raíz del proyecto (recomendado para uso offline y fijo en el dispositivo).
2. Abrí `index.html` en un navegador móvil o servilo con un servidor estático.
3. Tocá la pantalla para alternar:
   - Negro → reproduce video
   - Video → vuelve a negro

## Mantener pantalla encendida

La app solicita `Screen Wake Lock` (cuando el navegador lo soporta) para evitar suspensión/apagado mientras esté activa.

En navegadores antiguos donde Wake Lock no exista, la app sigue funcionando sin ese bloqueo de pantalla.
