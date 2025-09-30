const carrusel = document.querySelector('.cards')
const card = document.getElementById('card')
const btnIzq = document.getElementById('btn-izq')
const btnDer = document.getElementById('btn-der')

let desplazamiento = 0; 
const anchoCard = card.offsetWidth; // 206.25 


carrusel.style.transform = `translateX(0px)`;

function maxDesplazamiento (){
    return -(carrusel.scrollWidth - carrusel.parentElement.clientWidth)
}


btnDer.addEventListener('click', () => {
    const maxDespla = maxDesplazamiento()
    const mov = -1 * maxDesplazamiento() / 3; // 206.25 

    if(desplazamiento > maxDespla){ //-780
        desplazamiento -= mov; // se mueve a la izquierda
        carrusel.style.transform = `translateX(${desplazamiento}px)`;
        carrusel.style.transition = "transform 0.5s ease";
    }
});

btnIzq.addEventListener('click', () => {
    const mov = -1 * maxDesplazamiento() / 3; // 206.25 
    if (desplazamiento != -5.684341886080802e-14 && desplazamiento != 0) {
        desplazamiento += mov; // se mueve a la derecha
        carrusel.style.transform = `translateX(${desplazamiento}px)`;
        carrusel.style.transition = "transform 0.5s ease"; 
    }
    alert(desplazamiento)
});