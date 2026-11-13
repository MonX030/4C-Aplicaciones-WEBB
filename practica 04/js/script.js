/* =====================================================================
   MecaGest - script.js
   Toda la lógica de la página vive aquí.

   Índice
     0. Utilidades, avisos y sonido
     1. Menú de secciones
     2. Registro de nuevos usuarios (pasos, validación, redes, ubicación)
     3. Mis Citas (filtro por mes o por semana)
     4. Agendar cita
     5. Herramientas
     6. Mi Cuenta
     7. Ajustes (colores y volumen)
     8. Arranque
   ===================================================================== */

(function () {
    'use strict';

    /* ===================================================================
       0. UTILIDADES, AVISOS Y SONIDO
       =================================================================== */

    // Atajos para buscar elementos
    const $ = (selector, contexto = document) => contexto.querySelector(selector);
    const $$ = (selector, contexto = document) => Array.from(contexto.querySelectorAll(selector));

    // Quita acentos y mayúsculas: "Dinamométrica" -> "dinamometrica"
    const normalizar = (texto) =>
        String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const pad2 = (n) => String(n).padStart(2, '0');

    const MESES = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

    // Convierte "2026-10-15" en una fecha LOCAL (new Date("2026-10-15") usaría UTC
    // y podría mostrar un día menos, por eso se separa año, mes y día).
    function fechaLocal(valorISO) {
        const [a, m, d] = valorISO.split('-').map(Number);
        return new Date(a, m - 1, d);
    }

    // Catálogo de países, estados y ciudades (viene de js/domicilios.js)
    const DATOS = window.MECAGEST_DOMICILIOS || { paises: ['México'], estadosMexico: [], ejemplosMexico: [] };

    // Guardar y leer datos en el navegador (localStorage) sin que truene si está bloqueado
    const CLAVES = {
        ajustes: 'mecagest_ajustes',
        solicitudes: 'mecagest_solicitudes',
        cuenta: 'mecagest_cuenta',
        foto: 'mecagest_foto',
        herramientas: 'mecagest_herramientas',
        citas: 'mecagest_citas_agendadas'
    };

    const Almacen = {
        leer(clave, porDefecto) {
            try {
                const valor = localStorage.getItem(clave);
                return valor === null ? porDefecto : JSON.parse(valor);
            } catch (e) {
                return porDefecto;
            }
        },
        guardar(clave, valor) {
            try {
                localStorage.setItem(clave, JSON.stringify(valor));
                return true;
            } catch (e) {
                return false;
            }
        }
    };

    // Sonidos sencillos generados con Web Audio (no necesitan archivos).
    // Respetan el volumen y el botón "Silenciar" de la sección Ajustes.
    const Sonido = {
        volumen: 80,
        contexto: null,
        tocar(tipo) {
            if (this.volumen <= 0) return;
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.contexto = this.contexto || new AC();
                if (this.contexto.state === 'suspended') this.contexto.resume();

                const melodias = { click: [660], ok: [660, 880], error: [220, 180] };
                const notas = melodias[tipo] || melodias.click;
                const t0 = this.contexto.currentTime;
                const nivel = Math.max((this.volumen / 100) * 0.25, 0.0002);

                notas.forEach((frecuencia, i) => {
                    const osc = this.contexto.createOscillator();
                    const ganancia = this.contexto.createGain();
                    const inicio = t0 + i * 0.09;
                    osc.type = 'sine';
                    osc.frequency.value = frecuencia;
                    ganancia.gain.setValueAtTime(0.0001, inicio);
                    ganancia.gain.exponentialRampToValueAtTime(nivel, inicio + 0.01);
                    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.09);
                    osc.connect(ganancia);
                    ganancia.connect(this.contexto.destination);
                    osc.start(inicio);
                    osc.stop(inicio + 0.1);
                });
            } catch (e) {
                /* Si el navegador no permite audio, simplemente no suena */
            }
        }
    };

    // Aviso flotante abajo de la pantalla (tipo: 'ok', 'error' o 'click')
    let temporizadorAviso;
    function avisar(mensaje, tipo) {
        tipo = tipo || 'click';
        Sonido.tocar(tipo);
        const toast = $('#toast');
        if (!toast) return;
        toast.textContent = mensaje;
        toast.className = 'toast' + (tipo === 'ok' || tipo === 'error' ? ' ' + tipo : '');
        toast.hidden = false;
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => { toast.hidden = true; }, 3800);
    }


    /* ===================================================================
       1. MENÚ DE SECCIONES
       =================================================================== */
    function iniciarMenu() {
        const botones = $$('.menu-btn');
        const paneles = $$('.panel');

        botones.forEach((boton) => {
            boton.addEventListener('click', () => {
                const destino = boton.dataset.tab;

                botones.forEach((b) => b.classList.toggle('active', b === boton));
                paneles.forEach((p) => p.classList.toggle('active', p.id === 'tab-' + destino));

                // Centra el botón activo en el menú (útil en celular)
                boton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                Sonido.tocar('click');
            });
        });
    }


    /* ===================================================================
       2. REGISTRO DE NUEVOS USUARIOS
       =================================================================== */
    function iniciarRegistro() {
        const form = $('#formRegistro');
        if (!form) return;

        const pasos = $$('.step', form);
        const indicadores = $$('#stepper li');
        const btnAnterior = $('#btnAnterior');
        const btnSiguiente = $('#btnSiguiente');
        const accionesFinales = $('#accionesFinales');
        const mensajeExito = $('#mensajeExito');
        const botonEnviar = $('input[type="submit"]', form);
        let pasoActual = 0;

        const campo = (id) => document.getElementById(id);


        /* ---------- 2.1 Fecha de nacimiento y edad automática ---------- */
        const fechaNac = campo('fechaNacimiento');
        const edad = campo('edad');
        const mensajeEdad = campo('mensajeEdad');

        function calcularEdad(nacimiento) {
            const hoy = new Date();
            let anios = hoy.getFullYear() - nacimiento.getFullYear();
            const meses = hoy.getMonth() - nacimiento.getMonth();
            // Si todavía no cumple años este año, se resta uno
            if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) anios--;
            return anios;
        }

        function actualizarEdad() {
            mensajeEdad.textContent = '';
            mensajeEdad.className = 'mensaje-edad';
            edad.value = '';
            if (!fechaNac.value) return;

            const nacimiento = fechaLocal(fechaNac.value);
            if (nacimiento > new Date()) return; // la validación mostrará el error

            const anios = calcularEdad(nacimiento);
            edad.value = anios + (anios === 1 ? ' año' : ' años');

            if (anios >= 18) {
                mensajeEdad.textContent = `Edad: ${anios} años. El usuario es MAYOR de edad.`;
                mensajeEdad.className = 'mensaje-edad ok';
            } else {
                mensajeEdad.textContent = `Edad: ${anios} años. El usuario es MENOR de edad.`;
                mensajeEdad.className = 'mensaje-edad mal';
            }
        }

        // No se pueden elegir fechas futuras
        const hoy = new Date();
        fechaNac.max = `${hoy.getFullYear()}-${pad2(hoy.getMonth() + 1)}-${pad2(hoy.getDate())}`;
        fechaNac.addEventListener('input', actualizarEdad);
        fechaNac.addEventListener('change', actualizarEdad);


        /* ---------- 2.2 Redes sociales: la casilla activa su campo ---------- */
        const redes = [
            { casilla: 'chkFacebook', campo: 'urlFacebook' },
            { casilla: 'chkLinkedin', campo: 'urlLinkedin' },
            { casilla: 'chkWhatsapp', campo: 'whatsAppQR' }
        ];

        redes.forEach((red) => {
            const casilla = campo(red.casilla);
            const entrada = campo(red.campo);

            casilla.addEventListener('change', () => {
                entrada.disabled = !casilla.checked;   // solo se puede escribir si está marcada
                if (casilla.checked) {
                    entrada.focus();
                } else {
                    entrada.value = '';                // al desmarcar se borra el dato
                    limpiarError(entrada);
                }
            });
        });

        function reiniciarRedes() {
            redes.forEach((red) => {
                campo(red.campo).disabled = true;
                campo(red.casilla).checked = false;
            });
        }


        /* ---------- 2.3 Contraseña: botón para ver u ocultar ---------- */
        // Cambia el ícono del botón (ojo abierto / ojo tachado)
        function ponerIconoOjo(boton, visible) {
            const uso = boton.querySelector('use');
            if (uso) uso.setAttribute('href', visible ? '#i-eye-off' : '#i-eye');
            boton.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
            boton.title = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';
        }

        function ocultarContrasenas() {
            $$('.ver-pass').forEach((boton) => {
                campo(boton.dataset.target).type = 'password';
                ponerIconoOjo(boton, false);
            });
        }

        $$('.ver-pass').forEach((boton) => {
            boton.addEventListener('click', () => {
                const entrada = campo(boton.dataset.target);
                const mostrar = entrada.type === 'password';
                entrada.type = mostrar ? 'text' : 'password';
                ponerIconoOjo(boton, mostrar);
            });
        });


        /* ---------- 2.4 Ubicación: país, estado y ciudad desde el catálogo ---------- */
        const pais = campo('pais');
        const estado = campo('estado');
        const ciudad = campo('ciudad');
        const codigoPostal = campo('codigoPostal');
        const listaEstados = campo('listaEstados');
        const listaCiudades = campo('listaCiudades');
        const ayudaDomicilio = campo('ayudaDomicilio');
        let cpAutomatico = false; // true cuando el C.P. lo puso el catálogo (no el usuario)

        const esMexico = () => pais.value === 'México';

        DATOS.paises.forEach((nombre) => {
            const opcion = document.createElement('option');
            opcion.value = nombre;
            opcion.textContent = nombre;
            pais.appendChild(opcion);
        });
        pais.value = 'México';

        function llenarLista(datalist, valores) {
            datalist.innerHTML = '';
            valores.forEach((valor) => {
                const opcion = document.createElement('option');
                opcion.value = valor;
                datalist.appendChild(opcion);
            });
        }

        // Las ciudades sugeridas dependen del estado elegido
        function ciudadesDelEstado() {
            if (!esMexico()) return [];
            const estadoElegido = normalizar(estado.value);
            return DATOS.ejemplosMexico
                .filter((item) => normalizar(item.estado) === estadoElegido)
                .map((item) => item.ciudad);
        }

        function actualizarListas() {
            llenarLista(listaEstados, esMexico() ? DATOS.estadosMexico : []);
            llenarLista(listaCiudades, ciudadesDelEstado());
            estado.placeholder = esMexico() ? 'Puebla' : 'Estado, provincia o región';
            ciudad.placeholder = esMexico() ? 'Huauchinango' : 'Ciudad';
        }

        // Si la ciudad está en el catálogo, se sugiere su código postal y colonia
        function sugerirDomicilio() {
            ayudaDomicilio.textContent = '';
            if (!esMexico()) return;

            const encontrado = DATOS.ejemplosMexico.find((item) =>
                normalizar(item.estado) === normalizar(estado.value) &&
                normalizar(item.ciudad) === normalizar(ciudad.value));

            if (encontrado) {
                if (!codigoPostal.value || cpAutomatico) {
                    codigoPostal.value = encontrado.cp;
                    cpAutomatico = true;
                    limpiarError(codigoPostal);
                }
                ayudaDomicilio.textContent =
                    `Sugerencia del catálogo: C.P. ${encontrado.cp}, colonia ${encontrado.colonia}. ` +
                    'Puedes cambiarlo si tu domicilio es otro.';
            } else if (ciudad.value || estado.value) {
                ayudaDomicilio.textContent =
                    'Si tu ciudad o código postal no aparece en la lista, puedes escribirlo manualmente.';
            }
        }

        function reiniciarUbicacion() {
            pais.value = 'México';
            cpAutomatico = false;
            ayudaDomicilio.textContent = '';
            actualizarListas();
        }

        pais.addEventListener('change', () => {
            estado.value = '';
            ciudad.value = '';
            if (cpAutomatico) codigoPostal.value = '';
            cpAutomatico = false;
            [estado, ciudad, codigoPostal].forEach(limpiarError);
            actualizarListas();
            sugerirDomicilio();
        });

        estado.addEventListener('input', () => { actualizarListas(); sugerirDomicilio(); });
        ciudad.addEventListener('input', sugerirDomicilio);
        ciudad.addEventListener('change', sugerirDomicilio);

        codigoPostal.addEventListener('input', () => {
            cpAutomatico = false; // si el usuario lo escribe, ya no lo cambiamos solos
            codigoPostal.value = esMexico()
                ? codigoPostal.value.replace(/\D/g, '').slice(0, 5)
                : codigoPostal.value.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 10);
        });

        actualizarListas();


        /* ---------- 2.5 Reglas de validación ---------- */
        const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]+$/;
        // Correo: texto + @ + dominio + punto + terminación de 2 letras o más
        const regexCorreo = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
        const digitos = (valor) => valor.replace(/\D/g, '');

        const reglas = {
            nombre: (v) => !soloLetras.test(v) ? 'Solo se permiten letras.'
                : v.trim().length < 2 ? 'Mínimo 2 caracteres.' : '',

            apPaterno: (v) => !soloLetras.test(v) ? 'Solo se permiten letras.' : '',

            apMaterno: (v) => v && !soloLetras.test(v) ? 'Solo se permiten letras.' : '',

            fechaNacimiento: (v) => {
                const nacimiento = fechaLocal(v);
                if (nacimiento > new Date()) return 'La fecha no puede ser futura.';
                return calcularEdad(nacimiento) < 18 ? 'Debes ser mayor de 18 años.' : '';
            },

            email: (v) => !v.includes('@') ? 'El correo debe incluir el símbolo @.'
                : !regexCorreo.test(v) ? 'Escribe un correo válido, por ejemplo nombre@dominio.com.' : '',

            numTelefonico: (v) => digitos(v).length < 10 || digitos(v).length > 13
                ? 'El teléfono debe tener entre 10 y 13 dígitos.' : '',

            telefonoFijo: (v) => v && digitos(v).length !== 10 ? 'El teléfono fijo debe tener 10 dígitos.' : '',

            horarioContactoFin: (v) => {
                const inicio = campo('horarioContactoInicio').value;
                return v && inicio && v <= inicio ? 'La hora final debe ser posterior a la inicial.' : '';
            },

            urlFacebook: (v) => !v.trim() ? 'Escribe la URL de tu Facebook.'
                : !/^https?:\/\/([a-z0-9-]+\.)?facebook\.com\/.+/i.test(v) ? 'La URL de Facebook no es válida.' : '',

            urlLinkedin: (v) => !v.trim() ? 'Escribe la URL de tu Linkedin.'
                : !/^https?:\/\/([a-z0-9-]+\.)?linkedin\.com\/.+/i.test(v) ? 'La URL de Linkedin no es válida.' : '',

            whatsAppQR: (v, el) => !el.files.length ? 'Carga la imagen del código QR de Whatsapp.'
                : !el.files[0].type.startsWith('image/') ? 'El QR debe ser una imagen.' : '',

            usuario: (v) => v.length < 4 ? 'Mínimo 4 caracteres.'
                : !/^[A-Za-z0-9._-]+$/.test(v) ? 'Solo letras, números, punto, guion y guion bajo.'
                : Almacen.leer(CLAVES.solicitudes, []).some((s) => s.usuario.toLowerCase() === v.toLowerCase())
                    ? 'Ese usuario ya fue solicitado. Elige otro.' : '',

            contrasena: (v) => v.length < 8 ? 'Mínimo 8 caracteres.'
                : !/[A-Z]/.test(v) ? 'Debe incluir al menos una mayúscula.'
                : !/\d/.test(v) ? 'Debe incluir al menos un número.' : '',

            confirmarContrasena: (v) => v !== campo('contrasena').value ? 'Las contraseñas no coinciden.' : '',

            estado: (v) => !soloLetras.test(v) ? 'Solo se permiten letras.'
                : esMexico() && !DATOS.estadosMexico.some((e) => normalizar(e) === normalizar(v))
                    ? 'Elige un estado de la lista.' : '',

            ciudad: (v) => !soloLetras.test(v) ? 'Solo se permiten letras.' : '',

            codigoPostal: (v) => esMexico()
                ? (!/^\d{5}$/.test(v) ? 'El código postal debe tener 5 dígitos.' : '')
                : (!/^[A-Za-z0-9 -]{3,10}$/.test(v) ? 'Escribe un código postal válido.' : '')
        };


        /* ---------- 2.6 Mostrar y quitar errores ---------- */
        // El mensaje se coloca después del campo (o después del contenedor del ojo)
        const ancla = (el) => el.closest('.campo-pass') || el;

        function mostrarError(el, mensaje) {
            limpiarError(el);
            el.classList.add('invalid');
            const span = document.createElement('span');
            span.className = 'error-msg';
            span.dataset.for = el.id;
            span.textContent = mensaje;
            ancla(el).insertAdjacentElement('afterend', span);
        }

        function limpiarError(el) {
            el.classList.remove('invalid');
            const siguiente = ancla(el).nextElementSibling;
            if (siguiente && siguiente.classList.contains('error-msg') && siguiente.dataset.for === el.id) {
                siguiente.remove();
            }
        }

        function validarCampo(el) {
            // Un campo desactivado (red social sin marcar) no se valida
            if (el.disabled) {
                limpiarError(el);
                return true;
            }

            const valor = el.type === 'file' ? el.value : el.value.trim();
            const esRed = ['urlFacebook', 'urlLinkedin', 'whatsAppQR'].includes(el.id);
            let mensaje = '';

            if (el.required && !valor) {
                mensaje = el.tagName === 'SELECT' ? 'Selecciona una opción.' : 'Este campo es obligatorio.';
            } else if (reglas[el.id] && (valor || esRed || el.id === 'confirmarContrasena')) {
                mensaje = reglas[el.id](valor, el);
            }

            if (mensaje) mostrarError(el, mensaje); else limpiarError(el);
            return !mensaje;
        }

        const camposDelPaso = (paso) => $$('input:not([type="checkbox"]), select', paso);

        function validarPaso(i) {
            let primerError = null;
            camposDelPaso(pasos[i]).forEach((el) => {
                if (!validarCampo(el) && !primerError) primerError = el;
            });
            if (primerError) primerError.focus();
            return !primerError;
        }


        /* ---------- 2.7 Navegación entre pasos ---------- */
        function mostrarPaso(i) {
            pasoActual = i;
            pasos.forEach((paso, n) => paso.classList.toggle('active', n === i));
            indicadores.forEach((li, n) => {
                li.classList.toggle('active', n === i);
                li.classList.toggle('done', n < i);
            });
            btnAnterior.style.visibility = i === 0 ? 'hidden' : 'visible';
            const esUltimo = i === pasos.length - 1;
            btnSiguiente.hidden = esUltimo;
            accionesFinales.hidden = !esUltimo;
        }

        btnSiguiente.addEventListener('click', () => {
            if (pasoActual >= pasos.length - 1) return; // en el último paso se usa "Enviar"
            if (validarPaso(pasoActual)) {
                mostrarPaso(pasoActual + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                Sonido.tocar('error');
            }
        });

        btnAnterior.addEventListener('click', () => {
            mostrarPaso(pasoActual - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });


        /* ---------- 2.8 Validación en vivo ---------- */
        // Al salir de un campo se revisa
        form.addEventListener('focusout', (e) => {
            if (e.target.matches('input:not([type="checkbox"]), select')) validarCampo(e.target);
        });

        // Si el campo estaba en rojo, se vuelve a revisar mientras escribe
        form.addEventListener('input', (e) => {
            if (e.target.classList.contains('invalid')) validarCampo(e.target);
        });
        form.addEventListener('change', (e) => {
            if (e.target.classList.contains('invalid')) validarCampo(e.target);
        });

        // Si cambia la contraseña, se revisa otra vez la confirmación
        campo('contrasena').addEventListener('input', () => {
            const confirmar = campo('confirmarContrasena');
            if (confirmar.value) validarCampo(confirmar);
        });

        // Si cambia la hora de inicio, se revisa la hora final
        campo('horarioContactoInicio').addEventListener('input', () => {
            validarCampo(campo('horarioContactoFin'));
        });

        // Teléfonos: solo números y símbolos comunes
        ['numTelefonico', 'telefonoFijo'].forEach((id) => {
            campo(id).addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d\s()+-]/g, '');
            });
        });

        // El correo se guarda en minúsculas y sin espacios
        campo('email').addEventListener('blur', (e) => {
            e.target.value = e.target.value.trim().toLowerCase();
        });


        /* ---------- 2.9 Envío del formulario (simulado) ---------- */
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            mensajeExito.hidden = true;

            // Se revisan todos los pasos; si uno falla, se regresa a él
            for (let i = 0; i < pasos.length; i++) {
                if (!validarPaso(i)) {
                    mostrarPaso(i);
                    validarPaso(i);
                    Sonido.tocar('error');
                    return;
                }
            }

            // Términos y condiciones
            const terminos = campo('validado');
            const etiquetaTerminos = form.querySelector('label[for="validado"]');
            const errorViejo = etiquetaTerminos.nextElementSibling;
            if (errorViejo && errorViejo.classList.contains('error-msg')) errorViejo.remove();

            if (!terminos.checked) {
                const span = document.createElement('span');
                span.className = 'error-msg';
                span.textContent = 'Debes aceptar los términos y condiciones.';
                etiquetaTerminos.insertAdjacentElement('afterend', span);
                Sonido.tocar('error');
                return;
            }

            // Se guarda la solicitud en el navegador (la contraseña NO se guarda)
            const textoDe = (select) => select.options[select.selectedIndex].text;
            const solicitud = {
                titulo: textoDe(campo('tituloCortesia')),
                nombre: campo('nombre').value.trim(),
                apellidoPaterno: campo('apPaterno').value.trim(),
                apellidoMaterno: campo('apMaterno').value.trim(),
                genero: textoDe(campo('genero')),
                fechaNacimiento: fechaNac.value,
                edad: edad.value,
                email: campo('email').value.trim(),
                telefono: campo('numTelefonico').value.trim(),
                telefonoFijo: campo('telefonoFijo').value.trim(),
                horarioContacto: `${campo('horarioContactoInicio').value} - ${campo('horarioContactoFin').value}`,
                facebook: campo('urlFacebook').value.trim(),
                linkedin: campo('urlLinkedin').value.trim(),
                usuario: campo('usuario').value.trim(),
                direccion: campo('direccion').value.trim(),
                pais: pais.value,
                estado: estado.value.trim(),
                ciudad: ciudad.value.trim(),
                codigoPostal: codigoPostal.value,
                fechaSolicitud: new Date().toISOString()
            };

            const solicitudes = Almacen.leer(CLAVES.solicitudes, []);
            solicitudes.push(solicitud);
            Almacen.guardar(CLAVES.solicitudes, solicitudes);

            // Simulación de envío al servidor
            botonEnviar.disabled = true;
            botonEnviar.value = 'Enviando...';

            setTimeout(() => {
                form.reset();
                botonEnviar.disabled = false;
                botonEnviar.value = 'Enviar Solicitud';
                mensajeExito.hidden = false;
                mensajeExito.scrollIntoView({ behavior: 'smooth', block: 'center' });
                Sonido.tocar('ok');
                setTimeout(() => { mensajeExito.hidden = true; }, 8000);
            }, 1500);
        });

        // Al limpiar el formulario (botón o después de enviar) se deja todo como al inicio
        form.addEventListener('reset', () => {
            setTimeout(() => {
                $$('.error-msg', form).forEach((span) => span.remove());
                $$('.invalid', form).forEach((el) => el.classList.remove('invalid'));
                reiniciarRedes();
                ocultarContrasenas();
                reiniciarUbicacion();
                actualizarEdad();
                mostrarPaso(0);
            }, 0);
        });

        mostrarPaso(0);
    }


    /* ===================================================================
       3. MIS CITAS: filtro por mes o por semana
       =================================================================== */
    // Funciones compartidas con "Agendar cita"
    const tablaCitas = () => $('#tablaCitas tbody');

    function renumerarCitas() {
        $$('tr', tablaCitas()).forEach((fila, i) => { fila.cells[0].textContent = (i + 1) + '.'; });
    }

    // Agrega una fila a la tabla de citas (se usa al agendar y al cargar lo guardado)
    function agregarFilaCita(cita) {
        const [fechaTexto, horaTexto] = cita.fecha.split('T');
        const fecha = fechaLocal(fechaTexto);
        const textoFecha = `${fecha.getDate()} de ${capitalizar(MESES[fecha.getMonth()])} de ${fecha.getFullYear()}, ${horaTexto} h`;

        const fila = tablaCitas().insertRow();
        fila.insertCell().textContent = '';
        fila.insertCell().textContent = `Cita solicitada en la sucursal: ${cita.sucursal}`;
        fila.insertCell().textContent = cita.descripcion;
        fila.insertCell().textContent = textoFecha;

        const estatus = document.createElement('span');
        estatus.className = 'estatus programada';
        estatus.textContent = 'Programada';
        fila.insertCell().appendChild(estatus);

        renumerarCitas();
    }

    function iniciarCitas() {
        const mes = $('#mesCitas');
        const semana = $('#semanaCitas');
        const radioMes = $('#filtroMes');
        const resumen = $('#resumenCitas');
        if (!mes || !semana || !radioMes || !resumen) return;

        const DIA_MS = 86400000;
        const filas = () => $$('tr', tablaCitas());

        // Mes y semana: solo se activa el que está elegido
        function actualizarFiltro() {
            mes.disabled = !radioMes.checked;
            semana.disabled = radioMes.checked;
        }
        $$('input[name="filtroCitas"]').forEach((radio) => radio.addEventListener('change', actualizarFiltro));
        actualizarFiltro();

        // "10 de Octubre de 2026" -> milisegundos de esa fecha
        function leerFecha(texto) {
            const m = /(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/.exec(normalizar(texto));
            if (!m) return null;
            const numeroMes = MESES.indexOf(m[2]);
            return numeroMes < 0 ? null : Date.UTC(Number(m[3]), numeroMes, Number(m[1]));
        }

        // "2026-W43" -> lunes y domingo de esa semana
        function rangoSemana(valor) {
            const m = /^(\d{4})-W(\d{2})$/.exec(valor.trim().toUpperCase());
            if (!m) return null;
            const anio = Number(m[1]);
            const numeroSemana = Number(m[2]);
            if (numeroSemana < 1 || numeroSemana > 53) return null;
            // El 4 de enero siempre cae en la semana 1
            const diaDelCuatro = (new Date(Date.UTC(anio, 0, 4)).getUTCDay() + 6) % 7;
            const lunes = Date.UTC(anio, 0, 4 - diaDelCuatro + (numeroSemana - 1) * 7);
            return { inicio: lunes, fin: lunes + 6 * DIA_MS };
        }

        const textoDia = (ms) => {
            const d = new Date(ms);
            return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
        };

        function filtrarCitas() {
            let inicio;
            let fin;
            let etiqueta;

            if (radioMes.checked) {
                if (!mes.value) return avisar('Por favor elige un mes.', 'error');
                const [anio, numeroMes] = mes.value.split('-').map(Number);
                inicio = Date.UTC(anio, numeroMes - 1, 1);
                fin = Date.UTC(anio, numeroMes, 0); // último día del mes
                etiqueta = `${MESES[numeroMes - 1]} de ${anio}`;
            } else {
                const rango = rangoSemana(semana.value);
                if (!rango) return avisar('Elige una semana válida, por ejemplo 2026-W43.', 'error');
                inicio = rango.inicio;
                fin = rango.fin;
                etiqueta = `la semana del ${textoDia(inicio)} al ${textoDia(fin)}`;
            }

            let visibles = 0;
            filas().forEach((fila) => {
                const fecha = leerFecha(fila.cells[3].textContent);
                const coincide = fecha !== null && fecha >= inicio && fecha <= fin;
                fila.style.display = coincide ? '' : 'none';
                if (coincide) visibles++;
            });

            if (visibles === 0) {
                resumen.textContent = `No hay citas programadas para ${etiqueta}.`;
                avisar(`No hay citas para ${etiqueta}.`, 'error');
            } else {
                resumen.textContent = `Las citas programadas para ${etiqueta} son:`;
                Sonido.tocar('click');
            }
        }

        function mostrarTodas() {
            filas().forEach((fila) => { fila.style.display = ''; });
            resumen.textContent = 'Todas las citas programadas:';
            Sonido.tocar('click');
        }

        $('#verCitas').addEventListener('click', filtrarCitas);
        $('#todasCitas').addEventListener('click', mostrarTodas);

        // Citas que el usuario agendó antes (guardadas en el navegador)
        Almacen.leer(CLAVES.citas, []).forEach(agregarFilaCita);
    }


    /* ===================================================================
       4. AGENDAR CITA
       =================================================================== */
    function iniciarAgendar() {
        const fecha = $('#dateAppointment');
        const sucursal = $('#sucursal');
        const lista = $('#listaSucursales');
        const descripcion = $('#descriptionText');
        const boton = $('#btnAgendarCita');
        if (!fecha || !sucursal || !lista || !descripcion || !boton) return;

        // No se pueden elegir fechas pasadas
        function actualizarMinimo() {
            const ahora = new Date();
            fecha.min = `${ahora.getFullYear()}-${pad2(ahora.getMonth() + 1)}-${pad2(ahora.getDate())}` +
                `T${pad2(ahora.getHours())}:${pad2(ahora.getMinutes())}`;
        }
        actualizarMinimo();
        fecha.addEventListener('focus', actualizarMinimo);

        boton.addEventListener('click', () => {
            const sucursalesValidas = $$('option', lista).map((o) => normalizar(o.value));
            const errores = [];

            if (!fecha.value) {
                errores.push('elige la fecha y la hora');
            } else if (new Date(fecha.value) < new Date()) {
                errores.push('la fecha no puede estar en el pasado');
            }

            if (!sucursal.value.trim()) {
                errores.push('elige una sucursal');
            } else if (!sucursalesValidas.includes(normalizar(sucursal.value))) {
                errores.push('elige una sucursal de la lista');
            }

            if (descripcion.value.trim().length < 10) {
                errores.push('describe el motivo (mínimo 10 caracteres)');
            }

            if (errores.length) {
                return avisar('Revisa tu cita: ' + errores.join(', ') + '.', 'error');
            }

            const cita = {
                fecha: fecha.value,
                sucursal: sucursal.value.trim(),
                descripcion: descripcion.value.trim()
            };

            const citas = Almacen.leer(CLAVES.citas, []);
            citas.push(cita);
            Almacen.guardar(CLAVES.citas, citas);
            agregarFilaCita(cita);

            fecha.value = '';
            sucursal.value = '';
            descripcion.value = '';
            avisar('¡Cita solicitada! Ya aparece en "Mis Citas".', 'ok');
        });
    }


    /* ===================================================================
       5. HERRAMIENTAS
       =================================================================== */
    function iniciarHerramientas() {
        const select = $('#toolName');
        const cantidad = $('#cantidadHerramienta');
        const boton = $('#requestTool');
        const botonVaciar = $('#vaciarHerramientas');
        const tbody = $('#tablaHerramientas tbody');
        const celdaTotal = $('#totalUnidades');
        if (!select || !cantidad || !boton || !tbody || !celdaTotal) return;

        const grupos = $$('optgroup', select);
        const filasIniciales = tbody.innerHTML; // las filas originales de la tabla

        // La categoría (Refacción / Herramienta) filtra la lista de piezas
        function filtrarPiezas() {
            const categoria = $('input[name="categoriaRecurso"]:checked').value;
            grupos.forEach((grupo) => {
                const mostrar = categoria === 'todas' || grupo.dataset.tipo === categoria;
                grupo.hidden = !mostrar;
                grupo.disabled = !mostrar;
            });

            const actual = select.selectedOptions[0];
            if (!actual || actual.parentElement.disabled) {
                const primera = $('optgroup:not([disabled]) option', select);
                if (primera) primera.selected = true;
            }
        }
        $$('input[name="categoriaRecurso"]').forEach((radio) => radio.addEventListener('change', filtrarPiezas));

        // Categoría que se muestra en la tabla
        function categoriaDe(opcion) {
            if (opcion.parentElement.dataset.tipo === 'refaccion') return 'Refacción';
            return ['llave_combinada', 'llave_torx'].includes(opcion.value)
                ? 'Herramienta manual' : 'Herramienta especializada';
        }

        function renumerarYTotalizar() {
            let total = 0;
            $$('tr', tbody).forEach((fila, i) => {
                fila.cells[0].textContent = i + 1;
                total += parseInt(fila.cells[3].textContent, 10) || 0;
            });
            celdaTotal.textContent = total;
        }

        // Mantiene singular y plural: Pieza / Piezas, Juego / Juegos
        function ajustarUnidad(celda, total) {
            const base = celda.textContent.trim().replace(/s$/i, '');
            celda.textContent = total === 1 ? base : base + 's';
        }

        // Si la pieza ya está en la tabla se suma; si no, se crea una fila nueva
        function agregarALaTabla(nombre, categoria, unidades) {
            const existente = $$('tr', tbody).find((fila) =>
                normalizar(fila.cells[1].textContent) === normalizar(nombre));

            if (existente) {
                const nuevoTotal = (parseInt(existente.cells[3].textContent, 10) || 0) + unidades;
                existente.cells[3].textContent = nuevoTotal;
                ajustarUnidad(existente.cells[4], nuevoTotal);
            } else {
                const fila = tbody.insertRow();
                [' ', nombre, categoria, unidades, unidades === 1 ? 'Pieza' : 'Piezas'].forEach((texto) => {
                    fila.insertCell().textContent = texto;
                });
            }
            renumerarYTotalizar();
        }

        function solicitarHerramienta() {
            const opcion = select.selectedOptions[0];
            const unidades = Number(cantidad.value);

            if (!opcion) return avisar('Elige una pieza de la lista.', 'error');
            if (!cantidad.value || !Number.isInteger(unidades) || unidades < 1 || unidades > 10) {
                cantidad.focus();
                return avisar('Escribe una cantidad entera entre 1 y 10.', 'error');
            }

            const nombre = opcion.textContent.trim();
            const categoria = categoriaDe(opcion);
            agregarALaTabla(nombre, categoria, unidades);

            const pedidos = Almacen.leer(CLAVES.herramientas, []);
            pedidos.push({ nombre, categoria, cantidad: unidades });
            Almacen.guardar(CLAVES.herramientas, pedidos);

            cantidad.value = '';
            avisar(`Se agregó a la orden: ${nombre} (${unidades}).`, 'ok');
        }

        boton.addEventListener('click', solicitarHerramienta);
        cantidad.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') solicitarHerramienta();
        });

        // Quita solo lo que el usuario agregó y deja la tabla original
        botonVaciar.addEventListener('click', () => {
            tbody.innerHTML = filasIniciales;
            Almacen.guardar(CLAVES.herramientas, []);
            renumerarYTotalizar();
            avisar('Se quitó lo agregado a la orden.', 'click');
        });

        // Al abrir la página se restaura lo solicitado antes
        Almacen.leer(CLAVES.herramientas, []).forEach((p) => agregarALaTabla(p.nombre, p.categoria, p.cantidad));
        renumerarYTotalizar();
        filtrarPiezas();
    }


    /* ===================================================================
       6. MI CUENTA
       =================================================================== */
    function iniciarCuenta() {
        const fotoInput = $('#userPhoto');
        const fotoImagen = $('#buttonNext');
        const rfc = $('#rfc');
        const constancia = $('#fiscalSituation');
        if (!fotoInput || !fotoImagen || !rfc || !constancia) return;

        const cuenta = Almacen.leer(CLAVES.cuenta, {});

        /* ---------- Foto de perfil ---------- */
        // Dar clic a la imagen abre el selector de archivos
        fotoImagen.addEventListener('click', (e) => {
            e.preventDefault();
            fotoInput.click();
        });

        fotoInput.addEventListener('change', () => {
            const archivo = fotoInput.files[0];
            if (!archivo) return;

            if (!archivo.type.startsWith('image/')) {
                fotoInput.value = '';
                return avisar('La foto de perfil debe ser una imagen.', 'error');
            }
            if (archivo.size > 2 * 1048576) {
                fotoInput.value = '';
                return avisar('La foto no debe pesar más de 2 MB.', 'error');
            }

            const lector = new FileReader();
            lector.onload = () => {
                fotoImagen.src = lector.result;
                Almacen.guardar(CLAVES.foto, lector.result);
                avisar('Foto de perfil actualizada.', 'ok');
            };
            lector.readAsDataURL(archivo);
        });

        const fotoGuardada = Almacen.leer(CLAVES.foto, null);
        if (fotoGuardada) fotoImagen.src = fotoGuardada;

        /* ---------- RFC ---------- */
        // 3 o 4 letras + fecha (AAMMDD) + homoclave de 3 caracteres
        const regexRfc = /^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{3}$/;

        rfc.addEventListener('input', () => {
            rfc.value = rfc.value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, '');
        });

        rfc.addEventListener('change', () => {
            if (!rfc.value) {
                delete cuenta.rfc;
                Almacen.guardar(CLAVES.cuenta, cuenta);
                return;
            }
            if (regexRfc.test(rfc.value)) {
                cuenta.rfc = rfc.value;
                Almacen.guardar(CLAVES.cuenta, cuenta);
                avisar('RFC guardado.', 'ok');
            } else {
                avisar('RFC no válido. Ejemplo: MORR010101AB1.', 'error');
            }
        });

        if (cuenta.rfc) rfc.value = cuenta.rfc;

        /* ---------- Constancia de situación fiscal (PDF) ---------- */
        constancia.addEventListener('change', () => {
            const archivo = constancia.files[0];
            if (!archivo) return;

            if (!/\.pdf$/i.test(archivo.name)) {
                constancia.value = '';
                return avisar('La constancia debe ser un archivo PDF.', 'error');
            }
            if (archivo.size > 5 * 1048576) {
                constancia.value = '';
                return avisar('El PDF no debe pesar más de 5 MB.', 'error');
            }
            avisar('Constancia cargada: ' + archivo.name, 'ok');
        });
    }


    /* ===================================================================
       7. AJUSTES: colores y volumen
       =================================================================== */
    function iniciarAjustes() {
        const fuente = $('#fontColor');
        const fondo = $('#backgroundColor');
        const volumen = $('#soundsVolume');
        const textoVolumen = $('#volumenValor');
        const botonSilencio = $('#muteSounds');
        const botonRestablecer = $('#restablecerAjustes');
        if (!fuente || !fondo || !volumen || !botonSilencio) return;

        const raiz = document.documentElement;
        const colorFuenteOriginal = getComputedStyle(raiz).getPropertyValue('--text').trim();
        const colorFondoOriginal = getComputedStyle(raiz).getPropertyValue('--bg').trim();

        // Los selectores muestran los colores reales de la página
        fuente.value = colorFuenteOriginal;
        fondo.value = colorFondoOriginal;

        const estado = Object.assign(
            { fuente: null, fondo: null, volumen: 80, previo: 80 },
            Almacen.leer(CLAVES.ajustes, {})
        );
        const guardar = () => Almacen.guardar(CLAVES.ajustes, estado);

        /* ---------- Colores (con revisión de contraste) ---------- */
        // Luminancia de un color: 0 = negro, 1 = blanco
        function luminancia(hex) {
            const [r, g, b] = [1, 3, 5]
                .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
                .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        function contraste(hex1, hex2) {
            const a = luminancia(hex1);
            const b = luminancia(hex2);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        }

        // El texto debe leerse sobre las tarjetas (color --surface) y sobre el fondo de la página
        const colorTarjetas = getComputedStyle(raiz).getPropertyValue('--surface').trim() || '#141416';
        const textoLegible = (colorTexto, colorFondo) =>
            contraste(colorTexto, colorTarjetas) >= 3 && contraste(colorTexto, colorFondo) >= 3;

        function aplicarFuente(hex) {
            raiz.style.setProperty('--text', hex);
            fuente.value = hex;
        }
        function aplicarFondo(hex) {
            raiz.style.setProperty('--bg', hex);
            fondo.value = hex;
        }

        fuente.addEventListener('change', () => {
            if (!textoLegible(fuente.value, fondo.value)) {
                avisar('Ese color de fuente casi no se lee. Elige uno con más contraste.', 'error');
                fuente.value = estado.fuente || colorFuenteOriginal;
                return;
            }
            aplicarFuente(fuente.value);
            estado.fuente = fuente.value;
            guardar();
            Sonido.tocar('click');
        });

        fondo.addEventListener('change', () => {
            if (!textoLegible(fuente.value, fondo.value)) {
                avisar('Con ese fondo el texto casi no se lee. Elige un fondo más oscuro.', 'error');
                fondo.value = estado.fondo || colorFondoOriginal;
                return;
            }
            aplicarFondo(fondo.value);
            estado.fondo = fondo.value;
            guardar();
            Sonido.tocar('click');
        });

        if (estado.fuente) aplicarFuente(estado.fuente);
        if (estado.fondo) aplicarFondo(estado.fondo);

        /* ---------- Volumen y silencio ---------- */
        function actualizarVolumen() {
            volumen.value = estado.volumen;
            textoVolumen.textContent = estado.volumen + '%';
            Sonido.volumen = estado.volumen;
            botonSilencio.textContent = estado.volumen === 0 ? 'Activar sonido' : 'Silenciar sonido';
        }

        volumen.addEventListener('input', () => {
            estado.volumen = Number(volumen.value);
            if (estado.volumen > 0) estado.previo = estado.volumen;
            actualizarVolumen();
            guardar();
        });
        // Al soltar el control se escucha una muestra del volumen
        volumen.addEventListener('change', () => Sonido.tocar('click'));

        botonSilencio.addEventListener('click', () => {
            if (estado.volumen > 0) {
                estado.previo = estado.volumen;
                estado.volumen = 0;
            } else {
                estado.volumen = estado.previo > 0 ? estado.previo : 80;
            }
            actualizarVolumen();
            guardar();
            Sonido.tocar('click');
        });

        botonRestablecer.addEventListener('click', () => {
            raiz.style.removeProperty('--text');
            raiz.style.removeProperty('--bg');
            fuente.value = colorFuenteOriginal;
            fondo.value = colorFondoOriginal;
            estado.fuente = null;
            estado.fondo = null;
            estado.volumen = 80;
            estado.previo = 80;
            actualizarVolumen();
            guardar();
            avisar('Ajustes restablecidos.', 'ok');
        });

        actualizarVolumen();
    }


    /* ===================================================================
       8. ARRANQUE
       Cada módulo se inicia por separado: si uno falla, los demás siguen.
       =================================================================== */
    function iniciar() {
        const modulos = [
            ['Ajustes', iniciarAjustes],
            ['Menú', iniciarMenu],
            ['Registro', iniciarRegistro],
            ['Mis Citas', iniciarCitas],
            ['Agendar Cita', iniciarAgendar],
            ['Herramientas', iniciarHerramientas],
            ['Mi Cuenta', iniciarCuenta]
        ];

        modulos.forEach(([nombre, funcion]) => {
            try {
                funcion();
            } catch (error) {
                console.error(`[MecaGest] Error al iniciar "${nombre}":`, error);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
