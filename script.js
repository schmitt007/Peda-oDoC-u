const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const orderForm = document.querySelector("#order-form");
const formStatus = document.querySelector("#form-status");

document.querySelector("#year").textContent = new Date().getFullYear();

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  mainNav.classList.toggle("is-open", !isOpen);
});

mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    mainNav.classList.remove("is-open");
  }
});

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.classList.remove("is-error");
  const submitButton = orderForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");

  try {
    const formData = new FormData(orderForm);
    const response = await fetch("/api/orcamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Não foi possível enviar o pedido.");
    }

    orderForm.reset();
    formStatus.textContent = "Pedido registrado! A equipe poderá consultar sua mensagem e entrar em contato.";
  } catch (error) {
    formStatus.textContent = error.message || "Não foi possível enviar agora. Tente novamente.";
    formStatus.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
  }
});
