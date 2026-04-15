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
const errorText = document.querySelector('[data-nova-conta-error-text]');

const EXPECTED_CODE = "12345";
const RESEND_SECONDS = 30;
const SIGNUP_EMAIL_KEY = 'signupEmail';
const SIGNUP_CODE_KEY = 'signupCode';
const api = window.PetshopApi || null;
const API_BASE =
  window.PETSHOP_API_BASE ||
  api?.apiBase ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3333/api'
    : 'https://petshop-web-ii.onrender.com/api');

let lastFocusedElement = null;
let resendInterval = null;
let lastErrorMessage = 'Verifique o codigo e tente novamente.';

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
  novaContaForm.addEventListener("submit", async (event) => {
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

    try {
      if (!api) throw new Error('API indisponivel');
      const sendResponse = await fetch(`${API_BASE}/auth/request-signup-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const sendData = await sendResponse.json().catch(() => ({}));
      if (!sendResponse.ok) throw new Error(sendData?.message || 'Falha ao enviar codigo');

      sessionStorage.setItem(SIGNUP_EMAIL_KEY, email);

      setSubmitLoading(false);
      openModal(codeModal);
      resetCodeInputs();
      startResendCountdown();
    } catch (err) {
      setSubmitLoading(false);
      alert(err?.message || 'Nao foi possivel enviar o codigo.');
    }
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
  codeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = codeInputs.map((input) => input.value).join("");
    const email = (sessionStorage.getItem(SIGNUP_EMAIL_KEY) || novaContaEmailInput?.value || '').trim().toLowerCase();

    if (code.length !== EXPECTED_CODE.length) {
      lastErrorMessage = 'Codigo incompleto. Digite os 5 numeros.';
      if (errorText) errorText.textContent = lastErrorMessage;
      closeModal(codeModal);
      openModal(errorModal);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/verify-signup-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Codigo invalido');
      }

      sessionStorage.setItem(SIGNUP_EMAIL_KEY, email);
      sessionStorage.setItem(SIGNUP_CODE_KEY, code);

      closeModal(codeModal);
      openModal(successModal);
      return;
    } catch (_) {
      lastErrorMessage = _.message || 'Codigo invalido';
      if (errorText) errorText.textContent = lastErrorMessage;
      closeModal(codeModal);
      openModal(errorModal);
      return;
    }
  });
}

if (errorModalClose) {
  errorModalClose.addEventListener("click", () => {
    if (errorText) {
      errorText.textContent = lastErrorMessage;
    }
    closeModal(errorModal);
    openModal(codeModal);
    resetCodeInputs();
  });
}

if (resendButton) {
  resendButton.addEventListener("click", async () => {
    resetCodeInputs();
    const email = (sessionStorage.getItem(SIGNUP_EMAIL_KEY) || novaContaEmailInput?.value || '').trim().toLowerCase();
    if (!email) return;

    try {
      const response = await fetch(`${API_BASE}/auth/request-signup-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Falha ao reenviar codigo');

      startResendCountdown();
      if (resendTimer) {
        resendTimer.textContent = "Codigo reenviado. Reenviar em 30s";
      }
    } catch (err) {
      alert(err?.message || 'Nao foi possivel reenviar o codigo.');
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
