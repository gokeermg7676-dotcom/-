/* =========================================================================
   موتور تجربه تولد — Vanilla JS  ·  بدون هیچ کتابخانه‌ای
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     0. تنظیمات پایه
  ------------------------------------------------------------------ */
 var CFG = window.siteConfig;

if (!CFG) {
  console.error('[salaleh] config.js لود نشده است.');
  document.body.classList.remove('is-loading');
  return;
}

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window;
  var isMobile = window.matchMedia('(max-width: 900px)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var raf = window.requestAnimationFrame.bind(window);

  var timers = [];
  function later(fn, ms) { var t = window.setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(function (t) { window.clearTimeout(t); }); timers = []; }

  function faNum(n) {
    var d = '۰۱۲۳۴۵۶۷۸۹';
    return String(n).replace(/\d/g, function (x) { return d[+x]; });
  }

  /* ------------------------------------------------------------------
     1. مدیریت Placeholder تصویر
        اگر عکسی وجود نداشته باشد، این تابع یک جایگزین زیبا می‌سازد.
  ------------------------------------------------------------------ */
  var phSeq = 0;

  function makePlaceholder(label) {
    var wrap = document.createElement('div');
    wrap.className = 'ph';
    var marks = ['✦', '❀', '✧', '❋', '✺'];
    wrap.innerHTML =
      '<span class="ph__blur"></span>' +
      '<span class="ph__mark">' + marks[phSeq++ % marks.length] + '</span>' +
      '<span class="ph__ttl">' + (label || 'سلاله') + '</span>' +
      '<span class="ph__sub">PHOTO COMING SOON</span>';
    return wrap;
  }

  /** اگر عکس لود نشد، آن را با Placeholder جایگزین می‌کند. */
  function guard(img, label) {
    function fallback() {
      if (!img.isConnected) return;
      var ph = makePlaceholder(label);
      if (img.parentNode) img.parentNode.replaceChild(ph, img);
    }
    if (img.complete && img.naturalWidth === 0) {
      later(fallback, 0);
      return;
    }
    img.addEventListener('error', fallback, { once: true });
  }

  /* ------------------------------------------------------------------
     2. ساخت عناصر پویا
  ------------------------------------------------------------------ */
  function setText(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }

  /** یک متن بلند را به پاراگراف‌های جدا تبدیل می‌کند */
  function fillParagraphs(box, text) {
    if (!box) return;
    box.innerHTML = '';
    String(text || '').split(/\n+/).forEach(function (p) {
      if (!p.trim()) return;
      var el = document.createElement('p');
      el.textContent = p.trim();
      box.appendChild(el);
    });
  }

  /** خواندن همه‌ی متن‌ها از config و ریختن آن‌ها در صفحه */
  function fill() {
    /* فوتر */
    setText('#footName', CFG.name);
    setText('#footDate', CFG.birthday + ' · ' + CFG.year);

    /* پرده تاریکی */
    setText('#loaderText', CFG.loaderText);
    setText('#ovDate', CFG.overture.date);
    setText('#ovCap', CFG.overture.dateCaption);
    setText('#ovHint', CFG.overture.hint);
    setText('#ovCta', CFG.overture.cta);
    $$('.ov-line').forEach(function (el, i) { el.textContent = CFG.overture.beats[i] || ''; });

    /* پرده نام */
    setText('#nsName', CFG.nameReveal.name);
    setText('#nsWish', CFG.nameReveal.wish);
    setText('.tease__label', CFG.nameReveal.tease);

    /* هیرو */
    setText('#heroTitle', CFG.heroTitle);
    setText('#heroSub', CFG.heroSubtitle);
    setText('#heroPlate', CFG.birthday);
    var hi = $('#heroImg');
    if (hi) {
      hi.alt = CFG.heroImageAlt || CFG.shortName;
      hi.src = CFG.heroImage;
      guard(hi, CFG.shortName);
    }

    /* آرزو */
    setText('#wishEyebrow', CFG.wishSection.eyebrow);
    setText('#wishTitle', CFG.wishSection.title);
    setText('#wishSub', CFG.wishSection.subtitle);
    setText('#wishCta', CFG.wishSection.cta);
    setText('#modalTitle', CFG.wishSection.modalTitle);
    setText('#modalSig', CFG.birthday + ' · ' + CFG.shortName);
    setText('#modalClose', CFG.wishSection.modalClose);
    fillParagraphs($('#modalMsg'), CFG.birthdayMessage);

    /* گالری */
    setText('#galEyebrow', CFG.gallerySection.eyebrow);
    setText('#galTitle', CFG.gallerySection.title);
    setText('#galTeaser', CFG.gallerySection.teaser);
    setText('#galRevealTitle', CFG.gallerySection.revealTitle);

    /* خاطرات */
    setText('#memEyebrow', CFG.memorySection.eyebrow);
    setText('#memTitle', CFG.memorySection.title);
    setText('#memSub', CFG.memorySection.subtitle);
    setText('#memMore', CFG.memorySection.more || 'هنوز تموم نشده...');

    /* سورپرایز مخفی */
    setText('#secEyebrow', CFG.secretSection.eyebrow);
    setText('#secTitle', CFG.secretSection.title);
    setText('#secSub', CFG.secretSection.subtitle);
    setText('#lanternLabel', CFG.secretSection.lanternHint);
    setText('#foundTitle', CFG.secretSection.foundMessage);
    setText('#foundBody', CFG.secretSection.foundBody);

    /* پایان */
    setText('#finalPre', CFG.finalSection.preLine);
    setText('#finalTitle', CFG.finalSection.title);
    setText('#finalSign', CFG.finalSection.signature);
    setText('#baleTease', CFG.finalSection.baleTease);
    setText('#baleBtn', CFG.finalSection.baleCta);
    setText('#replayBtn', CFG.finalSection.replayHint);
    fillParagraphs($('#finalMsg'), CFG.birthdayMessage);

    buildDeck();
    buildMemory();
    buildDots();

    document.title = CFG.name + ' — ' + CFG.birthday;
  }

  /* ------------------------------------------------------------------
     3. گالری : استک کارت (نمای یکی‌یکی)
  ------------------------------------------------------------------ */
  var deckCards = [];
  var deckIdx = 0;
  var deckDone = false;

  function buildDeck() {
    var deck = $('#galleryDeck');
    deck.innerHTML = '';
    deckCards = [];

    CFG.gallerySection.gallery.forEach(function (g, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'deck__card';
      btn.setAttribute('aria-label', g.caption);

      var frame = document.createElement('div');
      frame.className = 'card__frame';

      var img = document.createElement('img');
      img.alt = g.caption;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.src = g.image;
      guard(img, 'قاب ' + faNum(i + 1));

      var cap = document.createElement('span');
      cap.className = 'card__cap';
      cap.innerHTML = '<span class="card__tag">QUEB ' + faNum(i + 1) + '</span><br>' + g.caption;

      frame.appendChild(img);
      frame.appendChild(cap);

      var pulse = document.createElement('span');
      pulse.className = 'card__pulse';
      frame.appendChild(pulse);

      btn.appendChild(frame);
      btn.addEventListener('click', advanceDeck);
      deck.appendChild(btn);
      deckCards.push(btn);
    });

    var cnt = $('#deckCount');
    var total = CFG.gallerySection.gallery.length;
    cnt.textContent = faNum(1);
    cnt.parentNode.innerHTML = '<b id="deckCount">' + faNum(1) + '</b> / ' + faNum(total);
  }

  function advanceDeck() {
    if (deckDone) return;

    var cur = deckCards[deckIdx];
    if (cur) {
      cur.classList.remove('is-on');
      cur.classList.add('is-out');
    }
    deckIdx++;

    if (deckIdx < deckCards.length) {
      /* کلیک‌های پشت‌سرهم روی موبایل نباید باعث خطا شود */
      var next = deckCards[deckIdx];
      var shown = deckIdx;
      later(function () {
        if (next && next.isConnected && !next.classList.contains('is-out')) next.classList.add('is-on');
      }, REDUCED ? 0 : 420);
      var c = $('#deckCount');
      if (c) c.textContent = faNum(shown + 1);
      showHint(shown === deckCards.length - 1 ? CFG.gallerySection.lastCard : CFG.gallerySection.revealCta, 2400);
    } else {
      revealGallery();
    }
  }

  function revealGallery() {
    if (deckDone) return;
    deckDone = true;
    $('#galleryDeck').classList.add('is-done');

    later(function () {
      var wrap = $('#galReveal');
      var mosaic = $('#galleryMosaic');
      mosaic.innerHTML = '';

      CFG.gallerySection.gallery.forEach(function (g, i) {
        var cell = document.createElement('figure');
        cell.className = 'mosaic__cell';
        cell.setAttribute('data-parallax', String(0.02 + (i % 3) * 0.014));

        var img = document.createElement('img');
        img.alt = g.caption;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = g.image;
        guard(img, 'قاب ' + faNum(i + 1));

        var cap = document.createElement('figcaption');
        cap.textContent = g.caption;

        cell.appendChild(img);
        cell.appendChild(cap);
        mosaic.appendChild(cell);
        later(function () { cell.classList.add('is-on'); }, REDUCED ? 0 : 90 + i * 110);
      });

      wrap.hidden = false;
      later(function () { registerReveal(wrap, 'blur'); }, 60);
    }, REDUCED ? 0 : 520);
  }

  /* ------------------------------------------------------------------
     4. خاطرات : کارت‌های Flip
  ------------------------------------------------------------------ */
  var flipped = 0;

  function buildMemory() {
    var wrap = $('#memoryCards');
    wrap.innerHTML = '';
    flipped = 0;

    CFG.memorySection.memories.forEach(function (m, i) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.setAttribute('aria-label', m.title + ' — باز کردن');
      card.setAttribute('data-reveal', 'scale');

      var inner = document.createElement('div');
      inner.className = 'card__inner';

      // رو
      var front = document.createElement('div');
      front.className = 'card__face card__front';
      var fi = document.createElement('img');
      fi.alt = m.title;
      fi.loading = 'lazy';
      fi.decoding = 'async';
      fi.src = m.image;
      guard(fi, m.title);
      var fm = document.createElement('div');
      fm.className = 'card__meta';
      fm.innerHTML = '<h3>' + m.title + '</h3><p>' + m.teaser + '</p>';
      var fo = document.createElement('span');
      fo.className = 'card__open';
      fo.textContent = 'باز کردن';
      front.appendChild(fi);
      front.appendChild(fm);
      front.appendChild(fo);

      // پشت
      var back = document.createElement('div');
      back.className = 'card__face card__back';
      back.innerHTML = '<h4>' + m.title + '</h4><p>' + m.body + '</p>';
      var bc = document.createElement('span');
      bc.className = 'card__close';
      bc.textContent = 'بستن ✕';
      back.appendChild(bc);

      inner.appendChild(front);
      inner.appendChild(back);
      card.appendChild(inner);

      card.addEventListener('click', function () {
        var isFlipped = card.classList.toggle('is-flipped');
        if (isFlipped) {
          flipped++;
          if (flipped === CFG.memorySection.memories.length && !card.dataset.hinted) {
            document.querySelectorAll('.card').forEach(function (c) { c.dataset.hinted = '1'; });
            showHint('هنوز تموم نشده...', 3000);
            burstSparkle($('#memMore'), 16);
          }
        } else {
          flipped = Math.max(0, flipped - 1);
        }
      });

      wrap.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------
     5. سورپرایزهای مخفی
  ------------------------------------------------------------------ */

  /* سورپرایز ۰۱ : فانوس باید چند بار لمس شود */
  var taps = 0;
  var secretFound = false;

  function buildDots() {
    var d = $('#secDots');
    d.innerHTML = '';
    for (var i = 0; i < CFG.secretSection.target; i++) d.appendChild(document.createElement('i'));
  }

  function initSecret() {
    var lant = $('#lantern');
    lant.addEventListener('click', function () {
      if (secretFound) return;
      taps++;
      var dots = $$('#secDots i');
      if (dots[taps - 1]) dots[taps - 1].classList.add('is-on');
      lant.classList.add('is-hot');
      burstSparkle(lant, 6);
      if (taps >= CFG.secretSection.target) openSecret();
    });

    /* سورپرایز ۰۲ : ستاره‌ی مخفی در گالری */
    var sp = $('#sparkle');
    sp.addEventListener('click', function (e) {
      e.stopPropagation();
      if (sp.classList.contains('is-found')) return;
      sp.classList.add('is-found');
      burstSparkle(sp, 22);
      showHint('تو هم حواست به اینجا بوده.', 3600);
    });

    /* راز کوچک: سه بار روی «۱۱ مهر» بزن، یک متن پنهان باز می‌شود */
    var plate = $('#heroPlate');
    var plateTaps = 0;
    if (plate) {
      plate.style.cursor = 'pointer';
      plate.addEventListener('click', function () {
        plateTaps++;
        if (plateTaps === 3) {
          showHint('«روزهایی هستند که خودشون آدم رو انتخاب می‌کنند.»', 5200);
          burstSparkle(plate, 18);
        }
      });
    }
  }

  function openSecret() {
    if (secretFound) return;
    secretFound = true;

    var lant = $('#lantern');
    lant.style.transition = 'opacity .8s, transform .8s';
    lant.style.opacity = '0';
    lant.style.transform = 'scale(1.6)';

    burstSparkle($('.secret__stage'), 46);
    flashLight(1500);

    later(function () {
      var box = $('#secretMsg');
      box.hidden = false;
      $('#lanternLabel').textContent = '';
      later(function () { registerReveal(box, 'blur'); }, 40);
      scrollIntoView(box, 0.55);
    }, REDUCED ? 0 : 700);
  }

  /* ------------------------------------------------------------------
     6. مودال
  ------------------------------------------------------------------ */
  var modalOpen = false;

  function initModal() {
    var modal = $('#modal');
    var openBtn = $('#wishCta');

    function open() {
      if (modalOpen) return;
      modalOpen = true;
      modal.hidden = false;
      later(function () { modal.classList.add('is-open'); }, 30);
      document.body.classList.add('is-locked');
      $('#modalClose').focus();
    }
    function close() {
      if (!modalOpen) return;
      modalOpen = false;
      modal.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      later(function () { if (!modalOpen) modal.hidden = true; }, 700);
    }

    openBtn.addEventListener('click', open);
    $('#modalBg').addEventListener('click', close);
    $('#modalClose').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ------------------------------------------------------------------
     7. موسیقی (اختیاری — اگر فایل نبود، بی‌سروصدا رد می‌شود)
  ------------------------------------------------------------------ */
  var audio = null;
  var musicReady = false;
  var musicWanted = false;

  function initMusic() {
    var btn = $('#musicBtn');
    var a = $('#bgm');
    if (!CFG.music) return;

    a.addEventListener('error', function () {
      console.warn('[salaleh] فایل موسیقی پیدا نشد (' + CFG.music + ') — سایت بدون صدا اجرا می‌شود.');
    });
    a.src = CFG.music;
    audio = a;

    function revealBtn() {
      btn.hidden = false;
      later(function () { btn.classList.add('is-ready'); }, 500);
    }

    function tryPlay() {
      if (!audio) return;
      if (audio.paused) {
        audio.volume = 0.42;
        var p = audio.play();
        if (p && typeof p.then === 'function') {
          p.then(function () {
            musicReady = true;
            musicWanted = true;
            btn.classList.add('is-playing');
            btn.setAttribute('aria-label', 'توقف موسیقی');
            $('.music__txt').textContent = 'در حال پخش';
          })['catch'](function () { /* مرورگر اجازه نداد — سایت بدون صدا ادامه می‌دهد */ });
        }
      }
    }

    /* اولین تعامل کاربر = اجازه‌ی پخش و ظاهر شدن دکمه */
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function () {
        revealBtn();
        later(tryPlay, 300);
      }, { once: true, passive: true });
    });

    btn.addEventListener('click', function () {
      if (!audio) return;
      if (audio.paused) {
        tryPlay();
      } else {
        audio.pause();
        musicWanted = false;
        btn.classList.remove('is-playing');
        btn.setAttribute('aria-label', 'پخش موسیقی');
        $('.music__txt').textContent = 'موسیقی';
      }
    });
  }

  /* ------------------------------------------------------------------
     8. افکت‌های کوچک
  ------------------------------------------------------------------ */
  var hintTimer = null;
  function showHint(txt, ms) {
    var h = $('#hint');
    if (!h || !txt) return;
    $('#hintTxt').textContent = txt;
    h.classList.add('is-on');
    if (hintTimer) window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(function () { h.classList.remove('is-on'); }, ms || 2600);
  }

  /** انفجار نور : پرکردن صفحه با یک موج روشن */
  function flashLight(ms) {
    var f = $('#flash');
    if (!f) return;
    ms = ms || 1150;
    f.classList.add('is-on');
    f.style.transition = 'none';
    f.style.opacity = '0.001';
    f.style.transform = 'scale(.3)';
    raf(function () {
      later(function () {
        f.style.transition = 'opacity ' + ms + 'ms cubic-bezier(.16,1,.3,1), transform ' + Math.round(ms * 1.2) + 'ms cubic-bezier(.16,1,.3,1)';
        f.style.opacity = '1';
        f.style.transform = 'scale(2.2)';
      }, 40);
    });
    later(function () {
      f.style.transition = 'opacity ' + Math.round(ms * 0.9) + 'ms ease-out, transform ' + Math.round(ms * 0.9) + 'ms ease-out';
      f.style.opacity = '0';
      f.style.transform = 'scale(3)';
    }, ms);
    later(resetFlash, ms + 950);
  }

  function resetFlash() {
    var f = $('#flash');
    if (!f) return;
    f.classList.remove('is-on');
    f.style.transition = '';
    f.style.opacity = '';
    f.style.transform = '';
  }

  var SPARK_COLORS = ['#ffd489', '#ff8fc7', '#c9b8ff', '#9ed2ff', '#fff'];
  function burstSparkle(origin, n) {
    if (REDUCED || !origin) return;
    var r = origin.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    if (r.width === 0) { cx = window.innerWidth / 2; cy = window.innerHeight / 2; }
    n = n || 14;

    for (var i = 0; i < n; i++) {
      (function (i) {
        later(function () {
          var p = document.createElement('i');
          var ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
          var dist = 60 + Math.random() * 150;
          p.style.position = 'fixed';
          p.style.left = cx + 'px';
          p.style.top = cy + 'px';
          p.style.width = (3 + Math.random() * 4) + 'px';
          p.style.height = p.style.width;
          p.style.zIndex = '90';
          p.style.pointerEvents = 'none';
          p.style.borderRadius = '50%';
          p.style.background = SPARK_COLORS[i % SPARK_COLORS.length];
          p.style.boxShadow = '0 0 10px 3px ' + SPARK_COLORS[i % SPARK_COLORS.length];
          p.style.transition = 'transform ' + (700 + Math.random() * 500) + 'ms cubic-bezier(.16,1,.3,1), opacity ' + (700 + Math.random() * 500) + 'ms ease-out';
          document.body.appendChild(p);
          later(function () {
            p.style.transform = 'translate(' + Math.cos(ang) * dist + 'px,' + Math.sin(ang) * dist + 'px) scale(0)';
            p.style.opacity = '0';
          }, 16);
          later(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1400);
        }, i * 26);
      })(i);
    }
  }

  function scrollIntoView(el, ratio) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }); }
    catch (e) { el.scrollIntoView(); }
  }

  /* ------------------------------------------------------------------
     9. ترنزیشن پرده
  ------------------------------------------------------------------ */
  function curtain(on, cb) {
    var c = $('#curtain');
    if (on) {
      c.classList.add('is-on');
      later(cb, REDUCED ? 20 : 780);
    } else {
      c.classList.remove('is-on');
      later(cb, REDUCED ? 20 : 780);
    }
  }

