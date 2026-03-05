const novaContaForm = document.querySelector("[data-nova-conta-form]");
const novaContaEmailInput = document.querySelector("[data-nova-conta-email]");
const novaContaSubmit = document.querySelector("[data-nova-conta-submit]");
const codeModal = document.querySelector("[data-nova-conta-modal]");
const codeForm = document.querySelector("[data-nova-conta-code-form]");
const codeInputs = Array.from(
  document.querySelectorAll("[data-nova-conta-code-input]")
);
const emailDisplay = document.querySelector("[data-nova-conta-email-display]");
const resendButton = document.querySelector("[data-nova-conta-resend]");
const resendTimer = document.querySelector("[data-nova-conta-resend-timer]");
const successModal = document.querySelector("[data-nova-conta-success]");
const errorModal = document.querySelector("[data-nova-conta-error]");
const errorModalClose = document.querySelector("[data-nova-conta-error-close]");

const EXPECTED_CODE = "12345";
const RESEND_SECONDS = 30;

let lastFocusedElement = null;
let resendInterval = null;

const getFocusableElements = (modal) => {
  if (!modal) return [];
  return Array.from(
    modal.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    )
  ).filter((element) => !element.hasAttribute("disabled"));
};

const closeAllModals = () => {
  [codeModal, successModal, errorModal].forEach((modal) => {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
  document.body.style.overflow = "";
};

const maskEmail = (email) => {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "seu e-mail";

  const visibleStart = localPart.slice(0, 2);
  const masked = "*".repeat(Math.max(localPart.length - 2, 2));
  return `${visibleStart}${masked}@${domain}`;
};

const setSubmitLoading = (isLoading) => {
  if (!novaContaSubmit) return;

  novaContaSubmit.disabled = isLoading;
  novaContaSubmit.classList.toggle("is-loading", isLoading);
  novaContaSubmit.textContent = isLoading ? "Enviando..." : "Continuar";
};

const openModal = (modal) => {
  if (!modal) {
    return;
  }

  if (!(document.activeElement instanceof HTMLElement)) {
    lastFocusedElement = null;
  } else {
    lastFocusedElement = document.activeElement;
  }

  closeAllModals();

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const focusable = getFocusableElements(modal);
  if (focusable[0] instanceof HTMLElement) {
    focusable[0].focus();
  }
};

const closeModal = (modal) => {
  if (!modal) {
    return;
  }

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  const hasOpenModal = document.querySelector(".modal.open");
  if (!hasOpenModal) {
    document.body.style.overflow = "";
  }

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
};

const resetCodeInputs = () => {
  codeInputs.forEach((input, index) => {
    input.value = "";
    if (index === 0) {
      input.focus();
    }
  });
};

const startResendCountdown = () => {
  if (!resendButton || !resendTimer) return;

  let remaining = RESEND_SECONDS;
  resendButton.disabled = true;
  resendTimer.textContent = `Reenviar em ${remaining}s`;

  if (resendInterval) {
    clearInterval(resendInterval);
  }

  resendInterval = setInterval(() => {
    remaining -= 1;

    if (remaining <= 0) {
      clearInterval(resendInterval);
      resendInterval = null;
      resendButton.disabled = false;
      resendTimer.textContent = "Você já pode reenviar";
      return;
    }

    resendTimer.textContent = `Reenviar em ${remaining}s`;
  }, 1000);
};

if (novaContaForm) {
  novaContaForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!novaContaEmailInput || !novaContaEmailInput.checkValidity()) {
      novaContaEmailInput?.reportValidity();
      return;
    }

    const email = novaContaEmailInput.value.trim().toLowerCase();
    if (emailDisplay) {
      emailDisplay.textContent = maskEmail(email);
    }

    setSubmitLoading(true);

    setTimeout(() => {
      setSubmitLoading(false);
      openModal(codeModal);
      resetCodeInputs();
      startResendCountdown();
    }, 500);
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

  input.addEventListener("paste", (event) => {
    event.preventDefault();
    const pasted = event.clipboardData?.getData("text") || "";
    const digits = pasted.replace(/\D/g, "").slice(0, EXPECTED_CODE.length).split("");

    if (!digits.length) return;

    codeInputs.forEach((item, itemIndex) => {
      item.value = digits[itemIndex] || "";
    });

    const nextIndex = Math.min(digits.length, codeInputs.length - 1);
    codeInputs[nextIndex].focus();
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
      closeModal(codeModal);
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
    openModal(codeModal);
    resetCodeInputs();
  });
}

if (resendButton) {
  resendButton.addEventListener("click", () => {
    resetCodeInputs();
    startResendCountdown();
    if (resendTimer) {
      resendTimer.textContent = "Código reenviado. Reenviar em 30s";
    }
  });
}

document.addEventListener("keydown", (event) => {
  const activeModal = document.querySelector(".modal.open");
  if (!(activeModal instanceof HTMLElement)) {
    return;
  }

  if (event.key === "Escape") {
    closeModal(activeModal);
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements(activeModal);
  if (!focusable.length) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

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
