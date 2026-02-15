const form = document.querySelector("[data-senha-form]");
const passwordInput = document.querySelector("[data-senha-input]");
const confirmInput = document.querySelector("[data-senha-confirm]");
const progressFill = document.querySelector("[data-senha-progress]");
const errorMessage = document.querySelector("[data-senha-error]");
const submitButton = document.querySelector("[data-senha-submit]");
const successModal = document.querySelector("[data-senha-success]");
const errorModal = document.querySelector("[data-senha-error-modal]");
const errorModalClose = document.querySelector("[data-senha-error-close]");

const hintUpper = document.querySelector("[data-hint-upper]");
const hintLower = document.querySelector("[data-hint-lower]");
const hintNumber = document.querySelector("[data-hint-number]");
const hintLength = document.querySelector("[data-hint-length]");

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

const setHintState = (element, isValid) => {
  if (!element) {
    return;
  }

  element.classList.toggle("is-valid", isValid);
};

const updateProgress = (validCount, total) => {
  if (!progressFill) {
    return;
  }

  const percent = Math.round((validCount / total) * 100);
  progressFill.style.width = `${percent}%`;
};

const validatePassword = () => {
  if (!passwordInput) {
    return { isValid: false, match: false };
  }

  const value = passwordInput.value;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasLength = value.length >= 8;

  setHintState(hintUpper, hasUpper);
  setHintState(hintLower, hasLower);
  setHintState(hintNumber, hasNumber);
  setHintState(hintLength, hasLength);

  const validCount = [hasUpper, hasLower, hasNumber, hasLength].filter(Boolean)
    .length;
  updateProgress(validCount, 4);

  const isValid = validCount === 4;
  const match = confirmInput ? value === confirmInput.value : false;

  return { isValid, match };
};

const updateFormState = () => {
  const { isValid, match } = validatePassword();
  const shouldShowError = !!confirmInput?.value && (!isValid || !match);

  if (errorMessage) {
    errorMessage.classList.toggle("is-visible", shouldShowError);
  }

  if (submitButton) {
    submitButton.disabled = !(isValid && match);
    submitButton.classList.toggle("login-btn-muted", !(isValid && match));
    submitButton.classList.toggle("login-btn-outline", isValid && match);
  }
};

if (passwordInput) {
  passwordInput.addEventListener("input", updateFormState);
}

if (confirmInput) {
  confirmInput.addEventListener("input", updateFormState);
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const { isValid, match } = validatePassword();

    if (isValid && match) {
      openModal(successModal);
      return;
    }

    if (errorMessage) {
      errorMessage.classList.add("is-visible");
    }

    openModal(errorModal);
  });
}

if (errorModalClose) {
  errorModalClose.addEventListener("click", () => closeModal(errorModal));
}

[successModal, errorModal].forEach((modal) => {
  if (!modal) {
    return;
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

updateFormState();
