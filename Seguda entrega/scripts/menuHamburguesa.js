const btnMenuHamburguesa = document.getElementById('btn-menu-hamburguesa')
const menuHamburguesa = document.getElementById('menu-hamburguesa')

btnMenuHamburguesa.addEventListener('click', () => {
    if(menuHamburguesa.style.display == 'flex'){
        menuHamburguesa.style.display = 'none'
    } else {
    menuHamburguesa.style.display = 'flex'
    }
})