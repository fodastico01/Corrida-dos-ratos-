/* Anúncios (AdMob), consentimento (UMP) e compra "Remover anúncios" (Play Billing).
   Só roda dentro do app Android (Capacitor). Injetado por prepare.mjs; o jogo na web não tem anúncios.
   Configuração (IDs) em ads-config.js, gerado no build. */
(function(){
  'use strict';
  var C = window.Capacitor;
  if(!C || !C.getPlatform || C.getPlatform()!=='android') return;
  try{ document.documentElement.classList.add('nativo'); }catch(e){}
  var CFG = window.__ADS_CFG || {};
  var AdMob = C.Plugins && C.Plugins.AdMob, Compra = C.Plugins && C.Plugins.NativePurchases;
  var PRODUTO = CFG.produto || 'remover_anuncios';
  var CHAVE = 'corrida-sem-anuncios';
  var INTERVALO = 5*60*1000;           // no máximo 1 anúncio a cada 5 minutos
  var ATRASO_INICIAL = 3*60*1000;      // nada nos 3 primeiros minutos do app
  var inicio = Date.now(), ultimo = 0, pronto = false, carregando = false, iniciado = false;
  var preco = '', consentimentoOpcoes = false;

  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function semAnuncios(){ return lsGet(CHAVE)==='1'; }

  /* ---------- textos (por idioma do jogo) ---------- */
  var T = {
    pt:{sair:'Toque em voltar de novo para sair', av:'Avaliar o jogo', t:'Anúncios', rem:'Remover anúncios', ok:'Anúncios removidos. Obrigado por apoiar o jogo!', res:'Restaurar compra', priv:'Avisos e privacidade', cons:'Preferências de anúncios', fail:'Não foi possível concluir a compra. Tente de novo.', none:'Nenhuma compra encontrada nesta conta.', rest:'Compra restaurada.'},
    en:{sair:'Press back again to exit', av:'Rate the game', t:'Ads', rem:'Remove ads', ok:'Ads removed. Thank you for supporting the game!', res:'Restore purchase', priv:'Notices and privacy', cons:'Ad preferences', fail:'The purchase could not be completed. Please try again.', none:'No purchase found on this account.', rest:'Purchase restored.'},
    es:{sair:'Pulsa atrás otra vez para salir', av:'Valorar el juego', t:'Anuncios', rem:'Quitar anuncios', ok:'Anuncios eliminados. ¡Gracias por apoyar el juego!', res:'Restaurar compra', priv:'Avisos y privacidad', cons:'Preferencias de anuncios', fail:'No se pudo completar la compra. Inténtalo de nuevo.', none:'No se encontró ninguna compra en esta cuenta.', rest:'Compra restaurada.'},
    'pt-pt':{sair:'Toque em voltar novamente para sair', av:'Avaliar o jogo', t:'Anúncios', rem:'Remover anúncios', ok:'Anúncios removidos. Obrigado por apoiares o jogo!', res:'Restaurar compra', priv:'Avisos e privacidade', cons:'Preferências de anúncios', fail:'Não foi possível concluir a compra. Tenta de novo.', none:'Nenhuma compra encontrada nesta conta.', rest:'Compra restaurada.'},
    fr:{sair:'Appuyez encore sur retour pour quitter', av:'Noter le jeu', t:'Publicités', rem:'Supprimer les publicités', ok:'Publicités supprimées. Merci de soutenir le jeu !', res:'Restaurer l\'achat', priv:'Avis et confidentialité', cons:'Préférences publicitaires', fail:'L\'achat n\'a pas pu être finalisé. Réessaie.', none:'Aucun achat trouvé sur ce compte.', rest:'Achat restauré.'},
    it:{sair:'Premi di nuovo indietro per uscire', av:'Valuta il gioco', t:'Annunci', rem:'Rimuovi gli annunci', ok:'Annunci rimossi. Grazie per aver sostenuto il gioco!', res:'Ripristina acquisto', priv:'Avvisi e privacy', cons:'Preferenze annunci', fail:'Impossibile completare l\'acquisto. Riprova.', none:'Nessun acquisto trovato su questo account.', rest:'Acquisto ripristinato.'},
    de:{sair:'Zum Beenden nochmals Zurück drücken', av:'Spiel bewerten', t:'Werbung', rem:'Werbung entfernen', ok:'Werbung entfernt. Danke, dass du das Spiel unterstützt!', res:'Kauf wiederherstellen', priv:'Hinweise und Datenschutz', cons:'Werbeeinstellungen', fail:'Der Kauf konnte nicht abgeschlossen werden. Versuche es erneut.', none:'Kein Kauf in diesem Konto gefunden.', rest:'Kauf wiederhergestellt.'},
    ru:{sair:'Нажмите «Назад» ещё раз, чтобы выйти', av:'Оценить игру', t:'Реклама', rem:'Отключить рекламу', ok:'Реклама отключена. Спасибо, что поддержали игру!', res:'Восстановить покупку', priv:'Уведомления и конфиденциальность', cons:'Настройки рекламы', fail:'Не удалось завершить покупку. Попробуйте ещё раз.', none:'Покупок в этом аккаунте не найдено.', rest:'Покупка восстановлена.'},
    id:{sair:'Tekan kembali sekali lagi untuk keluar', av:'Beri nilai game', t:'Iklan', rem:'Hapus iklan', ok:'Iklan dihapus. Terima kasih sudah mendukung game ini!', res:'Pulihkan pembelian', priv:'Pemberitahuan dan privasi', cons:'Preferensi iklan', fail:'Pembelian tidak dapat diselesaikan. Coba lagi.', none:'Tidak ada pembelian di akun ini.', rest:'Pembelian dipulihkan.'},
    tr:{sair:'Çıkmak için tekrar geri tuşuna basın', av:'Oyunu değerlendir', t:'Reklamlar', rem:'Reklamları kaldır', ok:'Reklamlar kaldırıldı. Oyunu desteklediğin için teşekkürler!', res:'Satın alımı geri yükle', priv:'Bildirimler ve gizlilik', cons:'Reklam tercihleri', fail:'Satın alma tamamlanamadı. Tekrar dene.', none:'Bu hesapta satın alma bulunamadı.', rest:'Satın alma geri yüklendi.'},
    ar:{sair:'اضغط رجوع مرة أخرى للخروج', av:'قيّم اللعبة', t:'الإعلانات', rem:'إزالة الإعلانات', ok:'تمت إزالة الإعلانات. شكرًا على دعمك اللعبة!', res:'استعادة الشراء', priv:'الإشعارات والخصوصية', cons:'تفضيلات الإعلانات', fail:'تعذر إتمام الشراء. حاول مرة أخرى.', none:'لم يتم العثور على أي عملية شراء في هذا الحساب.', rest:'تمت استعادة الشراء.'},
    ja:{sair:'もう一度戻るで終了します', av:'ゲームを評価する', t:'広告', rem:'広告を削除', ok:'広告を削除しました。ご支援ありがとうございます！', res:'購入を復元', priv:'お知らせとプライバシー', cons:'広告の設定', fail:'購入を完了できませんでした。もう一度お試しください。', none:'このアカウントに購入が見つかりません。', rest:'購入を復元しました。'},
    ko:{sair:'한 번 더 누르면 종료됩니다', av:'게임 평가하기', t:'광고', rem:'광고 제거', ok:'광고가 제거되었습니다. 게임을 응원해 주셔서 감사합니다!', res:'구매 복원', priv:'알림 및 개인정보', cons:'광고 설정', fail:'구매를 완료하지 못했습니다. 다시 시도해 주세요.', none:'이 계정에서 구매 내역을 찾을 수 없습니다.', rest:'구매가 복원되었습니다.'},
    hi:{sair:'बाहर निकलने के लिए फिर से बैक दबाएँ', av:'गेम को रेट करें', t:'विज्ञापन', rem:'विज्ञापन हटाएँ', ok:'विज्ञापन हटा दिए गए। खेल का समर्थन करने के लिए धन्यवाद!', res:'खरीदारी बहाल करें', priv:'सूचनाएँ और गोपनीयता', cons:'विज्ञापन प्राथमिकताएँ', fail:'खरीदारी पूरी नहीं हो सकी। कृपया फिर प्रयास करें।', none:'इस खाते में कोई खरीदारी नहीं मिली।', rest:'खरीदारी बहाल हो गई।'},
    zh:{sair:'再按一次返回键退出', av:'给游戏评分', t:'广告', rem:'移除广告', ok:'广告已移除。感谢你支持游戏！', res:'恢复购买', priv:'通知与隐私', cons:'广告偏好', fail:'无法完成购买，请重试。', none:'此账号下未找到购买记录。', rest:'已恢复购买。'}
  };
  function tx(){ var l = String(window.__LANG||'pt'); return T[l] || T[l.split('-')[0]] || (/^(es|fr|it|de|ru|id|tr|ar|ja|ko|hi|zh)/.test(l) ? T[l.slice(0,2)] : null) || T.en; }
  function toast(m){
    var d=document.createElement('div'); d.textContent=m;
    d.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);max-width:86vw;background:#222;color:#fff;padding:10px 16px;border-radius:12px;font:600 14px/1.35 system-ui,sans-serif;z-index:99999;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.4)';
    document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 3500);
  }

  /* ---------- apoio (doação): mesma compra única, texto de agradecimento ---------- */
  var AP = {
    pt:{b:'Apoiar o jogo', d:'Gostou do jogo? Ajude a mantê-lo e a criar novidades. Quem apoia também fica sem anúncios.'},
    en:{b:'Support the game', d:'Enjoying the game? Help keep it going and growing. Supporters also get no ads.'},
    es:{b:'Apoyar el juego', d:'¿Te gusta el juego? Ayúdanos a mantenerlo y a crear novedades. Quien apoya también se queda sin anuncios.'},
    'pt-pt':{b:'Apoiar o jogo', d:'Gostaste do jogo? Ajuda a mantê-lo e a criar novidades. Quem apoia também fica sem anúncios.'},
    fr:{b:'Soutenir le jeu', d:'Le jeu vous plaît ? Aidez-nous à le faire vivre. Les soutiens n\'ont plus de publicités.'},
    it:{b:'Sostieni il gioco', d:'Ti piace il gioco? Aiutaci a mantenerlo e a farlo crescere. Chi sostiene non vede più annunci.'},
    de:{b:'Spiel unterstützen', d:'Gefällt dir das Spiel? Hilf mit, es am Laufen zu halten. Unterstützer sehen keine Werbung mehr.'},
    ru:{b:'Поддержать игру', d:'Нравится игра? Помогите ей развиваться. Поддержавшие игру больше не видят рекламу.'},
    id:{b:'Dukung game ini', d:'Suka game ini? Bantu kami merawat dan mengembangkannya. Pendukung juga bebas iklan.'},
    tr:{b:'Oyunu destekle', d:'Oyunu beğendin mi? Sürmesine ve gelişmesine yardım et. Destekçiler reklam görmez.'},
    ar:{b:'ادعم اللعبة', d:'هل أعجبتك اللعبة؟ ساعدنا على الاستمرار والتطوير. الداعمون لا يرون إعلانات.'},
    ja:{b:'ゲームを応援する', d:'ゲームを気に入っていただけましたか？応援していただくと、今後の開発の力になり、広告も表示されなくなります。'},
    ko:{b:'게임 후원하기', d:'게임이 마음에 드셨나요? 계속 발전할 수 있도록 도와주세요. 후원하시면 광고도 사라집니다.'},
    hi:{b:'खेल का समर्थन करें', d:'खेल पसंद आया? इसे चलाते रहने और बेहतर बनाने में मदद करें। समर्थन करने वालों को विज्ञापन नहीं दिखते।'},
    zh:{b:'支持游戏', d:'喜欢这个游戏吗？帮助我们继续做下去。支持者也不会再看到广告。'}
  };
  function ap(){ var l = String(window.__LANG||'pt'); return AP[l] || AP[l.split('-')[0]] || AP.en; }

  /* ---------- compra ---------- */
  function ehComprado(lista){
    return (lista||[]).some(function(p){ return p.productIdentifier===PRODUTO && (p.purchaseState==='PURCHASED' || p.purchaseState==='1' || p.purchaseState===undefined); });
  }
  function conferirCompra(){
    if(!Compra) return Promise.resolve();
    return Compra.getPurchases({productType:'inapp'}).then(function(r){
      lsSet(CHAVE, ehComprado(r && r.purchases) ? '1' : '0'); atualizarUI();
    }).catch(function(){});
  }
  function carregarPreco(){
    if(!Compra) return;
    Compra.getProduct({productIdentifier:PRODUTO, productType:'inapp'}).then(function(r){
      if(r && r.product && r.product.priceString){ preco=r.product.priceString; atualizarUI(); }
    }).catch(function(){});
  }
  function comprar(){
    if(!Compra){ toast(tx().fail); return; }
    Compra.purchaseProduct({productIdentifier:PRODUTO, productType:'inapp', quantity:1}).then(function(){
      lsSet(CHAVE,'1'); atualizarUI(); toast(tx().ok);
    }).catch(function(e){
      var m=String((e&&e.message)||e||'');
      if(/cancel/i.test(m)) return;
      if(/already|owned/i.test(m)){ lsSet(CHAVE,'1'); atualizarUI(); toast(tx().ok); return; }
      toast(tx().fail);
    });
  }
  function restaurar(){
    if(!Compra){ toast(tx().fail); return; }
    Compra.restorePurchases().catch(function(){}).then(function(){
      return Compra.getPurchases({productType:'inapp'});
    }).then(function(r){
      if(ehComprado(r && r.purchases)){ lsSet(CHAVE,'1'); atualizarUI(); toast(tx().rest); }
      else toast(tx().none);
    }).catch(function(){ toast(tx().fail); });
  }

  /* ---------- anúncios ---------- */
  var tentativas = 0;
  function iniciarAnuncios(){
    if(!AdMob || iniciado || semAnuncios()) return;
    iniciado = true; tentativas++;
    diag('Iniciando anuncios (tentativa ' + tentativas + ')');
    AdMob.requestConsentInfo().catch(function(e){
      // sem formulario de consentimento configurado no AdMob (ou falha de rede): segue sem ele
      diag('Consentimento indisponivel, seguindo sem ele: ' + (e && (e.message||JSON.stringify(e))).slice(0,90));
      return {status:'ERRO', canRequestAds:true, isConsentFormAvailable:false, privacyOptionsRequirementStatus:'UNKNOWN'};
    }).then(function(info){
      diag('Consentimento: status=' + (info && info.status) + ' canRequestAds=' + (info && info.canRequestAds) + ' formulario=' + (info && info.isConsentFormAvailable));
      consentimentoOpcoes = info && info.privacyOptionsRequirementStatus==='REQUIRED';
      if(info && info.isConsentFormAvailable && info.status==='REQUIRED') return AdMob.showConsentForm();
      return info;
    }).then(function(info){
      if(info) consentimentoOpcoes = consentimentoOpcoes || info.privacyOptionsRequirementStatus==='REQUIRED';
      atualizarUI();
      if(!info || !info.canRequestAds){ diag('Nao pode pedir anuncios (canRequestAds falso)'); iniciado=false; return; }
      return AdMob.initialize({initializeForTesting: !!CFG.teste}).then(function(){ diag('AdMob inicializado'); preparar(); });
    }).catch(function(e){
      diag('Erro ao iniciar: ' + (e && (e.message||JSON.stringify(e))));
      iniciado=false; if(tentativas<4) setTimeout(iniciarAnuncios, 45000);
    });
  }
  function preparar(){
    if(semAnuncios() || carregando || pronto) return;
    carregando = true;
    AdMob.prepareInterstitial({adId: CFG.intersticial, isTesting: !!CFG.teste}).then(function(){ pronto=true; carregando=false; diag('Anuncio de teste carregado'); }).catch(function(e){ carregando=false; diag('Anuncio: erro ao preparar ' + (e && (e.message||JSON.stringify(e)))); });
  }
  if(AdMob){
    try{
      AdMob.addListener('interstitialAdDismissed', function(){ pronto=false; setTimeout(preparar, 1500); });
      AdMob.addListener('interstitialAdFailedToShow', function(e){ diag('Anuncio: falhou ao mostrar ' + (e && (e.message||''))); pronto=false; setTimeout(preparar, 30000); });
      AdMob.addListener('interstitialAdFailedToLoad', function(e){ pronto=false; carregando=false; diag('Anuncio: falhou ao carregar ' + (e && (e.code||'') + ' ' + (e && (e.message||'')))); setTimeout(preparar, 60000); });
    }catch(e){}
  }
  var LOG = [];
  function diag(m){
    if(!CFG.teste) return;
    LOG.push(new Date().toTimeString().slice(0,8) + ' ' + m); if(LOG.length>7) LOG.shift();
    var d = document.getElementById('ads-diag');
    if(!d){ d = document.createElement('div'); d.id='ads-diag';
      d.style.cssText='position:fixed;left:6px;right:6px;top:calc(env(safe-area-inset-top,0px) + 4px);background:rgba(0,0,0,.82);color:#9f9;padding:6px 8px;border-radius:8px;font:11px/1.3 monospace;z-index:99998;white-space:pre-wrap;word-break:break-word';
      d.addEventListener('click', function(){ d.style.display='none'; });
      document.body.appendChild(d); }
    d.style.display='block'; d.textContent = 'ANUNCIOS (toque p/ fechar)\n' + LOG.join('\n');
  }
  function talvezMostrar(){
    if(semAnuncios() || !AdMob || !pronto){ diag('Anuncio ainda nao pronto (carregado: ' + pronto + ')'); return; }
    var agora = Date.now();
    if(agora-inicio < ATRASO_INICIAL || agora-ultimo < INTERVALO){ diag('Anuncio: aguardando intervalo minimo'); return; }
    ultimo = agora; pronto = false;
    AdMob.showInterstitial().catch(function(){ setTimeout(preparar, 30000); });
  }
  /* pausas naturais: depois de salvar ou carregar uma partida (nunca no meio de uma decisão) */
  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest && ev.target.closest('[data-acao="slotSalvar"],[data-acao="slotCarregar"]');
    if(el) setTimeout(talvezMostrar, 700);
  }, true);
  /* depois de avançar um mês: espera as cartas e janelas fecharem (nunca no meio de uma decisão) e só então mostra */
  var espera = null;
  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest && ev.target.closest('[data-acao="avancar"]');
    if(!el || espera || semAnuncios()) return;
    var t0 = Date.now();
    espera = setInterval(function(){
      if(Date.now()-t0 > 30000){ clearInterval(espera); espera = null; return; }
      if(document.querySelector('.overlay')) return;   // ainda há carta/janela aberta
      clearInterval(espera); espera = null; talvezMostrar();
    }, 1500);
  }, true);


  /* ---------- pedido de avaliação (API oficial do Google Play; sem filtrar quem recebe) ---------- */
  var IAR = C.Plugins && C.Plugins.InAppReview;
  /* Botão voltar do Android: fecha janela / volta à aba Início; na raiz pede para tocar de novo e só então sai. */
  (function(){
    var APP = C.Plugins && C.Plugins.App; if(!APP || !APP.addListener) return;
    var ult = 0;
    APP.addListener('backButton', function(){
      var tratou = false;
      try{ tratou = !!(window.__voltarSistema && window.__voltarSistema()); }catch(e){}
      if(tratou) return;
      var agora = Date.now();
      if(agora - ult < 2200){ try{ APP.exitApp(); }catch(e){} return; }
      ult = agora;
      var t = tx(); toast(t.sair || 'Press back again to exit');
    });
  })();
  var AV_MIN_JOGADAS = 40, AV_MIN_MS = 10*60*1000, AV_DIAS = 30*24*3600*1000, AV_MAX = 3;
  function avCont(){ var n = parseInt(lsGet('corrida-av-jogadas')||'0',10)||0; return n; }
  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest && ev.target.closest('[data-acao="avancar"]'); if(!el) return;
    lsSet('corrida-av-jogadas', String(avCont()+1));
    if(!lsGet('corrida-av-inicio')) lsSet('corrida-av-inicio', String(Date.now()));
  }, true);
  var avEspera = null;
  function talvezAvaliar(){
    if(!IAR || avEspera) return;
    var vezes = parseInt(lsGet('corrida-av-vezes')||'0',10)||0, ultimoAv = parseInt(lsGet('corrida-av-ultimo')||'0',10)||0;
    var ini = parseInt(lsGet('corrida-av-inicio')||'0',10)||0;
    if(vezes>=AV_MAX || avCont()<AV_MIN_JOGADAS || !ini || Date.now()-ini<AV_MIN_MS || Date.now()-ultimoAv<AV_DIAS) return;
    var t0 = Date.now();
    avEspera = setInterval(function(){
      if(Date.now()-t0 > 30000){ clearInterval(avEspera); avEspera = null; return; }
      if(document.querySelector('.overlay')) return;          // carta ou janela aberta: espera
      if(Date.now()-ultimo < 20000) return;                   // nunca logo depois de um anúncio
      clearInterval(avEspera); avEspera = null;
      lsSet('corrida-av-vezes', String(vezes+1)); lsSet('corrida-av-ultimo', String(Date.now()));
      try{ IAR.requestReview(); }catch(e){}
    }, 2500);
  }
  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest && ev.target.closest('[data-acao="avancar"]'); if(el) setTimeout(talvezAvaliar, 4000);
  }, true);

  /* ---------- tela de Configurações ---------- */
  function secao(){
    var t = tx(), comp = semAnuncios();
    var h = '<div class="ads-secao" style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(128,128,128,.3);text-align:center">'
      + '<div style="font-weight:700;margin-bottom:8px">'+t.t+'</div>';
    if(comp) h += '<div style="font-size:14px;opacity:.85;margin-bottom:8px">'+t.ok+'</div>';
    else h += '<button class="btn" data-ads="comprar" style="margin:3px">'+t.rem+(preco?' · '+preco:'')+'</button>'
      + '<button class="btn" data-ads="restaurar" style="margin:3px">'+t.res+'</button>';
    if(!comp) h += '<div style="font-size:13px;opacity:.85;margin:12px 6px 6px">'+ap().d+'</div>'
      + '<button class="btn coin" data-ads="comprar" style="margin:3px">♥ '+ap().b+(preco?' · '+preco:'')+'</button>';
    if(!comp && consentimentoOpcoes) h += '<button class="btn" data-ads="consentimento" style="margin:3px">'+t.cons+'</button>';
    h += '<button class="btn" data-ads="avaliar" style="margin:3px">★ '+t.av+'</button>';
    h += '<button class="btn" data-ads="privacidade" style="margin:3px">'+t.priv+'</button></div>';
    return h;
  }
  function atualizarUI(){
    var s = document.querySelector('.ads-secao'); if(!s) return;
    var n = document.createElement('div'); n.innerHTML = secao(); s.replaceWith(n.firstChild);
  }
  (function(){ var st=document.createElement('style'); st.textContent='.titulo-rodape{bottom:64px!important}.ads-titulo{background:linear-gradient(180deg,#f0668a 0%,#c9365f 100%)!important;color:#fff!important;border-color:#ffd1dd!important;box-shadow:0 4px 0 #8f2145,0 0 0 2px rgba(240,102,138,.35)!important;text-shadow:0 1px 0 rgba(0,0,0,.25);animation:none!important}'; (document.head||document.documentElement).appendChild(st); })();
  function injetarTitulo(){
    var box = document.querySelector('.titulo-botoes');
    if(!box || semAnuncios()){ var x=document.querySelector('.ads-titulo'); if(x) x.remove(); return; }
    if(box.querySelector('.ads-titulo')) return;
    var b = document.createElement('button'); b.className='btn ads-titulo'; b.setAttribute('data-ads','comprar');
    b.textContent = '♥ ' + ap().b; box.appendChild(b);
  }
  function injetar(){
    injetarTitulo();
    if(document.querySelector('.ads-secao')) return;
    var sh = document.querySelector('#modal .sheet'); if(!sh || !sh.querySelector('.slots')) return;   // so na janela de Configurações
    var cfg = sh.querySelector('.cfg'); if(!cfg) return;
    cfg.insertAdjacentHTML('beforebegin', secao());
  }
  var pend=false;
  new MutationObserver(function(){ if(pend) return; pend=true; setTimeout(function(){ pend=false; injetar(); }, 60); }).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest && ev.target.closest('[data-ads]'); if(!el) return;
    ev.preventDefault(); ev.stopPropagation();
    var a = el.getAttribute('data-ads');
    if(a==='comprar') comprar();
    else if(a==='restaurar') restaurar();
    else if(a==='consentimento' && AdMob) AdMob.showPrivacyOptionsForm().catch(function(){});
    else if(a==='avaliar') window.open('https://play.google.com/store/apps/details?id=br.com.legendariobr.financegame','_blank');
    else if(a==='privacidade') window.open('https://fodastico01.github.io/Corrida-dos-ratos-/privacidade.html','_blank');
  }, true);

  /* ---------- partida ---------- */
  function partir(){ conferirCompra().then(function(){ carregarPreco(); iniciarAnuncios(); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(partir, 1500); });
  else setTimeout(partir, 1500);
})();
