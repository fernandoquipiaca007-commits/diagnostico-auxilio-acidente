(function () {
  const C = window.CONFIG, Q = window.QUESTIONS;
  const $ = (id) => document.getElementById(id);
  const dr = C.DR_NAME || 'a Doutora';
  const answers = {}; let i = 0, lead = null, busy = false;

  // Cabeçalho
  $('drName').textContent = C.DR_NAME || 'Diagnóstico Auxílio-Acidente';
  $('initial').textContent = (C.DR_NAME.replace(/^Dra?\.?\s*/i, '')[0] || '⚖').toUpperCase();
  if (C.OAB) $('rDisc').textContent += ' ' + (C.DR_NAME ? C.DR_NAME + ' · ' : '') + C.OAB;

  // UTM / origem
  const sp = new URLSearchParams(location.search), utm = {};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].forEach(k => sp.get(k) && (utm[k] = sp.get(k)));

  // Meta Pixel (opcional)
  function fbq() { window.fbq && window.fbq.apply(null, arguments); }
  if (C.META_PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('set', 'autoConfig', false, C.META_PIXEL_ID); // sem "SubscribedButtonClick" automático
    fbq('init', C.META_PIXEL_ID); fbq('track', 'PageView');
  }

  // API de Conversões (servidor) — mesmo event_id do Pixel para desduplicar
  const testCode = sp.get('test_event_code') || '';
  const cookie = (n) => (document.cookie.match('(^|; )' + n + '=([^;]*)') || [])[2] || '';
  function fbc() {
    const c = cookie('_fbc'); if (c) return c;
    return utm.fbclid ? `fb.1.${Date.now()}.${utm.fbclid}` : '';
  }
  function track(name, eventId, extra) {
    fbq('track', name, Object.assign({ content_name: 'auxilio-acidente' }, extra || {}), { eventID: eventId });
    if (!C.CAPI_URL) return;
    try {
      fetch(C.CAPI_URL, {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: name, event_id: eventId, nome: lead && lead.nome, tel: lead && lead.tel,
          nivel: lead && lead.nivel, url: location.href.split('?')[0], fbp: cookie('_fbp'), fbc: fbc(), test_event_code: testCode })
      }).catch(() => {});
    } catch (_) {}
  }

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
    window.scrollTo(0, 0);
  }

  function render() {
    const q = Q[i], sel = answers[q.id] || [];
    $('stepTxt').textContent = `Pergunta ${i + 1} de ${Q.length}`;
    $('bar').style.width = Math.round((i / Q.length) * 90 + 5) + '%';
    $('qTitle').textContent = q.title;
    $('qHint').textContent = q.hint || '';
    $('edu').classList.remove('on'); $('edu').innerHTML = q.edu || '';
    const box = $('opts'); box.innerHTML = '';
    q.opts.forEach((o, k) => {
      const b = document.createElement('button');
      b.className = 'opt' + (q.multi ? ' multi' : '') + (sel.includes(k) ? ' sel' : '');
      b.innerHTML = `<span class="e">${o.e}</span><span class="t"></span><span class="ar">${q.multi ? '✓' : '→'}</span>`;
      b.querySelector('.t').textContent = o.t;
      b.onclick = () => pick(k);
      box.appendChild(b);
    });
    $('next').disabled = !sel.length;
    $('next').style.display = q.multi ? '' : 'none';
    $('back').style.visibility = i ? 'visible' : 'hidden';
    if (sel.length && q.edu) $('edu').classList.add('on');
  }

  function pick(k) {
    const q = Q[i]; let sel = answers[q.id] || [];
    if (q.multi) {
      if (q.opts[k].only) sel = sel.includes(k) ? [] : [k];
      else { sel = sel.filter(x => !q.opts[x].only); sel = sel.includes(k) ? sel.filter(x => x !== k) : sel.concat(k); }
      answers[q.id] = sel; render();
    } else {
      if (busy) return; busy = true;
      answers[q.id] = [k]; render();
      // mostra a dica educativa um instante antes de avançar
      setTimeout(() => { busy = false; advance(); }, q.edu ? 1600 : 280);
    }
  }

  function advance() {
    fbq('trackCustom', 'QuizStep', { step: i + 1 });
    if (i < Q.length - 1) { i++; render(); } else show('s-form');
  }

  function evaluate() {
    let pts = 0, stop = false, soft = false; const resumo = {};
    Q.forEach(q => {
      const sel = answers[q.id] || [];
      resumo[q.id] = sel.map(k => q.opts[k].t);
      sel.forEach(k => { const o = q.opts[k]; pts += o.p; if (o.flag === 'stop') stop = true; if (o.flag === 'soft') soft = true; });
    });
    const nivel = stop ? 'baixa' : soft ? 'media' : 'alta';
    return { pts, nivel, resumo };
  }

  // Máscara de telefone
  $('tel').addEventListener('input', e => {
    let d = e.target.value.replace(/\D/g, '').slice(0, 11);
    e.target.value = d.length > 6 ? `(${d.slice(0,2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}` : d;
  });

  $('leadForm').addEventListener('submit', async e => {
    e.preventDefault();
    const nome = $('nome').value.trim(), tel = $('tel').value.replace(/\D/g, '');
    if (nome.length < 2) return $('err').textContent = 'Digite o seu nome.';
    if (tel.length < 10) return $('err').textContent = 'Digite o WhatsApp com DDD.';
    $('err').textContent = ''; $('send').disabled = true;
    const r = evaluate();
    const id = (crypto.randomUUID && crypto.randomUUID()) || ('l' + Date.now() + Math.random().toString(16).slice(2));
    lead = { id, nome, tel, ...r };
    show('s-load');
    save(lead); // não bloqueia o fluxo
    track('CompleteRegistration', id, { status: r.nivel });
    const lis = $('lsteps').children;
    for (let k = 0; k < lis.length; k++) { await wait(650); lis[k].classList.add('ok'); }
    await wait(500); result();
  });

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function save(l) {
    try {
      fetch(`${C.SUPABASE_URL}/rest/v1/${C.TABLE}`, {
        method: 'POST', keepalive: true,
        headers: { apikey: C.SUPABASE_KEY, Authorization: `Bearer ${C.SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ id: /^[0-9a-f-]{36}$/.test(l.id) ? l.id : undefined, nome: l.nome, whatsapp: '55' + l.tel, qualificacao: l.nivel, pontuacao: l.pts, respostas: l.resumo, utm, pagina: location.href.split('?')[0] })
      }).catch(() => {});
    } catch (_) {}
  }

  const TXT = {
    alta: { pill: '✅ SINAIS FORTES DE DIREITO', w: 88, c: '#1d6b47', lvl: 'Chance de direito: ALTA',
      title: n => `${n}, o seu caso tem os sinais que o INSS analisa para o auxílio-acidente.`,
      text: 'Você teve um acidente, ficou com sequela e isso atrapalha o seu trabalho. São exatamente os pontos que o INSS avalia. Agora falta a análise dos seus documentos.',
      wa: `Quero meu diagnóstico com ${dr}` },
    media: { pill: '⚠️ PRECISA DE ANÁLISE', w: 58, c: '#b45309', lvl: 'Chance de direito: A CONFIRMAR',
      title: n => `${n}, o seu caso tem pontos a favor, mas precisa de uma análise.`,
      text: 'Você tem sequela que atrapalha o trabalho, mas a sua situação no INSS na época do acidente precisa ser conferida. Existem caminhos que só uma análise do caso mostra.',
      wa: `Falar com ${dr} sobre o meu caso` },
    baixa: { pill: 'ℹ️ RESULTADO DA TRIAGEM', w: 22, c: '#9a9a9a', lvl: 'Auxílio-acidente: pouco provável',
      title: n => `${n}, pelas suas respostas o auxílio-acidente parece não se aplicar agora.`,
      text: 'Mas cada caso é único e pode existir outro benefício. Se ficou com dúvida, você pode falar com a equipe.',
      wa: 'Tirar uma dúvida mesmo assim' }
  };

  function result() {
    const t = TXT[lead.nivel], first = lead.nome.split(' ')[0];
    $('rPill').textContent = t.pill; $('rTitle').textContent = t.title(first); $('rText').textContent = t.text;
    $('rLvl').textContent = t.lvl; $('rLvl').style.color = t.c; $('rMeter').style.background = t.c;
    $('waTxt').textContent = t.wa;
    $('wa').classList.toggle('wa', lead.nivel !== 'baixa');
    const m = $('rMirror'); m.innerHTML = '';
    [['acidente','🩹'],['corpo','📍'],['sequela','🩺'],['trabalho','💼']].forEach(([id, e]) => {
      if (!lead.resumo[id] || !lead.resumo[id].length) return;
      const li = document.createElement('li'); li.innerHTML = `<span>${e}</span><span></span>`;
      li.lastChild.textContent = lead.resumo[id].join(', '); m.appendChild(li);
    });
    show('s-result');
    requestAnimationFrame(() => setTimeout(() => $('rMeter').style.width = t.w + '%', 80));
  }

  $('wa').onclick = () => {
    const r = lead.resumo;
    const msg = `Olá${C.DR_NAME ? ', ' + C.DR_NAME : ', Doutora'}! Meu nome é ${lead.nome}. Fiz o teste do auxílio-acidente no site e gostaria do meu diagnóstico.\n\n` +
      `• Acidente: ${r.acidente.join(', ')}\n• Parte do corpo: ${r.corpo.join(', ')}\n• Sequela: ${r.sequela.join(', ')}\n` +
      `• No trabalho: ${r.trabalho.join(', ')}\n• Vínculo: ${r.vinculo.join(', ')}\n• Quando: ${r.quando.join(', ')}\n• Benefício: ${r.beneficio.join(', ')}`;
    track('Contact', lead.id + ':contact', { status: lead.nivel });
    const go = `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(msg)}`;
    setTimeout(() => { location.href = go; }, 350); // dá tempo ao Pixel de disparar
  };

  $('start').onclick = () => { fbq('trackCustom', 'QuizStart'); show('s-quiz'); render(); };
  $('next').onclick = advance;
  $('back').onclick = () => { if (i > 0) { i--; render(); } };
})();
