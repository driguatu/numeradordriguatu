const apiKey = '$2a$10$I.nAGVatRjpKKbw/ugGoNe3V3Is9QWViWkM20djPjZfo6Jo/GfNqO';
const binId = '6797b2abe41b4d34e47f8a51';

async function loadCount() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': apiKey
            }
        });
        const data = await response.json();
        count = data.record.count || 0;
        document.getElementById('count').innerText = count;
    } catch (error) {
        console.error('Erro ao carregar a contagem:', error);
    }
}

async function saveCount() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify({ count })
        });
    } catch (error) {
        console.error('Erro ao salvar a contagem:', error);
    }
}

function increment() {
    count++;
    document.getElementById('count').innerText = count;
    saveCount();
}

function decrement() {
    if (confirm("Tem certeza de que deseja diminuir o número?")) {
        count--;
        document.getElementById('count').innerText = count;
        saveCount();
    }
}

window.onload = loadCount;
