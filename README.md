# EXPEDIENTE 64

> El caso del dióxido de azufre. Sitio educativo interactivo en español (variante argentina) sobre la molécula SO₂, con estética noir-investigativa y experiencia premium web.

## ▶ Cómo correrlo

**Opción 1 — Abrir directamente:**
Doble clic en `index.html` desde un navegador moderno (Chrome, Edge, Firefox, Safari).

> ⚠️ Algunos navegadores bloquean módulos ES6 cargados desde `file://`. Si ves errores en la consola, usá la opción 2.

**Opción 2 — Servidor local (recomendado):**

```bash
# Python 3
python3 -m http.server 8080
# luego abrí http://localhost:8080
```

```bash
# Node.js
npx serve .
```

No requiere instalación de dependencias ni proceso de build. Todo funciona vía CDN.

## 🛠 Stack

- HTML5 + CSS3 + JavaScript ES6 (módulos)
- **Three.js 0.160** vía CDN (todas las moléculas 3D)
- **GSAP 3.12** para animaciones
- **Lucide** para iconos
- Google Fonts: Special Elite, Playfair Display, Inter, JetBrains Mono
- LocalStorage para récords y votos

## 📁 Estructura

```
expediente-64/
├── index.html
├── styles/        → CSS modular (main, sections, games, animations)
├── scripts/
│   ├── main.js
│   ├── parallax.js, cursor.js
│   ├── three/     → escenas 3D (molecule-builder, hero, suspect, lewis)
│   ├── games/     → 5 juegos (lewis-builder, sulfusnake, acid-defense, memotest, quiz)
│   └── data/      → contenido (glossary, timeline, quiz)
└── README.md
```

## 🎮 Funcionalidades

11 secciones con parallax, 5 escenas 3D únicas, 5 juegos con récord local, 2 easter eggs (código Konami + 10 clics al sello CONFIDENCIAL), tooltips de glosario, votación persistente, mapa interactivo con hotspots.

### Easter eggs

- **Konami code** (`↑↑↓↓←→←→BA`): activa el modo desclasificado.
- **Sello rojo CASO ABIERTO**: 10 clics revelan un mensaje secreto.

## ♿ Accesibilidad

HTML semántico, ARIA, contrastes WCAG AA, soporte completo `prefers-reduced-motion`.
