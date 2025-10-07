// Cantina Fácil — modo admin com modal e botões uniformes no modo admin
(function() {
  const bySelAll = (s, el=document) => Array.from(el.querySelectorAll(s));
  const $ = (s, el=document) => el.querySelector(s);

  const ADMIN_PIN = "2468";
  const STORAGE_KEY_STOCK = 'cantina_estoque';
  const STORAGE_KEY_ADMIN = 'cantina_is_admin';

  const defaultEstoque = [
    { nome: "Pão de queijo", quantidade: 18, lowAt: 8 },
    { nome: "Suco natural (500 ml)", quantidade: 7, lowAt: 6 },
    { nome: "Sanduíche natural", quantidade: 3, lowAt: 5 },
    { nome: "Coxinha", quantidade: 15, lowAt: 6 },
    { nome: "Pastel (queijo)", quantidade: 0, lowAt: 6 },
    { nome: "Bolo de cenoura", quantidade: 9, lowAt: 4 },
    { nome: "Refrigerante (350 ml)", quantidade: 22, lowAt: 10 },
    { nome: "Água mineral (500 ml)", quantidade: 30, lowAt: 10 },
    { nome: "Vitamina (banana)", quantidade: 5, lowAt: 5 },
  ];

  /* ===== EFEITOS ===== */
  const targets = [...bySelAll('.btn'), ...bySelAll('.navbar .nav-link')];
  targets.forEach(el => {
    el.addEventListener('mouseenter', () => el.classList.add('hover-glow'));
    el.addEventListener('mouseleave', () => el.classList.remove('hover-glow'));
    el.addEventListener('pointerdown', function(e){
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top  = (e.clientY - rect.top - size/2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ===== PERSISTÊNCIA ===== */
  const loadEstoque = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STOCK);
      if (!raw) return structuredClone(defaultEstoque);
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data.map(d => ({
        nome: d.nome,
        quantidade: Number(d.quantidade) || 0,
        lowAt: Number(d.lowAt) || 0
      })) : structuredClone(defaultEstoque);
    } catch {
      return structuredClone(defaultEstoque);
    }
  };
  const saveEstoque = list => localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(list));
  const isAdmin = () => localStorage.getItem(STORAGE_KEY_ADMIN) === '1';
  const setAdmin = v => localStorage.setItem(STORAGE_KEY_ADMIN, v ? '1' : '0');

  let estoque = loadEstoque();

  /* ===== ELEMENTOS ===== */
  const invBody = $('#inv-body');
  const invSearch = $('#inv-search');
  const invFilter = $('#inv-filter');
  const editor = $('#inv-editor');
  const loginBtn = $('#admin-login');
  const logoutBtn = $('#admin-logout');
  const toggleBtn = $('#inv-edit-toggle');
  const resetBtn = $('#inv-reset');
  const itemSelect = $('#inv-item');
  const qtdInput = $('#inv-qtd');
  const addBtn = $('#inv-add');
  const subBtn = $('#inv-sub');
  const setBtn = $('#inv-set');
  const zeroBtn = $('#inv-zero');
  const adminModalEl = $('#adminModal');
  const adminForm = $('#admin-form');
  const adminPinInp = $('#admin-pin');
  let adminModal = null;
  if (window.bootstrap && adminModalEl) adminModal = new bootstrap.Modal(adminModalEl);

  /* ===== FUNÇÕES ===== */
  const statusFrom = (qtd, lowAt) => {
    if (qtd <= 0) return { code:'out', label:'Esgotado' };
    if (qtd <= lowAt) return { code:'low', label:'Acabando' };
    return { code:'ok', label:'Em estoque' };
  };

  const badgeFor = code => ({
    ok: '<span class="badge bg-success-subtle text-success fw-semibold">Em estoque</span>',
    low: '<span class="badge bg-warning-subtle text-warning fw-semibold">Acabando</span>',
    out: '<span class="badge bg-danger-subtle text-danger fw-semibold">Esgotado</span>'
  }[code] || '');

  const renderTable = () => {
    const q = (invSearch?.value || '').trim().toLowerCase();
    const f = (invFilter?.value || '').trim();
    invBody.innerHTML = estoque
      .filter(it => !q || it.nome.toLowerCase().includes(q))
      .map(it => ({ ...it, st: statusFrom(it.quantidade, it.lowAt) }))
      .filter(it => !f || it.st.code === f)
      .map(it => `
        <tr>
          <td>${it.nome}</td>
          <td>${it.quantidade}</td>
          <td>${badgeFor(it.st.code)}</td>
          <td class="text-end text-muted small">${new Date().toLocaleTimeString()}</td>
        </tr>
      `).join('') ||
      `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum item encontrado.</td></tr>`;
  };

  const fillItemSelect = () => itemSelect.innerHTML = estoque.map((it, i) => `<option value="${i}">${it.nome}</option>`).join('');

  function uniformButtonsAsRestaurar() {
    [toggleBtn, resetBtn, logoutBtn].forEach(btn => {
      if (btn) {
        btn.style.background = "#fff";
        btn.style.color = "#5a3727";
        btn.style.border = "1px solid #cbb09a";
      }
    });
  }

  const updateAdminUI = () => {
    const admin = isAdmin();
    loginBtn?.classList.toggle('d-none', admin);
    toggleBtn?.classList.toggle('d-none', !admin);
    resetBtn?.classList.toggle('d-none', !admin);
    logoutBtn?.classList.toggle('d-none', !admin);
    if (admin) uniformButtonsAsRestaurar();
    else editor?.classList.add('d-none');
  };

  /* ===== ADMIN ===== */
  loginBtn?.addEventListener('click', () => {
    adminPinInp.value = "";
    adminPinInp.classList.remove('is-invalid');
    adminModal?.show();
    setTimeout(() => adminPinInp.focus(), 150);
  });

  adminForm?.addEventListener('submit', e => {
    e.preventDefault();
    const pin = adminPinInp.value.trim();
    if (pin === ADMIN_PIN) {
      setAdmin(true);
      updateAdminUI();
      fillItemSelect();
      adminModal?.hide();
    } else {
      adminPinInp.classList.add('is-invalid');
      adminModalEl.querySelector('.modal-dialog').animate(
        [{ transform:'translateX(0)' }, { transform:'translateX(-6px)' }, { transform:'translateX(6px)' }, { transform:'translateX(0)' }],
        { duration:180, iterations:1 }
      );
    }
  });

  logoutBtn?.addEventListener('click', () => { setAdmin(false); updateAdminUI(); });

  toggleBtn?.addEventListener('click', () => {
    if (!isAdmin()) return;
    const show = editor.classList.contains('d-none');
    editor.classList.toggle('d-none', !show);
    if (show) fillItemSelect();
  });

  resetBtn?.addEventListener('click', () => {
    if (!isAdmin()) return;
    if (!confirm('Restaurar o estoque para os valores padrão?')) return;
    localStorage.removeItem(STORAGE_KEY_STOCK);
    estoque = loadEstoque();
    fillItemSelect();
    renderTable();
  });

  /* ===== OPERAÇÕES ===== */
  const applyDelta = sign => {
    if (!isAdmin()) return;
    const idx = Number(itemSelect.value);
    const delta = Math.max(0, Number(qtdInput.value || 0));
    if (!Number.isInteger(idx) || idx < 0 || idx >= estoque.length) return;
    estoque[idx].quantidade = Math.max(0, estoque[idx].quantidade + (sign * delta));
    saveEstoque(estoque);
    renderTable();
  };

  const setExact = () => {
    if (!isAdmin()) return;
    const idx = Number(itemSelect.value);
    const val = Math.max(0, Number(qtdInput.value || 0));
    if (!Number.isInteger(idx) || idx < 0 || idx >= estoque.length) return;
    estoque[idx].quantidade = val;
    saveEstoque(estoque);
    renderTable();
  };

  const setZero = () => {
    if (!isAdmin()) return;
    const idx = Number(itemSelect.value);
    if (!Number.isInteger(idx) || idx < 0 || idx >= estoque.length) return;
    estoque[idx].quantidade = 0;
    saveEstoque(estoque);
    renderTable();
  };

  addBtn?.addEventListener('click', () => applyDelta(+1));
  subBtn?.addEventListener('click', () => applyDelta(-1));
  setBtn?.addEventListener('click', setExact);
  zeroBtn?.addEventListener('click', setZero);

  invSearch?.addEventListener('input', renderTable);
  invFilter?.addEventListener('change', renderTable);

  /* ===== INICIALIZA ===== */
  updateAdminUI();
  renderTable();
})();
/* === Status dinâmico da cantina (sem estilos inline) === */
(function(){
  const statusDiv = document.getElementById('status-cantina');
  if (!statusDiv) return;

  // Horários de funcionamento
  const horarios = [
    { inicio: "09:40", fim: "10:00" }, // manhã
    { inicio: "12:00", fim: "13:00" }, // almoço
    { inicio: "15:40", fim: "16:00" }, // tarde
    { inicio: "21:00", fim: "21:20" }  // noite
  ];

  // Converte string "HH:mm" em objeto Date no dia atual
  function parseTime(hm){
    const [h, m] = hm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  // Retorna o próximo horário de abertura
  function getProximoHorario(atual){
    for (const h of horarios){
      const ini = parseTime(h.inicio);
      if (atual < ini) return h;
    }
    return null;
  }

  // Atualiza o texto com efeito de fade suave
  function fadeUpdate(el, newText, newClass){
    el.style.opacity = "0";
    setTimeout(() => {
      el.className = newClass;
      el.textContent = newText;
      el.style.opacity = "1";
    }, 600);
  }

  // Verifica status da cantina e atualiza
  function atualizarStatus(){
    const agora = new Date();
    const aberto = horarios.some(h => {
      const ini = parseTime(h.inicio);
      const fim = parseTime(h.fim);
      return agora >= ini && agora <= fim;
    });

    let novoTexto = "";
    let novaClasse = "";

    if (aberto){
      novaClasse = "alert alert-success text-center fw-semibold mb-4 pulse-green";
      novoTexto = "🟢 Cantina aberta agora! Aproveite o recreio 😊";
    } else {
      const prox = getProximoHorario(agora);
      if (prox){
        novaClasse = "alert alert-warning text-center fw-semibold mb-4";
        novoTexto = `🔴 Fechada no momento — reabre às ${prox.inicio}.`;
      } else {
        novaClasse = "alert alert-secondary text-center fw-semibold mb-4";
        novoTexto = "🔴 Fechada por hoje — volte amanhã!";
      }
    }

    if (statusDiv.textContent !== novoTexto) {
      fadeUpdate(statusDiv, novoTexto, novaClasse);
    }
  }

  atualizarStatus();
  setInterval(atualizarStatus, 60000); // atualiza a cada 1 min
})();
