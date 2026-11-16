// ===== CONFIGURAÇÃO — edite só aqui =====
window.CONFIG = {
  DR_NAME: '',                 // ex.: 'Dra. Dina Silva' (vazio = "a Doutora")
  OAB: '',                     // ex.: 'OAB/PI 12.345' — aparece no rodapé quando preenchido
  WHATSAPP: '558681207124',    // número da Doutora (DDI+DDD+número, só dígitos)
  META_PIXEL_ID: '',           // ID do Pixel da Meta (vazio = desativado)
  SUPABASE_URL: 'https://htinilgvvzrazwazgojt.supabase.co',
  SUPABASE_KEY: 'sb_publishable_DDdaUgLYaw5Fv3qMbvFBdQ_ArZ8HVuH', // chave pública (só permite inserir leads)
  TABLE: 'leads_auxilio_acidente'
};

// ===== PERGUNTAS =====
// flag: 'stop' = desqualifica (baixa) · 'soft' = qualificação média
window.QUESTIONS = [
  { id:'acidente', title:'Como aconteceu o seu acidente?', hint:'Escolha a opção mais próxima.',
    opts:[
      {e:'⚽',t:'Esporte ou lazer (futebol, academia…)',p:2},
      {e:'🏍️',t:'Trânsito (moto, carro, bicicleta, atropelamento)',p:2},
      {e:'🏠',t:'Queda em casa ou na rua',p:2},
      {e:'🏭',t:'No trabalho ou no caminho do trabalho',p:2},
      {e:'❓',t:'Outro tipo de acidente',p:1}],
    edu:'💡 <b>Sabia?</b> Para o auxílio-acidente o INSS <b>não analisa onde</b> o acidente aconteceu. Pode ter sido no futebol de domingo. O que conta é a <b>sequela</b>.' },
  { id:'corpo', title:'Qual parte do corpo foi afetada?', hint:'Pode marcar mais de uma.', multi:true,
    opts:[
      {e:'✋',t:'Mão, punho ou dedos',p:2},
      {e:'💪',t:'Braço, cotovelo ou ombro',p:2},
      {e:'🦵',t:'Perna, joelho ou quadril',p:2},
      {e:'🦶',t:'Pé ou tornozelo',p:2},
      {e:'🧍',t:'Coluna',p:2},
      {e:'👁️',t:'Visão, audição ou outra parte',p:1}] },
  { id:'sequela', title:'Hoje, o que ficou depois do acidente?', hint:'Marque tudo o que você sente.', multi:true,
    opts:[
      {e:'🤲',t:'Perdi força (não consigo segurar ou apertar como antes)',p:3},
      {e:'🔩',t:'Fiquei com placa, pino ou parafuso',p:3},
      {e:'🚫',t:'Não consigo dobrar, esticar ou movimentar direito',p:3},
      {e:'😣',t:'Dor que volta quando faço esforço',p:2},
      {e:'🚶',t:'Manco ou não consigo ficar muito tempo em pé',p:3},
      {e:'✨',t:'Nada, me recuperei 100%',p:0,flag:'stop',only:true}],
    edu:'💡 A <b>sequela permanente</b> é o ponto principal que o INSS analisa. Mesmo uma limitação "pequena" pode contar se atrapalha o seu trabalho.' },
  { id:'trabalho', title:'Essa limitação atrapalha o seu trabalho?',
    opts:[
      {e:'😓',t:'Sim, faço tudo com muito mais esforço e dor',p:3},
      {e:'🔄',t:'Sim, precisei mudar de função ou de profissão',p:3},
      {e:'🐢',t:'Sim, fiquei mais lento(a) do que antes',p:2},
      {e:'👍',t:'Não, trabalho igual a antes',p:0,flag:'stop'}] },
  { id:'vinculo', title:'Na época do acidente, como você trabalhava?',
    opts:[
      {e:'📘',t:'Carteira assinada (CLT)',p:3},
      {e:'🌾',t:'Trabalhador(a) rural / pescador(a)',p:3},
      {e:'🧹',t:'Empregada doméstica com carteira',p:3},
      {e:'📦',t:'Estava desempregado(a) há menos de 1 ano',p:2,flag:'soft'},
      {e:'🧾',t:'Autônomo(a) ou MEI',p:1,flag:'soft'},
      {e:'❌',t:'Nunca contribuí para o INSS',p:0,flag:'stop'}] },
  { id:'quando', title:'Quando foi o acidente?',
    opts:[
      {e:'📅',t:'Há menos de 1 ano',p:2},
      {e:'🗓️',t:'Entre 1 e 5 anos',p:3},
      {e:'⏳',t:'Há mais de 5 anos',p:2}],
    edu:'💡 Dependendo do caso, é possível pedir também os <b>valores atrasados</b> dos últimos 5 anos.' },
  { id:'beneficio', title:'Você já recebeu algum benefício do INSS por causa desse acidente?',
    opts:[
      {e:'⏹️',t:'Recebi auxílio-doença e ele foi cortado',p:3},
      {e:'⛔',t:'Pedi e foi negado',p:3},
      {e:'🙋',t:'Nunca pedi nada',p:2},
      {e:'✅',t:'Já recebo auxílio-acidente',p:0,flag:'stop'}] }
];
