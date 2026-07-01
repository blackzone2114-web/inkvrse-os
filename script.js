const statusEl = document.querySelector("#status");

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".faq-item").forEach((other) => {
      if (other !== item) other.classList.remove("open");
    });
    item.classList.toggle("open");
  });
});

document.querySelector("#waitlist-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "Saving...";

  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.querySelector("#email").value,
      role: document.querySelector("#role").value,
    }),
  });

  const data = await res.json().catch(() => ({}));
  statusEl.textContent = res.ok
    ? "You are on the founder list."
    : data.error || "Could not save yet. Check environment variables.";
});

document.querySelectorAll(".checkout").forEach((button) => {
  button.addEventListener("click", async () => {
    statusEl.textContent = "Opening checkout...";
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: button.dataset.tier }),
    });

    const data = await res.json().catch(() => ({}));
    if (data.url) window.location.href = data.url;
    else statusEl.textContent = data.error || "Stripe is not configured yet.";
  });
});
