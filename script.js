let count = 0;

function increment() {
    count++;
    document.getElementById('count').innerText = count;
}

function decrement() {
    if (confirm("Tem certeza de que deseja diminuir o número?")) {
        count--;
        document.getElementById('count').innerText = count;
    }
}
