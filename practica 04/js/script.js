


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
