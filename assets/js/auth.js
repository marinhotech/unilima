/**
 * UNILIMA — Autenticação local do CRM
 * ------------------------------------------------------------
 * Proteção apenas local: impede que o CRM seja aberto por engano.
 * NÃO é um sistema de autenticação com servidor. Qualquer pessoa
 * com acesso ao navegador e a este código pode, em teoria,
 * apagar os dados salvos. Use isso apenas como uma trava simples,
 * não como segurança de nível corporativo.
 * ------------------------------------------------------------
 */
const UnilimaAuth = (function () {
  "use strict";

  const CHAVE_AUTH = "unilima_crm_auth";
  const CHAVE_SESSAO = "unilima_crm_sessao";

  function possuiSenhaCadastrada() {
    return !!localStorage.getItem(CHAVE_AUTH);
  }

  function gerarSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function gerarHash(senha, salt) {
    const encoder = new TextEncoder();
    const dados = encoder.encode(salt + ":" + senha);
    const buffer = await crypto.subtle.digest("SHA-256", dados);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function cadastrarSenha(senha) {
    const salt = gerarSalt();
    const hash = await gerarHash(senha, salt);
    const registro = { salt, hash, criadoEm: new Date().toISOString() };
    localStorage.setItem(CHAVE_AUTH, JSON.stringify(registro));
    return true;
  }

  async function verificarSenha(senha) {
    const bruto = localStorage.getItem(CHAVE_AUTH);
    if (!bruto) return false;
    const { salt, hash } = JSON.parse(bruto);
    const tentativa = await gerarHash(senha, salt);
    return tentativa === hash;
  }

  async function alterarSenha(senhaAtual, novaSenha) {
    const ok = await verificarSenha(senhaAtual);
    if (!ok) return false;
    await cadastrarSenha(novaSenha);
    return true;
  }

  function abrirSessao() {
    sessionStorage.setItem(CHAVE_SESSAO, "1");
  }

  function sessaoAtiva() {
    return sessionStorage.getItem(CHAVE_SESSAO) === "1";
  }

  function encerrarSessao() {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }

  function exigirSessaoOuRedirecionar(caminhoLogin) {
    if (!sessaoAtiva()) {
      window.location.href = caminhoLogin || "login.html";
    }
  }

  function limparCadastroSenha() {
    localStorage.removeItem(CHAVE_AUTH);
    encerrarSessao();
  }

  return {
    possuiSenhaCadastrada,
    cadastrarSenha,
    verificarSenha,
    alterarSenha,
    abrirSessao,
    sessaoAtiva,
    encerrarSessao,
    exigirSessaoOuRedirecionar,
    limparCadastroSenha,
  };
})();
