# Práctica 03: Mi portafolio web

**Alumno:** Rubén Morales Reyes · **Asignatura:** Aplicaciones Web · **Docente:** M.T.I Marco A. Ramírez Hernández


## 1. Objetivo
Desarrollar una página de perfil personal con HTML5, CSS3 y JavaScript básico (sin frameworks), aplicando etiquetas semánticas, estilos, diseño responsivo e interacción (carrusel y modal), y gestionar el trabajo con Git/GitHub mediante la rama `practica-03`.

## 2. Descripción del proyecto
Portafolio de una sola página con: presentación, acerca de mí, aspiraciones, hobbies, favoritos (carrusel con película, canción y libro) y redes sociales. Cada favorito abre un **modal de pantalla completa** con el video, el audio o el PDF.

## 3. Estructura de directorios
```text
practica 03/
├── miperfil.html
├── README.md
├── styles/styles.css
├── js/script.js
└── assets/
    ├── images/      (perfil, fondo1-5, odisea, el-perfume, favicoon.ico)
    ├── music/       (me-gustas.mp3, portada.jpg)
    ├── videos/      (la-odisea.mp4)
    └── documents/   (libro.pdf)
```

## 4. Tecnologías
HTML5 semántico · CSS3 (Flexbox, Grid, `clamp()`, media queries) · JavaScript básico (DOM) · Git y GitHub · Markdown. Sin librerías ni frameworks.

## 5. Secciones HTML
| Elemento | Función |
|---|---|
| `<header>` + `<nav>` | Menú fijo con enlaces internos (`href="#id"`) |
| `<main>` | Contenido principal |
| `<section id="inicio">` | Presentación con foto y frase |
| `<section id="acerca-de-mi">` | Descripción y datos personales (`<article>`) |
| `<section id="aspiraciones">` / `#hobbies` | Tarjetas `<article>` |
| `<section id="favoritos">` | Carrusel de 3 tarjetas |
| `<div id="modal">` | Ventana modal (`role="dialog"`, `aria-modal`) con `<video>`, `<audio>` e `<iframe>` del PDF |
| `<section id="redes">` | Enlaces con iconos SVG |
| `<footer>` | Pie de página y enlace "volver al inicio" |

## 6. Propiedades CSS principales
- **Parallax:** `background-attachment: fixed` + `background-size: cover` (se desactiva en celular con `scroll`).
- **Navegación fija:** `position: fixed`, `z-index`, y `scroll-margin-top` para que el menú no tape los títulos.
- **Glassmorphism:** `backdrop-filter: blur()`, fondos `rgba()`, bordes semitransparentes.
- **Distribución:** Flexbox (nav, carrusel, modal) y Grid (`.contenedor`, `.cards-container`, `.social-container`).
- **Responsivo:** `clamp()`, `min()`, media queries a 900, 600 y 400 px.
- **Carrusel:** `overflow: hidden` + `display: flex` + `transform: translateX()` con `transition`.
- **Modal:** `position: fixed; inset: 0`; el scroll del fondo se bloquea con `overflow: hidden` en `html.modal-open`.
- **Accesibilidad:** `:focus-visible`, `prefers-reduced-motion`.

## 7. Funcionalidades JavaScript (`js/script.js`)
- **Carrusel:** botones anterior/siguiente (con vuelta al inicio/final), indicadores clicables, flechas ← → del teclado, texto "Favorito X de 3" para lectores de pantalla (`aria-live`) y diapositivas ocultas con `aria-hidden` + `inert`.
- **Modal:** se abre desde los botones `data-modal`; se cierra con el botón ✕, clic fuera de la ventana o `Escape`. Al abrir bloquea el scroll; al cerrar lo restaura, **pausa y reinicia** video y audio, descarga el PDF y devuelve el foco al botón que lo abrió. El foco del teclado queda atrapado dentro del modal (Tab).
- Usa `querySelector`, `getElementById`, `addEventListener`, `classList` y manipulación del DOM. Cada evento se registra una sola vez.

## 8. Cómo ejecutar
1. Descargar o clonar el repositorio.
2. Abrir `practica 03/miperfil.html` en el navegador (doble clic).
3. Opcional: servidor local, p. ej. `python -m http.server` y visitar `http://localhost:8000/practica%2003/miperfil.html`. Si el PDF no se muestra al abrir con `file://`, usar este método o el 

## 9. Conclusiones
Aprendí a estructurar una página con etiquetas semánticas, a organizar recursos con rutas relativas, a maquetar con Flexbox y Grid, a hacerla responsiva, a manipular el DOM con eventos (carrusel y modal con control de scroll, foco y multimedia) y a trabajar con ramas, commits y Pull Requests.
## 🚀 Bonus: Hospedaje Web con GitHub Pages

* **URL Pública del Portafolio:** [https://monx030.github.io/4C-Aplicaciones-WEBB/](https://monx030.github.io/4C-Aplicaciones-WEBB/)
* **GitHub URL del Repositorio:** [https://github.com/MonX030/4C-Aplicaciones-WEBB](https://github.com/MonX030/4C-Aplicaciones-WEBB)

### 1. Procedimiento Realizado
1. Se configuró el repositorio como público para habilitar el servicio de **GitHub Pages** desde la sección de configuración (*Settings > Pages*).
2. Se estableció el despliegue automático apuntando a la rama `main` y a la carpeta raíz (`/ root`).
3. Se implementó un archivo de redirección `index.html` en la raíz principal del repositorio para enlazar automáticamente el dominio público con el portafolio personal ubicado en la subcarpeta `practica 03/`.

### 2. Dificultades Encontradas
* Al tener el proyecto estructurado dentro de una subcarpeta (`practica 03`), la URL principal de GitHub Pages no cargaba el portafolio de forma directa por defecto, mostrando el directorio general del repositorio.

### 3. Soluciones Implementadas
* Se creó un archivo HTML con redirección automática en la raíz del repositorio, logrando que al ingresar al enlace público se redirija fluidamente hacia el archivo principal del portafolio dentro de la carpeta correspondiente.
