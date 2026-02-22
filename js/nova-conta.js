const novaContaForm = document.querySelector("[data-nova-conta-form]");
const codeModal = document.querySelector("[data-nova-conta-modal]");
const codeForm = document.querySelector("[data-nova-conta-code-form]");
const codeInputs = Array.from(
  document.querySelectorAll("[data-nova-conta-code-input]")
);
const successModal = document.querySelector("[data-nova-conta-success]");
const errorModal = document.querySelector("[data-nova-conta-error]");
const errorModalClose = document.querySelector("[data-nova-conta-error-close]");

const EXPECTED_CODE = "12345";

const openModal = (modal) => {
  if (!modal) {
    return;
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = (modal) => {
  if (!modal) {
    return;
  }

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
};

const resetCodeInputs = () => {
  codeInputs.forEach((input, index) => {
    input.value = "";
    if (index === 0) {
      input.focus();
    }
  });
};

if (novaContaForm) {
  novaContaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    openModal(codeModal);
    resetCodeInputs();
  });
}

codeInputs.forEach((input, index) => {
  input.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    target.value = target.value.replace(/\D/g, "").slice(0, 1);

    if (target.value && codeInputs[index + 1]) {
      codeInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && codeInputs[index - 1]) {
      codeInputs[index - 1].focus();
    }
  });
});

if (codeForm) {
  codeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const code = codeInputs.map((input) => input.value).join("");

    if (code.length !== EXPECTED_CODE.length || code !== EXPECTED_CODE) {
      openModal(errorModal);
      return;
    }

    closeModal(codeModal);
    openModal(successModal);
  });
}

if (errorModalClose) {
  errorModalClose.addEventListener("click", () => {
    closeModal(errorModal);
    resetCodeInputs();
  });
}

[codeModal, successModal, errorModal].forEach((modal) => {
  if (!modal) {
    return;
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});
