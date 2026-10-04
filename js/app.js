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
    els.title.textContent = name === "checkout" ? "เช็กเอาต์" : name === "done" ? "ขอบคุณที่สั่งซื้อสินค้า" : "ตะกร้า";
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
    ensureOrderRef();
    var nameInput = $("#cust-name");
    nameInput.focus();
    var panel = $("#view-checkout");
    if (panel && panel.scrollTo) panel.scrollTo(0, 0);
  });
  els.backCart.addEventListener("click", function () { showView("cart"); });

  var sending = false;
  var orderRef = "";
  var slipOrder = null;

  function ensureOrderRef() {
    if (!orderRef) {
      try { orderRef = sessionStorage.getItem("sudgreeek-order-ref") || ""; } catch (e) {}
    }
    if (!orderRef || !/^SG-\d+$/.test(orderRef)) {
      orderRef = "SG-" + String(Date.now()).slice(-4);
      try { sessionStorage.setItem("sudgreeek-order-ref", orderRef); } catch (e) {}
    }
    var code = $("#order-code");
    if (code) code.textContent = orderRef;
    return orderRef;
  }


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
  }

  function showSendError(msg) {
    var sendErr = $("#err-send");
    if (sendErr) {
      sendErr.textContent = msg;
      if (sendErr.scrollIntoView) sendErr.scrollIntoView({ block: "center" });
    }
    toast(msg);
  }

  function finishOrder(ref, name, totalText, phone, items) {
    slipOrder = {
      ref: ref,
      name: name || "",
      phone: phone || "",
      total: totalText || "",
      items: items || ""
    };
    var code = $("#order-code");
    if (code) code.textContent = ref;
    showView("done");
    clearCartAfterSend();
    var done = $("#view-done");
    if (done && done.scrollTo) done.scrollTo(0, 0);
  }

  function bangkokDate() {
    try {
      var formatted = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
    } catch (e) {}
    var shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return shifted.getUTCFullYear() + "-" + pad(shifted.getUTCMonth() + 1) + "-" + pad(shifted.getUTCDate());
  }

  function placeOrder(e) {
    var ORDER_SHEET_URL = "";
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
    var t = totals();
    var ref = ensureOrderRef();
    var totalText = money(t.total);
    try {
      sessionStorage.setItem("sudgreeek-pending-order", JSON.stringify({
        ref: ref,
        name: name,
        phone: phone,
        total: totalText,
        items: orderLines()
      }));
    } catch (err) {
      showSendError("บันทึกออเดอร์ในเบราว์เซอร์ไม่ได้ ลองใหม่นะ ตะกร้ายังอยู่");
      return;
    }
    var menu = orderLines();
    var qty = 0;
    for (var qi = 0; qi < cart.length; qi++) qty += Number(cart[qi].qty) || 0;
    if (!qty) qty = 1;
    $("#f-subject").value = "SUDGREEEK order " + ref;
    $("#f-next").value = "";
    $("#f-items").value = menu;
    $("#f-subtotal").value = money(t.subtotal);
    $("#f-discount").value = money(t.discount);
    $("#f-delivery").value = money(t.delivery);
    $("#f-total").value = totalText;
    $("#cust-name").value = name;
    $("#cust-phone").value = phone;
    sending = true;
    var submitBtn = $("#checkout-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังส่ง...";
    orderRef = "";
    try { sessionStorage.removeItem("sudgreeek-order-ref"); } catch (e) {}
    els.form.action = "https://formsubmit.co/sudgreek@gmail.com";
    els.form.method = "post";
    els.form.target = "checkout-sink";
    els.form.submit();
    if (ORDER_SHEET_URL) {
      try {
        fetch(ORDER_SHEET_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            date: bangkokDate(),
            ref: ref,
            menu: menu,
            qty: qty,
            price: t.total
          })
        }).catch(function () {});
      } catch (sheetErr) {}
    }
    finishOrder(ref, name, totalText, phone, menu);
  }

  els.form.addEventListener("submit", placeOrder);
  var lineSlip = $("#line-slip");
  if (lineSlip) lineSlip.addEventListener("click", function () {
    if (!slipOrder || !slipOrder.ref) return;
    var parts = ["รหัสออเดอร์ " + slipOrder.ref, "ยอด " + slipOrder.total];
    if (slipOrder.name) parts.push("ชื่อ " + slipOrder.name);
    if (slipOrder.phone) parts.push("เบอร์ " + slipOrder.phone);
    if (slipOrder.items) parts.push(slipOrder.items);
    parts.push("ส่งสลิปการโอนในแชทนี้");
    var url = "https://line.me/R/oaMessage/@816tejgh/?" + encodeURIComponent(parts.join("\n"));
    window.location.href = url;
  });
  if (els.doneHome) els.doneHome.addEventListener("click", function () {
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

  function resumeOrder() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    var ref = params.get("order");
    if (!ref || !/^SG-\d+$/.test(ref)) return;
    var pending = null;
    try { pending = JSON.parse(sessionStorage.getItem("sudgreeek-pending-order") || "null"); } catch (e) {}
    if (!pending || pending.ref !== ref) return;
    try { sessionStorage.removeItem("sudgreeek-pending-order"); } catch (e) {}
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
    finishOrder(ref, pending.name || "", pending.total || "", pending.phone || "", pending.items || "");
    openDrawer("done");
  }

  (function slides() {
    var box = document.querySelector(".shop-slides");
    if (!box) return;
    var pics = Array.prototype.slice.call(box.querySelectorAll("img"));
    if (pics.length < 2) return;
    var i = 0;
    var timer = 0;
    function show(n) {
      i = (n + pics.length) % pics.length;
      pics.forEach(function (img, idx) { img.classList.toggle("on", idx === i); });
    }
    function arm() {
      clearInterval(timer);
      timer = setInterval(function () { show(i + 1); }, 3500);
    }
    var prev = document.getElementById("slide-prev");
    var next = document.getElementById("slide-next");
    if (prev) prev.addEventListener("click", function () { show(i - 1); arm(); });
    if (next) next.addEventListener("click", function () { show(i + 1); arm(); });
    arm();
  })();

  load();
  if (promo) els.promoInput.value = promo;
  renderCart();
  renderBuilder();
  resumeOrder();
})();
