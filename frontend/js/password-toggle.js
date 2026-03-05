document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const field = button.closest(".password-field");
    const input = field
      ? field.querySelector("input[type='password'], input[type='text']")
      : null;

    if (!input) {
      return;
    }

    const isVisible = input.type === "text";
    input.type = isVisible ? "password" : "text";
    button.setAttribute("aria-pressed", String(!isVisible));
    button.setAttribute(
      "aria-label",
      isVisible ? "Mostrar senha" : "Esconder senha"
    );
    button.setAttribute("data-state", isVisible ? "hidden" : "visible");
  });
});
