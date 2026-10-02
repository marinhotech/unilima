/**
 * UNILIMA — Backup e segurança do CRM
 * ------------------------------------------------------------
 * Exporta e importa todos os dados do CRM (leads, tarefas e
 * configurações) em um único arquivo JSON. Também permite
 * exportar a lista de leads em CSV. Tudo roda no navegador,
 * sem envio de dados para nenhum servidor.
 * ------------------------------------------------------------
 */
(function () {
  "use strict";

  const CHAVE_ULTIMO_BACKUP = "unilima_crm_ultimo_backup";
  const CHAVE_SNAPSHOT_AUTO = "unilima_crm_snapshot_pre_restauracao";
  const DIAS_AVISO_BACKUP_ANTIGO = 7;

  document.addEventListener("DOMContentLoaded", () => {
    const botaoExportarJson = document.getElementById("botao-exportar-json");
    const botaoExportarCsv = document.getElementById("botao-exportar-csv");
    const inputImportar = document.getElementById("input-importar-backup");
    const botaoImportar = document.getElementById("botao-importar-backup");
    const botaoRestaurarSnapshot = document.getElementById("botao-restaurar-snapshot");

    if (botaoExportarJson) botaoExportarJson.addEventListener("click", exportarJson);
    if (botaoExportarCsv) botaoExportarCsv.addEventListener("click", exportarCsv);
    if (botaoImportar && inputImportar) {
      botaoImportar.addEventListener("click", () => {
        const arquivo = inputImportar.files[0];
        if (!arquivo) {
          if (window.UnilimaUI) window.UnilimaUI.mostrarToast("Selecione um arquivo de backup (.json) antes de importar.");
          return;
        }
        lerArquivoEconfirmar(arquivo);
      });
    }
    if (botaoRestaurarSnapshot) botaoRestaurarSnapshot.addEventListener("click", restaurarSnapshotAutomatico);

    renderizarInfoBackupGlobal();
  });

  function dados() { return window.UnilimaDados; }

  function montarPacoteBackup() {
    const d = dados();
    return {
      tipo: "backup-unilima-crm",
      versao: 2,
      geradoEm: new Date().toISOString(),
      leads: d ? d.lerLeads() : JSON.parse(localStorage.getItem("unilima_crm_leads") || "[]"),
      tarefas: d ? d.lerTarefas() : JSON.parse(localStorage.getItem("unilima_crm_tarefas") || "[]"),
      config: d ? d.lerConfigCrm() : JSON.parse(localStorage.getItem("unilima_crm_config") || "null"),
    };
  }

  function exportarJson() {
    const pacote = montarPacoteBackup();
    const conteudo = JSON.stringify(pacote, null, 2);
    baixarArquivo(conteudo, `backup-unilima-${carimboArquivo()}.json`, "application/json");
    registrarUltimoBackup();
    if (window.UnilimaUI) window.UnilimaUI.mostrarToast("Backup JSON exportado com sucesso.");
  }

  function exportarCsv() {
    const d = dados();
    const leads = d ? d.lerLeads() : JSON.parse(localStorage.getItem("unilima_crm_leads") || "[]");

    const colunas = [
      "nome", "whatsapp", "email", "cidade", "estado",
      "categoria", "curso", "origem", "etapa", "observacoes",
      "proximoRetorno", "perdidoMotivo", "criadoEm", "atualizadoEm",
    ];
    const cabecalho = colunas.join(";");
    const linhas = leads.map((l) => colunas.map((c) => csvEscape(l[c])).join(";"));
    const conteudo = "\uFEFF" + [cabecalho, ...linhas].join("\r\n");
    baixarArquivo(conteudo, `leads-unilima-${carimboArquivo()}.csv`, "text/csv;charset=utf-8;");
    if (window.UnilimaUI) window.UnilimaUI.mostrarToast("Lista de leads exportada em CSV.");
  }

  function csvEscape(valor) {
    if (valor === undefined || valor === null) return "";
    const texto = String(valor).replace(/"/g, '""');
    return `"${texto}"`;
  }

  function baixarArquivo(conteudo, nomeArquivo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function carimboArquivo() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function lerArquivoEconfirmar(arquivo) {
    const leitor = new FileReader();
    leitor.onload = () => {
      let pacote;
      try {
        pacote = JSON.parse(leitor.result);
      } catch (e) {
        if (window.UnilimaUI) window.UnilimaUI.mostrarToast("Arquivo inválido. Selecione um backup .json gerado pelo próprio CRM.");
        return;
      }

      if (!pacote || !Array.isArray(pacote.leads) || !Array.isArray(pacote.tarefas)) {
        if (window.UnilimaUI) window.UnilimaUI.mostrarToast("Este arquivo não parece ser um backup válido do CRM da UNILIMA.");
        return;
      }

      const mensagem = `Este arquivo contém <strong>${pacote.leads.length} leads</strong> e <strong>${pacote.tarefas.length} tarefas</strong>. ` +
        `Antes de continuar, uma cópia de segurança automática dos dados atuais deste navegador será salva localmente. ` +
        `Depois disso, todos os dados atuais do CRM serão <strong>substituídos</strong> pelos dados do backup. Essa ação não pode ser desfeita (exceto restaurando a cópia de segurança automática, se necessário).`;

      if (window.UnilimaUI) {
        window.UnilimaUI.abrirConfirmacao("Restaurar backup", mensagem, () => aplicarBackup(pacote));
      } else if (window.confirm(mensagem.replace(/<[^>]+>/g, ""))) {
        aplicarBackup(pacote);
      }
    };
    leitor.readAsText(arquivo, "UTF-8");
  }

  function criarSnapshotAutomatico() {
    const atual = montarPacoteBackup();
    atual.motivo = "Cópia de segurança automática criada antes de uma restauração.";
    atual.criadoEm = new Date().toISOString();
    try {
      localStorage.setItem(CHAVE_SNAPSHOT_AUTO, JSON.stringify(atual));
    } catch (e) { /* localStorage cheio — segue sem travar a restauração */ }
  }

  function aplicarBackup(pacote) {
    criarSnapshotAutomatico();

    const d = dados();
    if (d) {
      d.salvarLeads(pacote.leads);
      d.salvarTarefas(pacote.tarefas);
      if (pacote.config && Array.isArray(pacote.config.categorias)) d.salvarConfigCrm(pacote.config);
    } else {
      localStorage.setItem("unilima_crm_leads", JSON.stringify(pacote.leads));
      localStorage.setItem("unilima_crm_tarefas", JSON.stringify(pacote.tarefas));
    }

    if (window.UnilimaUI) {
      window.UnilimaUI.mostrarToast("Backup restaurado com sucesso. Uma cópia dos dados anteriores foi salva neste navegador.");
      window.UnilimaUI.renderizarTudo();
    } else {
      window.location.reload();
    }
    renderizarInfoBackupGlobal();
  }

  function restaurarSnapshotAutomatico() {
    const bruto = localStorage.getItem(CHAVE_SNAPSHOT_AUTO);
    if (!bruto) {
      if (window.UnilimaUI) window.UnilimaUI.mostrarToast("Não há nenhuma cópia de segurança automática salva neste navegador.");
      return;
    }
    let snapshot;
    try { snapshot = JSON.parse(bruto); } catch (e) { return; }

    const mensagem = `Isso vai restaurar os dados como estavam antes da última importação de backup (salvos em ${new Date(snapshot.criadoEm).toLocaleString("pt-BR")}), substituindo os dados atuais. Deseja continuar?`;

    if (window.UnilimaUI) {
      window.UnilimaUI.abrirConfirmacao("Restaurar cópia de segurança automática", mensagem, () => {
        const d = dados();
        if (d) {
          d.salvarLeads(snapshot.leads || []);
          d.salvarTarefas(snapshot.tarefas || []);
          if (snapshot.config) d.salvarConfigCrm(snapshot.config);
        }
        if (window.UnilimaUI) {
          window.UnilimaUI.mostrarToast("Cópia de segurança automática restaurada.");
          window.UnilimaUI.renderizarTudo();
        }
      });
    }
  }

  function registrarUltimoBackup() {
    localStorage.setItem(CHAVE_ULTIMO_BACKUP, new Date().toISOString());
    renderizarInfoBackupGlobal();
  }

  function renderizarInfoBackupGlobal() {
    const el = document.getElementById("info-ultimo-backup");
    const avisoAntigo = document.getElementById("aviso-backup-antigo");
    const botaoRestaurarSnapshot = document.getElementById("botao-restaurar-snapshot");

    const temSnapshot = !!localStorage.getItem(CHAVE_SNAPSHOT_AUTO);
    if (botaoRestaurarSnapshot) botaoRestaurarSnapshot.hidden = !temSnapshot;

    if (!el) return;
    const ultimo = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
    if (!ultimo) {
      el.textContent = "Último backup: nenhum backup realizado";
      if (avisoAntigo) avisoAntigo.hidden = true;
      return;
    }
    const data = new Date(ultimo);
    el.textContent = "Último backup: " + data.toLocaleString("pt-BR");

    if (avisoAntigo) {
      const dias = (Date.now() - data.getTime()) / (1000 * 60 * 60 * 24);
      avisoAntigo.hidden = dias < DIAS_AVISO_BACKUP_ANTIGO;
    }
  }

  window.UnilimaBackup = { exportarJson, exportarCsv, renderizarInfoBackupGlobal };
})();
