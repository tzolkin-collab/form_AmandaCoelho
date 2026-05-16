export const diagnosticData = {
  intro: {
    title: "Diagnóstico Do Contrato ao Contato",
    subtitle: "Descubra onde sua venda trava hoje e qual deve ser seu próximo movimento",
    paragraphs: [
      "Venda não começa só quando o cliente pergunta preço. Venda começa no contato, na escuta, na intenção, na condução e na continuidade da relação.",
      "Esse diagnóstico rápido vai te ajudar a entender onde sua venda mais trava hoje e qual deve ser seu próximo foco para vender com mais clareza, segurança e resultado.",
      "Responda com sinceridade. Não existe resposta bonita. Existe resposta útil."
    ]
  },
  questions: [
    { id: 1, text: "Qual seu nome?", type: "text" },
    { id: 2, text: "Qual seu WhatsApp?", type: "text" },
    { 
      id: 3, 
      text: "Hoje você trabalha com vendas em qual área?", 
      type: "radio", 
      options: [
        "Loja física", "Loja online", "Serviços", "Beleza", "Moda", 
        "Alimentos", "Representação comercial", "Atendimento ao cliente", "Negócio próprio", "Outro"
      ] 
    },
    { 
      id: 4, 
      text: "Hoje, qual frase mais parece com você?", 
      type: "radio", 
      options: [
        "Eu vendo quando o cliente me procura", 
        "Eu até abordo, mas tenho medo de parecer insistente", 
        "Eu converso bem, mas travo na hora de fechar", 
        "Eu vendo, mas não tenho constância", 
        "Eu tenho clientes, mas não sei gerar recompra", 
        "Eu vendo bem, mas quero ter mais método e previsibilidade"
      ] 
    },
    { 
      id: 5, 
      text: "Qual é sua maior dificuldade hoje na venda?", 
      type: "radio", 
      options: [
        "Abordar clientes novos", "Saber o que falar no primeiro contato", "Entender a real necessidade do cliente", 
        "Mostrar valor sem depender de desconto", "Responder objeções", "Fechar a venda", "Fazer pós-venda", 
        "Vender todos os dias com constância", "Organizar meus contatos e oportunidades"
      ] 
    },
    { 
      id: 6, 
      text: "Quando o cliente fala “vou pensar”, o que você costuma fazer?", 
      type: "radio", 
      options: [
        "Espero ele voltar sozinho", 
        "Mando uma mensagem depois, mas sem muita estratégia", 
        "Tento insistir um pouco, mas fico insegura", 
        "Faço perguntas para entender o que ficou em dúvida", 
        "Tenho um processo claro para retomar a conversa"
      ] 
    },
    { 
      id: 7, 
      text: "O que mais te faz perder venda hoje?", 
      type: "radio", 
      options: [
        "O cliente some depois do preço", "Eu demoro para responder ou acompanhar", 
        "Eu fico com vergonha de chamar de novo", "Eu não sei criar urgência sem pressionar", 
        "Eu explico muito, mas não conduzo para a decisão", "Eu não tenho uma oferta clara", 
        "Eu não sei manter relacionamento depois do atendimento"
      ] 
    },
    { 
      id: 8, 
      text: "Em uma escala de 1 a 5, quanto você sente que conduz a venda com intenção?", 
      type: "radio", 
      options: [
        "1 = quase nunca. Eu vou respondendo conforme o cliente fala", 
        "2 = poucas vezes", "3 = às vezes", "4 = muitas vezes", 
        "5 = quase sempre. Eu sei conduzir do contato ao fechamento"
      ] 
    },
    { 
      id: 9, 
      text: "Em uma escala de 1 a 5, quanto você se sente segura para falar de preço?", 
      type: "radio", 
      options: [
        "1 = tenho muita dificuldade", "2 = fico insegura", "3 = depende do cliente", 
        "4 = consigo falar bem", "5 = falo com segurança e mostro valor antes do preço"
      ] 
    },
    { 
      id: 10, 
      text: "Qual parte da venda você mais gostaria de dominar?", 
      type: "radio", 
      options: [
        "Abordagem", "WhatsApp comercial", "Apresentação do produto ou serviço", 
        "Quebra de objeções", "Fechamento", "Pós-venda", "Recompra", 
        "Organização da rotina comercial", "Relacionamento com cliente"
      ] 
    },
    { 
      id: 11, 
      text: "Se você pudesse resolver uma coisa nas suas vendas nos próximos 7 dias, o que seria?", 
      type: "textarea", 
      note: "Essa é uma das mais importantes. Aqui vai aparecer a dor com as palavras reais do público." 
    },
    { 
      id: 12, 
      text: "O que você sente que mais falta para vender melhor?", 
      type: "radio", 
      options: [
        "Confiança", "Técnica", "Método", "Coragem", "Disciplina", 
        "Organização", "Clareza na comunicação", "Acompanhamento", 
        "Exemplos práticos", "Roteiros prontos"
      ] 
    },
    { 
      id: 13, 
      text: "Que tipo de ajuda seria mais útil para você hoje?", 
      type: "radio", 
      options: [
        "Mensagens prontas para abordar clientes", "Roteiro de venda pelo WhatsApp", 
        "Passo a passo para fechar mais", "Aula prática sobre objeções", "Checklist de pós-venda", 
        "Plano de rotina comercial", "Desafio de vendas de poucos dias", "Mentoria em grupo", 
        "Treinamento com exemplos reais"
      ] 
    },
    { 
      id: 14, 
      text: "Qual formato você realmente conseguiria consumir e aplicar?", 
      type: "radio", 
      options: [
        "Aulas curtas gravadas", "Aula ao vivo com perguntas", "Material prático em PDF", 
        "Grupo no WhatsApp", "Áudios rápidos", "Desafio de 7 dias", "Planilha ou ferramenta pronta", 
        "Encontro presencial", "Mentoria com acompanhamento"
      ] 
    },
    { 
      id: 15, 
      text: "Você aceita receber seu resultado e materiais complementares pelo WhatsApp?", 
      type: "radio", 
      options: ["Sim", "Não"] 
    }
  ],
  profiles: [
    {
      id: "automatico",
      name: "Vendedor no Automático",
      description: "Você está em uma fase em que a venda ainda acontece muito por demanda. Ou seja, você vende quando o cliente chama, quando aparece uma oportunidade ou quando alguém já demonstra interesse. Isso não significa que você não sabe vender. Significa que hoje sua venda ainda depende muito mais do movimento do cliente do que da sua condução.\n\nO grande risco desse perfil é ficar preso no modo “me chama se precisar”. E a verdade é que muita venda se perde exatamente aí. Porque cliente ocupado esquece. Cliente inseguro adia. Cliente com dúvida some. Cliente sem condução não decide.\n\nNa lógica da Amanda, venda é relacionamento puro e intencional. E intenção não é pressão. Intenção é saber o que fazer depois do primeiro contato.",
      focus: "Seu foco principal é sair da venda passiva e começar a criar movimento comercial. Você precisa desenvolver abordagem, rotina de contato e segurança para chamar o cliente sem sentir que está incomodando.",
      actions: [
        { title: "Crie uma lista de 20 contatos quentes.", desc: "Clientes antigos, pessoas que já perguntaram preço, pessoas que demonstraram interesse, clientes que compraram uma vez e nunca mais voltaram." },
        { title: "Envie uma mensagem simples de retomada.", desc: "Exemplo: “Oi, tudo bem? Lembrei de você porque estou organizando alguns atendimentos essa semana e pensei que talvez isso fizesse sentido pra você. Posso te mandar?”" },
        { title: "Pare de encerrar conversa com “qualquer coisa me chama”.", desc: "Troque por uma próxima ação clara. Exemplo: “Vou te mandar duas opções e você me fala qual faz mais sentido pra sua rotina.”" },
        { title: "Tenha uma meta pequena de contato diário.", desc: "Não precisa começar com 50 pessoas. Comece com 5 contatos por dia. Venda é oxigênio de todo negócio, mas oxigênio precisa circular." },
        { title: "Depois de toda conversa, defina o próximo passo.", desc: "Pode ser enviar uma foto, mandar uma condição, tirar uma dúvida, agendar um retorno ou chamar novamente no dia seguinte." }
      ],
      phrase: "Você não precisa esperar o cliente chegar pronto. Você precisa aprender a conduzir o contato até ele enxergar valor.",
      indicators: [
        "Eu vendo quando o cliente me procura",
        "Tenho dificuldade de abordar",
        "Tenho medo de parecer insistente",
        "Espero o cliente voltar sozinho",
        "Não tenho rotina comercial",
        "Tenho dificuldade de vender todos os dias"
      ],
      pain: "falta de ação comercial ativa.",
      productSuggestion: "desafio prático de abordagem, mensagens prontas, rotina de vendas de 7 dias, WhatsApp comercial."
    },
    {
      id: "relacao",
      name: "Vendedor de Relação",
      description: "Você tem uma força muito importante: sabe criar vínculo. Provavelmente conversa bem, atende com cuidado, gera simpatia e faz o cliente se sentir acolhido. Isso é uma potência enorme, porque venda nasce de confiança.\n\nMas o ponto de atenção é que relacionamento sem condução pode virar conversa que não fecha. Você cria conexão, mas talvez trave na hora de apresentar a oferta, falar o preço, responder objeção ou chamar o cliente para a decisão.\n\nEsse perfil costuma perder venda não por falta de atendimento, mas por excesso de cuidado sem direção. A pessoa explica, conversa, acolhe, responde… mas não conduz.\n\nNa lógica da Amanda: tudo que rela é relacionamento. Já relou hoje? Mas relacionamento precisa de intenção para virar resultado.",
      focus: "Seu foco principal é transformar confiança em decisão. Você precisa desenvolver clareza de oferta, condução de conversa e fechamento sem culpa.",
      actions: [
        { title: "Antes de oferecer, faça pelo menos 2 perguntas.", desc: "Exemplos: “O que você está buscando hoje?” “Você quer algo mais prático ou mais completo?” “Qual sua maior dificuldade com isso agora?”" },
        { title: "Apresente a oferta conectada à dor do cliente.", desc: "Não fale só características. Fale o motivo. Exemplo: “Pelo que você me contou, essa opção faz mais sentido porque resolve exatamente essa dificuldade que você comentou.”" },
        { title: "Troque explicação longa por direção clara.", desc: "Em vez de explicar tudo de uma vez, conduza. Exemplo: “Tenho duas opções pra você. Uma mais simples e uma mais completa. Vou te mostrar as duas e te digo qual eu escolheria no seu caso.”" },
        { title: "Treine uma frase de fechamento leve.", desc: "Exemplo: “Faz sentido pra você seguir com essa opção?” ou “Quer que eu já deixe isso separado pra você?”" },
        { title: "Faça pós-venda com intenção.", desc: "Depois da compra, mande uma mensagem perguntando se deu tudo certo. Isso abre porta para recompra, indicação e relacionamento real." }
      ],
      phrase: "Você já sabe criar contato. Agora precisa aprender a transformar esse contato em contrato com mais segurança.",
      indicators: [
        "Converso bem, mas travo na hora de fechar",
        "Tenho dificuldade de mostrar valor",
        "O cliente pergunta preço e some",
        "Tenho dificuldade de responder objeções",
        "Fico insegura para falar de preço",
        "Quero aprender fechamento"
      ],
      pain: "transformar conversa em venda.",
      productSuggestion: "roteiro de fechamento, aula de objeções, treinamento de oferta, método de condução comercial."
    },
    {
      id: "jogo",
      name: "Vendedor de Jogo",
      description: "Você já entende que venda não é sorte. Venda tem movimento, leitura, relação, estratégia e continuidade. Você provavelmente já consegue conduzir melhor o cliente, entende a importância de acompanhar oportunidades e sabe que vender não termina no pagamento.\n\nEsse é um perfil com mais maturidade comercial. Mas aqui mora um risco: achar que vender bem em alguns dias significa ter processo. Resultado pontual não é previsibilidade. Para crescer de verdade, você precisa transformar sua venda em método.\n\nNa lógica da Amanda: corpo quente, mente fria. Venda exige energia, presença e relação, mas também exige leitura, estratégia e acompanhamento.",
      focus: "Seu foco principal é criar consistência e previsibilidade. Você precisa acompanhar seus números, organizar sua carteira de clientes, melhorar recompra e transformar boas práticas em rotina.",
      actions: [
        { title: "Separe seus clientes em 3 grupos.", desc: "Clientes que compraram recentemente. Clientes antigos que sumiram. Pessoas interessadas que ainda não compraram." },
        { title: "Crie uma ação para cada grupo.", desc: "Para quem comprou recentemente: pós-venda. Para quem sumiu: retomada. Para quem demonstrou interesse: condução para decisão." },
        { title: "Acompanhe 3 números simples.", desc: "Quantas pessoas você chamou. Quantas responderam. Quantas compraram." },
        { title: "Crie um roteiro de follow-up.", desc: "Não dependa da memória. Defina quando chamar de novo, o que falar e qual próximo passo oferecer." },
        { title: "Transforme venda em ciclo.", desc: "Contato, escuta, oferta, fechamento, pós-venda, recompra e indicação. Esse é o jogo. E quem entende o jogo para de depender só do movimento do dia." }
      ],
      phrase: "Você já joga melhor que a média. Agora precisa parar de vender só com talento e começar a vender com método.",
      indicators: [
        "Vendo, mas não tenho constância",
        "Quero mais método e previsibilidade",
        "Quero organizar minha rotina comercial",
        "Quero gerar recompra",
        "Quero melhorar performance",
        "Preciso de acompanhamento"
      ],
      pain: "consistência, processo e escala.",
      productSuggestion: "mentoria em grupo, treinamento mais completo, imersão, acompanhamento comercial, método de vendas para equipe."
    }
  ],
  conclusion: {
    title: "Seu resultado chegou.",
    template: "Com base nas suas respostas, seu perfil comercial hoje é: {nome do perfil}.",
    message: "Esse resultado não é uma caixinha fixa. É um retrato do seu momento atual na venda. Ele mostra onde você tende a travar, qual habilidade precisa desenvolver agora e quais ações práticas podem te ajudar a sair do automático.\n\nVenda é relacionamento puro e intencional. E quanto mais consciência você tem sobre seu jeito de vender, mais clareza você ganha para conduzir melhor cada contato.",
    cta: "Nos próximos dias, vamos enviar alguns materiais práticos para te ajudar a evoluir nesse ponto específico da sua venda. Pode ser um roteiro de abordagem, um checklist de pós-venda, um guia de objeções ou um plano simples de rotina comercial.\n\nA ideia é te ajudar a aplicar o que você viu hoje na prática. Porque venda boa não termina na palestra. Ela começa no próximo contato."
  }
};
