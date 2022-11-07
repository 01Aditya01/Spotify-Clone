import "./style.css";

const APP_URL = import.meta.env.VITE_APP_URL;
document.addEventListener("DOMContentLoaded", () => {
  window.location.href = `${APP_URL}/dashboard/dashboard.html`;
});
