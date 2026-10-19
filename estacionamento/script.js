
const BLOCKS = {
    A: { total: 20, free: [1, 2, 3, 4, 9, 10, 11, 12, 17], offline: [] },
    C: { total: 20, free: [1, 2, 11, 12], offline: [] },
    H: { total: 20, free: [], offline: [] }
  };
  
  const initial = JSON.parse(JSON.stringify(BLOCKS));
  
  let selectedSpot = null;
  let historyItems = [];
  let refreshTimer;
  
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  
  function stateOf(block, number) {
    if (BLOCKS[block].offline.includes(number)) return "offline";
    return BLOCKS[block].free.includes(number) ? "free" : "occupied";
  }
  
  function labelState(state) {
    return {
      free: "Vaga livre",
      occupied: "Vaga ocupada",
      offline: "Sensor sem sinal"
    }[state];
  }
  
  function counts(block) {
    const data = BLOCKS[block];
    const free = data.free.length;
    const offline = data.offline.length;
  
    return {
      free,
      offline,
      occupied: data.total - free - offline,
      total: data.total
    };
  }
  
  function overallClass(data) {
    if (data.free === 0) return "full";
    if (data.free <= 4) return "warning";
    return "free";
  }
  
  // Cartões superiores
  function renderSummary() {
    $("#summary-grid").innerHTML = Object.keys(BLOCKS).map(block => {
      const data = counts(block);
  
      return `
        <article class="summary-card ${overallClass(data)}">
          <div class="block-letter">
            <span class="lamp"></span>${block}
          </div>
  
          <div class="summary-info">
            <h3>Bloco ${block}</h3>
  
            <div class="summary-numbers">
              <div>
                <div class="free-count">${data.free}</div>
                <div class="summary-label">vagas livres</div>
              </div>
  
              <div class="occupied-count">
                ${data.occupied}
                <small>vagas ocupadas</small>
              </div>
            </div>
  
            <div class="total-line">
              ${data.total} vagas no total
              ${data.offline ? ` · ${data.offline} sem sinal` : ""}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }
  
  // Painel numerado de cada estacionamento
  function renderParking() {
    const filter = $("#block-filter").value;
  
    const blocks = Object.keys(BLOCKS).filter(block =>
      filter === "todos" || filter === block
    );
  
    $("#parking-sections").innerHTML = blocks.map(block => {
      const data = counts(block);
  
      const spots = Array.from(
        { length: BLOCKS[block].total },
        (_, index) => {
          const number = index + 1;
          const state = stateOf(block, number);
          const formatted = String(number).padStart(2, "0");
  
          return `
            <button
              class="spot ${state}"
              data-block="${block}"
              data-spot="${number}"
              title="Bloco ${block} — Vaga ${formatted}: ${labelState(state)}">
              ${formatted}
            </button>
          `;
        }
      ).join("");
  
      return `
        <article class="parking-card" data-block="${block}">
          <div class="parking-main">
            <div class="parking-header">
              <div class="parking-title">
                <span class="status-dot"></span>
                <h3>Bloco ${block}</h3>
              </div>
  
              <div class="parking-counts">
                <strong>${data.free} vagas livres</strong>
                &nbsp; | &nbsp; ${data.occupied} ocupadas
                &nbsp; | &nbsp; ${data.total} no total
              </div>
            </div>
  
            <div class="spot-grid">${spots}</div>
          </div>
  
          <div class="parking-photo">
            <div class="photo-placeholder">
              SENAI BLUMENAU<br>
              <strong>Bloco ${block}</strong><br>
              Estacionamento noturno
            </div>
            <small>Estacionamento — Bloco ${block}</small>
          </div>
        </article>
      `;
    }).join("");
  
    $$(".spot").forEach(button => {
      button.addEventListener("click", () => {
        openSpot(button.dataset.block, Number(button.dataset.spot));
      });
    });
  }
  
  // Contadores na página do mapa
  function renderMapCounts() {
    Object.keys(BLOCKS).forEach(block => {
      const element = $(`#map-free-${block}`);
  
      if (element) {
        element.textContent = counts(block).free;
      }
    });
  }
  
  function renderAll() {
    renderSummary();
    renderParking();
    renderMapCounts();
  }
  
  // Histórico de alterações
  function addHistory(block, number, state, source = "Simulação") {
    const time = new Date().toLocaleTimeString("pt-BR");
  
    historyItems.unshift({
      time,
      block,
      number: String(number).padStart(2, "0"),
      state: labelState(state),
      source
    });
  
    historyItems = historyItems.slice(0, 50);
  
    $("#history-body").innerHTML = historyItems.map(item => `
      <tr>
        <td>${item.time}</td>
        <td>Bloco ${item.block}</td>
        <td>${item.number}</td>
        <td>${item.state}</td>
        <td>${item.source}</td>
      </tr>
    `).join("");
  }
  
  // Detalhes da vaga selecionada
  function openSpot(block, number) {
    selectedSpot = { block, number };
  
    const state = stateOf(block, number);
  
    $("#spot-details").innerHTML = `
      <h2 class="spot-detail-title">
        Bloco ${block} · Vaga ${String(number).padStart(2, "0")}
      </h2>
  
      <p>Estado atual do sensor:</p>
  
      <span class="spot-detail-state ${state}">
        ${labelState(state)}
      </span>
  
      <p style="color:#9db4d4;font-size:12px;line-height:1.5">
        Modo de demonstração. A alteração manual não representa
        uma leitura real de hardware.
      </p>
    `;
  
    $("#toggle-spot").textContent =
      state === "free" ? "Marcar como ocupada" :
      state === "occupied" ? "Marcar como livre" :
      "Reativar sensor (demonstração)";
  
    $("#spot-dialog").showModal();
  }
  
  // Altera o estado de uma vaga para testar a interface
  function toggleSpot(block, number) {
    const state = stateOf(block, number);
    const data = BLOCKS[block];
  
    if (state === "offline") {
      data.offline = data.offline.filter(n => n !== number);
      data.free.push(number);
    } else if (state === "free") {
      data.free = data.free.filter(n => n !== number);
    } else {
      data.free.push(number);
    }
  
    const newState = stateOf(block, number);
  
    addHistory(block, number, newState);
    renderAll();
  }
  
  // Data e horário
  function updateClock() {
    const now = new Date();
  
    $("#date").textContent = now.toLocaleDateString("pt-BR");
    $("#clock").textContent = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  
    $("#last-update").textContent = now.toLocaleTimeString("pt-BR");
  }
  
  // Navegação lateral
  $$(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach(item => {
        item.classList.toggle("active", item === button);
      });
  
      $$(".view").forEach(view => {
        view.classList.toggle(
          "active",
          view.id === `view-${button.dataset.view}`
        );
      });
    });
  });
  
  // Filtro por bloco
  $("#block-filter").addEventListener("change", renderParking);
  
  // Botão para testar alterações aleatórias
  $("#demo-toggle").addEventListener("click", () => {
    const candidates = [];
  
    Object.keys(BLOCKS).forEach(block => {
      for (let number = 1; number <= BLOCKS[block].total; number++) {
        candidates.push({ block, number });
      }
    });
  
    const item = candidates[Math.floor(Math.random() * candidates.length)];
  
    toggleSpot(item.block, item.number);
  });
  
  // Alteração pelo detalhe da vaga
  $("#toggle-spot").addEventListener("click", () => {
    if (!selectedSpot) return;
  
    toggleSpot(selectedSpot.block, selectedSpot.number);
    openSpot(selectedSpot.block, selectedSpot.number);
  });
  
  // Fechar janela clicando fora dela
  $("#spot-dialog").addEventListener("click", event => {
    if (event.target === $("#spot-dialog")) {
      $("#spot-dialog").close();
    }
  });
  
  // Clicar em um bloco no mapa abre o painel filtrado
  $$("[data-map-block]").forEach(button => {
    button.addEventListener("click", () => {
      $("#block-filter").value = button.dataset.mapBlock;
  
      $$(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === "inicio");
      });
  
      $$(".view").forEach(view => {
        view.classList.toggle("active", view.id === "view-inicio");
      });
  
      renderParking();
    });
  });
  
  // Frequência da atualização visual
  function setRefreshTimer() {
    clearInterval(refreshTimer);
  
    refreshTimer = setInterval(() => {
      updateClock();
      renderSummary();
      renderMapCounts();
    }, Number($("#refresh-rate").value) * 1000);
  }
  
  $("#refresh-rate").addEventListener("change", setRefreshTimer);
  
  // Restaurar os dados iniciais
  $("#reset-demo").addEventListener("click", () => {
    Object.keys(BLOCKS).forEach(block => {
      BLOCKS[block].free = [...initial[block].free];
      BLOCKS[block].offline = [...initial[block].offline];
    });
  
    historyItems = [];
    $("#history-body").innerHTML = "";
  
    renderAll();
    updateClock();
  });
  
  // Inicialização
  updateClock();
  renderAll();
  setRefreshTimer();
  
  addHistory("A", 1, "free", "Inicialização");
  