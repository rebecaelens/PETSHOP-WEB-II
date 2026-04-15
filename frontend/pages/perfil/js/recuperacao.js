const form = document.querySelector("[data-code-form]");
const inputs = Array.from(document.querySelectorAll("[data-code-input]"));
const errorMessage = document.querySelector("[data-code-error]");
const modal = document.querySelector("[data-modal]");
const modalClose = document.querySelector("[data-modal-close]");
const errorModal = document.querySelector("[data-error-modal]");
const errorModalClose = document.querySelector("[data-error-modal-close]");

const EXPECTED_CODE = "12345";

const openModal = () => {
  if (!modal) {
    return;
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  if (!modal) {
    return;
  }

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
};

const openErrorModal = () => {
  if (!errorModal) {
    return;
  }

  errorModal.classList.add("open");
  errorModal.setAttribute("aria-hidden", "false");
};

const closeErrorModal = () => {
  if (!errorModal) {
    return;
  }

  errorModal.classList.remove("open");
  errorModal.setAttribute("aria-hidden", "true");
};

const setErrorVisible = (isVisible) => {
  if (!errorMessage) {
    return;
  }

  errorMessage.classList.toggle("is-visible", isVisible);
};

inputs.forEach((input, index) => {
  input.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    target.value = target.value.replace(/\D/g, "").slice(0, 1);

    if (target.value && inputs[index + 1]) {
      inputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && inputs[index - 1]) {
      inputs[index - 1].focus();
    }
  });
});

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const code = inputs.map((input) => input.value).join("");

    if (code.length !== EXPECTED_CODE.length || code !== EXPECTED_CODE) {
      setErrorVisible(true);
      openErrorModal();
      return;
    }

    setErrorVisible(false);
    openModal();
  });
}

if (modalClose) {
  modalClose.addEventListener("click", closeModal);
}

if (errorModalClose) {
  errorModalClose.addEventListener("click", closeErrorModal);
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

if (errorModal) {
  errorModal.addEventListener("click", (event) => {
    if (event.target === errorModal) {
      closeErrorModal();
    }
  });
}
