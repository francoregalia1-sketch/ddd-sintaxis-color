# DDD · Sintaxis del Color

Aplicación web didáctica, estática y sin dependencias para explorar las armonías cromáticas de **Munsell**, **Janello–Caivano** y **Johannes Itten**, diseñada en coherencia visual y técnica con [ddd.geapmdp.com.ar/ostwald24/](https://ddd.geapmdp.com.ar/ostwald24/).

## Cómo abrirla
1. **Directo desde la carpeta:** hacé doble clic en `index.html` (no requiere servidor ni conexión especial; funciona en `file://`).
2. **Con servidor local (opcional):** ejecutá `python -m http.server 8080` dentro de `ddd-sintaxis-color/` y abrí `http://localhost:8080/`.

## Módulos incluidos
- **Munsell:** Adaptación CMY 9×9 recortada por luminosidad + Munsell Original (`H V/C`), Balanza de Cleland en `N5`, las 9 armonías (13 variantes), calculadora interactiva de áreas inversas al croma y mapas 2.5D de secuencias y caminos elípticos.
- **Janello–Caivano:** Matriz interactiva de 8 casos (`= / ≠`) en ejes CMY, RGB y Perceptual, ejemplos oficiales de las teóricas, comparador de progresión aritmética en Caso 8 y sólido isométrico 3D.
- **Itten:** Rueda giratoria en CMY (12 y 24 tonos) y RYB clásico (12 tonos) con polígonos arrastrables + Laboratorio interactivo de los 7 contrastes.
- **Probador en Trama:** Aplicación instantánea de cualquier paleta sobre 4 motivos bidimensionales, permutación de planos, test de escala de grises, vista de cesía y exportación a lámina PNG (A5 horizontal).
