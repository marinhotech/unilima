# UNILIMA — Site institucional + CRM (100% GitHub Pages)

Este projeto roda inteiramente com arquivos estáticos: HTML5, CSS3 e JavaScript puro, sem servidor, sem banco de dados online, sem processo de build e sem dependências para instalar. Funciona assim que os arquivos forem publicados no GitHub Pages.

---

## 0. O que mudou nesta revisão

Esta é uma **revisão** do projeto anterior, feita sobre a estrutura já existente (não foi reconstruído do zero). Resumo do que foi alterado:

**Posicionamento institucional**
- O site não apresenta mais a UNILIMA como faculdade/escola. Ela agora é descrita como marca de consultoria educacional conduzida por Márcia Helena de Lima, que atua por meio de instituições de ensino parceiras.
- Foram removidas as estatísticas não comprovadas que existiam antes ("+20 anos", "+5.000 alunos", "98% de satisfação"). Nenhum número foi inventado para substituí-las.
- Nova navegação pública: Início, Sobre a UNILIMA, Formações, Instituições Parceiras, FAQ, Contato.
- Nova seção "Formações" com as 4 categorias documentadas (Pós-graduação, Técnico por Competência, Técnico Regular, EJA), sem valores, duração, credenciamento ou prazos inventados.
- Nova seção "Instituições parceiras" com os nomes documentados (Faculdade Marinho, Faculdade Iguaçu), sem logos fictícias.
- Diferenciais reescritos para soarem como consultoria educacional, não como faculdade.
- Paleta de cores atualizada para a nova identidade (azul #2648B0, azul-hover #1B3585, azul-marinho #1B2A4A, cinza #64748B), fonte Inter, gradientes pesados removidos.

**CRM**
- Navegação simplificada: Dashboard, Pipeline, Leads, Agenda e Tarefas, Configurações.
- Novo **Pipeline** (quadro Kanban) com as etapas Novo Lead → Em Atendimento → Negociação → Convertido / Perdido. A etapa pode ser alterada arrastando o card (desktop) ou pelo seletor de etapa (funciona em qualquer dispositivo, inclusive celular).
- Cada lead agora tem uma **ficha completa** com dados de contato, interesse, etapa, próximo retorno, observações, tarefas relacionadas e um **histórico cronológico automático** (timeline) que registra criação, mudanças de etapa, observações, retornos agendados/reagendados/concluídos, tarefas criadas/concluídas, conversão e perda.
- Ao mover um lead para "Convertido", é possível (opcionalmente) registrar curso, categoria, instituição parceira e data da matrícula — sem criar um módulo financeiro ou de "Alunos".
- Ao marcar um lead como "Perdido", é possível (opcionalmente) informar um motivo.
- "Agenda e Tarefas" unifica tarefas e os retornos agendados nos leads em uma única lista, com abas Hoje / Próximos / Atrasados / Concluídos. O campo "Próximo retorno" do lead não precisa ser cadastrado de novo como tarefa — ele aparece automaticamente na Agenda.
- Nova tela de **Configurações** com sub-abas: Cursos e serviços (ativar/desativar categorias nos novos cadastros, sem apagar leads antigos), Dados da consultora (uso interno), Senha de acesso, Backup e segurança.
- Backup: antes de importar/restaurar um arquivo, o CRM agora cria automaticamente uma cópia de segurança dos dados atuais neste navegador, que pode ser restaurada a qualquer momento em Configurações → Backup e segurança.
- **Migração automática**: se você já tinha leads cadastrados na versão anterior do CRM (campo antigo "situação"), eles são convertidos automaticamente para a nova estrutura de etapas na primeira vez que o CRM for aberto. Nenhum dado é apagado nesse processo.

Nada do que já funcionava foi descartado por preferência de implementação: o sistema de login local (hash via Web Crypto API), o mecanismo de backup/restauração, a exportação CSV e a arquitetura 100% estática foram todos preservados e apenas ampliados.

---

## 1. O que está incluído

- `index.html` — site público da UNILIMA (Início, Sobre, Formações, Instituições parceiras, FAQ, Contato).
- `login.html` — tela de acesso ao CRM (protege o CRM de abertura acidental).
- `crm.html` — CRM interno (Dashboard, Pipeline, Leads, Agenda e Tarefas, Configurações).
- `assets/css/` — estilos do site e do CRM.
- `assets/js/`
  - `config.js` — dados públicos do site (contato, textos, formações, instituições parceiras, FAQ). **Principal arquivo a editar.**
  - `site.js` — lógica do site público.
  - `auth.js` — proteção local de acesso ao CRM (hash de senha via Web Crypto API).
  - `crm.js` — lógica do CRM: dados, migração, Pipeline, leads, agenda, configurações.
  - `backup.js` — exportação/importação de backup, CSV e cópia de segurança automática.
- `assets/img/` — logotipo oficial da UNILIMA (preservado, não redesenhado) e ícones gerados a partir dele.
- `.nojekyll` — garante que o GitHub Pages publique o projeto sem processamento adicional.

---

## 2. Como publicar no GitHub Pages

### Passo 1 — Criar um repositório no GitHub
1. Acesse [github.com](https://github.com) e faça login.
2. Clique em **New repository**.
3. Dê um nome (ex: `unilima-site`), deixe **Public** e clique em **Create repository**.

### Passo 2 — Enviar os arquivos
1. Descompacte o ZIP deste projeto.
2. No repositório, use **Add file → Upload files**.
3. Envie **todos** os arquivos e pastas (mantendo a estrutura, incluindo `assets/`).
4. Clique em **Commit changes**.

> Pelo terminal, os comandos são:
> ```
> git init
> git add .
> git commit -m "Revisão UNILIMA"
> git branch -M main
> git remote add origin https://github.com/SEU-USUARIO/unilima-site.git
> git push -u origin main
> ```

### Passo 3 — Ativar o GitHub Pages
1. No repositório, vá em **Settings → Pages**.
2. Em **Branch**, selecione `main` e `/ (root)`. Clique em **Save**.
3. Aguarde e atualize a página — o GitHub mostrará o endereço público:
   `https://SEU-USUARIO.github.io/unilima-site/`

### Passo 4 — Conferir
- Acesse o endereço publicado e confirme que a página inicial carrega.
- Clique em "Acessar CRM" para testar a tela de login.

---

## 3. Placeholders que ainda precisam ser preenchidos

Em `assets/js/config.js`, dentro do objeto `contato`:

| Campo | Status |
|---|---|
| `whatsapp` | `PREENCHER_NUMERO_WHATSAPP` — necessário para os botões de WhatsApp funcionarem |
| `telefoneExibicao` | `PREENCHER_TELEFONE` |
| `email` | `PREENCHER_EMAIL` |
| `instagram` | `PREENCHER_INSTAGRAM` |
| `endereco.linha1` / `linha2` | `PREENCHER_ENDERECO` / `PREENCHER_CIDADE - PREENCHER_UF` (opcional — a linha some do site enquanto não for preenchida) |
| `horarioAtendimento` | `PREENCHER_HORARIO_DE_ATENDIMENTO` (opcional — some do site enquanto não for preenchido) |

Enquanto esses campos estiverem com "PREENCHER", o site **esconde automaticamente** as linhas correspondentes na seção de contato e no rodapé (não mostra dado falso ao visitante). O botão de WhatsApp só funciona de verdade depois que `whatsapp` for preenchido com o número real.

Nenhuma estatística, duração de curso, valor, credenciamento ou nome de instituição adicional foi inventado — apenas o que estava documentado no pedido foi incluído.

---

## 4. Como alterar as informações públicas em `config.js`

Abra `assets/js/config.js` em qualquer editor de texto:

- **Contato:** edite o objeto `contato` (whatsapp, telefone, e-mail, Instagram, endereço, horário).
- **Textos institucionais:** edite `textos` (título do hero, texto "Sobre a UNILIMA", etc.).
- **Diferenciais:** edite a lista `diferenciais`.
- **Formações:** edite a lista `formacoes` — cada item tem `nome` e `descricao`. Não adicione valores, duração ou credenciamento sem confirmação oficial.
- **Instituições parceiras:** edite `instituicoesParceiras` (lista de nomes).
- **FAQ:** edite a lista `faq`.

Salve o arquivo e envie a alteração ao GitHub. O site atualiza em poucos minutos.

---

## 5. Como acessar o CRM

1. Clique em "Acessar CRM" no site, ou acesse `login.html` diretamente.
2. **Primeiro acesso:** crie uma senha (mínimo 6 caracteres). Ela fica salva apenas neste navegador, como hash (nunca em texto puro).
3. Nos acessos seguintes, digite a senha criada.
4. Esqueceu a senha? Use "Esqueci minha senha / redefinir acesso" na tela de login — isso apaga **apenas a senha** (leads e tarefas continuam salvos) e permite criar uma nova.

⚠️ Essa proteção é **apenas local** (JavaScript + Web Crypto API no navegador). Não é autenticação de servidor.

---

## 6. Como ativar/desativar categorias (cursos e serviços) dentro do CRM

1. No CRM, vá em **Configurações → Cursos e serviços**.
2. Use o interruptor ao lado de cada categoria para ativar ou desativar.
3. Categorias **inativas** deixam de aparecer como opção em **novos** cadastros de lead (no CRM) — mas:
   - leads antigos que já usavam aquela categoria **não são apagados nem alterados**;
   - essa configuração é **local do CRM** e **não altera** o site público. O site público continua sendo editado em `assets/js/config.js` (seção 4 acima).

---

## 7. Como usar o Pipeline

- Cada lead aparece como um card na coluna correspondente à sua etapa atual.
- Para mudar de etapa: **arraste o card** para outra coluna (funciona melhor no computador), **ou** use o seletor de etapa no rodapé do card / dentro da ficha do lead (funciona em qualquer dispositivo, incluindo celular).
- Ao mover um lead para "Convertido", uma janela opcional permite registrar os detalhes da matrícula (curso, categoria, instituição parceira, data).
- Ao mover um lead para "Perdido", uma janela opcional permite informar o motivo.
- Nenhum lead é apagado ao mudar de etapa — o histórico completo é sempre preservado.

---

## 8. Como fazer backup dos dados do CRM

1. Vá em **Configurações → Backup e segurança**.
2. Clique em **Exportar backup (.json)** — baixa um arquivo com leads, tarefas e configurações do CRM.
3. Guarde esse arquivo em um local seguro (pen drive, nuvem pessoal, e-mail para você mesma).
4. Faça isso regularmente — é a única forma de não perder dados se o navegador for limpo.

## 9. Como restaurar um backup

1. Em **Configurações → Backup e segurança**, selecione o arquivo `.json` em "Importar backup".
2. Clique em **Importar backup**.
3. Confirme a substituição. **Antes de substituir, o CRM salva automaticamente uma cópia dos dados atuais** neste navegador.
4. Se precisar desfazer, use o botão **"Restaurar cópia de segurança automática"** que aparece logo abaixo, na mesma tela.

## 10. Como exportar os contatos em CSV

Em **Configurações → Backup e segurança**, clique em **Exportar leads (.csv)**. Abra no Excel ou Google Planilhas.

---

## 11. Limitações da arquitetura (leia com atenção)

- Os dados do CRM ficam **somente neste navegador** (`localStorage`). Não são sincronizados automaticamente entre computadores ou navegadores diferentes.
- **Limpar os dados de navegação do navegador pode apagar o CRM inteiro.** Faça backups regularmente.
- O formulário do site público **não cadastra leads automaticamente no CRM** — ele apenas monta uma mensagem e abre o WhatsApp (ou e-mail). Quem atende deve cadastrar manualmente o lead no CRM, no Pipeline ou em Leads.
- O login do CRM é uma **proteção local**, não um sistema de autenticação com servidor.
- O projeto foi pensado para uso **individual, por uma pessoa, em um computador/navegador por vez**.
- A ativação/desativação de categorias em Configurações é local do CRM e não altera o site público.

---

Projeto entregue pronto para publicação: sem `node_modules`, sem framework, sem banco de dados, sem configuração de hospedagem paga e sem dependência de serviços externos.
