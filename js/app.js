(function () {
  var KEY = "sudgreeek-cart-v1";
  var DELIVERY = 40;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  var els = {
    q: $("#q"),
    cards: $("#sig-grid"),
    empty: $("#search-empty"),
    count: $("#cart-count"),
    cartBtn: $("#cart-btn"),
    drawer: $("#drawer"),
    overlay: $("#overlay"),
    close: $("#drawer-close"),
    title: $("#drawer-title"),
    lines: $("#cart-lines"),
    cartEmpty: $("#cart-empty"),
    subtotal: $("#subtotal"),
    discountRow: $("#discount-row"),
    discount: $("#discount"),
    delivery: $("#delivery"),
    grand: $("#grand"),
    promoInput: $("#promo-input"),
    promoApply: $("#promo-apply"),
    promoMsg: $("#promo-msg"),
    promoClear: $("#promo-clear"),
    goCheckout: $("#go-checkout"),
    viewCart: $("#view-cart"),
    viewCheckout: $("#view-checkout"),
    viewDone: $("#view-done"),
    backCart: $("#back-cart"),
    form: $("#checkout-form"),
    summary: $("#checkout-summary"),
    doneText: $("#done-text"),
    doneHome: $("#done-home"),
    addCustom: $("#add-custom"),
    buildEmpty: $("#build-empty"),
    buildLines: $("#build-lines"),
    buildTotalRow: $("#build-total-row"),
    buildTotal: $("#build-total"),
    toast: $("#toast"),
    builder: $("#builder")
  };

  var cart = [];
  var promo = null;
  var toastTimer = 0;
  var searchScrolled = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) {
    return "฿" + Number(n).toLocaleString("en-US");
  }

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && Array.isArray(raw.cart)) {
        cart = raw.cart.filter(function (i) {
          return i && i.id && typeof i.price === "number" && i.qty > 0;
        });
        promo = raw.promo === "GREEK10" ? "GREEK10" : null;
      }
    } catch (e) {
      cart = [];
      promo = null;
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ cart: cart, promo: promo }));
    } catch (e) {}
  }

  function totals() {
    var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var discount = promo === "GREEK10" ? Math.round(subtotal * 0.1) : 0;
    var delivery = subtotal > 0 ? DELIVERY : 0;
    var total = Math.max(0, subtotal - discount) + delivery;
    return { subtotal: subtotal, discount: discount, delivery: delivery, total: total };
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove("show"); }, 1600);
  }

  function addItem(item) {
    var found = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === item.id) found = cart[i];
    }
    if (found) found.qty = Math.min(20, found.qty + 1);
    else cart.push({
      id: item.id,
      name: item.name,
      detail: item.detail || "",
      price: item.price,
      img: item.img || "",
      qty: 1
    });
    save();
    renderCart();
    toast("ใส่ตะกร้าแล้ว");
  }

  function renderCheckoutSummary() {
    var t = totals();
    if (!cart.length) {
      els.summary.innerHTML = "<p>ตะกร้าว่าง</p>";
      return;
    }
    var rows = cart.map(function (i) {
      return "<li><span>" + esc(i.name) + " × " + i.qty + "</span><span>" + money(i.price * i.qty) + "</span></li>";
    }).join("");
    var discountRow = t.discount
      ? '<div class="sum-row"><span>ส่วนลด GREEK10</span><span>−' + money(t.discount) + "</span></div>"
      : "";
    els.summary.innerHTML =
      '<ul class="sum-list">' + rows + "</ul>" +
      '<div class="sum-row"><span>รวมอาหาร</span><span>' + money(t.subtotal) + "</span></div>" +
      discountRow +
      '<div class="sum-row"><span>ค่าจัดส่ง</span><span>' + money(t.delivery) + "</span></div>" +
      '<div class="sum-row grand"><span>ยอดสุทธิ</span><span>' + money(t.total) + "</span></div>";
    var payTotal = $("#pay-total");
    if (payTotal) payTotal.textContent = money(t.total);
  }

  function renderCart() {
    var n = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    els.count.textContent = n > 99 ? "99+" : String(n);
    els.cartBtn.setAttribute("aria-label", "เปิดตะกร้า " + n + " รายการ");
    var t = totals();
    els.cartEmpty.hidden = cart.length !== 0;
    els.lines.innerHTML = cart.map(function (item, idx) {
      var thumb = item.img
        ? '<img src="' + esc(item.img) + '" alt="" width="64" height="64">'
        : '<div class="line-fallback" aria-hidden="true">🥛</div>';
      return (
        '<article class="line">' + thumb +
        '<div class="line-info"><h3>' + esc(item.name) + "</h3><p>" + esc(item.detail || "") + "</p>" +
        '<div class="qty">' +
        '<button type="button" data-act="dec" data-idx="' + idx + '" aria-label="ลดจำนวน ' + esc(item.name) + '">−</button>' +
        "<span>" + item.qty + "</span>" +
        '<button type="button" data-act="inc" data-idx="' + idx + '" aria-label="เพิ่มจำนวน ' + esc(item.name) + '">+</button>' +
        "</div></div>" +
        '<div class="line-end"><strong>' + money(item.price * item.qty) + "</strong>" +
        '<button type="button" class="text-btn" data-act="remove" data-idx="' + idx + '">ลบ</button></div></article>'
      );
    }).join("");
    els.subtotal.textContent = money(t.subtotal);
    els.discount.textContent = "−" + money(t.discount);
    els.discountRow.hidden = !(promo === "GREEK10" && t.discount > 0);
    els.delivery.textContent = money(t.delivery);
    els.grand.textContent = money(t.total);
    if (els.goCheckout) {
      els.goCheckout.disabled = cart.length === 0;
      els.goCheckout.setAttribute("aria-disabled", cart.length ? "false" : "true");
    }
    if (promo === "GREEK10") {
      els.promoMsg.textContent = "ใช้โค้ด GREEK10 แล้ว ลด 10% จากค่าอาหาร ไม่รวมค่าจัดส่ง";
      els.promoMsg.className = "promo-msg ok";
      els.promoClear.hidden = false;
    } else {
      els.promoClear.hidden = true;
    }
    renderCheckoutSummary();
  }

  function openDrawer(view) {
    showView(view || "cart");
    els.drawer.classList.add("open");
    els.drawer.setAttribute("aria-hidden", "false");
    els.overlay.hidden = false;
    els.cartBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("noscroll");
    els.close.focus();
  }

  function closeDrawer() {
    els.drawer.classList.remove("open");
    els.drawer.setAttribute("aria-hidden", "true");
    els.overlay.hidden = true;
    els.cartBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("noscroll");
    els.cartBtn.focus();
  }

  function showView(name) {
    els.viewCart.hidden = name !== "cart";
    els.viewCheckout.hidden = name !== "checkout";
    els.viewDone.hidden = name !== "done";
    els.title.textContent = name === "checkout" ? "เช็กเอาต์" : name === "done" ? "รับออเดอร์แล้ว" : "ตะกร้า";
    if (name === "checkout") renderCheckoutSummary();
  }

  els.q.addEventListener("input", function () {
    var query = els.q.value.trim().toLowerCase();
    var shown = 0;
    $all(".card", els.cards).forEach(function (card) {
      var hay = (card.getAttribute("data-q") || "").toLowerCase();
      var ok = !query || hay.indexOf(query) !== -1;
      card.hidden = !ok;
      if (ok) shown++;
    });
    els.empty.hidden = shown !== 0;
    if (query && !searchScrolled) {
      $("#signature").scrollIntoView({ behavior: "smooth", block: "start" });
      searchScrolled = true;
    }
    if (!query) searchScrolled = false;
  });

  $("#search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    $("#signature").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.cards.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-add");
    if (!btn) return;
    addItem({
      id: btn.dataset.id,
      name: btn.dataset.name,
      detail: btn.dataset.detail,
      price: Number(btn.dataset.price),
      img: btn.dataset.img
    });
  });

  els.lines.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var idx = Number(btn.dataset.idx);
    var item = cart[idx];
    if (!item) return;
    if (btn.dataset.act === "inc") item.qty = Math.min(20, item.qty + 1);
    if (btn.dataset.act === "dec") item.qty -= 1;
    if (btn.dataset.act === "remove" || item.qty <= 0) cart.splice(idx, 1);
    save();
    renderCart();
  });

  function applyPromo() {
    var code = els.promoInput.value.trim().toUpperCase();
    if (!code) {
      els.promoMsg.textContent = "พิมพ์โค้ดก่อนนะ";
      els.promoMsg.className = "promo-msg bad";
      return;
    }
    if (code !== "GREEK10") {
      promo = null;
      save();
      renderCart();
      els.promoMsg.textContent = "โค้ดนี้ใช้ไม่ได้";
      els.promoMsg.className = "promo-msg bad";
      return;
    }
    promo = "GREEK10";
    save();
    renderCart();
  }

  els.promoApply.addEventListener("click", applyPromo);
  els.promoInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyPromo();
    }
  });
  els.promoClear.addEventListener("click", function () {
    promo = null;
    els.promoInput.value = "";
    els.promoMsg.textContent = "";
    els.promoMsg.className = "promo-msg";
    save();
    renderCart();
  });

  els.cartBtn.addEventListener("click", function () { openDrawer("cart"); });
  els.close.addEventListener("click", closeDrawer);
  els.overlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && els.drawer.classList.contains("open")) closeDrawer();
  });

  els.goCheckout.addEventListener("click", function () {
    if (!cart.length) {
      toast("ตะกร้ายังว่าง เลือกโยเกิร์ตก่อนนะ");
      return;
    }
    showView("checkout");
    var nameInput = $("#cust-name");
    nameInput.focus();
    var panel = $("#view-checkout");
    if (panel && panel.scrollTo) panel.scrollTo(0, 0);
  });
  els.backCart.addEventListener("click", function () { showView("cart"); });

  var sending = false;

  function orderLines() {
    return cart.map(function (i) {
      var bit = i.name + " × " + i.qty + " " + money(i.price * i.qty);
      return i.detail ? bit + " (" + i.detail + ")" : bit;
    }).join("\n");
  }

  function clearCartAfterSend() {
    cart = [];
    promo = null;
    els.promoInput.value = "";
    els.promoMsg.textContent = "";
    els.form.reset();
    save();
    renderCart();
    syncSlip();
  }

  function showSendError(msg) {
    var sendErr = $("#err-send");
    if (sendErr) {
      sendErr.textContent = msg;
      if (sendErr.scrollIntoView) sendErr.scrollIntoView({ block: "center" });
    }
    toast(msg);
  }

  function needsEmailConfirm(body) {
    var msg = String((body && body.message) || "").toLowerCase();
    return /activat|confirm your email|verify your email|not been activated|needs to be confirmed/.test(msg);
  }

  function finishOrder(ref, name, totalText, pendingConfirm) {
    var extra = pendingConfirm
      ? "<br>ร้านต้องกดยืนยันอีเมลครั้งเดียวก่อน ออเดอร์นี้รับไว้แล้ว"
      : "<br>ส่งออเดอร์ไปที่อีเมลร้านแล้ว";
    els.doneText.innerHTML =
      "เลขที่ <strong>" + esc(ref) + "</strong><br>ชื่อ " + esc(name) +
      "<br>ยอดรวม <span class=\"money\">" + totalText + "</span>" +
      extra;
    showView("done");
    clearCartAfterSend();
    var done = $("#view-done");
    if (done && done.scrollTo) done.scrollTo(0, 0);
  }

  function placeOrder(e) {
    if (e) e.preventDefault();
    if (sending) return;
    var nameErr = $("#err-name");
    var phoneErr = $("#err-phone");
    var sendErr = $("#err-send");
    if (sendErr) sendErr.textContent = "";
    if (!cart.length) {
      showSendError("ตะกร้ายังว่าง เลือกสินค้าก่อนนะ");
      return;
    }
    var data = new FormData(els.form);
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("phone") || "").trim();
    var note = String(data.get("note") || "").trim();
    var digits = phone.replace(/\D/g, "");
    var ok = true;
    if (name.length < 2) {
      nameErr.textContent = "กรอกชื่อด้วยนะ";
      ok = false;
    } else nameErr.textContent = "";
    if (digits.length < 9 || digits.length > 15) {
      phoneErr.textContent = "กรอกเบอร์โทรให้ครบหน่อย";
      ok = false;
    } else phoneErr.textContent = "";
    if (!ok) {
      (name.length < 2 ? $("#cust-name") : $("#cust-phone")).focus();
      return;
    }
    var slipErr = $("#err-slip");
    var slip = selectedSlip();
    if (!slip) {
      if (slipErr) slipErr.textContent = "อัปโหลดรูปสลิปก่อนยืนยันนะ";
      var slipInput = $("#slip");
      if (slipInput) slipInput.focus();
      syncSlip();
      return;
    }
    if (slipErr) slipErr.textContent = "";
    var t = totals();
    var ref = "SG-" + String(Date.now()).slice(-4);
    var totalText = money(t.total);
    var submitBtn = $("#checkout-submit");
    var payload = new FormData();
    payload.append("_subject", "SUDGREEEK order " + ref);
    payload.append("_template", "table");
    payload.append("_captcha", "false");
    payload.append("name", name);
    payload.append("phone", phone);
    payload.append("note", note);
    payload.append("items", orderLines());
    payload.append("subtotal", money(t.subtotal));
    payload.append("discount", money(t.discount));
    payload.append("delivery", money(40));
    payload.append("total", totalText);
    payload.append("slip_filename", slip.name);
    var slipAttached = false;
    try {
      payload.append("attachment", slip, slip.name);
      var stored = typeof payload.get === "function" ? payload.get("attachment") : slip;
      slipAttached = !!(stored && stored.size === slip.size && stored.name === slip.name);
    } catch (err) {
      slipAttached = false;
    }
    if (!slipAttached) {
      showSendError("แนบสลิปไม่สำเร็จ ลองเลือกรูปใหม่ ตะกร้ายังอยู่");
      return;
    }
    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังส่ง...";
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    fetch("https://formsubmit.co/ajax/sudgreek@gmail.com", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: payload,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var body = {};
        try { body = text ? JSON.parse(text) : {}; } catch (err) { body = { message: text }; }
        body._status = res.status;
        return body;
      });
    }).then(function (body) {
      var success = body && (body.success === true || body.success === "true");
      if (success) {
        finishOrder(ref, name, totalText, false);
        return;
      }
      if (needsEmailConfirm(body)) {
        finishOrder(ref, name, totalText, true);
        return;
      }
      var rate = /rate limit/i.test(String(body && body.message || ""));
      showSendError(rate
        ? "ส่งถี่เกินไป รอสักครู่แล้วลองใหม่ ตะกร้ายังอยู่"
        : "ส่งออเดอร์ไม่สำเร็จ ลองอีกครั้งนะ ตะกร้ายังอยู่");
    }).catch(function () {
      showSendError("ส่งออเดอร์ไม่สำเร็จ ลองอีกครั้งนะ ตะกร้ายังอยู่");
    }).then(function () {
      clearTimeout(timer);
      sending = false;
      if (submitBtn) submitBtn.textContent = "ยืนยันออเดอร์";
      syncSlip();
    });
  }


  function selectedSlip() {
    var input = $("#slip");
    if (!input || !input.files || !input.files[0]) return null;
    var file = input.files[0];
    if (file.size > 9 * 1024 * 1024) return null;
    if (file.type && file.type.indexOf("image/") !== 0) return null;
    if (!file.type && !/\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name)) return null;
    return file;
  }

  function syncSlip() {
    var btn = $("#checkout-submit");
    var input = $("#slip");
    var err = $("#err-slip");
    var raw = input && input.files && input.files[0];
    var file = selectedSlip();
    if (err && raw && !file) {
      err.textContent = raw.size > 9 * 1024 * 1024
        ? "ไฟล์ใหญ่เกิน 9MB เลือกรูปที่เล็กลง"
        : "ใช้ไฟล์รูปภาพเท่านั้น";
    } else if (err && !sending) {
      err.textContent = "";
    }
    if (btn && !sending) btn.disabled = !file;
  }

  els.form.addEventListener("submit", placeOrder);
  $("#checkout-submit").addEventListener("click", placeOrder);
  var slipInput = $("#slip");
  if (slipInput) slipInput.addEventListener("change", syncSlip);

  els.doneHome.addEventListener("click", function () {
    closeDrawer();
    $("#signature").scrollIntoView({ behavior: "smooth" });
  });

  function checked(name) {
    return $all('input[name="' + name + '"]:checked');
  }

  function basePriceFor(base, size) {
    if (!base || !size) return 0;
    return Number(size.value === "120" ? base.dataset.p120 : base.dataset.p80);
  }

  function readBuilder() {
    var size = $('input[name="size"]:checked');
    var base = $('input[name="base"]:checked');
    var toppings = checked("topping");
    var lines = [];
    var price = 0;
    if (size) lines.push({ label: "ขนาด " + size.dataset.label, price: null, extra: false });
    if (base && size) {
      var basePrice = basePriceFor(base, size);
      price += basePrice;
      lines.push({ label: base.dataset.label + " " + size.dataset.label, price: basePrice, extra: false });
    } else if (base) {
      lines.push({ label: base.dataset.label, price: null, extra: false });
    }
    toppings.forEach(function (f) {
      var extra = Number(f.dataset.price);
      price += extra;
      lines.push({ label: f.dataset.label, price: extra, extra: true });
    });
    var id = [
      "custom",
      size ? size.value : "-",
      base ? base.value : "-",
      toppings.map(function (f) { return f.value; }).sort().join("+")
    ].join("|");
    return { size: size, base: base, lines: lines, price: price, ready: !!(size && base), id: id };
  }

  function renderBuilder() {
    var size = $('input[name="size"]:checked');
    $all('input[name="base"]').forEach(function (input) {
      var priceEl = input.parentNode.querySelector(".pick-price");
      if (!priceEl) return;
      if (!size) {
        priceEl.textContent = "80g " + money(input.dataset.p80) + " · 120g " + money(input.dataset.p120);
      } else {
        priceEl.textContent = money(basePriceFor(input, size));
      }
    });
    var b = readBuilder();
    els.addCustom.disabled = !b.ready;
    els.buildEmpty.hidden = b.ready;
    if (!b.size && !b.base) els.buildEmpty.textContent = "เลือกขนาดและเนื้อกรีกก่อน";
    else if (!b.size) els.buildEmpty.textContent = "เลือกขนาดก่อน";
    else if (!b.base) els.buildEmpty.textContent = "เลือกเนื้อกรีกก่อน";
    els.buildLines.innerHTML = b.lines.map(function (line) {
      var shown = line.price == null ? "" : (line.extra ? "+" : "") + money(line.price);
      return "<li><span>" + esc(line.label) + "</span><span>" + shown + "</span></li>";
    }).join("");
    els.buildTotalRow.hidden = !b.ready;
    if (b.ready) els.buildTotal.textContent = money(b.price);
  }

  els.builder.addEventListener("change", renderBuilder);

  els.addCustom.addEventListener("click", function () {
    var b = readBuilder();
    if (!b.ready) return;
    var detailParts = b.lines.filter(function (line) { return line.extra; }).map(function (line) { return line.label; });
    addItem({
      id: b.id,
      name: "จัดเซ็ตเอง · " + b.base.dataset.label + " " + b.size.dataset.label,
      detail: detailParts.join(" · "),
      price: b.price,
      img: b.base.value === "biscoff" ? "img/biscoff.jpg" : "img/plain.jpg"
    });
  });

  var sections = ["top", "signature", "builder", "about"];
  var navLinks = $all(".nav a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute("href") === "#" + entry.target.id) a.setAttribute("aria-current", "page");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0.01 });
    sections.forEach(function (id) {
      var node = document.getElementById(id);
      if (node) io.observe(node);
    });
  }

  els.drawer.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !els.drawer.classList.contains("open")) return;
    var focusables = $all("button, a, input, textarea", els.drawer).filter(function (el) {
      return !el.disabled && !el.closest("[hidden]");
    });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  load();
  if (promo) els.promoInput.value = promo;
  renderCart();
  renderBuilder();
})();
