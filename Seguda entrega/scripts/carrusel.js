const carrusel = document.getElementById('contenedor-cards')
const btnIzq = document.getElementById('btn-izq')
const btnDer = document.getElementById('btn-der')

let desplazamiento = 0; 
const anchoCard = 300; 

carrusel.style.transform = `translateX(0px)`;

btnDer.addEventListener('click', () => {
    desplazamiento -= anchoCard; // se mueve a la izquierda
    carrusel.style.transform = `translateX(${desplazamiento}px)`;
    carrusel.style.transition = "transform 0.5s ease";
});

btnIzq.addEventListener('click', () => {
    if (desplazamiento != 0) {
        desplazamiento += anchoCard; // se mueve a la derecha
        carrusel.style.transform = `translateX(${desplazamiento}px)`;
        carrusel.style.transition = "transform 0.5s ease"; 
    }
});