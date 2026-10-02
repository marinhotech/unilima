/**
 * ============================================================
 * CONFIGURAÇÕES DA UNILIMA
 * ============================================================
 * Este é o ÚNICO arquivo que você normalmente precisa editar
 * para atualizar as informações públicas do site (WhatsApp,
 * telefone, e-mail, endereço, horários, textos e formações).
 *
 * O CRM tem sua própria tela de Configurações (dentro do CRM)
 * para ativar/desativar categorias nos NOVOS cadastros de lead.
 * Isso é apenas interno do CRM e NÃO altera este arquivo nem
 * o site público automaticamente.
 *
 * >>> CAMPOS MARCADOS COM "PREENCHER" PRECISAM SER SUBSTITUÍDOS <<<
 * ============================================================
 */

window.UNILIMA_CONFIG = {

  // ----------------------------------------------------------
  // IDENTIDADE
  // ----------------------------------------------------------
  instituicao: {
    nome: "UNILIMA",
    consultora: "Márcia Helena de Lima",
    slogan: "Educação que transforma vidas.",
  },

  // ----------------------------------------------------------
  // CONTATO
  // Substitua os valores abaixo pelos dados reais da UNILIMA.
  // ----------------------------------------------------------
  contato: {
    // Apenas números, com DDI e DDD. Exemplo: "5531999999999"
    whatsapp: "PREENCHER_NUMERO_WHATSAPP",

    // Número formatado para exibição. Exemplo: "(31) 99999-9999"
    telefoneExibicao: "PREENCHER_TELEFONE",

    email: "PREENCHER_EMAIL",

    instagram: "PREENCHER_INSTAGRAM",

    endereco: {
      linha1: "PREENCHER_ENDERECO (opcional)",
      linha2: "PREENCHER_CIDADE - PREENCHER_UF",
      mapsUrl: "",
    },

    horarioAtendimento: [
      "PREENCHER_HORARIO_DE_ATENDIMENTO",
    ],
  },

  // ----------------------------------------------------------
  // TEXTOS INSTITUCIONAIS
  // ----------------------------------------------------------
  textos: {
    heroTitulo: "Sua próxima conquista começa aqui",
    heroSubtitulo:
      "Encontre oportunidades de formação alinhadas aos seus objetivos profissionais, com orientação próxima em cada etapa.",
    heroCardTitulo: "Atendimento próximo e personalizado.",
    heroCardTexto:
      "Conte com orientação para encontrar a opção de formação mais adequada aos seus objetivos.",

    sobreTitulo: "Sobre a UNILIMA",
    sobreTexto:
      "A UNILIMA é uma marca de consultoria educacional conduzida por Márcia Helena de Lima, criada para aproximar pessoas de oportunidades de formação e desenvolvimento profissional. Por meio de parcerias com instituições de ensino, a UNILIMA atua na orientação e no atendimento de interessados em diferentes possibilidades de formação, acompanhando cada pessoa desde a escolha do curso até as etapas necessárias para sua matrícula.",

    diferenciaisTitulo: "Diferenciais da UNILIMA",

    formacoesTitulo: "Formações",
    formacoesSubtitulo:
      "Conheça as categorias de formação com as quais a UNILIMA trabalha atualmente, por meio de instituições de ensino parceiras.",

    parceirasTitulo: "Instituições parceiras",
    parceirasTexto:
      "A UNILIMA atua em parceria com instituições de ensino para ampliar as possibilidades de formação oferecidas aos seus clientes.",
  },

  // ----------------------------------------------------------
  // DIFERENCIAIS (cards da seção "Sobre a UNILIMA")
  // ----------------------------------------------------------
  diferenciais: [
    {
      titulo: "Atendimento personalizado",
      descricao: "Orientação próxima durante o processo de escolha.",
    },
    {
      titulo: "Diversas possibilidades de formação",
      descricao: "Opções entre Pós-graduação, Técnico por Competência, Técnico Regular e EJA.",
    },
    {
      titulo: "Parcerias educacionais",
      descricao: "Atuação em conjunto com instituições de ensino parceiras.",
    },
    {
      titulo: "Acompanhamento durante o atendimento",
      descricao: "Suporte e orientação durante as etapas necessárias para a matrícula.",
    },
  ],

  // ----------------------------------------------------------
  // FORMAÇÕES (categorias exibidas no site público)
  // Adicione, remova ou edite categorias livremente nesta lista.
  // Não inclua valores, duração, credenciamento ou promessas —
  // essas informações não foram documentadas e não devem ser
  // inventadas.
  // ----------------------------------------------------------
  formacoes: [
    {
      id: "pos-graduacao",
      nome: "Pós-graduação",
      descricao: "Opções de continuidade e aprofundamento profissional por meio de instituições parceiras.",
    },
    {
      id: "tecnico-competencia",
      nome: "Técnico por Competência",
      descricao: "Formação técnica com aproveitamento da experiência profissional já adquirida.",
    },
    {
      id: "tecnico-regular",
      nome: "Técnico Regular",
      descricao: "Formação técnica nos moldes regulares, oferecida por instituições parceiras.",
    },
    {
      id: "eja",
      nome: "EJA",
      descricao: "Educação de Jovens e Adultos, para quem deseja retomar ou concluir os estudos.",
    },
  ],

  // ----------------------------------------------------------
  // INSTITUIÇÕES PARCEIRAS
  // Nomes documentados até o momento. Não invente novas
  // instituições nem logotipos.
  // ----------------------------------------------------------
  instituicoesParceiras: [
    { nome: "Faculdade Marinho" },
    { nome: "Faculdade Iguaçu" },
  ],

  // ----------------------------------------------------------
  // PERGUNTAS FREQUENTES
  // ----------------------------------------------------------
  faq: [
    {
      pergunta: "O que é a UNILIMA?",
      resposta:
        "A UNILIMA é uma marca de consultoria educacional conduzida por Márcia Helena de Lima. Ela aproxima pessoas de oportunidades de formação por meio de instituições de ensino parceiras, oferecendo orientação durante todo o atendimento.",
    },
    {
      pergunta: "Quais opções de formação posso encontrar?",
      resposta:
        "A UNILIMA trabalha atualmente com quatro categorias: Pós-graduação, Técnico por Competência, Técnico Regular e EJA, sempre por meio de instituições de ensino parceiras.",
    },
    {
      pergunta: "Como posso saber qual opção é adequada para mim?",
      resposta:
        "Entre em contato pelo WhatsApp ou pelo formulário desta página. A UNILIMA oferece orientação próxima para te ajudar a entender qual formação faz mais sentido para os seus objetivos.",
    },
    {
      pergunta: "Como entro em contato?",
      resposta:
        "Você pode usar o botão do WhatsApp presente nesta página, preencher o formulário de contato ou usar os demais canais informados no rodapé.",
    },
  ],
};
