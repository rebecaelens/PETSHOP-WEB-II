const sidebarToggle = document.querySelector("[data-sidebar-toggle]");
const sidebar = document.querySelector("[data-sidebar]");

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

const currentPath = window.location.pathname.split("/").pop();
const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach((item) => {
  if (item.getAttribute("href") === currentPath) {
    item.classList.add("active");
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.matches("[data-favorito]")) {
    target.classList.toggle("is-favorito");
    target.textContent = target.classList.contains("is-favorito")
      ? "Favoritado"
      : "Favoritar";
  }

  if (target.matches("[data-carrinho]")) {
    target.classList.toggle("is-no-carrinho");
    target.textContent = target.classList.contains("is-no-carrinho")
      ? "No carrinho"
      : "Adicionar";
  }
});
