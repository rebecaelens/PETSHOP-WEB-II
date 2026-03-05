const form = document.querySelector("[data-senha-form]");
const usernameInput = document.querySelector("[data-username-input]");
const profileImageInput = document.querySelector("[data-profile-image-input]");
const passwordInput = document.querySelector("[data-senha-input]");
const confirmInput = document.querySelector("[data-senha-confirm]");
const progressFill = document.querySelector("[data-senha-progress]");
const errorMessage = document.querySelector("[data-senha-error]");
const submitButton = document.querySelector("[data-senha-submit]");
const successModal = document.querySelector("[data-senha-success]");
const errorModal = document.querySelector("[data-senha-error-modal]");
const errorModalClose = document.querySelector("[data-senha-error-close]");
const SIGNUP_EMAIL_KEY = 'signupEmail';
const SIGNUP_CODE_KEY = 'signupCode';
const api = window.PetshopApi || null;

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

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(file);
  });

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
  const hasUserName = !!usernameInput?.value.trim();
  const shouldShowError = (!!confirmInput?.value || !!usernameInput?.value) && (!isValid || !match || !hasUserName);

  if (errorMessage) {
    errorMessage.classList.toggle("is-visible", shouldShowError);
  }

  if (submitButton) {
    submitButton.disabled = !(isValid && match && hasUserName);
    submitButton.classList.toggle("login-btn-muted", !(isValid && match && hasUserName));
    submitButton.classList.toggle("login-btn-outline", isValid && match && hasUserName);
  }
};

if (usernameInput) {
  usernameInput.addEventListener("input", updateFormState);
}

if (passwordInput) {
  passwordInput.addEventListener("input", updateFormState);
}

if (confirmInput) {
  confirmInput.addEventListener("input", updateFormState);
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const { isValid, match } = validatePassword();
    const userName = usernameInput ? usernameInput.value.trim() : "";
    const hasUserName = !!userName;

    if (isValid && match && hasUserName) {
      const signupEmail = sessionStorage.getItem(SIGNUP_EMAIL_KEY);
      const signupCode = sessionStorage.getItem(SIGNUP_CODE_KEY);

      if (!signupEmail || !signupCode) {
        if (errorMessage) {
          errorMessage.textContent = 'Sessao de validacao expirada. Volte e valide o e-mail novamente.';
          errorMessage.classList.add('is-visible');
        }
        openModal(errorModal);
        return;
      }

      let avatarUrl = null;

      const selectedFile = profileImageInput?.files?.[0];
      if (selectedFile) {
        try {
          avatarUrl = await readFileAsDataURL(selectedFile);
          localStorage.setItem("userProfileImage", avatarUrl);
        } catch (error) {
          openModal(errorModal);
          return;
        }
      }

      try {
        const response = await fetch('http://localhost:3333/api/auth/register-with-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userName,
            email: signupEmail,
            password: passwordInput.value,
            code: signupCode,
            avatarUrl
          })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || 'Nao foi possivel concluir o cadastro');
        }

        if (api?.setAuth) {
          api.setAuth({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          });
        }

        localStorage.setItem("currentUser", userName);
        localStorage.setItem("profileUserName", userName);
        sessionStorage.removeItem(SIGNUP_EMAIL_KEY);
        sessionStorage.removeItem(SIGNUP_CODE_KEY);
      } catch (err) {
        if (errorMessage) {
          errorMessage.textContent = err?.message || 'Nao foi possivel concluir o cadastro.';
          errorMessage.classList.add('is-visible');
        }
        openModal(errorModal);
        return;
      }

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
