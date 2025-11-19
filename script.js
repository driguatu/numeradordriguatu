document.addEventListener('DOMContentLoaded', () => {
  const counterDisplay = document.getElementById('counter');
  const increaseBtn = document.getElementById('increase');
  const decreaseBtn = document.getElementById('decrease');

  // Função para buscar o valor do contador no servidor
  function fetchCounter() {
    fetch('/api/counter')
      .then(response => response.json())
      .then(data => {
        counterDisplay.textContent = data.counter;
      })
      .catch(err => console.error('Erro ao obter contador:', err));
  }

  // Função para atualizar o contador (aumentar ou diminuir)
  function updateCounter(endpoint) {
    fetch(endpoint, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      counterDisplay.textContent = data.counter;
    })
    .catch(err => console.error('Erro ao atualizar contador:', err));
  }

  // Eventos dos botões
  increaseBtn.addEventListener('click', () => {
    updateCounter('/api/counter/increase');
  });

  decreaseBtn.addEventListener('click', () => {
    updateCounter('/api/counter/decrease');
  });

  // Busca inicial do valor do contador
  fetchCounter();
});
