/**
 * UNILIMA — CRM local (armazenamento em localStorage)
 * ------------------------------------------------------------
 * Todos os dados ficam somente no navegador. Não há servidor,
 * API ou banco de dados externo. Consulte assets/js/backup.js
 * para as rotinas de backup e restauração.
 * ------------------------------------------------------------
 */
(function () {
  "use strict";

  const CHAVE_LEADS = "unilima_crm_leads";
  const CHAVE_TAREFAS = "unilima_crm_tarefas";
  const CHAVE_CONFIG = "unilima_crm_config";

  const ETAPAS = [
    { id: "novo-lead", label: "Novo Lead" },
    { id: "em-atendimento", label: "Em Atendimento" },
    { id: "negociacao", label: "Negociação" },
    { id: "convertido", label: "Convertido" },
    { id: "perdido", label: "Perdido" },
  ];
  const ETAPAS_ATIVAS = ["novo-lead", "em-atendimento", "negociacao"]; // consideradas no funil ativo (retornos, etc.)

  const ORIGENS = ["WhatsApp", "Instagram", "Facebook", "Indicação", "Site", "Outro"];
  const MOTIVOS_PERDA = ["Sem interesse", "Valor", "Não respondeu", "Escolheu outra instituição", "Outro"];
  const PRIORIDADES = ["Alta", "Média", "Baixa"];

  function labelEtapa(id) {
    const e = ETAPAS.find((x) => x.id === id);
    return e ? e.label : id;
  }

  /* ================= MIGRAÇÃO DE DADOS ANTIGOS ================= */
  // Converte leads salvos pela versão anterior do CRM (campo "situacao")
  // para a nova estrutura com "etapa", sem apagar nada.
  const MAPA_SITUACAO_ANTIGA = {
    "Novo": "novo-lead",
    "Em atendimento": "em-atendimento",
    "Aguardando retorno": "em-atendimento",
    "Interessado": "negociacao",
    "Matriculado": "convertido",
    "Não interessado": "perdido",
  };

  function migrarLead(lead) {
    let mudou = false;
    if (!lead.etapa) {
      lead.etapa = MAPA_SITUACAO_ANTIGA[lead.situacao] || "novo-lead";
      mudou = true;
    }
    if (lead.whatsapp === undefined || lead.whatsapp === "") {
      lead.whatsapp = lead.whatsapp || lead.telefone || "";
      mudou = true;
    }
    if (lead.categoria === undefined) { lead.categoria = lead.categoria || ""; mudou = true; }
    if (lead.curso === undefined) { lead.curso = lead.curso || ""; mudou = true; }
    if (!Array.isArray(lead.historico)) { lead.historico = []; mudou = true; }
    if (lead.conversao === undefined) { lead.conversao = null; mudou = true; }
    if (lead.perdidoMotivo === undefined) { lead.perdidoMotivo = ""; mudou = true; }
    if (lead.origem === undefined) { lead.origem = ""; mudou = true; }
    if (lead.situacao !== undefined) { delete lead.situacao; mudou = true; }
    if (lead.responsavel !== undefined) { delete lead.responsavel; mudou = true; }
    if (lead.telefone !== undefined) { delete lead.telefone; mudou = true; }
    return mudou;
  }

  /* ================= CAMADA DE DADOS ================= */

  function lerLeads() {
    let leads = [];
    try { leads = JSON.parse(localStorage.getItem(CHAVE_LEADS)) || []; }
    catch (e) { leads = []; }
    let precisaSalvar = false;
    leads.forEach((l) => { if (migrarLead(l)) precisaSalvar = true; });
    if (precisaSalvar) salvarLeads(leads);
    return leads;
  }
  function salvarLeads(lista) { localStorage.setItem(CHAVE_LEADS, JSON.stringify(lista)); }

  function lerTarefas() {
    try { return JSON.parse(localStorage.getItem(CHAVE_TAREFAS)) || []; }
    catch (e) { return []; }
  }
  function salvarTarefas(lista) { localStorage.setItem(CHAVE_TAREFAS, JSON.stringify(lista)); }

  function configPadrao() {
    const formacoesBase = (window.UNILIMA_CONFIG && window.UNILIMA_CONFIG.formacoes) || [];
    return {
      categorias: formacoesBase.map((f) => ({ id: f.id || gerarId(), nome: f.nome, ativo: true })),
      consultora: { nome: (window.UNILIMA_CONFIG && window.UNILIMA_CONFIG.instituicao.consultora) || "", observacoes: "" },
    };
  }

  function lerConfigCrm() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_CONFIG));
      if (salvo && Array.isArray(salvo.categorias)) return salvo;
    } catch (e) { /* ignora */ }
    const padrao = configPadrao();
    salvarConfigCrm(padrao);
    return padrao;
  }
  function salvarConfigCrm(cfg) { localStorage.setItem(CHAVE_CONFIG, JSON.stringify(cfg)); }

  function gerarId() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function agoraISO() { return new Date().toISOString(); }
  function dataHoje() { return new Date().toISOString().slice(0, 10); }

  function registrarHistorico(lead, tipo, texto) {
    if (!Array.isArray(lead.historico)) lead.historico = [];
    lead.historico.unshift({ data: agoraISO(), tipo, texto });
  }

  // Exposto para o backup.js
  window.UnilimaDados = { lerLeads, salvarLeads, lerTarefas, salvarTarefas, lerConfigCrm, salvarConfigCrm, gerarId };

  /* ================= ESTADO DA TELA ================= */

  let leadFichaAbertaId = null;
  let tarefaEmEdicaoId = null;
  let acaoConfirmacao = null;
  let filtroTextoLeads = "";
  let filtroEtapaLeads = "";
  let abaAgendaAtiva = "todos";
  let subabaConfigAtiva = "categorias";
  let leadArrastandoId = null;

  /* ================= INICIALIZAÇÃO ================= */

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof UnilimaAuth !== "undefined") {
      UnilimaAuth.exigirSessaoOuRedirecionar("login.html");
    }
    configurarNavegacao();
    configurarSaida();
    configurarModais();
    configurarFiltrosLeads();
    configurarFormularioNovoLead();
    configurarFormularioFicha();
    configurarFormularioTarefa();
    configurarFormulariosEtapaEspecial();
    configurarAgendaAbas();
    configurarConfiguracoes();
    preencherSelectsEstaticos();
    renderizarTudo();
  });

  function renderizarTudo() {
    renderizarDashboard();
    renderizarPipeline();
    renderizarTabelaLeads();
    renderizarAgenda();
    renderizarInfoBackup();
    renderizarConfiguracoes();
  }

  function renderizarInfoBackup() {
    if (window.UnilimaBackup) window.UnilimaBackup.renderizarInfoBackupGlobal();
  }

  /* ================= NAVEGAÇÃO ENTRE SEÇÕES ================= */

  function configurarNavegacao() {
    document.querySelectorAll(".menu-crm button[data-secao]").forEach((btn) => {
      btn.addEventListener("click", () => irParaSecao(btn.dataset.secao));
    });
    const hash = (window.location.hash || "#dashboard").replace("#", "");
    irParaSecao(hash, true);
    window.addEventListener("hashchange", () => {
      irParaSecao((window.location.hash || "#dashboard").replace("#", ""), true);
    });
  }

  function irParaSecao(id, semAtualizarHash) {
    const validas = ["dashboard", "pipeline", "leads", "agenda", "config"];
    if (!validas.includes(id)) id = "dashboard";

    document.querySelectorAll(".secao-crm").forEach((s) => s.classList.remove("ativa"));
    const alvo = document.getElementById("secao-" + id);
    if (alvo) alvo.classList.add("ativa");

    document.querySelectorAll(".menu-crm button[data-secao]").forEach((b) => {
      b.classList.toggle("ativo", b.dataset.secao === id);
    });

    if (!semAtualizarHash) window.location.hash = id;

    if (id === "dashboard") renderizarDashboard();
    if (id === "pipeline") renderizarPipeline();
    if (id === "agenda") renderizarAgenda();
    if (id === "config") renderizarConfiguracoes();
  }

  function configurarSaida() {
    const botao = document.getElementById("botao-sair");
    if (!botao) return;
    botao.addEventListener("click", () => {
      UnilimaAuth.encerrarSessao();
      window.location.href = "login.html";
    });
  }

  /* ================= HELPERS DE RETORNO/ATRASO ================= */

  function retornoAtrasado(lead) {
    if (!lead.proximoRetorno) return false;
    if (!ETAPAS_ATIVAS.includes(lead.etapa)) return false;
    return new Date(lead.proximoRetorno) < new Date();
  }

  function tarefaDataHora(tarefa) {
    return tarefa.data + "T" + (tarefa.horario || "23:59");
  }
  function tarefaAtrasada(tarefa) {
    if (tarefa.status === "Concluída") return false;
    return new Date(tarefaDataHora(tarefa)) < new Date();
  }

  /* ================= DASHBOARD ================= */

  function renderizarDashboard() {
    const leads = lerLeads();
    const tarefas = lerTarefas();
    const hoje = dataHoje();

    const contarEtapa = (id) => leads.filter((l) => l.etapa === id).length;

    definirTexto("estat-total", leads.length);
    definirTexto("estat-novos", contarEtapa("novo-lead"));
    definirTexto("estat-atendimento", contarEtapa("em-atendimento"));
    definirTexto("estat-negociacao", contarEtapa("negociacao"));
    definirTexto("estat-convertidos", contarEtapa("convertido"));

    const retornosHoje = leads.filter((l) => ETAPAS_ATIVAS.includes(l.etapa) && l.proximoRetorno && l.proximoRetorno.slice(0, 10) === hoje);
    definirTexto("estat-retornos-hoje", retornosHoje.length);

    const tarefasHoje = tarefas.filter((t) => t.status !== "Concluída" && t.data === hoje);
    definirTexto("estat-tarefas-hoje", tarefasHoje.length);

    const tarefasAtrasadasCount = tarefas.filter(tarefaAtrasada).length;
    const retornosAtrasadosCount = leads.filter(retornoAtrasado).length;
    definirTexto("estat-atrasados", tarefasAtrasadasCount + retornosAtrasadosCount);

    const listaProximos = document.getElementById("lista-proximos-retornos");
    if (listaProximos) {
      const proximos = leads
        .filter((l) => ETAPAS_ATIVAS.includes(l.etapa) && l.proximoRetorno)
        .sort((a, b) => a.proximoRetorno.localeCompare(b.proximoRetorno))
        .slice(0, 6);
      if (proximos.length === 0) {
        listaProximos.innerHTML = `<li class="painel-vazio">Nenhum retorno agendado.</li>`;
      } else {
        listaProximos.innerHTML = proximos.map((l) => `
          <li>
            <span>${escapeHtml(l.nome)}${retornoAtrasado(l) ? ' <strong style="color:var(--vermelho);">Atrasado</strong>' : ""}</span>
            <span>${formatarDataHoraBr(l.proximoRetorno)}</span>
          </li>`).join("");
      }
    }

    const listaRecentes = document.getElementById("lista-recentes");
    if (listaRecentes) {
      const recentes = [...leads].sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || "")).slice(0, 6);
      if (recentes.length === 0) {
        listaRecentes.innerHTML = `<li class="painel-vazio">Nenhum lead cadastrado ainda.</li>`;
      } else {
        listaRecentes.innerHTML = recentes.map((l) => `
          <li><span>${escapeHtml(l.nome)}</span><span>${formatarDataBr(l.criadoEm)}</span></li>`).join("");
      }
    }
  }

  function definirTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  /* ================= PIPELINE (KANBAN) ================= */

  function renderizarPipeline() {
    const quadro = document.getElementById("quadro-pipeline");
    if (!quadro) return;
    const leads = lerLeads();

    quadro.innerHTML = ETAPAS.map((etapa) => {
      const leadsDaEtapa = leads.filter((l) => l.etapa === etapa.id).sort((a, b) => (b.atualizadoEm || "").localeCompare(a.atualizadoEm || ""));
      const cartoes = leadsDaEtapa.map((l) => cartaoPipelineHtml(l)).join("");
      return `
        <div class="coluna-pipeline" data-etapa="${etapa.id}">
          <div class="coluna-cabecalho">
            <h3>${etapa.label}</h3>
            <span class="contagem">${leadsDaEtapa.length}</span>
          </div>
          <div class="coluna-corpo" data-etapa-alvo="${etapa.id}">
            ${cartoes || '<div class="coluna-vazia">Nenhum lead nesta etapa.</div>'}
          </div>
        </div>`;
    }).join("");

    configurarDragAndDrop();

    quadro.querySelectorAll(".cartao-pipeline").forEach((cartao) => {
      cartao.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("seletor-etapa-rapido")) return;
        abrirFichaLead(cartao.dataset.id);
      });
      const seletor = cartao.querySelector(".seletor-etapa-rapido");
      if (seletor) {
        seletor.addEventListener("click", (ev) => ev.stopPropagation());
        seletor.addEventListener("change", (ev) => {
          ev.stopPropagation();
          aplicarMudancaEtapa(cartao.dataset.id, seletor.value);
        });
      }
    });
  }

  function cartaoPipelineHtml(lead) {
    const atrasado = retornoAtrasado(lead);
    const retornoTxt = lead.proximoRetorno
      ? `<span class="retorno-lead ${atrasado ? "atrasado-txt" : "normal-txt"}">${atrasado ? "⚠ Atrasado — " : "⏰ "}${formatarDataHoraBr(lead.proximoRetorno)}</span>`
      : "";
    const opcoesEtapa = ETAPAS.map((e) => `<option value="${e.id}" ${e.id === lead.etapa ? "selected" : ""}>${e.label}</option>`).join("");
    return `
      <div class="cartao-pipeline ${atrasado ? "atrasado" : ""}" draggable="true" data-id="${lead.id}">
        <span class="nome-lead">${escapeHtml(lead.nome)}</span>
        ${lead.categoria || lead.curso ? `<span class="meta-lead">${escapeHtml([lead.categoria, lead.curso].filter(Boolean).join(" · "))}</span>` : ""}
        ${lead.origem ? `<span class="meta-lead">Origem: ${escapeHtml(lead.origem)}</span>` : ""}
        ${retornoTxt}
        <select class="seletor-etapa-rapido" aria-label="Alterar etapa">${opcoesEtapa}</select>
      </div>`;
  }

  function configurarDragAndDrop() {
    const quadro = document.getElementById("quadro-pipeline");
    if (!quadro) return;

    quadro.querySelectorAll(".cartao-pipeline").forEach((cartao) => {
      cartao.addEventListener("dragstart", () => {
        leadArrastandoId = cartao.dataset.id;
        cartao.classList.add("arrastando");
      });
      cartao.addEventListener("dragend", () => {
        cartao.classList.remove("arrastando");
        leadArrastandoId = null;
      });
    });

    quadro.querySelectorAll(".coluna-pipeline").forEach((coluna) => {
      coluna.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        coluna.classList.add("sobre-drag");
      });
      coluna.addEventListener("dragleave", () => coluna.classList.remove("sobre-drag"));
      coluna.addEventListener("drop", (ev) => {
        ev.preventDefault();
        coluna.classList.remove("sobre-drag");
        if (!leadArrastandoId) return;
        aplicarMudancaEtapa(leadArrastandoId, coluna.dataset.etapa);
      });
    });
  }

  function aplicarMudancaEtapa(leadId, novaEtapa) {
    const leads = lerLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa === novaEtapa) return;

    const etapaAntiga = lead.etapa;
    lead.etapa = novaEtapa;
    lead.atualizadoEm = agoraISO();
    registrarHistorico(lead, "etapa", `Etapa alterada de "${labelEtapa(etapaAntiga)}" para "${labelEtapa(novaEtapa)}"`);

    if (novaEtapa === "convertido") registrarHistorico(lead, "conversao", "Lead convertido");
    if (novaEtapa === "perdido") registrarHistorico(lead, "perda", "Lead marcado como perdido");

    salvarLeads(leads);
    renderizarPipeline();
    renderizarTabelaLeads();
    renderizarDashboard();

    if (leadFichaAbertaId === leadId) preencherFicha(lead);

    if (novaEtapa === "convertido") abrirModalConversao(leadId);
    else if (novaEtapa === "perdido") abrirModalPerda(leadId);
    else mostrarToast(`Etapa de "${lead.nome}" alterada para ${labelEtapa(novaEtapa)}.`);
  }

  /* ================= MODAIS DE ETAPA ESPECIAL (CONVERSÃO / PERDA) ================= */

  function configurarFormulariosEtapaEspecial() {
    const formConv = document.getElementById("form-conversao");
    if (formConv) {
      formConv.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const leads = lerLeads();
        const lead = leads.find((l) => l.id === formConv.dataset.leadId);
        if (!lead) return;
        lead.conversao = {
          curso: formConv.curso.value.trim(),
          categoria: formConv.categoria.value.trim(),
          instituicao: formConv.instituicao.value,
          dataMatricula: formConv.dataMatricula.value,
        };
        lead.atualizadoEm = agoraISO();
        const detalhes = [lead.conversao.curso, lead.conversao.instituicao].filter(Boolean).join(" · ");
        registrarHistorico(lead, "conversao", "Detalhes da matrícula registrados" + (detalhes ? `: ${detalhes}` : ""));
        salvarLeads(leads);
        fecharModal("modal-conversao");
        renderizarPipeline();
        if (leadFichaAbertaId === lead.id) preencherFicha(lead);
        mostrarToast("Detalhes da matrícula salvos.");
      });
    }

    const formPerda = document.getElementById("form-perda");
    if (formPerda) {
      formPerda.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const leads = lerLeads();
        const lead = leads.find((l) => l.id === formPerda.dataset.leadId);
        if (!lead) return;
        const motivo = formPerda.motivo.value;
        if (motivo) {
          lead.perdidoMotivo = motivo;
          registrarHistorico(lead, "perda", `Motivo informado: ${motivo}`);
          salvarLeads(leads);
          if (leadFichaAbertaId === lead.id) preencherFicha(lead);
        }
        fecharModal("modal-perda");
        mostrarToast("Lead marcado como perdido.");
      });
    }
  }

  function abrirModalConversao(leadId) {
    const lead = lerLeads().find((l) => l.id === leadId);
    if (!lead) return;
    const form = document.getElementById("form-conversao");
    form.reset();
    form.dataset.leadId = leadId;
    form.curso.value = lead.curso || "";
    form.categoria.value = lead.categoria || "";
    preencherSelectInstituicoes(form.instituicao);
    abrirModal("modal-conversao");
  }

  function abrirModalPerda(leadId) {
    const form = document.getElementById("form-perda");
    form.reset();
    form.dataset.leadId = leadId;
    abrirModal("modal-perda");
  }

  function preencherSelectInstituicoes(select) {
    const lista = (window.UNILIMA_CONFIG && window.UNILIMA_CONFIG.instituicoesParceiras) || [];
    select.innerHTML = `<option value="">Não informado</option>` + lista.map((p) => `<option value="${escapeHtml(p.nome)}">${escapeHtml(p.nome)}</option>`).join("");
  }

  /* ================= LEADS: FILTROS E TABELA ================= */

  function configurarFiltrosLeads() {
    const busca = document.getElementById("busca-leads");
    const filtroEtapa = document.getElementById("filtro-etapa");
    const botaoNovo = document.getElementById("botao-novo-lead");
    const botaoNovoPipeline = document.getElementById("botao-novo-lead-pipeline");

    if (busca) busca.addEventListener("input", () => { filtroTextoLeads = busca.value.trim().toLowerCase(); renderizarTabelaLeads(); });
    if (filtroEtapa) filtroEtapa.addEventListener("change", () => { filtroEtapaLeads = filtroEtapa.value; renderizarTabelaLeads(); });
    if (botaoNovo) botaoNovo.addEventListener("click", () => abrirModalNovoLead());
    if (botaoNovoPipeline) botaoNovoPipeline.addEventListener("click", () => abrirModalNovoLead());
  }

  function preencherSelectsEstaticos() {
    const filtroEtapa = document.getElementById("filtro-etapa");
    if (filtroEtapa) {
      filtroEtapa.innerHTML = `<option value="">Todas as etapas</option>` + ETAPAS.map((e) => `<option value="${e.id}">${e.label}</option>`).join("");
    }
    const origemNovo = document.getElementById("campo-novo-origem");
    if (origemNovo) origemNovo.innerHTML = ORIGENS.map((o) => `<option value="${o}">${o}</option>`).join("");

    const motivoSelect = document.querySelector('#form-perda select[name="motivo"]');
    if (motivoSelect) {
      motivoSelect.innerHTML = `<option value="">Não informar</option>` + MOTIVOS_PERDA.map((m) => `<option value="${m}">${m}</option>`).join("");
    }
    const prioridadeSelect = document.getElementById("campo-tarefa-prioridade");
    if (prioridadeSelect) prioridadeSelect.innerHTML = PRIORIDADES.map((p) => `<option value="${p}">${p}</option>`).join("");
  }

  function categoriasAtivasOptions(valorSelecionado) {
    const cfg = lerConfigCrm();
    const ativas = cfg.categorias.filter((c) => c.ativo);
    if (ativas.length === 0) return `<option value="">Nenhuma categoria ativa — veja Configurações</option>`;
    return `<option value="">Selecione</option>` + ativas.map((c) => `<option value="${escapeHtml(c.nome)}" ${c.nome === valorSelecionado ? "selected" : ""}>${escapeHtml(c.nome)}</option>`).join("") +
      (valorSelecionado && !ativas.find((c) => c.nome === valorSelecionado) ? `<option value="${escapeHtml(valorSelecionado)}" selected>${escapeHtml(valorSelecionado)} (inativa)</option>` : "");
  }

  function classeStatus(etapaId) {
    return "status-" + etapaId;
  }

  function renderizarTabelaLeads() {
    const corpo = document.getElementById("corpo-tabela-leads");
    if (!corpo) return;
    let leads = lerLeads();

    if (filtroTextoLeads) {
      leads = leads.filter((l) =>
        (l.nome || "").toLowerCase().includes(filtroTextoLeads) ||
        (l.whatsapp || "").toLowerCase().includes(filtroTextoLeads) ||
        (l.email || "").toLowerCase().includes(filtroTextoLeads)
      );
    }
    if (filtroEtapaLeads) leads = leads.filter((l) => l.etapa === filtroEtapaLeads);

    leads.sort((a, b) => (b.atualizadoEm || "").localeCompare(a.atualizadoEm || ""));
    definirTexto("contador-leads", leads.length);

    if (leads.length === 0) {
      corpo.innerHTML = `<tr><td colspan="7"><div class="tabela-vazia">Nenhum lead encontrado. Ajuste os filtros ou cadastre um novo lead.</div></td></tr>`;
      return;
    }

    corpo.innerHTML = leads.map((l) => `
      <tr>
        <td><strong>${escapeHtml(l.nome)}</strong></td>
        <td>${escapeHtml(l.whatsapp || "-")}</td>
        <td>${escapeHtml(l.categoria || "-")}</td>
        <td><span class="status-badge ${classeStatus(l.etapa)}">${escapeHtml(labelEtapa(l.etapa))}</span></td>
        <td>${l.proximoRetorno ? formatarDataHoraBr(l.proximoRetorno) : "-"}</td>
        <td>${formatarDataBr(l.criadoEm)}</td>
        <td>
          <div class="acoes-linha">
            <button type="button" title="Abrir WhatsApp" data-acao="whatsapp" data-id="${l.id}">💬</button>
            <button type="button" title="Abrir ficha" data-acao="ficha" data-id="${l.id}">📄</button>
            <button type="button" class="excluir" title="Excluir" data-acao="excluir" data-id="${l.id}">🗑</button>
          </div>
        </td>
      </tr>
    `).join("");

    corpo.querySelectorAll("button[data-acao]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const acao = btn.dataset.acao;
        if (acao === "ficha") abrirFichaLead(id);
        if (acao === "excluir") confirmarExclusaoLead(id);
        if (acao === "whatsapp") abrirWhatsappLead(id);
      });
    });
  }

  function abrirWhatsappLead(id) {
    const lead = lerLeads().find((l) => l.id === id);
    if (!lead) return;
    const numero = (lead.whatsapp || "").replace(/\D/g, "");
    if (!numero) { mostrarToast("Este lead não possui WhatsApp cadastrado."); return; }
    const texto = encodeURIComponent(`Olá, ${lead.nome}! Aqui é da UNILIMA.`);
    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank", "noopener");
  }

  /* ================= NOVO LEAD (CADASTRO RÁPIDO) ================= */

  function configurarFormularioNovoLead() {
    const form = document.getElementById("form-novo-lead");
    if (!form) return;

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const nome = form.nome.value.trim();
      const whatsapp = form.whatsapp.value.trim();
      if (!nome) { mostrarToast("Informe o nome do lead."); return; }
      if (whatsapp.replace(/\D/g, "").length < 10) { mostrarToast("Informe um WhatsApp válido para o lead."); return; }

      const agora = agoraISO();
      const lead = {
        id: gerarId(),
        nome,
        whatsapp,
        email: form.email.value.trim(),
        cidade: form.cidade.value.trim(),
        estado: form.estado.value.trim(),
        categoria: form.categoria.value,
        curso: form.curso.value.trim(),
        origem: form.origem.value,
        etapa: "novo-lead",
        observacoes: form.observacao.value.trim(),
        proximoRetorno: form.proximoRetorno.value || "",
        perdidoMotivo: "",
        conversao: null,
        historico: [],
        criadoEm: agora,
        atualizadoEm: agora,
      };
      registrarHistorico(lead, "criacao", "Lead criado");
      if (lead.observacoes) registrarHistorico(lead, "observacao", `Observação: ${lead.observacoes}`);
      if (lead.proximoRetorno) registrarHistorico(lead, "retorno", `Retorno agendado para ${formatarDataHoraBr(lead.proximoRetorno)}`);

      const leads = lerLeads();
      leads.push(lead);
      salvarLeads(leads);

      fecharModal("modal-novo-lead");
      renderizarTudo();
      mostrarToast("Lead cadastrado com sucesso.");
    });

    const botaoAbrir = document.getElementById("botao-novo-lead");
    if (botaoAbrir) botaoAbrir.addEventListener("click", abrirModalNovoLead);
  }

  function abrirModalNovoLead() {
    const form = document.getElementById("form-novo-lead");
    form.reset();
    form.categoria.innerHTML = categoriasAtivasOptions("");
    abrirModal("modal-novo-lead");
  }

  /* ================= FICHA DO LEAD ================= */

  function abrirFichaLead(id) {
    const lead = lerLeads().find((l) => l.id === id);
    if (!lead) return;
    leadFichaAbertaId = id;
    preencherFicha(lead);
    abrirModal("modal-ficha-lead");
  }

  function preencherFicha(lead) {
    document.getElementById("ficha-nome").textContent = lead.nome;
    document.getElementById("ficha-criado-em").textContent = "Cadastrado em " + formatarDataBr(lead.criadoEm);

    const selectEtapa = document.getElementById("ficha-etapa");
    selectEtapa.innerHTML = ETAPAS.map((e) => `<option value="${e.id}" ${e.id === lead.etapa ? "selected" : ""}>${e.label}</option>`).join("");

    const form = document.getElementById("form-ficha");
    form.whatsapp.value = lead.whatsapp || "";
    form.email.value = lead.email || "";
    form.cidade.value = lead.cidade || "";
    form.estado.value = lead.estado || "";
    form.categoria.innerHTML = categoriasAtivasOptions(lead.categoria);
    form.curso.value = lead.curso || "";
    form.proximoRetorno.value = lead.proximoRetorno || "";
    form.dataset.leadId = lead.id;

    const btnWhats = document.getElementById("ficha-botao-whatsapp");
    btnWhats.onclick = () => abrirWhatsappLead(lead.id);

    const caixaConversao = document.getElementById("ficha-caixa-conversao");
    if (lead.etapa === "convertido") {
      caixaConversao.hidden = false;
      const c = lead.conversao;
      caixaConversao.innerHTML = c && (c.curso || c.instituicao || c.dataMatricula)
        ? `<strong>Matrícula registrada</strong><br>${[c.curso, c.categoria, c.instituicao, c.dataMatricula ? formatarDataBr(c.dataMatricula) : ""].filter(Boolean).map(escapeHtml).join(" · ")} <button type="button" class="btn btn-fantasma" id="ficha-editar-conversao" style="margin-top:8px;">Editar detalhes</button>`
        : `Lead convertido — nenhum detalhe de matrícula registrado ainda. <button type="button" class="btn btn-fantasma" id="ficha-editar-conversao" style="margin-top:8px;">Adicionar detalhes</button>`;
      const btnEditarConv = document.getElementById("ficha-editar-conversao");
      if (btnEditarConv) btnEditarConv.addEventListener("click", () => abrirModalConversao(lead.id));
    } else {
      caixaConversao.hidden = true;
    }

    const caixaPerda = document.getElementById("ficha-caixa-perda");
    if (lead.etapa === "perdido") {
      caixaPerda.hidden = false;
      caixaPerda.innerHTML = lead.perdidoMotivo
        ? `<strong>Motivo:</strong> ${escapeHtml(lead.perdidoMotivo)}`
        : `Nenhum motivo informado. <button type="button" class="btn btn-fantasma" id="ficha-editar-perda" style="margin-top:8px;">Informar motivo</button>`;
      const btnEditarPerda = document.getElementById("ficha-editar-perda");
      if (btnEditarPerda) btnEditarPerda.addEventListener("click", () => abrirModalPerda(lead.id));
    } else {
      caixaPerda.hidden = true;
    }

    renderizarTarefasFicha(lead.id);
    renderizarTimelineFicha(lead.historico || []);

    const botaoExcluir = document.getElementById("ficha-botao-excluir");
    botaoExcluir.onclick = () => confirmarExclusaoLead(lead.id, true);

    const botaoNovaTarefaFicha = document.getElementById("ficha-botao-nova-tarefa");
    botaoNovaTarefaFicha.onclick = () => abrirModalTarefa(null, lead.id);
  }

  function configurarFormularioFicha() {
    const form = document.getElementById("form-ficha");
    if (!form) return;

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const leads = lerLeads();
      const lead = leads.find((l) => l.id === form.dataset.leadId);
      if (!lead) return;

      const retornoAntigo = lead.proximoRetorno || "";
      const retornoNovo = form.proximoRetorno.value || "";

      lead.whatsapp = form.whatsapp.value.trim();
      lead.email = form.email.value.trim();
      lead.cidade = form.cidade.value.trim();
      lead.estado = form.estado.value.trim();
      lead.categoria = form.categoria.value;
      lead.curso = form.curso.value.trim();
      lead.proximoRetorno = retornoNovo;
      lead.atualizadoEm = agoraISO();

      if (retornoAntigo !== retornoNovo) {
        if (!retornoAntigo && retornoNovo) registrarHistorico(lead, "retorno", `Retorno agendado para ${formatarDataHoraBr(retornoNovo)}`);
        else if (retornoAntigo && retornoNovo) registrarHistorico(lead, "retorno", `Retorno reagendado para ${formatarDataHoraBr(retornoNovo)}`);
        else if (retornoAntigo && !retornoNovo) registrarHistorico(lead, "retorno", "Retorno removido");
      }

      salvarLeads(leads);
      preencherFicha(lead);
      renderizarPipeline();
      renderizarTabelaLeads();
      renderizarDashboard();
      renderizarAgenda();
      mostrarToast("Dados do lead atualizados.");
    });

    const botaoAddObs = document.getElementById("ficha-botao-add-observacao");
    if (botaoAddObs) {
      botaoAddObs.addEventListener("click", () => {
        const campo = document.getElementById("ficha-nova-observacao");
        const texto = campo.value.trim();
        if (!texto || !leadFichaAbertaId) return;
        const leads = lerLeads();
        const lead = leads.find((l) => l.id === leadFichaAbertaId);
        if (!lead) return;
        registrarHistorico(lead, "observacao", texto);
        lead.atualizadoEm = agoraISO();
        salvarLeads(leads);
        campo.value = "";
        renderizarTimelineFicha(lead.historico);
        renderizarPipeline();
        mostrarToast("Observação adicionada.");
      });
    }

    const selectEtapa = document.getElementById("ficha-etapa");
    if (selectEtapa) {
      selectEtapa.addEventListener("change", () => {
        if (!leadFichaAbertaId) return;
        aplicarMudancaEtapa(leadFichaAbertaId, selectEtapa.value);
      });
    }
  }

  function renderizarTimelineFicha(historico) {
    const lista = document.getElementById("ficha-timeline");
    if (!lista) return;
    if (!historico || historico.length === 0) {
      lista.innerHTML = `<li class="painel-vazio">Nenhum evento registrado ainda.</li>`;
      return;
    }
    lista.innerHTML = historico.map((h) => `
      <li>
        <span class="ponto-timeline"></span>
        <span class="conteudo-timeline">
          <strong>${formatarDataHoraBr(h.data)}</strong>
          <span>${escapeHtml(h.texto)}</span>
        </span>
      </li>`).join("");
  }

  function renderizarTarefasFicha(leadId) {
    const lista = document.getElementById("ficha-tarefas");
    if (!lista) return;
    const tarefas = lerTarefas().filter((t) => t.leadId === leadId).sort((a, b) => tarefaDataHora(a).localeCompare(tarefaDataHora(b)));
    if (tarefas.length === 0) {
      lista.innerHTML = `<li class="painel-vazio" style="background:none;padding:4px 0;">Nenhuma tarefa relacionada.</li>`;
      return;
    }
    lista.innerHTML = tarefas.map((t) => `
      <li class="${t.status === "Concluída" ? "concluida" : ""}">
        <span>${escapeHtml(t.titulo)} — ${formatarDataBr(t.data)}${t.horario ? " " + t.horario : ""}</span>
        <span>${t.status}</span>
      </li>`).join("");
  }

  function confirmarExclusaoLead(id, fecharFichaAntes) {
    const lead = lerLeads().find((l) => l.id === id);
    if (!lead) return;
    abrirConfirmacao(
      "Excluir lead",
      `Tem certeza que deseja excluir "${escapeHtml(lead.nome)}"? Essa ação não pode ser desfeita e removerá também o histórico deste lead.`,
      () => {
        salvarLeads(lerLeads().filter((l) => l.id !== id));
        salvarTarefas(lerTarefas().filter((t) => t.leadId !== id));
        if (fecharFichaAntes) fecharModal("modal-ficha-lead");
        renderizarTudo();
        mostrarToast("Lead excluído.");
      }
    );
  }

  /* ================= AGENDA E TAREFAS ================= */

  function configurarAgendaAbas() {
    const botaoNovaTarefa = document.getElementById("botao-nova-tarefa");
    if (botaoNovaTarefa) botaoNovaTarefa.addEventListener("click", () => abrirModalTarefa());

    document.querySelectorAll(".abas-filtro button[data-aba]").forEach((btn) => {
      btn.addEventListener("click", () => {
        abaAgendaAtiva = btn.dataset.aba;
        document.querySelectorAll(".abas-filtro button[data-aba]").forEach((b) => b.classList.toggle("ativa", b === btn));
        renderizarAgenda();
      });
    });
  }

  function itensAgendaUnificados() {
    const tarefas = lerTarefas().map((t) => ({
      tipo: "tarefa",
      id: t.id,
      titulo: t.titulo,
      leadId: t.leadId || "",
      dataHora: tarefaDataHora(t),
      data: t.data,
      horario: t.horario,
      prioridade: t.prioridade,
      status: t.status,
      observacao: t.observacao,
    }));

    const leads = lerLeads();
    const retornos = leads
      .filter((l) => ETAPAS_ATIVAS.includes(l.etapa) && l.proximoRetorno)
      .map((l) => ({
        tipo: "retorno",
        id: "retorno-" + l.id,
        titulo: "Retorno: " + l.nome,
        leadId: l.id,
        dataHora: l.proximoRetorno,
        data: l.proximoRetorno.slice(0, 10),
        horario: l.proximoRetorno.slice(11, 16),
        prioridade: "",
        status: "Pendente",
        observacao: "",
      }));

    return [...tarefas, ...retornos].sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  }

  function itemAtrasado(item) {
    if (item.status === "Concluída") return false;
    return new Date(item.dataHora) < new Date();
  }
  function itemEhHoje(item) { return item.data === dataHoje(); }

  function renderizarAgenda() {
    const container = document.getElementById("lista-agenda");
    if (!container) return;
    let itens = itensAgendaUnificados();
    const hoje = dataHoje();

    if (abaAgendaAtiva === "hoje") itens = itens.filter((i) => i.data === hoje && i.status !== "Concluída");
    else if (abaAgendaAtiva === "proximos") itens = itens.filter((i) => i.data > hoje && i.status !== "Concluída");
    else if (abaAgendaAtiva === "atrasados") itens = itens.filter((i) => itemAtrasado(i));
    else if (abaAgendaAtiva === "concluidos") itens = itens.filter((i) => i.status === "Concluída");

    if (itens.length === 0) {
      container.innerHTML = `<p class="painel-vazio">Nenhum item encontrado para este filtro.</p>`;
      return;
    }

    const leads = lerLeads();

    container.innerHTML = itens.map((item) => {
      const atrasado = itemAtrasado(item);
      const hojeItem = itemEhHoje(item) && item.status !== "Concluída";
      const classe = item.status === "Concluída" ? "concluida" : atrasado ? "atrasada" : hojeItem ? "hoje" : "";
      const lead = item.leadId ? leads.find((l) => l.id === item.leadId) : null;
      const badge = `<span class="badge-tipo">${item.tipo === "retorno" ? "Retorno" : "Tarefa"}</span>`;

      let acoes = "";
      if (item.tipo === "tarefa") {
        acoes = `
          ${item.status !== "Concluída" ? `<button type="button" data-acao="concluir-tarefa" data-id="${item.id}">Concluir</button>` : `<button type="button" data-acao="reabrir-tarefa" data-id="${item.id}">Reabrir</button>`}
          <button type="button" data-acao="editar-tarefa" data-id="${item.id}">Editar</button>
          <button type="button" data-acao="excluir-tarefa" data-id="${item.id}">Excluir</button>`;
      } else {
        acoes = `
          <button type="button" data-acao="concluir-retorno" data-id="${item.leadId}">Concluir retorno</button>
          <button type="button" data-acao="abrir-lead" data-id="${item.leadId}">Abrir lead</button>`;
      }

      return `
        <div class="cartao-tarefa ${classe} ${item.tipo === "retorno" ? "item-agenda-retorno" : ""}">
          <div class="info-tarefa">
            <strong>${badge}${escapeHtml(item.titulo)}</strong>
            <span>${lead && item.tipo === "tarefa" ? "Lead: " + escapeHtml(lead.nome) + " · " : ""}${escapeHtml(item.observacao || "")}</span>
          </div>
          <div class="meta-tarefa">
            ${item.prioridade ? `<span class="tag-prioridade prioridade-${item.prioridade.toLowerCase()}">${escapeHtml(item.prioridade)}</span>` : ""}
            <span>${formatarDataBr(item.data)}${item.horario ? " · " + item.horario : ""}</span>
            ${atrasado ? '<span style="color:var(--vermelho);font-weight:600;">Atrasado</span>' : ""}
            ${hojeItem && !atrasado ? '<span style="color:var(--ambar);font-weight:600;">Hoje</span>' : ""}
          </div>
          <div class="acoes-tarefa">${acoes}</div>
        </div>`;
    }).join("");

    container.querySelectorAll("button[data-acao]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const acao = btn.dataset.acao;
        if (acao === "concluir-tarefa") alterarStatusTarefa(id, "Concluída");
        if (acao === "reabrir-tarefa") alterarStatusTarefa(id, "Pendente");
        if (acao === "editar-tarefa") abrirModalTarefa(id);
        if (acao === "excluir-tarefa") confirmarExclusaoTarefa(id);
        if (acao === "abrir-lead") { fecharModal("modal-ficha-lead"); abrirFichaLead(id); }
        if (acao === "concluir-retorno") concluirRetornoLead(id);
      });
    });
  }

  function concluirRetornoLead(leadId) {
    const leads = lerLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    lead.proximoRetorno = "";
    lead.atualizadoEm = agoraISO();
    registrarHistorico(lead, "retorno", "Retorno concluído");
    salvarLeads(leads);
    renderizarAgenda();
    renderizarDashboard();
    renderizarPipeline();
    if (leadFichaAbertaId === leadId) preencherFicha(lead);
    mostrarToast("Retorno marcado como concluído.");
  }

  function configurarFormularioTarefa() {
    const form = document.getElementById("form-tarefa");
    if (!form) return;

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const dados = {
        titulo: form.titulo.value.trim(),
        leadId: form.leadId.value || "",
        data: form.data.value,
        horario: form.horario.value,
        prioridade: form.prioridade.value,
        observacao: form.observacao.value.trim(),
      };
      if (!dados.titulo || !dados.data) { mostrarToast("Informe ao menos o título e a data da tarefa."); return; }

      const tarefas = lerTarefas();
      if (tarefaEmEdicaoId) {
        const idx = tarefas.findIndex((t) => t.id === tarefaEmEdicaoId);
        if (idx > -1) tarefas[idx] = { ...tarefas[idx], ...dados };
        salvarTarefas(tarefas);
        mostrarToast("Tarefa atualizada.");
      } else {
        const novaTarefa = { id: gerarId(), ...dados, status: "Pendente", criadoEm: agoraISO() };
        tarefas.push(novaTarefa);
        salvarTarefas(tarefas);
        if (dados.leadId) {
          const leads = lerLeads();
          const lead = leads.find((l) => l.id === dados.leadId);
          if (lead) {
            registrarHistorico(lead, "tarefa", `Tarefa criada: ${dados.titulo}`);
            lead.atualizadoEm = agoraISO();
            salvarLeads(leads);
            if (leadFichaAbertaId === lead.id) preencherFicha(lead);
          }
        }
        mostrarToast("Tarefa criada.");
      }

      fecharModal("modal-tarefa");
      renderizarAgenda();
      renderizarDashboard();
    });
  }

  function abrirModalTarefa(id, leadIdPreDefinido) {
    tarefaEmEdicaoId = id || null;
    const form = document.getElementById("form-tarefa");
    form.reset();

    const selectLead = document.getElementById("campo-tarefa-lead");
    const leads = lerLeads();
    selectLead.innerHTML = `<option value="">Nenhum lead relacionado</option>` + leads.map((l) => `<option value="${l.id}">${escapeHtml(l.nome)}</option>`).join("");

    document.getElementById("titulo-modal-tarefa").textContent = id ? "Editar tarefa" : "Nova tarefa";

    if (id) {
      const tarefa = lerTarefas().find((t) => t.id === id);
      if (!tarefa) return;
      form.titulo.value = tarefa.titulo || "";
      form.leadId.value = tarefa.leadId || "";
      form.data.value = tarefa.data || "";
      form.horario.value = tarefa.horario || "";
      form.prioridade.value = tarefa.prioridade || "Média";
      form.observacao.value = tarefa.observacao || "";
    } else {
      form.data.value = dataHoje();
      form.prioridade.value = "Média";
      if (leadIdPreDefinido) selectLead.value = leadIdPreDefinido;
    }

    abrirModal("modal-tarefa");
  }

  function alterarStatusTarefa(id, status) {
    const tarefas = lerTarefas();
    const idx = tarefas.findIndex((t) => t.id === id);
    if (idx === -1) return;
    tarefas[idx].status = status;
    salvarTarefas(tarefas);

    if (status === "Concluída" && tarefas[idx].leadId) {
      const leads = lerLeads();
      const lead = leads.find((l) => l.id === tarefas[idx].leadId);
      if (lead) {
        registrarHistorico(lead, "tarefa", `Tarefa concluída: ${tarefas[idx].titulo}`);
        lead.atualizadoEm = agoraISO();
        salvarLeads(leads);
        if (leadFichaAbertaId === lead.id) preencherFicha(lead);
      }
    }
    renderizarAgenda();
    renderizarDashboard();
  }

  function confirmarExclusaoTarefa(id) {
    abrirConfirmacao("Excluir tarefa", "Tem certeza que deseja excluir esta tarefa?", () => {
      salvarTarefas(lerTarefas().filter((t) => t.id !== id));
      renderizarAgenda();
      renderizarDashboard();
      mostrarToast("Tarefa excluída.");
    });
  }

  /* ================= CONFIGURAÇÕES ================= */

  function configurarConfiguracoes() {
    document.querySelectorAll(".subabas-config button[data-subaba]").forEach((btn) => {
      btn.addEventListener("click", () => {
        subabaConfigAtiva = btn.dataset.subaba;
        renderizarConfiguracoes();
      });
    });

    const formConsultora = document.getElementById("form-consultora");
    if (formConsultora) {
      formConsultora.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const cfg = lerConfigCrm();
        cfg.consultora = { nome: formConsultora.nome.value.trim(), observacoes: formConsultora.observacoes.value.trim() };
        salvarConfigCrm(cfg);
        mostrarToast("Dados da consultora salvos neste navegador.");
      });
    }
  }

  function renderizarConfiguracoes() {
    document.querySelectorAll(".subabas-config button[data-subaba]").forEach((b) => {
      b.classList.toggle("ativa", b.dataset.subaba === subabaConfigAtiva);
    });
    document.querySelectorAll(".subsecao-config").forEach((s) => {
      s.classList.toggle("ativa", s.id === "subsecao-" + subabaConfigAtiva);
    });

    if (subabaConfigAtiva === "categorias") renderizarCategorias();
    if (subabaConfigAtiva === "consultora") renderizarConsultora();
  }

  function renderizarCategorias() {
    const lista = document.getElementById("lista-categorias");
    if (!lista) return;
    const cfg = lerConfigCrm();
    lista.innerHTML = cfg.categorias.map((c) => `
      <div class="linha-categoria ${c.ativo ? "" : "inativa"}">
        <strong>${escapeHtml(c.nome)}</strong>
        <label class="interruptor">
          <input type="checkbox" data-cat-id="${c.id}" ${c.ativo ? "checked" : ""}>
          <span class="trilho"></span>
        </label>
      </div>`).join("");

    lista.querySelectorAll("input[type=checkbox]").forEach((chk) => {
      chk.addEventListener("change", () => {
        const cfgAtual = lerConfigCrm();
        const cat = cfgAtual.categorias.find((c) => c.id === chk.dataset.catId);
        if (cat) { cat.ativo = chk.checked; salvarConfigCrm(cfgAtual); renderizarCategorias(); }
      });
    });
  }

  function renderizarConsultora() {
    const cfg = lerConfigCrm();
    const form = document.getElementById("form-consultora");
    if (!form) return;
    form.nome.value = cfg.consultora.nome || "";
    form.observacoes.value = cfg.consultora.observacoes || "";
  }

  /* ================= MODAIS (genérico) ================= */

  function configurarModais() {
    document.querySelectorAll("[data-fechar-modal]").forEach((el) => {
      el.addEventListener("click", () => fecharModal(el.dataset.fecharModal));
    });
    document.querySelectorAll(".modal-fundo").forEach((fundo) => {
      fundo.addEventListener("click", (ev) => { if (ev.target === fundo) fundo.hidden = true; });
    });
    const btnConfirmar = document.getElementById("botao-confirmar-acao");
    if (btnConfirmar) {
      btnConfirmar.addEventListener("click", () => {
        if (typeof acaoConfirmacao === "function") acaoConfirmacao();
        fecharModal("modal-confirmar");
      });
    }
  }

  function abrirModal(id) { const el = document.getElementById(id); if (el) el.hidden = false; }
  function fecharModal(id) { const el = document.getElementById(id); if (el) el.hidden = true; }

  function abrirConfirmacao(titulo, mensagem, aoConfirmar) {
    document.getElementById("titulo-confirmar").textContent = titulo;
    document.getElementById("mensagem-confirmar").innerHTML = mensagem;
    acaoConfirmacao = aoConfirmar;
    abrirModal("modal-confirmar");
  }

  window.UnilimaUI = { abrirConfirmacao, mostrarToast, renderizarTudo, abrirModal, fecharModal };

  /* ================= UTILITÁRIOS ================= */

  function mostrarToast(mensagem) {
    let toast = document.getElementById("toast-global");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-global";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.classList.add("visivel");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove("visivel"), 3200);
  }

  function formatarDataBr(isoOuData) {
    if (!isoOuData) return "-";
    const data = isoOuData.length === 10 ? new Date(isoOuData + "T00:00:00") : new Date(isoOuData);
    if (isNaN(data)) return "-";
    return data.toLocaleDateString("pt-BR");
  }
  function formatarDataHoraBr(iso) {
    if (!iso) return "";
    const data = new Date(iso);
    if (isNaN(data)) return "";
    return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.UnilimaHelpers = { escapeHtml, formatarDataBr, formatarDataHoraBr, gerarId, dataHoje };
})();
