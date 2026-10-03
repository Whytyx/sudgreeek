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
      '<div class="sum-row"><span>ค่าจัดส่งตัวอย่าง</span><span>' + money(t.delivery) + "</span></div>" +
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
    els.goCheckout.disabled = cart.length === 0;
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
    els.title.textContent = name === "checkout" ? "เช็กเอาต์ตัวอย่าง" : name === "done" ? "เรียบร้อย" : "ตะกร้า";
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
    if (!cart.length) return;
    showView("checkout");
    $("#cust-name").focus();
  });
  els.backCart.addEventListener("click", function () { showView("cart"); });

  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cart.length) return;
    var data = new FormData(els.form);
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("phone") || "").trim();
    var note = String(data.get("note") || "").trim();
    var digits = phone.replace(/\D/g, "");
    var ok = true;
    var nameErr = $("#err-name");
    var phoneErr = $("#err-phone");
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
    var ref = "SG-" + String(Date.now()).slice(-4);
    els.doneText.innerHTML =
      "เลขที่ตัวอย่าง <strong>" + esc(ref) + "</strong> ของคุณ " + esc(name) +
      "<br>ยอดตัวอย่าง " + money(t.total) +
      (note ? "<br>โน้ต: " + esc(note) : "") +
      "<br><br>นี่เป็นตัวอย่างการสั่งเท่านั้น ยังไม่ได้เชื่อมกับร้านจริง ไม่มีการเรียกเก็บเงิน และไม่ได้ส่งออเดอร์ไปที่ใด";
    cart = [];
    promo = null;
    els.promoInput.value = "";
    els.promoMsg.textContent = "";
    nameErr.textContent = "";
    phoneErr.textContent = "";
    els.form.reset();
    save();
    renderCart();
    showView("done");
  });

  els.doneHome.addEventListener("click", function () {
    closeDrawer();
    $("#signature").scrollIntoView({ behavior: "smooth" });
  });

  function checked(name) {
    return $all('input[name="' + name + '"]:checked');
  }

  function readBuilder() {
    var size = $('input[name="size"]:checked');
    var toppings = checked("topping");
    var lines = [];
    var price = 0;
    if (size) {
      var basePrice = Number(size.dataset.price);
      price += basePrice;
      lines.push({ label: size.dataset.label, price: basePrice, extra: false });
    }
    toppings.forEach(function (f) {
      var extra = Number(f.dataset.price);
      price += extra;
      lines.push({ label: f.dataset.label, price: extra, extra: true });
    });
    var id = [
      "custom",
      size ? size.value : "-",
      toppings.map(function (f) { return f.value; }).sort().join("+")
    ].join("|");
    return { size: size, lines: lines, price: price, ready: !!size, id: id };
  }

  function renderBuilder() {
    var b = readBuilder();
    els.addCustom.disabled = !b.ready;
    els.buildEmpty.hidden = b.lines.length > 0 && !!b.size;
    if (!b.size) els.buildEmpty.textContent = "เลือกขนาดกะปุกก่อน";
    els.buildLines.innerHTML = b.lines.map(function (line) {
      var shown = (line.extra ? "+" : "") + money(line.price);
      return "<li><span>" + esc(line.label) + "</span><span>" + shown + "</span></li>";
    }).join("");
    els.buildTotalRow.hidden = !b.size;
    if (b.size) els.buildTotal.textContent = money(b.price);
  }

  els.builder.addEventListener("change", renderBuilder);

  els.addCustom.addEventListener("click", function () {
    var b = readBuilder();
    if (!b.ready) return;
    var detailParts = b.lines.filter(function (line) { return line.extra; }).map(function (line) { return line.label; });
    addItem({
      id: b.id,
      name: "จัดเซ็ตเอง · " + b.size.dataset.label,
      detail: detailParts.join(" · "),
      price: b.price,
      img: ""
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
