


console.log("Hola Mundo , desde JavaScript");


// 2. VALIDAR FECHA DE NACIMIENTO
// Obtener el campo de fecha de nacimiento

const inputFechaNacimiento = document.getElementById('fechaNacimiento');


// elemento <p> para mostrar el resultado

const mensajeEdad = document.createElement('p');

mensajeEdad.style.fontWeight = 'bold';
mensajeEdad.style.marginTop = '5px';


// mensaje debajo del campo de fecha

inputFechaNacimiento.parentNode.insertBefore(
    mensajeEdad,
    inputFechaNacimiento.nextSibling
);


// Detectar cuando cambia la fecha de nacimiento

inputFechaNacimiento.addEventListener('change', function() {

    const valorFecha = this.value;

    // limpiar el mensaje

    if (!valorFecha) {
        mensajeEdad.textContent = "";
        return;
    }


    // Obtener la fecha de nacimiento y la fecha actual

    const fechaNac = new Date(valorFecha);
    const hoy = new Date();


    // Calcular la edad

    let edad = hoy.getFullYear() - fechaNac.getFullYear();

    const mes = hoy.getMonth() - fechaNac.getMonth();


    // Ajustar si todavía no cumple años en el año actual

    if (
        mes < 0 ||
        (mes === 0 && hoy.getDate() < fechaNac.getDate())
    ) {
        edad--;
    }


    // Mostrar el resultado dependiendo de la edad

    if (edad >= 18) {

        mensajeEdad.textContent =
            `✔ Edad: ${edad} años. El usuario es MAYOR de edad.`;

        mensajeEdad.style.color = '#2e7d32';

    } else {

        mensajeEdad.textContent =
            `✖ Edad: ${edad} años. El usuario es MENOR de edad.`;

        mensajeEdad.style.color = '#c62828';

    }

});



