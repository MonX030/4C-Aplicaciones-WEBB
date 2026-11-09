<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi primera página web en PHP - 250854</title>
</head>
<body>
    <?php
    // Declaración de una variable de tipo string
    $nombre = "Rubén Morales Reyes";
    $carrera_estudia = "T.S.U. en Desarrollo de Software Multiplataforma";
    echo "<h1> Hola mundo desde PHP! </h1>";
    # Esta línea imprime la versión de PHP que se está utilizando
    echo "<h2> Estas usando la version de PHP: " . phpversion() . "</h2>";
    ?>
    <!-- Este es un comentario en HTML -->
    <hr>
    <?php
    /* Después de asignarle un valor a la variable $nombre,
    podemos imprimirla en pantalla */
    echo "<h3> Mi nombre es: $nombre y estudio: $carrera_estudia </h3>";
    ?>

    <?php
    $x = 10;
    $y = -5;
    $z = '3';

    echo "<h3> La suma de $x + $y es: " . ($x + $y) . "</h3>";
    echo "<h3> La suma de $x + $y + $z es: " . ($x + $y + $z) . "</h3>";

    function multiplicar($a, $b) {
        $resultado = $a * $b;
        echo "<h4> La multiplicación de $a * $b es: $resultado </h4>";
        return $resultado;
    }

    echo "<h4> La multiplicación de 3 x 3 es : " . multiplicar(3, 3) . "</h4>";
    echo "<h4> La multiplicación de $x x $z es : " . multiplicar($x, $z) . "</h4>";
    echo "<h4> La multiplicación de 1250 x 325 es : " . multiplicar(1250, 325) . "</h4>";
    echo "<h4> La multiplicación de 0 x 325 es : " . multiplicar(0, 325) . "</h4>";
    echo "<hr>";

    $ultima_multiplicacion = multiplicar(0, 325);
    echo "<p> El resultado de la última multiplicación es: $ultima_multiplicacion </p>";
    ?>

    <?php
    /* Static Scope - Alcance Estático */
    function myTest() {
        static $w = 0; // static scope
        echo "$w <br>";
        $w++;
    }

    myTest();
    myTest();
    myTest();
    myTest();
    myTest();
    myTest();
    myTest();
    ?>

    <?php
    # función para saber el tipo de dato de una variable
    /* var_dump() es una función que nos permite conocer
    el tipo de dato de una variable y su valor, no es necesario programarla
    por ya está implementada en PHP */

    echo "<p> La variable <strong>nombre</strong> es de tipo: ";
    var_dump($nombre);
    echo "</p>";

    echo "<p> La variable <strong>carrera_estudia</strong> es de tipo: ";
    var_dump($carrera_estudia);
    echo "</p>";

    $fecha_nacimiento = "2004/11/07";

    echo "<p> La variable <strong>fecha_nacimiento</strong> es de tipo: ";
    var_dump($fecha_nacimiento);
    echo "</p>";

    $edad_actual = date("Y") - date("Y", strtotime($fecha_nacimiento));

    echo "<p> La variable <strong>edad_actual</strong> es de tipo: ";
    var_dump($edad_actual);
    echo "</p>";

    echo "<p> La edad actual es: $edad_actual </p>";
    ?>
</body>
</html>