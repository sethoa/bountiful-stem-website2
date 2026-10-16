(function () {
  "use strict";

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
        toggle.focus();
      }
    });
  }

  // Dropdown menus (tap on mobile, hover or tap on desktop)
  document.querySelectorAll(".sub-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sub = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") !== "true";
      document.querySelectorAll(".sub-toggle").forEach(function (other) {
        if (other !== btn) {
          other.setAttribute("aria-expanded", "false");
          document.getElementById(other.getAttribute("aria-controls")).classList.remove("open");
        }
      });
      btn.setAttribute("aria-expanded", String(open));
      sub.classList.toggle("open", open);
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-sub")) {
      document.querySelectorAll(".sub-toggle").forEach(function (b) {
        b.setAttribute("aria-expanded", "false");
        document.getElementById(b.getAttribute("aria-controls")).classList.remove("open");
      });
    }
  });

  // YouTube: show a lightweight thumbnail, load the player only when clicked
  document.querySelectorAll(".video[data-yt]").forEach(function (box) {
    var btn = box.querySelector(".video-play");
    btn.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + box.getAttribute("data-yt") + "?autoplay=1&rel=0";
      iframe.title = box.getAttribute("data-title");
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      box.innerHTML = "";
      box.appendChild(iframe);
    });
  });

  // Theme: system -> light -> dark
  var root = document.documentElement;
  var themeBtn = document.querySelector("[data-theme-toggle]");
  var order = ["system", "light", "dark"];
  function applyTheme(t) {
    if (t === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", t);
    if (themeBtn) themeBtn.textContent = "Theme: " + t;
  }
  var saved = "system";
  try { saved = localStorage.getItem("bs-theme") || "system"; } catch (e) {}
  applyTheme(saved);
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      saved = order[(order.indexOf(saved) + 1) % order.length];
      applyTheme(saved);
      try { localStorage.setItem("bs-theme", saved); } catch (e) {}
    });
  }

  // Copy email
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = btn.parentElement.querySelector("[data-copy-text]");
      if (!el) return;
      var text = el.textContent.trim();
      function selectFallback() {
        var r = document.createRange();
        r.selectNodeContents(el);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        btn.textContent = "Selected";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { btn.textContent = "Copied"; }, selectFallback);
      } else {
        selectFallback();
      }
    });
  });

  // Contact form: preselect topic from ?topic=, then hand off to the visitor's email app.
  // To receive messages without email apps, set data-endpoint on the form to a form service URL
  // (e.g. Formspree), and messages will be posted there instead.
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var params = new URLSearchParams(location.search);
    var topic = params.get("topic");
    var select = form.querySelector("#cf-topic");
    if (topic && select && select.querySelector('option[value="' + topic + '"]')) select.value = topic;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();
      if (!name || !email || !message || !form.email.checkValidity()) {
        status.textContent = "Please fill in your name, a valid email address and a message.";
        return;
      }
      var topicLabel = select.options[select.selectedIndex].text;
      var endpoint = form.getAttribute("data-endpoint");
      if (endpoint) {
        status.textContent = "Sending…";
        fetch(endpoint, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
          .then(function (r) {
            if (!r.ok) throw new Error();
            form.reset();
            status.textContent = "Thank you. Your message has been sent and we'll reply soon.";
          })
          .catch(function () {
            status.textContent = "Your message couldn't be sent. Please email us directly at " + form.getAttribute("data-email") + ".";
          });
        return;
      }
      var subject = encodeURIComponent("Website enquiry: " + topicLabel);
      var body = encodeURIComponent(message + "\n\n" + name + "\n" + email);
      location.href = "mailto:" + form.getAttribute("data-email") + "?subject=" + subject + "&body=" + body;
      status.textContent = "Your email app should open with the message ready to send. If it doesn't, email us at " + form.getAttribute("data-email") + ".";
    });
  }
})();
