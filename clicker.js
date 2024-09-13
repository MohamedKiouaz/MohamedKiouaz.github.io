let count = 0;
const button = document.getElementById('clicker-button');
const counter = document.getElementById('counter');

button.addEventListener('click', () => {
    count++;
    counter.textContent = `Clics: ${count}`;
});