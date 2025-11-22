(function () {
  'use strict';

  var STORAGE_KEY = 'gd_cookie_consent';

  function readConsent() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  }
  function writeConsent(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }

  function loadAnalytics() {
    try {
      if (window.__gd_gtag_loaded) return;
      window.__gd_gtag_loaded = true;
      var GA_ID = 'G-XXXXXXXXXX'; // Replace with real Measurement ID if available
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      window.gtag = window.gtag || gtag;
      gtag('js', new Date());
      gtag('config', GA_ID, { anonymize_ip: true });
    } catch (e) {
      console.warn('GA load failed', e);
    }
  }

  function applyConsentEffects(consent) {
    if (!document || !document.body) return;
    document.body.setAttribute(
      'data-gd-cookie-analytics',
      !!(consent && consent.analytics)
    );
    document.body.setAttribute(
      'data-gd-cookie-ads',
      !!(consent && consent.ads)
    );
    if (consent && consent.analytics) {
      loadAnalytics();
    }
  }

  var TEMPLATE = `
<style id="gd-cookie-style">
@keyframes gd-slide-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
#gd-cookie-banner{position:fixed;bottom:18px;left:18px;right:18px;max-width:1200px;margin:0 auto;background:#000;color:#fff;z-index:999999;padding:20px;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.35);font-family:Inter, Arial, Helvetica, sans-serif;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;animation:gd-slide-up .28s ease}
#gd-cookie-banner .gd-content{display:flex;gap:12px;align-items:flex-start;flex:1;min-width:0}
#gd-cookie-banner h3{margin:0;font-size:1.05rem;font-weight:700}
#gd-cookie-banner p{margin:6px 0 0 0;color:#ddd;line-height:1.4;font-size:0.95rem;max-width:700px}
#gd-cookie-banner .gd-actions{display:flex;gap:10px;align-items:center}
#gd-cookie-banner button{border:none;cursor:pointer;padding:10px 20px;border-radius:999px;font-weight:600;font-size:0.95rem}
#gd-cookie-banner .gd-btn-primary{background:#fff;color:#000}
#gd-cookie-banner .gd-btn-outline{background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.12)}
#gd-cookie-modal{position:fixed;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;z-index:100000}
#gd-cookie-modal .gd-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.6)}
#gd-cookie-modal .gd-panel{position:relative;background:#111;color:#fff;padding:18px;border-radius:8px;max-width:720px;width:94%;z-index:2}
#gd-reopen-btn{position:fixed;left:16px;bottom:16px;z-index:999999;background:rgba(0,0,0,0.6);color:#fff;border:1px solid rgba(255,255,255,0.08);padding:8px 12px;border-radius:999px;cursor:pointer;font-size:0.95rem}
</style>

<div id="gd-cookie-banner" role="dialog" aria-live="polite" aria-label="Bannière cookies">
  <div class="gd-content">
    <div>
      <h3>Cookies et confidentialité</h3>
      <p>Nous utilisons des cookies pour assurer le bon fonctionnement du site, personnaliser l'expérience et analyser l'usage. Vous pouvez changer vos réglages à tout moment.</p>
      <div style="margin-top:8px"><a href="#" id="gd-open-settings" style="color:#bbb;text-decoration:underline">Changer les réglages</a></div>
    </div>
  </div>
  <div class="gd-actions">
    <button id="gd-reject" class="gd-btn-outline" aria-label="Tout refuser">Tout refuser</button>
    <button id="gd-accept" class="gd-btn-primary" aria-label="Tout autoriser">Tout autoriser</button>
  </div>
</div>

<div id="gd-cookie-modal" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="gd-backdrop" id="gd-backdrop"></div>
  <div class="gd-panel" role="document" aria-labelledby="gd-modal-title">
    <h2 id="gd-modal-title">Réglages des cookies</h2>
    <p style="color:#ccc;margin-top:6px">Choisissez les cookies que vous autorisez.</p>
    <form id="gd-settings-form">
      <label style="display:flex;justify-content:space-between;align-items:center;padding:10px 0"> <span>Cookies nécessaires</span> <input type="checkbox" disabled checked /> </label>
      <label style="display:flex;justify-content:space-between;align-items:center;padding:10px 0"> <span>Cookies analytiques</span> <input type="checkbox" id="gd-analytics" /> </label>
      <label style="display:flex;justify-content:space-between;align-items:center;padding:10px 0"> <span>Cookies publicitaires</span> <input type="checkbox" id="gd-ads" /> </label>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
        <button type="button" id="gd-save" class="gd-btn-primary">Enregistrer</button>
        <button type="button" id="gd-cancel" class="gd-btn-outline">Annuler</button>
      </div>
    </form>
  </div>
</div>

<button id="gd-reopen-btn" aria-label="Gérer mes cookies" title="Gérer mes cookies" style="display:none">Gérer mes cookies</button>
`;

  function showModal() {
    var modal = document.getElementById('gd-cookie-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    var consent = readConsent() || { analytics: false, ads: false };
    var a = document.getElementById('gd-analytics'),
      b = document.getElementById('gd-ads');
    if (a) a.checked = !!consent.analytics;
    if (b) b.checked = !!consent.ads;
    document.getElementById('gd-save').focus();
  }
  function hideModal() {
    var modal = document.getElementById('gd-cookie-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  function addReopenUI() {
    var header = document.querySelector('.site-header, header');
    if (header) {
      var link = document.createElement('button');
      link.textContent = 'Gérer mes cookies';
      link.style.cssText =
        'background:transparent;border:none;color:inherit;cursor:pointer;margin-left:12px;font-size:0.95rem;text-decoration:underline';
      link.addEventListener('click', function () {
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'flex';
        else installUI();
      });
      var spot = header.querySelector('.header-inner') || header;
      spot.appendChild(link);
      return;
    }
    var reopen = document.getElementById('gd-reopen-btn');
    if (reopen) {
      reopen.style.display = 'block';
      reopen.addEventListener('click', function () {
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'flex';
        else installUI();
      });
    }
  }

  function installUI() {
    var e = document.getElementById('gd-cookie-banner');
    if (e) e.parentNode && e.parentNode.removeChild(e);
    var m = document.getElementById('gd-cookie-modal');
    if (m) m.parentNode && m.parentNode.removeChild(m);
    var styleOld = document.getElementById('gd-cookie-style');
    if (styleOld)
      styleOld.parentNode && styleOld.parentNode.removeChild(styleOld);
    var reopenOld = document.getElementById('gd-reopen-btn');
    if (reopenOld)
      reopenOld.parentNode && reopenOld.parentNode.removeChild(reopenOld);

    var container = document.createElement('div');
    container.innerHTML = TEMPLATE;
    document.body.appendChild(container);

    var btnAccept = document.getElementById('gd-accept');
    var btnReject = document.getElementById('gd-reject');
    var btnSettings = document.getElementById('gd-open-settings');
    var btnSave = document.getElementById('gd-save');
    var btnCancel = document.getElementById('gd-cancel');
    var backdrop = document.getElementById('gd-backdrop');
    var btnClose = document.getElementById('gd-close');

    btnAccept &&
      btnAccept.addEventListener('click', function () {
        var consent = {
          necessary: true,
          analytics: true,
          ads: true,
          ts: Date.now(),
        };
        writeConsent(consent);
        applyConsentEffects(consent);
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'none';
      });
    btnReject &&
      btnReject.addEventListener('click', function () {
        var consent = {
          necessary: true,
          analytics: false,
          ads: false,
          ts: Date.now(),
        };
        writeConsent(consent);
        applyConsentEffects(consent);
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'none';
      });
    btnSettings &&
      btnSettings.addEventListener('click', function (e) {
        e.preventDefault();
        showModal();
      });
    btnSave &&
      btnSave.addEventListener('click', function () {
        var consent = {
          necessary: true,
          analytics: !!document.getElementById('gd-analytics').checked,
          ads: !!document.getElementById('gd-ads').checked,
          ts: Date.now(),
        };
        writeConsent(consent);
        applyConsentEffects(consent);
        hideModal();
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'none';
      });
    btnCancel &&
      btnCancel.addEventListener('click', function () {
        hideModal();
      });
    backdrop &&
      backdrop.addEventListener('click', function () {
        hideModal();
      });
    btnClose &&
      btnClose.addEventListener('click', function () {
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'none';
      });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideModal();
    });

    addReopenUI();
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      var consent = readConsent();
      installUI();
      if (consent) {
        applyConsentEffects(consent);
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'none';
      } else {
        var b = document.getElementById('gd-cookie-banner');
        if (b) b.style.display = 'flex';
      }
    } catch (err) {
      console.error('GD cookie init error', err);
    }
  });
})();
