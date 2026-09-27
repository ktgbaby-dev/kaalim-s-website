/* =========================================================
   KTG MUSIC — BROADCAST SCRIPT
   Opening sequence, static canvas, nav, scroll reveals.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     OPENING SEQUENCE
     Plays once per browser session (sessionStorage), skippable.
     Beats: STATIC -> SIGNAL -> CH.01/KTG -> NOW TUNING IN -> ON AIR
  --------------------------------------------------------- */
  var intro = document.getElementById("intro");
  var canvas = document.getElementById("static-canvas");
  var skipBtn = document.getElementById("skip-intro");
  var beats = document.querySelectorAll(".intro-beat");
  var STORAGE_KEY = "ktg_intro_seen";

  function endIntro() {
    document.body.classList.remove("intro-locked");
    intro.classList.add("intro-hidden");
    stopStatic();
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* storage unavailable, non-fatal */ }
    window.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(e) {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") endIntro();
  }

  var alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { /* ignore */ }

  if (!intro) {
    // no-op: intro markup missing
  } else if (alreadySeen) {
    intro.classList.add("intro-hidden");
  } else {
    document.body.classList.add("intro-locked");
    startStatic();
    runSequence();
    intro.addEventListener("click", endIntro);
    skipBtn.addEventListener("click", function (e) { e.stopPropagation(); endIntro(); });
    window.addEventListener("keydown", onKeydown);
  }

  function runSequence() {
    var timings = [0, 900, 1900, 3100, 4200]; // ms at which each beat activates
    timings.forEach(function (t, i) {
      setTimeout(function () {
        beats.forEach(function (b) { b.classList.remove("active"); });
        if (beats[i]) beats[i].classList.add("active");
      }, t);
    });
    setTimeout(endIntro, 4900);
  }

  /* --- Canvas TV static (lightweight, no video asset) --- */
  var staticRAF = null;
  function startStatic() {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var w, h;

    // Offscreen buffer holds the small noise field; drawing FROM it TO the
    // visible canvas (rather than the canvas drawing onto itself) avoids
    // self-copy artifacts in putImageData/drawImage.
    var buffer = document.createElement("canvas");
    var bufferCtx = buffer.getContext("2d");

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      buffer.width = 160;
      buffer.height = Math.round((buffer.width * h) / w);
    }
    resize();
    window.addEventListener("resize", resize);

    var frame = 0;
    function draw() {
      frame++;
      var sw = buffer.width, sh = buffer.height;
      var imgData = bufferCtx.createImageData(sw, sh);
      var settleFactor = Math.min(frame / 90, 1); // static "resolves" toward less noise over the sequence
      for (var i = 0; i < imgData.data.length; i += 4) {
        var v = Math.random() * 255;
        // occasional colored glitch pixels for the "signal lock" feel
        var glitch = Math.random() < 0.02 * (1 - settleFactor);
        imgData.data[i] = glitch ? 50 : v;
        imgData.data[i + 1] = glitch ? 194 : v;
        imgData.data[i + 2] = glitch ? 255 : v;
        imgData.data[i + 3] = 255 * (1 - settleFactor * 0.85);
      }
      bufferCtx.putImageData(imgData, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buffer, 0, 0, sw, sh, 0, 0, w, h);
      staticRAF = requestAnimationFrame(draw);
    }
    draw();

    startStatic._resize = resize;
  }
  function stopStatic() {
    if (staticRAF) cancelAnimationFrame(staticRAF);
    if (startStatic._resize) window.removeEventListener("resize", startStatic._resize);
  }

  /* ---------------------------------------------------------
     STICKY NAV — mobile toggle + active link + smooth close
  --------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     SCROLL REVEAL — fade/slide sections in as they enter view
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    ".release-card, .program-slot, .now-playing-card, .character-media, .character-copy, .social-grid"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------------------------------------------------------
     FOOTER YEAR
  --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     TRANSMIT FORM — placeholder submit handling
     Swap the fetch/action below for Formspree / Netlify Forms / your API.
  --------------------------------------------------------- */
  var form = document.querySelector(".transmit-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      var original = btn.textContent;
      btn.textContent = "SIGNAL SENT ✓";
      form.reset();
      setTimeout(function () { btn.textContent = original; }, 2400);
      // PLACEHOLDER: replace this alert-free stub with a real POST to your form endpoint.
    });
  }
})();
