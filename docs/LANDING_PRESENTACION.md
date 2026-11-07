# Landing de VACCA

La presentación pública está en `/landing`, integrada al frontend. Conserva
el isotipo, la tipografía Manrope y los tokens de colores, radios y sombras
de la aplicación. El acceso lleva al login o a Inicio según la sesión.

## Recorrido

La portada muestra el tablero real. Después se presenta el flujo de organizar,
evaluar y seguir el rodeo; una galería permite elegir diez pantallas y ampliar
cada captura con un diálogo accesible. Se explican las funciones principales,
el acceso desde celular, el alcance experimental de la CC automática y el
proyecto. Las etapas anteriores se pueden desplegar sin ocupar toda la página.
No se publican estadísticas de precisión como promesas de uso.

## Capturas reales

Hay catorce capturas JPEG en `public/landing`: doce de escritorio (1440×960)
y dos de celular (390×844). Incluyen inicio, rodeo, mapa, animal, sesiones,
detalle de sesión, servicios, detalle de servicio, importación, tabla de alta,
historial y campo. La galería usa diez vistas; las otras quedan como material
de presentación. La portada reutiliza Inicio y la sección móvil muestra Inicio
y la ficha del animal.

Todas salen de `backend/scripts/preview_local.py`, con cuenta, animales y lotes
de demostración. No contienen datos productivos. La foto de ejemplo proviene
del fixture existente de IA, cargada mediante el almacenamiento local de la app.
`public/landing/capturas.json` registra rutas, tamaños y fecha de la generación.
No se retocó la interfaz ni se reemplazaron datos mediante respuestas simuladas.
El mapa capturado muestra los polígonos de demo; no se presenta como fotografía
satelital de un campo real.

## Reproducir y revisar

Con la demo del backend en 8026 y el build del frontend apuntando a
`http://127.0.0.1:8026/api`, servido en 5180:

```sh
node scripts/capturas-landing.mjs
node scripts/landing.browser.test.mjs
```

El primer script sólo permite un frontend localhost/127.0.0.1 y usa la cuenta
de demo del backend local. El segundo comprueba navegación, imágenes, cambio
de vista, ampliación, Escape y ausencia de desbordes en 320, 390, 768 y 1440px.
Guarda las vistas de revisión de la landing en `.local/landing`, fuera de Git.

La landing funciona sin autenticación y carga las capturas secundarias de
forma diferida. Respeta la preferencia de movimiento reducido y permite
navegar por teclado. Sigue pendiente únicamente la publicación, que no fue
solicitada; el trabajo queda en la rama local `recta-final`, sin push.
