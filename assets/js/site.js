/**
 * UNILIMA — Lógica do site público
 * Não depende de servidor, banco de dados ou processos de build.
 */
(function () {
  "use strict";

  const cfg = window.UNILIMA_CONFIG;

  document.addEventListener("DOMContentLoaded", () => {
    preencherTextos();
    montarDiferenciais();
    montarFormacoes();
    montarParceiras();
    montarFaq();
    montarContato();
    configurarMenuMobile();
    configurarWhatsappFlutuante();
    configurarFormulario();
    marcarAnoRodape();
  });

  function ehPlaceholder(valor) {
    return !valor || String(valor).trim() === "" || String(valor).toUpperCase().startsWith("PREENCHER");
  }

  function preencherTextos() {
    document.querySelectorAll("[data-cfg]").forEach((el) => {
      const caminho = el.getAttribute("data-cfg").split(".");
      let valor = cfg;
      for (const chave of caminho) valor = valor && valor[chave];
      if (valor !== undefined && valor !== null) el.textContent = valor;
    });

    document.querySelectorAll("[data-cfg-href]").forEach((el) => {
      const caminho = el.getAttribute("data-cfg-href").split(".");
      let valor = cfg;
      for (const chave of caminho) valor = valor && valor[chave];
      if (valor && !ehPlaceholder(valor)) el.setAttribute("href", valor);
    });

    const linkWhats = linkWhatsappGenerico();
    document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
      el.setAttribute("href", linkWhats);
    });
  }

  function linkWhatsappGenerico(mensagem) {
    const numero = (cfg.contato.whatsapp || "").replace(/\D/g, "");
    const texto = mensagem
      ? encodeURIComponent(mensagem)
      : encodeURIComponent(
          `Olá! Vim pelo site da ${cfg.instituicao.nome} e gostaria de mais informações.`
        );
    return `https://wa.me/${numero}?text=${texto}`;
  }

  function montarDiferenciais() {
    const grade = document.getElementById("grade-diferenciais");
    if (!grade) return;
    grade.innerHTML = cfg.diferenciais
      .map(
        (d, i) => `
      <div class="cartao-diferencial">
        <div class="marcador">${String(i + 1).padStart(2, "0")}</div>
        <h3>${escapeHtml(d.titulo)}</h3>
        <p>${escapeHtml(d.descricao)}</p>
      </div>`
      )
      .join("");
  }

  function montarFormacoes() {
    const grade = document.getElementById("grade-formacoes");
    const selectCurso = document.getElementById("campo-curso");
    if (!grade) return;
    grade.innerHTML = cfg.formacoes
      .map(
        (c) => `
      <div class="cartao-curso">
        <h3>${escapeHtml(c.nome)}</h3>
        <p>${escapeHtml(c.descricao)}</p>
        <a class="link-curso" href="${linkWhatsappGenerico(
          `Olá! Tenho interesse na formação "${c.nome}" da ${cfg.instituicao.nome}.`
        )}" target="_blank" rel="noopener">Tenho interesse</a>
      </div>`
      )
      .join("");

    if (selectCurso) {
      selectCurso.innerHTML =
        `<option value="">Selecione uma formação</option>` +
        cfg.formacoes.map((c) => `<option value="${escapeHtml(c.nome)}">${escapeHtml(c.nome)}</option>`).join("") +
        `<option value="Outro">Outro / ainda não sei</option>`;
    }
  }

  function montarParceiras() {
    const grade = document.getElementById("grade-parceiras");
    if (!grade) return;
    const lista = cfg.instituicoesParceiras || [];
    if (lista.length === 0) {
      grade.innerHTML = `<p class="painel-vazio">Nenhuma instituição parceira cadastrada ainda.</p>`;
      return;
    }
    grade.innerHTML = lista
      .map(
        (p) => `
      <div class="cartao-parceira">
        <span class="marcador-parceira">🎓</span>
        <h3>${escapeHtml(p.nome)}</h3>
      </div>`
      )
      .join("");
  }

  function montarFaq() {
    const lista = document.getElementById("lista-faq");
    if (!lista) return;
    lista.innerHTML = cfg.faq
      .map(
        (item, i) => `
      <div class="item-faq" data-aberto="false">
        <button class="pergunta-faq" type="button" aria-expanded="false" data-faq-index="${i}">
          <span>${escapeHtml(item.pergunta)}</span>
          <span class="sinal">+</span>
        </button>
        <div class="resposta-faq">
          <p>${escapeHtml(item.resposta)}</p>
        </div>
      </div>`
      )
      .join("");

    lista.querySelectorAll(".pergunta-faq").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".item-faq");
        const resposta = item.querySelector(".resposta-faq");
        const aberto = item.getAttribute("data-aberto") === "true";
        item.setAttribute("data-aberto", (!aberto).toString());
        btn.setAttribute("aria-expanded", (!aberto).toString());
        resposta.style.maxHeight = !aberto ? resposta.scrollHeight + "px" : "0px";
      });
    });
  }

  function montarContato() {
    const c = cfg.contato;

    const linhaEndereco = document.getElementById("linha-endereco");
    const enderecoEl = document.getElementById("contato-endereco");
    if (linhaEndereco && enderecoEl) {
      const l1 = c.endereco && c.endereco.linha1;
      const l2 = c.endereco && c.endereco.linha2;
      if (!ehPlaceholder(l1) || !ehPlaceholder(l2)) {
        enderecoEl.innerHTML = [l1, l2].filter((v) => v && !ehPlaceholder(v)).map(escapeHtml).join("<br>");
        linhaEndereco.hidden = false;
      }
    }

    const linhaHorario = document.getElementById("linha-horario");
    const horarioEl = document.getElementById("contato-horario");
    if (linhaHorario && horarioEl) {
      const horarios = (c.horarioAtendimento || []).filter((h) => !ehPlaceholder(h));
      if (horarios.length > 0) {
        horarioEl.innerHTML = horarios.map(escapeHtml).join("<br>");
        linhaHorario.hidden = false;
      }
    }

    // Telefone: se for placeholder, esconde a linha inteira (não some por padrão pois vem no HTML sem "hidden")
    const telEl = document.querySelector('[data-cfg="contato.telefoneExibicao"]');
    if (telEl && ehPlaceholder(c.telefoneExibicao)) {
      const linha = telEl.closest(".linha-contato");
      if (linha) linha.hidden = true;
    }
    document.querySelectorAll('[data-cfg="contato.email"]').forEach((el) => {
      if (ehPlaceholder(c.email)) {
        const linha = el.closest(".linha-contato");
        if (linha) linha.hidden = true;
      }
    });

    const rodapeTel = document.getElementById("rodape-telefone");
    if (rodapeTel && ehPlaceholder(c.telefoneExibicao)) rodapeTel.hidden = true;
    const rodapeEmail = document.getElementById("rodape-email");
    if (rodapeEmail && ehPlaceholder(c.email)) rodapeEmail.hidden = true;
    const rodapeInsta = document.getElementById("rodape-instagram");
    if (rodapeInsta && ehPlaceholder(c.instagram)) rodapeInsta.hidden = true;
  }

  function configurarMenuMobile() {
    const botao = document.getElementById("menu-toggle");
    const nav = document.getElementById("nav-principal");
    if (!botao || !nav) return;
    botao.addEventListener("click", () => {
      const aberto = nav.classList.toggle("aberto");
      botao.setAttribute("aria-expanded", aberto.toString());
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("aberto"))
    );
  }

  function configurarWhatsappFlutuante() {
    const botao = document.getElementById("whatsapp-flutuante");
    if (!botao) return;
    botao.setAttribute("href", linkWhatsappGenerico());
  }

  function configurarFormulario() {
    const form = document.getElementById("form-contato");
    if (!form) return;

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!validarFormulario(form)) return;

      const dados = {
        nome: form.nome.value.trim(),
        telefone: form.telefone.value.trim(),
        email: form.email.value.trim(),
        curso: form.curso.value.trim(),
        mensagem: form.mensagem.value.trim(),
      };

      const textoWhats =
        `Olá, ${cfg.instituicao.nome}! Vim pelo site e gostaria de mais informações.\n\n` +
        `*Nome:* ${dados.nome}\n` +
        `*WhatsApp:* ${dados.telefone}\n` +
        (dados.email ? `*E-mail:* ${dados.email}\n` : "") +
        `*Formação de interesse:* ${dados.curso || "Não informado"}\n` +
        `*Mensagem:* ${dados.mensagem || "Não informado"}`;

      const urlWhats = linkWhatsappGenerico(textoWhats);

      const assunto = encodeURIComponent(`Contato pelo site - ${dados.nome}`);
      const corpo = encodeURIComponent(
        `Nome: ${dados.nome}\nWhatsApp: ${dados.telefone}\nE-mail: ${dados.email || "Não informado"}\nFormação de interesse: ${dados.curso || "Não informado"}\n\nMensagem:\n${dados.mensagem || "Não informado"}`
      );
      const urlEmail = `mailto:${cfg.contato.email}?subject=${assunto}&body=${corpo}`;

      mostrarToast("Mensagem pronta! Abrindo o WhatsApp da UNILIMA…");
      window.open(urlWhats, "_blank", "noopener");

      const linkEmailAlt = document.getElementById("link-email-alternativo");
      if (linkEmailAlt && !ehPlaceholder(cfg.contato.email)) {
        linkEmailAlt.href = urlEmail;
        linkEmailAlt.hidden = false;
      }
    });
  }

  function validarFormulario(form) {
    let valido = true;
    const campos = [
      { nome: "nome", tipo: "texto", min: 3 },
      { nome: "telefone", tipo: "telefone" },
      { nome: "email", tipo: "email-opcional" },
    ];

    campos.forEach(({ nome, tipo, min }) => {
      const input = form[nome];
      if (!input) return;
      const campoWrap = input.closest(".campo");
      let ok = true;
      const val = input.value.trim();

      if (tipo === "texto") ok = val.length >= (min || 1);
      if (tipo === "telefone") ok = val.replace(/\D/g, "").length >= 10;
      if (tipo === "email-opcional") ok = val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

      campoWrap.classList.toggle("invalido", !ok);
      if (!ok) valido = false;
    });

    if (!valido) mostrarToast("Confira os campos destacados antes de enviar.");
    return valido;
  }

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
    toast._timeout = setTimeout(() => toast.classList.remove("visivel"), 3600);
  }

  function marcarAnoRodape() {
    const el = document.getElementById("ano-atual");
    if (el) el.textContent = new Date().getFullYear();
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
