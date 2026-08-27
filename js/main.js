(function () {
  var doc = document;
  var body = doc.body;
  var CART_KEY = "dondurma-cart-v1";
  var USER_KEY = "dondurma-user-v1";
  var KONTO_KEY = "dd-konto-v1";

  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
    body.classList.add("is-touch");
  }

  var cursor = doc.createElement("div");
  cursor.className = "dd-cursor";
  var ring = doc.createElement("div");
  ring.className = "dd-cursor-ring";
  if (!body.classList.contains("is-touch")) {
    body.appendChild(cursor);
    body.appendChild(ring);
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var rx = x;
    var ry = y;
    window.addEventListener("mousemove", function (event) {
      x = event.clientX;
      y = event.clientY;
      cursor.style.left = x + "px";
      cursor.style.top = y + "px";
    }, { passive: true });
    (function follow() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      window.requestAnimationFrame(follow);
    }());
    doc.querySelectorAll("a, button, input, textarea, label").forEach(function (node) {
      node.addEventListener("mouseenter", function () { ring.classList.add("is-hot"); });
      node.addEventListener("mouseleave", function () { ring.classList.remove("is-hot"); });
    });
  }

  var sky = doc.querySelector("[data-sky]");
  if (sky) {
    var i;
    for (i = 0; i < 7; i += 1) {
      var scoop = doc.createElement("span");
      scoop.className = "scoop";
      scoop.style.left = (6 + i * 13) + "%";
      scoop.style.animationDelay = (i * -1.8) + "s";
      scoop.style.animationDuration = (13 + i) + "s";
      sky.appendChild(scoop);
    }
    for (i = 0; i < 22; i += 1) {
      var sprinkle = doc.createElement("span");
      sprinkle.className = "sprinkle";
      sprinkle.style.left = Math.round(Math.random() * 100) + "%";
      sprinkle.style.top = Math.round(Math.random() * 80) + "%";
      sprinkle.style.animationDelay = (-Math.random() * 10) + "s";
      sky.appendChild(sprinkle);
    }
  }

  var heroMedia = doc.querySelector("[data-parallax]");
  if (heroMedia && !body.classList.contains("is-touch")) {
    window.addEventListener("mousemove", function (event) {
      var px = (event.clientX / window.innerWidth - 0.5) * 12;
      var py = (event.clientY / window.innerHeight - 0.5) * 8;
      heroMedia.style.transform = "translate3d(" + px + "px," + py + "px,0)";
    }, { passive: true });
  }

  function reveal() {
    doc.querySelectorAll(".reveal, .card").forEach(function (node) {
      if (node.getBoundingClientRect().top < window.innerHeight - 48) {
        node.classList.add("is-visible");
      }
    });
  }
  reveal();
  window.addEventListener("scroll", reveal, { passive: true });

  function pageHref(sourceKey, fallback) {
    var link = doc.querySelector('a[data-lw-page-ref="' + sourceKey + '"]');
    if (link && link.getAttribute("href")) return link.href;
    return fallback;
  }
  function cardImageFromButton(button) {
    var card = button.closest("[data-region], article, .card, section");
    var img = card && card.querySelector("img");
    if (img && (img.currentSrc || img.src)) return img.currentSrc || img.src;
    return button.getAttribute("data-tour-image") || "";
  }
  function readCart() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  function writeCart(items) {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    paintCartCount();
    paintCartPage();
  }
  function cartCount() {
    return readCart().reduce(function (sum, item) { return sum + (item.qty || 0); }, 0);
  }
  function paintCartCount() {
    doc.querySelectorAll("[data-basket-count]").forEach(function (node) {
      node.textContent = String(cartCount());
      node.classList.remove("is-pop");
      void node.offsetWidth;
      node.classList.add("is-pop");
    });
  }
  function addTour(tour) {
    var items = readCart();
    var found = items.find(function (item) { return item.id === tour.id; });
    if (found) {
      found.qty += 1;
      if (tour.image) found.image = tour.image;
    } else {
      items.push({ id: tour.id, title: tour.title, price: tour.price, image: tour.image, qty: 1 });
    }
    writeCart(items);
  }
  doc.querySelectorAll("[data-add]").forEach(function (button) {
    button.addEventListener("click", function () {
      addTour({
        id: button.getAttribute("data-add") || "",
        title: button.getAttribute("data-tour-title") || "Kugel",
        price: Number(button.getAttribute("data-tour-price") || 0),
        image: cardImageFromButton(button)
      });
    });
  });

  function paintCartPage() {
    var root = doc.querySelector("[data-cart-root]");
    if (!root) return;
    var items = readCart();
    var empty = root.querySelector("[data-cart-empty]");
    var list = root.querySelector("[data-cart-list]");
    var total = root.querySelector("[data-cart-total]");
    if (!items.length) {
      if (empty) empty.hidden = false;
      if (list) list.innerHTML = "";
      if (total) total.textContent = "0 Euro";
      return;
    }
    if (empty) empty.hidden = true;
    if (list) {
      list.innerHTML = items.map(function (item) {
        return '<article class="cart-item">' +
          (item.image ? '<img src="' + item.image + '" alt="">' : "<div></div>") +
          "<div><strong>" + item.title + "</strong><p class='meta'>" + item.price + " Euro je Becher</p>" +
          "<div class='qty'><button type='button' data-qty='-1' data-id='" + item.id + "'>-</button>" +
          "<span>" + item.qty + "</span>" +
          "<button type='button' data-qty='1' data-id='" + item.id + "'>+</button></div></div>" +
          "<strong>" + (item.price * item.qty) + " Euro</strong></article>";
      }).join("");
      list.querySelectorAll("[data-qty]").forEach(function (button) {
        button.addEventListener("click", function () {
          var id = button.getAttribute("data-id");
          var delta = Number(button.getAttribute("data-qty") || 0);
          var next = readCart().map(function (item) {
            if (item.id !== id) return item;
            return { id: item.id, title: item.title, price: item.price, image: item.image, qty: item.qty + delta };
          }).filter(function (item) { return item.qty > 0; });
          writeCart(next);
        });
      });
    }
    if (total) {
      var sum = items.reduce(function (value, item) { return value + item.price * item.qty; }, 0);
      total.textContent = sum + " Euro";
    }
  }

  doc.querySelectorAll("[data-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-filter") || "all";
      doc.querySelectorAll("[data-filter]").forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
      doc.querySelectorAll("[data-region]").forEach(function (card) {
        var region = card.getAttribute("data-region") || "";
        card.hidden = value !== "all" && region !== value;
      });
    });
  });

  function readUser() {
    try { return JSON.parse(window.localStorage.getItem(USER_KEY) || "null"); }
    catch (error) { return null; }
  }
  function writeUser(user) {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
    paintAccount();
  }
  function paintAccount() {
    var user = readUser();
    doc.querySelectorAll("[data-account-guest]").forEach(function (node) { node.hidden = Boolean(user); });
    doc.querySelectorAll("[data-account-member]").forEach(function (node) { node.hidden = !user; });
    doc.querySelectorAll("[data-account-name]").forEach(function (node) {
      node.textContent = user ? user.name : "";
    });
    doc.querySelectorAll("[data-account-email]").forEach(function (node) {
      node.textContent = user ? user.email : "";
    });
  }
  var register = doc.querySelector("[data-register-form]");
  if (register) {
    register.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = (register.querySelector('[name="name"]') || {}).value || "Gast";
      var email = (register.querySelector('[name="email"]') || {}).value || "";
      if (!email) return;
      writeUser({ name: name, email: email });
      window.location.href = pageHref(KONTO_KEY, register.getAttribute("action") || "konto.html");
    });
  }
  var login = doc.querySelector("[data-login-form]");
  if (login) {
    login.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = (login.querySelector('[name="email"]') || {}).value || "";
      var existing = readUser();
      writeUser({ name: existing && existing.email === email ? existing.name : "Gast", email: email });
      window.location.href = pageHref(KONTO_KEY, login.getAttribute("action") || "konto.html");
    });
  }
  var logout = doc.querySelector("[data-logout]");
  if (logout) {
    logout.addEventListener("click", function () { writeUser(null); });
  }

  var contact = doc.querySelector("[data-kontakt-form]");
  if (contact) {
    contact.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = doc.querySelector("[data-form-success]");
      if (note) note.hidden = false;
      contact.reset();
    });
  }

  paintCartCount();
  paintCartPage();
  paintAccount();

  var builder = doc.querySelector("[data-builder]");
  if (builder) {
    var flavors = {
      firenze: { title: "Pistazie Firenze", extra: 2, color: "#7bc47f", image: "assets/cover-firenze.jpg" },
      istanbul: { title: "Dondurma Istanbul", extra: 3, color: "#e85a71", image: "assets/cover-istanbul.jpg" },
      kyoto: { title: "Matcha Kyoto", extra: 4, color: "#5aa35f", image: "assets/cover-kyoto.jpg" },
      bangkok: { title: "Mango Bangkok", extra: 1, color: "#f7c948", image: "assets/cover-bangkok.jpg" },
      buenos: { title: "Dulce Buenos Aires", extra: 2, color: "#d4a574", image: "assets/cover-buenos.jpg" },
      tahiti: { title: "Vanille Tahiti", extra: 5, color: "#fff4ea", image: "assets/cover-tahiti.jpg" },
      roma: { title: "Stracciatella Roma", extra: 2, color: "#f3efe8", image: "assets/cover-roma.jpg" },
      wien: { title: "Melange Wien", extra: 3, color: "#8a645c", image: "assets/cover-wien.jpg" }
    };
    var sizes = { klein: 6, mittel: 8, gross: 11 };
    var toppingPrices = { crunch: 1, sahne: 1, schoko: 2 };
    var toppingLabels = { crunch: "Krokant", sahne: "Sahne", schoko: "Schoko" };
    var sizeLabels = { klein: "klein", mittel: "mittel", gross: "gross" };
    var state = { size: "mittel", flavor: "firenze", toppings: {} };

    function selectedToppings() {
      return Object.keys(toppingPrices).filter(function (key) { return state.toppings[key]; });
    }
    function builderPrice() {
      return sizes[state.size] + flavors[state.flavor].extra + selectedToppings().reduce(function (sum, key) {
        return sum + toppingPrices[key];
      }, 0);
    }
    function builderTitle() {
      var extras = selectedToppings().map(function (key) { return toppingLabels[key]; });
      var label = flavors[state.flavor].title + " · " + sizeLabels[state.size];
      if (extras.length) label += " · " + extras.join(", ");
      return label;
    }
    function paintBuilder() {
      var flavor = flavors[state.flavor];
      var photo = builder.querySelector("[data-builder-photo]");
      var scoop = builder.querySelector("[data-builder-scoop]");
      var total = builder.querySelector("[data-builder-total]");
      var add = builder.querySelector("[data-builder-add]");
      if (photo) photo.src = flavor.image;
      if (scoop) {
        scoop.style.background = flavor.color;
        scoop.classList.remove("is-klein", "is-mittel", "is-gross");
        scoop.classList.add("is-" + state.size);
      }
      builder.querySelectorAll("[data-builder-topping]").forEach(function (node) {
        node.classList.toggle("is-on", Boolean(state.toppings[node.getAttribute("data-builder-topping")]));
      });
      builder.querySelectorAll("[data-size]").forEach(function (node) {
        node.classList.toggle("is-active", node.getAttribute("data-size") === state.size);
      });
      builder.querySelectorAll("[data-flavor]").forEach(function (node) {
        node.classList.toggle("is-active", node.getAttribute("data-flavor") === state.flavor);
      });
      builder.querySelectorAll("[data-topping]").forEach(function (node) {
        node.classList.toggle("is-active", Boolean(state.toppings[node.getAttribute("data-topping")]));
      });
      if (total) total.textContent = builderPrice() + " Euro";
      if (add) {
        var toppingKey = selectedToppings().join("-");
        add.setAttribute("data-add", "becher-" + state.flavor + "-" + state.size + (toppingKey ? "-" + toppingKey : ""));
        add.setAttribute("data-tour-title", builderTitle());
        add.setAttribute("data-tour-price", String(builderPrice()));
        add.setAttribute("data-tour-image", flavor.image);
      }
    }
    builder.addEventListener("click", function (event) {
      if (event.target.closest("[data-builder-add]")) return;
      var size = event.target.closest("[data-size]");
      var flavorBtn = event.target.closest("[data-flavor]");
      var topping = event.target.closest("[data-topping]");
      if (size) state.size = size.getAttribute("data-size") || state.size;
      if (flavorBtn) state.flavor = flavorBtn.getAttribute("data-flavor") || state.flavor;
      if (topping) {
        var key = topping.getAttribute("data-topping");
        state.toppings[key] = !state.toppings[key];
      }
      paintBuilder();
    });
    paintBuilder();
  }
}());