/* ------------------------------------------------------------------
     10. دیده‌شدن عناصر + انیمیشن ورود
         یک لایه‌ی اطمینانی روی IntersectionObserver گذاشته شده تا اگر مرورگری
         رویداد را نداد، بررسی ساده‌ی مختصات جای آن را بگیرد.
  ------------------------------------------------------------------ */
var watchList = [];
var watchRaf = false;
var watchStarted = false;

  function rectRatio(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 1;
    var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return r.height > 0 ? visible / r.height : 0;
  }

  function fireWatch(item) {
    if (item.done) return;
    item.done = true;
    var i = watchList.indexOf(item);
    if (i > -1) watchList.splice(i, 1);
    item.cb();
  }

  function checkWatch() {
    for (var i = watchList.length - 1; i >= 0; i--) {
      if (rectRatio(watchList[i].el) >= watchList[i].threshold) fireWatch(watchList[i]);
    }
  }

  function initWatch() {
    if (watchStarted) return;
    watchStarted = true;

    ['scroll', 'resize', 'orientationchange'].forEach(function (ev) {
      window.addEventListener(ev, function () {
        if (watchRaf) return;
        watchRaf = true;
        raf(function () { watchRaf = false; checkWatch(); });
      }, { passive: true });
    });

    /* لایه‌ی اطمینانی : اگر رویداد اسکرول از دست برود، هر ۱ ثانیه چک می‌کنیم
       تا هیچ انیمیشنی برای همیشه پنهان نماند. */
    window.setInterval(function () {
      if (!watchList.length) return;
      checkWatch();
    }, 1000);
  }

  /** با رسیدن عنصر به دید کاربر، تابع callback اجرا می‌شود (فقط یک بار) */
  function watchInView(el, cb, threshold) {
    if (!el) return;
    var item = { el: el, cb: cb, threshold: threshold || 0.15, done: false };
    watchList.push(item);

    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { fireWatch(item); o.unobserve(e.target); }
        });
      }, { threshold: Math.max(item.threshold, 0.01), rootMargin: '0px 0px -6% 0px' });
      o.observe(el);
    }
    checkWatch();
  }

  function registerReveal(el, type) {
    if (!el) return;
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', type || 'up');
    if (el.classList.contains('is-in')) return;
    watchInView(el, function () { el.classList.add('is-in'); }, 0.12);
  }

  var revealReady = false;

  function autoReveal() {
    if (revealReady) return;
    revealReady = true;

    $$('.reveal').forEach(function (el) { registerReveal(el, 'up'); });
    $$('[data-reveal]').forEach(function (el) { registerReveal(el, el.getAttribute('data-reveal') || 'up'); });

    /* روشن شدن پالت رنگی هر بخش */
    $$('.act').forEach(function (sec) {
      watchInView(sec, function () { sec.classList.add('is-lit'); }, 0.02);
    });

    checkWatch();
  }

  /** اولین کارت گالری وقتی بخش گالری دیده شد ظاهر می‌شود */
  function initGalleryStart() {
    if (!deckCards.length) return;
    watchInView($('#actGallery'), function () {
      later(function () { if (!deckDone && !deckCards[deckIdx].classList.contains('is-on')) deckCards[0].classList.add('is-on'); }, 320);
    }, 0.22);
  }

  /* ------------------------------------------------------------------
     11. پارالاکس سبک
  ------------------------------------------------------------------ */
  function initParallax() {
    if (isMobile || REDUCED || isTouch) return;
    var items = $$('[data-parallax]');
    if (!items.length) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

    function loop() {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      items.forEach(function (el) {
        var sp = parseFloat(el.getAttribute('data-parallax')) || 0.04;
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.setProperty('--px', (cx * sp * -110).toFixed(2) + 'px');
        el.style.setProperty('--py', (cy * sp * -64 + mid * sp * 0.4).toFixed(2) + 'px');
      });
      if (Math.abs(tx - cx) > 0.0015 || Math.abs(ty - cy) > 0.0015) raf(loop);
      else running = false;
    }
    function kick() { if (!running) { running = true; raf(loop); } }

    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    }, { passive: true });

    window.addEventListener('scroll', kick, { passive: true });
    kick();
  }

  /* ------------------------------------------------------------------
     12. ذرات نور + مکان‌نما
  ------------------------------------------------------------------ */
  function initDust() {
    if (REDUCED) return;
    var wrap = $('#dust');
    var count = isMobile ? 10 : 20;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      var s = 1 + Math.random() * 2.6;
      p.style.width = s + 'px';
      p.style.height = s + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = (100 + Math.random() * 40) + '%';
      p.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
      p.style.animationDuration = (14 + Math.random() * 20) + 's';
      p.style.animationDelay = (-Math.random() * 24) + 's';
      p.style.opacity = String(0.2 + Math.random() * 0.5);
      wrap.appendChild(p);
    }
  }

  function initCursor() {
    if (isTouch || isMobile || REDUCED) return;
    var cur = $('#cursor'), spot = $('#spotlight');
    document.body.classList.add('cursor-live');
    var x = 0, y = 0;

    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      cur.classList.add('is-on');
      cur.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      spot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      var hot = e.target.closest('button, a, .sparkle, .lantern, #heroPlate');
      cur.classList.toggle('is-hot', !!hot);
    });
    document.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });
  }

  /* ------------------------------------------------------------------
     13. ماشین وضعیت پرده‌ها
  ------------------------------------------------------------------ */
  var beatIdx = 0;

  function showBeat(i) {
    var lines = $$('.ov-line');
    lines.forEach(function (l) { l.classList.remove('is-on'); });
    if (lines[i]) lines[i].classList.add('is-on');
  }

  function runOverture() {
    var ov = $('#overture');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-locked', 'is-overture');
    later(function () { ov.classList.add('is-lit'); }, 500);

    // ضربه اول خودکار
    later(function () { showBeat(0); }, 1500);

    // ضربه‌های بعدی با لمس کاربر یا خودکار
    var auto = [4200, 7400];
    later(function () { if (beatIdx === 0) nextBeat(); }, auto[0]);
    later(function () { if (beatIdx <= 1) nextBeat(); }, auto[1]);
  }

  function nextBeat() {
    var ov = $('#overture');
    if (!document.body.classList.contains('is-overture')) return;
    if (document.body.classList.contains('is-ready')) return;
    var lines = $$('.ov-line');
    beatIdx++;
    if (beatIdx < lines.length) {
      showBeat(beatIdx);
    } else {
      lines.forEach(function (l) { l.classList.remove('is-on'); });
      var d = $('#ovDate');
      d.textContent = CFG.overture.date;
      later(function () { d.classList.add('is-on'); }, 260);
      later(function () { $('#ovCap').classList.add('is-on'); }, 1250);
      later(function () { ov.classList.add('is-ready'); }, 1900);
      document.body.classList.add('is-ready');
    }
  }

  function enterNameStage() {
    if (!document.body.classList.contains('is-overture')) return;
    clearTimers();

    flashLight(1300);
    later(function () {
      document.body.classList.remove('is-overture', 'is-ready');
      document.body.classList.add('is-namestage', 'is-locked');
      $('#nsName').classList.add('is-on');
      later(function () { $('#nsWish').classList.add('is-on'); }, 900);
      later(function () { $('#nsTease').classList.add('is-on'); }, 1900);
    }, REDUCED ? 30 : 420);
  }

  function enterStory() {
    if (document.body.classList.contains('is-story')) return;

    /* Light Burst : انفجار نور و سپس کشف دنیای اصلی */
    flashLight(1200);

    later(function () {
      document.body.classList.remove('is-namestage', 'is-locked');
      document.body.classList.add('is-story');
      window.scrollTo(0, 0);
      revealOnce();

      ['#actHero .eyebrow', '#heroTitle', '#actHero .rule', '#heroSub'].forEach(function (s) {
        registerReveal($(s), 'blur');
      });

      later(function () {
        $('#scrollCue').classList.add('is-in');
        showHint('برای ادامه، پایین بزن یا اسکرول کن', 4600);
      }, 1100);
    }, REDUCED ? 80 : 1000);
  }

  function revealOnce() {
    initWatch();
    autoReveal();
    initGalleryStart();
    initParallax();
  }

  /* ------------------------------------------------------------------
     14. پایان : پیام نهایی + کانال بله
  ------------------------------------------------------------------ */
  var nextShown = false;
  var codaShown = false;

  function initFinal() {
    var started = false;
    watchInView($('#actFinal'), function () {
      if (started) return;
      started = true;
      runFinalScene();
    }, 0.28);
  }

  function runFinalScene() {
    var pre = $('#finalPre'), ti = $('#finalTitle'), sg = $('#finalSign'), ms = $('#finalMsg');

    later(function () { pre.classList.add('is-on'); }, 500);
    later(function () { ti.classList.add('is-on'); }, 1500);
    later(function () { sg.classList.add('is-on'); }, 2600);

    if (deckDone || secretFound) {
      later(function () {
        ms.hidden = false;
        later(function () { ms.classList.add('is-on'); }, 60);
      }, 3200);
      later(function () { showNext(); }, 4600);
    } else {
      // اگر کاربر از مراحل رد نشده، پیام را با اولین تعامل نشان بده
      later(function () { ms.hidden = false; ms.classList.add('is-on'); }, 3400);
      later(function () { showNext(); }, 5200);
    }
  }

  function showNext() {
    if (nextShown) return;
    nextShown = true;
    var n = $('#finalNext');
    n.hidden = false;
    later(function () { n.classList.add('is-on'); }, 60);
    burstSparkle(n, 20);

    /* سورپرایز ۰۳ : اگر کاربر بعد از مدتی هنوز اینجا بماند، پیشنهاد «دوباره ببین» ظاهر می‌شود */
    later(function () { openCoda(); }, 26000);
  }

  function initBale() {
    var btn = $('#baleBtn');
    btn.addEventListener('click', function () {
      var link = CFG.baleChannelLink;
      if (!link || link === 'YOUR_BALE_CHANNEL_LINK' || link.indexOf('YOUR_') === 0) {
        showHint('این لینک هنوز در config.js تنظیم نشده.', 4200);
        burstSparkle(btn, 12);
        return;
      }
      btn.disabled = true;
      btn.textContent = CFG.finalSection.baleOpening;
      flashLight(1100);
      window.open(link, '_blank', 'noopener,noreferrer');
      later(function () {
        btn.disabled = false;
        btn.textContent = CFG.finalSection.baleCta;
        openCoda();
      }, 1500);
    });

    /* سورپرایز ۰۳ : پس از کانال، امکان دیدن دوباره‌ی تجربه */
    $('#replayBtn').addEventListener('click', function () {
      location.reload();
    });
  }

  function openCoda() {
    if (codaShown) return;
    codaShown = true;
    var c = $('#coda');
    c.hidden = false;
    later(function () { c.classList.add('is-on'); }, 60);
  }

  /* ------------------------------------------------------------------
     15. نوار پیشرفت بارگذاری
  ------------------------------------------------------------------ */
  function boot() {
    var bar = $('#loaderBar');
    var pct = 0;
    var iv = window.setInterval(function () {
      pct += 12 + Math.random() * 16;
      if (pct > 100) pct = 100;
      bar.style.width = pct + '%';
      if (pct >= 100) window.clearInterval(iv);
    }, 140);

    /* رفتن به پرده تاریکی بعد از ~۱.۲ ثانیه، حتی اگر عکس‌ها دیر برسند */
    window.setTimeout(function () {
      window.clearInterval(iv);
      bar.style.width = '100%';
      runOverture();
    }, 1250);
  }

  /* ------------------------------------------------------------------
     16. راه‌اندازی
  ------------------------------------------------------------------ */
  function init() {
    try { fill(); }
    catch (err) {
      console.error('[salaleh] خطا در ساخت محتوا:', err);
      document.body.classList.remove('is-loading');
    }

    initDust();
    initCursor();
    initMusic();
    initModal();
    initSecret();
    initBale();
    initFinal();

    /* لمس/کلیک پرده تاریکی */
    var ov = $('#overture');
    ov.addEventListener('click', function (e) {
      if (e.target.closest('#ovCta')) return;
      if (!document.body.classList.contains('is-ready')) nextBeat();
    });
    $('#ovCta').addEventListener('click', function (e) {
      e.stopPropagation();
      enterNameStage();
    });

    /* پرده نام */
    $('#nsTease').addEventListener('click', function () {
      enterStory();
    });

    /* راهنمای اسکرول */
    $('#scrollCue').addEventListener('click', function () {
      scrollIntoView($('#actWish'), 0.5);
    });
    $('#memMore').addEventListener('click', function () {
      scrollIntoView($('#actSecret'), 0.5);
      burstSparkle(this, 10);
    });
    $('#wishCta').addEventListener('click', function () { burstSparkle(this, 8); });

    /* کیبورد: همه‌ی پرده‌ها با Enter/Space هم کار می‌کنند */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (document.body.classList.contains('is-overture') && !document.body.classList.contains('is-ready')) {
        e.preventDefault(); nextBeat();
      }
    });

    /* اگر کاربر وسط راه صفحه را رفرش کرد */
    window.addEventListener('pageshow', function () { window.scrollTo(0, 0); });

    boot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
