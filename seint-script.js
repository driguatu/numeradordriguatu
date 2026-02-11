document.addEventListener('DOMContentLoaded', () => {
  const datetimeDisplay = document.getElementById('datetime');
  const messageDisplay = document.getElementById('special-message');

  // --- Relógio ---
  function updateClock() {
    const now = new Date();
    const dateString = now.toLocaleDateString('pt-BR');
    const timeString = now.toLocaleTimeString('pt-BR');
    datetimeDisplay.textContent = `${dateString} - ${timeString}`;
  }

  setInterval(updateClock, 1000);
  updateClock();

  // --- Carregar todos os contadores ---
  function fetchCounters() {
    fetch('/api/seint')
      .then(response => response.json())
      .then(data => {
        const contadores = data.contadores;
        for (const tipo in contadores) {
          const el = document.getElementById(`counter-${tipo}`);
          if (el) el.textContent = contadores[tipo];
        }

        // Mensagem de Ano Novo
        if (data.message) {
          messageDisplay.textContent = data.message;
          messageDisplay.classList.remove('hidden');
        } else {
          messageDisplay.classList.add('hidden');
        }
      })
      .catch(err => console.error('Erro ao obter contadores:', err));
  }

  // --- Atualizar um contador (increase ou decrease) ---
  function updateCounter(tipo, acao) {
    fetch(`/api/seint/${acao}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo })
    })
      .then(response => response.json())
      .then(data => {
        for (const t in data) {
          const el = document.getElementById(`counter-${t}`);
          if (el) el.textContent = data[t];
        }
      })
      .catch(err => console.error('Erro ao atualizar contador:', err));
  }

  // --- Event listeners nos botões ---
  document.querySelectorAll('.btn-increase').forEach(btn => {
    btn.addEventListener('click', () => {
      updateCounter(btn.dataset.tipo, 'increase');
    });
  });

  document.querySelectorAll('.btn-decrease').forEach(btn => {
    btn.addEventListener('click', () => {
      updateCounter(btn.dataset.tipo, 'decrease');
    });
  });

  fetchCounters();
});
