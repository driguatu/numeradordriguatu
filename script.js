document.addEventListener('DOMContentLoaded', () => {
  const counterDisplay = document.getElementById('counter');
  const datetimeDisplay = document.getElementById('datetime'); // Novo elemento
  const increaseBtn = document.getElementById('increase');
  const decreaseBtn = document.getElementById('decrease');

  // --- CÓDIGO DO RELÓGIO (ADICIONE ISTO) ---
  function updateClock() {
    const now = new Date();
    // Formata para o padrão brasileiro (DD/MM/AAAA HH:MM:SS)
    const dateString = now.toLocaleDateString('pt-BR');
    const timeString = now.toLocaleTimeString('pt-BR');
    
    datetimeDisplay.textContent = `${dateString} - ${timeString}`;
  }

  // Atualiza o relógio a cada 1000 milissegundos (1 segundo)
  setInterval(updateClock, 1000);
  // Chama uma vez imediatamente para não esperar 1 segundo para aparecer
  updateClock();
  // ------------------------------------------

  // ... O resto do seu código (fetchCounter, updateCounter, eventos) continua igual ...
  
  function fetchCounter() {
    fetch('/api/counter')
      .then(response => response.json())
      .then(data => {
        counterDisplay.textContent = data.counter;
      })
      .catch(err => console.error('Erro ao obter contador:', err));
  }
  
  // (Mantenha o restante do arquivo como estava)
  function updateCounter(endpoint) {
      // ... seu código antigo ...
    fetch(endpoint, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      counterDisplay.textContent = data.counter;
    })
    .catch(err => console.error('Erro ao atualizar contador:', err));
  }

  increaseBtn.addEventListener('click', () => {
    updateCounter('/api/counter/increase');
  });

  decreaseBtn.addEventListener('click', () => {
    updateCounter('/api/counter/decrease');
  });

  fetchCounter();
});