// ==========================================
// 3. FORMULARIO DE REGISTRO POR PASOS + VALIDACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('formRegistro');
    if (!form) return;

    const steps = [...form.querySelectorAll('.step')];
    const indicators = [...document.querySelectorAll('#stepper li')];
    const btnPrev = document.getElementById('btnAnterior');
    const btnNext = document.getElementById('btnSiguiente');
    const finalActions = document.getElementById('accionesFinales');
    const successMsg = document.getElementById('mensajeExito');
    const submitBtn = form.querySelector('input[type="submit"]');
    let current = 0;


    /* ---------- Reglas de validación ---------- */

    const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const digitos = (v) => v.replace(/\D/g, '');

    function socialRule(chkId, value, regex, nombre) {
        if (!document.getElementById(chkId).checked) return '';
        if (!value.trim()) return `Ingresa la URL de tu ${nombre}.`;
        return !regex.test(value) ? `La URL de ${nombre} no es válida.` : '';
    }

    const rules = {

        nombre: (v) => !soloLetras.test(v) ? 'Solo se permiten letras.'
            : v.trim().length < 2 ? 'Mínimo 2 caracteres.' : '',

        apPaterno: (v) => !soloLetras.test(v) ? 'Solo se permiten letras.' : '',

        apMaterno: (v) => v && !soloLetras.test(v) ? 'Solo se permiten letras.' : '',

        fechaNacimiento: (v) => {
            const hoy = new Date();
            const nac = new Date(v);
            if (nac > hoy) return 'La fecha no puede ser futura.';
            let edad = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
            return edad < 18 ? 'Debes ser mayor de 18 años.' : '';
        },

        email: (v) => !emailRegex.test(v) ? 'Ingresa un correo válido (ej: nombre@dominio.com).' : '',

        numTelefonico: (v) => digitos(v).length < 10 ? 'El teléfono debe tener al menos 10 dígitos.' : '',

        telefonoFijo: (v) => v && digitos(v).length !== 10 ? 'El teléfono fijo debe tener 10 dígitos.' : '',

        horarioContactoFin: (v) => {
            const ini = document.getElementById('horarioContactoInicio').value;
            return v && ini && v <= ini ? 'La hora final debe ser posterior a la inicial.' : '';
        },

        urlFacebook: (v) => socialRule('chkFacebook', v, /^https?:\/\/(www\.)?facebook\.com\/.+/i, 'Facebook'),

        urlLinkedin: (v) => socialRule('chkLinkedin', v, /^https?:\/\/(www\.)?linkedin\.com\/.+/i, 'Linkedin'),

        whatsAppQR: (v, el) => document.getElementById('chkWhatsapp').checked && !el.files.length
            ? 'Carga la imagen del código QR de Whatsapp.' : '',

        usuario: (v) => v.length < 4 ? 'Mínimo 4 caracteres.' : /\s/.test(v) ? 'No puede contener espacios.' : '',

        contrasena: (v) => v.length < 8 ? 'Mínimo 8 caracteres.'
            : !/[A-Z]/.test(v) ? 'Debe incluir al menos una mayúscula.'
            : !/\d/.test(v) ? 'Debe incluir al menos un número.' : '',

        confirmarContrasena: (v) => v !== document.getElementById('contrasena').value
            ? 'Las contraseñas no coinciden.' : '',

        codigoPostal: (v) => !/^\d{5}$/.test(v) ? 'El código postal debe tener 5 dígitos.' : ''
    };


    /* ---------- Mostrar / quitar errores ---------- */

    function setError(el, msg) {
        clearError(el);
        el.classList.add('invalid');
        const span = document.createElement('span');
        span.className = 'error-msg';
        span.dataset.for = el.id;
        span.textContent = msg;
        el.insertAdjacentElement('afterend', span);
    }

    function clearError(el) {
        el.classList.remove('invalid');
        const sig = el.nextElementSibling;
        if (sig && sig.classList.contains('error-msg') && sig.dataset.for === el.id) sig.remove();
    }

    function validateField(el) {
        const value = el.type === 'file' ? el.value : el.value.trim();
        const isSocial = ['urlFacebook', 'urlLinkedin', 'whatsAppQR'].includes(el.id);
        let msg = '';

        if (el.hasAttribute('required') && !value) {
            msg = 'Este campo es obligatorio.';
        } else if (rules[el.id] && (value || isSocial || el.id === 'confirmarContrasena')) {
            msg = rules[el.id](value, el);
        }

        msg ? setError(el, msg) : clearError(el);
        return !msg;
    }

    function getFields(step) {
        return [...step.querySelectorAll('input:not([type="checkbox"]), select')];
    }

    function validateStep(i) {
        let firstInvalid = null;
        getFields(steps[i]).forEach((el) => {
            if (!validateField(el) && !firstInvalid) firstInvalid = el;
        });
        if (firstInvalid) firstInvalid.focus();
        return !firstInvalid;
    }


    /* ---------- Navegación entre pasos ---------- */

    function showStep(i) {
        current = i;
        steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
        indicators.forEach((li, idx) => {
            li.classList.toggle('active', idx === i);
            li.classList.toggle('done', idx < i);
        });
        btnPrev.style.visibility = i === 0 ? 'hidden' : 'visible';
        const last = i === steps.length - 1;
        btnNext.hidden = last;
        finalActions.hidden = !last;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    btnNext.addEventListener('click', () => {
        if (validateStep(current)) showStep(current + 1);
    });

    btnPrev.addEventListener('click', () => showStep(current - 1));


    /* ---------- Validación en vivo ---------- */

    form.addEventListener('focusout', (e) => {
        if (e.target.matches('input:not([type="checkbox"]), select')) validateField(e.target);
    });

    form.addEventListener('input', (e) => {
        if (e.target.classList.contains('invalid')) validateField(e.target);
    });

    const redes = { chkFacebook: 'urlFacebook', chkLinkedin: 'urlLinkedin', chkWhatsapp: 'whatsAppQR' };

    Object.keys(redes).forEach((id) => {
        document.getElementById(id).addEventListener('change', () => {
            validateField(document.getElementById(redes[id]));
        });
    });

    document.getElementById('contrasena').addEventListener('input', () => {
        const c = document.getElementById('confirmarContrasena');
        if (c.value) validateField(c);
    });

    document.getElementById('horarioContactoInicio').addEventListener('input', () => {
        validateField(document.getElementById('horarioContactoFin'));
    });

    document.getElementById('numTelefonico').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d\s()+-]/g, '');
    });

    document.getElementById('codigoPostal').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });


    /* ---------- Envío simulado ---------- */

    form.addEventListener('submit', (e) => {

        e.preventDefault();
        successMsg.hidden = true;

        // Revalidar todos los pasos; si alguno falla, regresar a él
        for (let i = 0; i < steps.length; i++) {
            if (!validateStep(i)) {
                showStep(i);
                validateStep(i);
                return;
            }
        }

        // Términos y condiciones
        const terminos = document.getElementById('validado');
        const labelTerm = form.querySelector('label[for="validado"]');
        const oldErr = labelTerm.nextElementSibling;
        if (oldErr && oldErr.classList.contains('error-msg')) oldErr.remove();

        if (!terminos.checked) {
            const span = document.createElement('span');
            span.className = 'error-msg';
            span.textContent = 'Debes aceptar los términos y condiciones.';
            labelTerm.insertAdjacentElement('afterend', span);
            return;
        }

        // Simulación de envío al servidor
        submitBtn.disabled = true;
        submitBtn.value = 'Enviando...';

        setTimeout(() => {
            form.reset();
            form.querySelectorAll('.error-msg').forEach((s) => s.remove());
            form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
            mensajeEdad.textContent = '';
            submitBtn.disabled = false;
            submitBtn.value = 'Enviar Solicitud';
            showStep(0);
            successMsg.hidden = false;
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => (successMsg.hidden = true), 8000);
        }, 1500);
    });

    form.addEventListener('reset', () => {
        setTimeout(() => {
            form.querySelectorAll('.error-msg').forEach((s) => s.remove());
            form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
            mensajeEdad.textContent = '';
            showStep(0);
        }, 0);
    });

    showStep(0);
});


// ==========================================
// 4. FORMULARIOS EXTRA (filtro de citas y sonido)
// ==========================================

// Alternar entre filtro por mes y por semana
document.querySelectorAll('input[name="filtroCitas"]').forEach((radio) => {
    radio.addEventListener('change', () => {
        const porMes = document.getElementById('filtroMes').checked;
        document.getElementById('mesCitas').disabled = !porMes;
        document.getElementById('semanaCitas').disabled = porMes;
    });
});

// Silenciar / restaurar volumen
const rangoVolumen = document.getElementById('soundsVolume');
const botonMute = document.getElementById('muteSounds');
let volumenPrevio = rangoVolumen.value;

botonMute.addEventListener('click', () => {
    if (rangoVolumen.value > 0) {
        volumenPrevio = rangoVolumen.value;
        rangoVolumen.value = 0;
        botonMute.textContent = 'Activar sonido';
    } else {
        rangoVolumen.value = volumenPrevio > 0 ? volumenPrevio : 80;
        botonMute.textContent = 'Silenciar sonido';
    }
});

rangoVolumen.addEventListener('input', () => {
    botonMute.textContent = rangoVolumen.value > 0 ? 'Silenciar sonido' : 'Activar sonido';
});
