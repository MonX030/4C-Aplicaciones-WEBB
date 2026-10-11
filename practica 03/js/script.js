/* ==================================================
   script.js - Práctica 03: Mi portafolio web
   1) Carrusel de favoritos
   2) Modal de pantalla completa (video, audio, PDF)
   ================================================== */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    /* ================= 1. CARRUSEL ================= */
    const carrusel = document.querySelector('#carrusel');
    const track    = document.getElementById('carrusel-track');
    const slides   = track.querySelectorAll('.slide');
    const dots     = document.querySelectorAll('#carrusel-dots .dot');
    const estado   = document.getElementById('carrusel-estado');
    let indice = 0;

    // Muestra la diapositiva i (con vuelta al inicio/final)
    function irA(i) {
        indice = (i + slides.length) % slides.length;
        track.style.transform = `translateX(-${indice * 100}%)`;

        slides.forEach((slide, k) => {
            const activa = k === indice;
            slide.setAttribute('aria-hidden', String(!activa));
            slide.inert = !activa;           // evita enfocar botones ocultos
        });
        dots.forEach((dot, k) => {
            dot.classList.toggle('activo', k === indice);
            if (k === indice) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
        });
        estado.textContent = `Favorito ${indice + 1} de ${slides.length}`;
    }

    document.getElementById('carrusel-prev')
        .addEventListener('click', () => irA(indice - 1));
    document.getElementById('carrusel-next')
        .addEventListener('click', () => irA(indice + 1));
    dots.forEach((dot, k) => dot.addEventListener('click', () => irA(k)));

    // Flechas del teclado cuando el carrusel tiene el foco
    carrusel.addEventListener('keydown', (e) => {
        if (e.target.closest('#modal')) return;
        if (e.key === 'ArrowLeft')  { e.preventDefault(); irA(indice - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); irA(indice + 1); }
    });

    irA(0);

    /* ================= 2. MODAL ================= */
    const modal   = document.getElementById('modal');
    const titulo  = document.getElementById('modal-titulo');
    const cerrar  = document.getElementById('modal-close');
    const video   = document.getElementById('modal-video');
    const audio   = document.getElementById('modal-audio');
    const pdf     = document.getElementById('modal-pdf');
    const paneles = modal.querySelectorAll('.modal-panel');
    const RUTA_PDF = 'assets/documents/libro.pdf';
    const TITULOS = {
        video: '🎬 La Odisea',
        audio: '🎵 Mandragora - Me Gustas',
        pdf:   '📖 El Perfume'
    };
    let abridor = null;   // botón que abrió el modal (para devolver el foco)

    function abrirModal(tipo, boton) {
        abridor = boton;
        titulo.textContent = TITULOS[tipo];
        paneles.forEach(p => { p.hidden = p.dataset.panel !== tipo; });
        if (tipo === 'pdf') pdf.src = RUTA_PDF;

        modal.hidden = false;
        document.documentElement.classList.add('modal-open');  // bloquea scroll
        document.body.classList.add('modal-open');
        cerrar.focus();
    }

    function cerrarModal() {
        if (modal.hidden) return;
        // Detener audio y video
        video.pause(); video.currentTime = 0;
        audio.pause(); audio.currentTime = 0;
        pdf.removeAttribute('src');

        modal.hidden = true;
        document.documentElement.classList.remove('modal-open'); // restaura scroll
        document.body.classList.remove('modal-open');
        if (abridor) abridor.focus();
    }

    // Botones de las tarjetas que abren el modal
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => abrirModal(btn.dataset.modal, btn));
    });

    // Cerrar: botón, clic fuera de la ventana, tecla Escape
    cerrar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });
    document.addEventListener('keydown', (e) => {
        if (modal.hidden) return;
        if (e.key === 'Escape') { cerrarModal(); return; }

        // Mantener el foco del teclado dentro del modal (Tab)
        if (e.key === 'Tab') {
            const focos = [...modal.querySelectorAll('button, a[href], iframe, audio[controls], video[controls]')]
                .filter(el => el.offsetParent !== null);
            if (!focos.length) return;
            const primero = focos[0], ultimo = focos[focos.length - 1];
            if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault(); ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault(); primero.focus();
            }
        }
    });
});
