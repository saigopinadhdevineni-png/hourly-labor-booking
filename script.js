const WORKERS_KEY = "hlb_workers_v1";
const BOOKINGS_KEY = "hlb_bookings_v1";

const defaultWorkers = [
  { id: "w1", name: "Ramesh", skill: "Plumbing", rate: 25, rating: 4.6, location: "South Bend", available: "Today" },
  { id: "w2", name: "Suresh", skill: "Electrician", rate: 30, rating: 4.7, location: "Mishawaka", available: "Tomorrow" },
  { id: "w3", name: "Kiran", skill: "House Cleaning", rate: 18, rating: 4.5, location: "South Bend", available: "Today" },
  { id: "w4", name: "Mahesh", skill: "Painting", rate: 22, rating: 4.4, location: "Elkhart", available: "This Week" },
  { id: "w5", name: "Arjun", skill: "Moving Help", rate: 20, rating: 4.3, location: "South Bend", available: "Today" },
  { id: "w6", name: "Naveen", skill: "Carpentry", rate: 28, rating: 4.6, location: "Granger", available: "This Week" },
];

let selectedWorker = null;

const el = (id) => document.getElementById(id);

function loadWorkers() {
  const saved = localStorage.getItem(WORKERS_KEY);
  if (!saved) {
    localStorage.setItem(WORKERS_KEY, JSON.stringify(defaultWorkers));
    return defaultWorkers;
  }
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(WORKERS_KEY, JSON.stringify(defaultWorkers));
    return defaultWorkers;
  }
}

function saveWorkers(workers) {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(workers));
}

function loadBookings() {
  const saved = localStorage.getItem(BOOKINGS_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

function uniqueSkills(workers) {
  return ["all", ...Array.from(new Set(workers.map(w => w.skill)))];
}

function formatMoney(n) {
  return `$${Number(n).toFixed(0)}`;
}

function renderSkillOptions(workers) {
  const skills = uniqueSkills(workers);
  const select = el("skill");
  select.innerHTML = skills.map(s => `<option value="${s}">${s === "all" ? "All Skills" : s}</option>`).join("");
}

function applyFilters(workers) {
  const q = el("search").value.trim().toLowerCase();
  const skill = el("skill").value;
  const sort = el("sort").value;

  let list = [...workers];

  if (q) list = list.filter(w => w.name.toLowerCase().includes(q));
  if (skill !== "all") list = list.filter(w => w.skill === skill);

  if (sort === "rate_low") list.sort((a,b) => a.rate - b.rate);
  if (sort === "rate_high") list.sort((a,b) => b.rate - a.rate);
  if (sort === "rating_high") list.sort((a,b) => b.rating - a.rating);

  return list;
}

function workerCard(w) {
  return `
    <div class="card">
      <div class="cardTop">
        <div>
          <p class="name">${w.name}</p>
          <p class="skill">${w.skill}</p>
        </div>
        <span class="badge">${w.available}</span>
      </div>

      <div class="metaRow">
        <span class="tag">Rate: <b>${formatMoney(w.rate)}/hr</b></span>
        <span class="tag">Rating: <b>${w.rating.toFixed(1)}</b></span>
        <span class="tag">📍 ${w.location}</span>
      </div>

      <div class="metaRow" style="margin-top:12px;">
        <button class="btn primary" type="button" data-book="${w.id}">Book</button>
      </div>
    </div>
  `;
}

function renderWorkers() {
  const workers = loadWorkers();
  const filtered = applyFilters(workers);
  el("workerGrid").innerHTML = filtered.map(workerCard).join("") || `<p class="muted">No workers found.</p>`;

  // Bind book buttons
  document.querySelectorAll("[data-book]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-book");
      const w = workers.find(x => x.id === id);
      selectWorker(w);
      window.location.hash = "#workers";
      el("customerName").focus();
    });
  });

  // keep skill list updated if new demo data loaded
  renderSkillOptions(workers);
}

function selectWorker(w) {
  selectedWorker = w;

  el("selectedCard").innerHTML = `
    <div class="cardTop">
      <div>
        <p class="name">${w.name}</p>
        <p class="skill">${w.skill}</p>
      </div>
      <span class="badge">${formatMoney(w.rate)}/hr</span>
    </div>
    <div class="metaRow">
      <span class="tag">Rating: <b>${w.rating.toFixed(1)}</b></span>
      <span class="tag">📍 ${w.location}</span>
      <span class="tag">Availability: <b>${w.available}</b></span>
    </div>
  `;

  el("confirmBtn").disabled = false;
  updateCost();
}

function updateCost() {
  const hours = Number(el("hours").value || 0);
  const rate = selectedWorker ? selectedWorker.rate : 0;
  const total = hours * rate;

  el("cost").textContent = formatMoney(total);
  el("rateLine").textContent = selectedWorker ? `Rate: ${formatMoney(rate)}/hr • Hours: ${hours}` : "Rate: -";
}

function renderBookings() {
  const bookings = loadBookings();
  if (bookings.length === 0) {
    el("bookingList").innerHTML = `<p class="muted">No bookings yet. Book a worker above.</p>`;
    return;
  }

  el("bookingList").innerHTML = bookings
    .slice()
    .reverse()
    .map(b => `
      <div class="bookingItem">
        <div>
          <div><strong>${b.workerName}</strong> • ${b.skill}</div>
          <div class="muted small">
            ${b.date} • ${b.hours} hr • ${formatMoney(b.rate)}/hr • <b>${formatMoney(b.total)}</b>
          </div>
          <div class="muted small">Customer: ${b.customerName} • ${b.phone} • ${b.address}</div>
        </div>
        <div class="right">
          <button class="btn del" type="button" data-del="${b.id}">Delete</button>
        </div>
      </div>
    `).join("");

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const updated = loadBookings().filter(b => b.id !== id);
      saveBookings(updated);
      renderBookings();
    });
  });
}

function resetDemoData() {
  saveWorkers(defaultWorkers);
  saveBookings([]);
  selectedWorker = null;
  el("selectedCard").innerHTML = `<p class="muted">No worker selected.</p>`;
  el("confirmBtn").disabled = true;
  el("cost").textContent = "$0";
  el("rateLine").textContent = "Rate: -";
  el("bookingForm").reset();
  el("hours").value = 2;
  renderWorkers();
  renderBookings();
}

function init() {
  el("year").textContent = new Date().getFullYear();

  // Set default date to today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  el("date").value = `${yyyy}-${mm}-${dd}`;

  renderWorkers();
  renderBookings();

  el("search").addEventListener("input", renderWorkers);
  el("skill").addEventListener("change", renderWorkers);
  el("sort").addEventListener("change", renderWorkers);

  el("hours").addEventListener("input", updateCost);

  el("btnSeed").addEventListener("click", resetDemoData);

  el("bookingForm").addEventListener("submit", (e) => {
    e.preventDefault();

    if (!selectedWorker) return;

    const booking = {
      id: `b_${Date.now()}`,
      workerId: selectedWorker.id,
      workerName: selectedWorker.name,
      skill: selectedWorker.skill,
      rate: selectedWorker.rate,
      hours: Number(el("hours").value),
      date: el("date").value,
      total: Number(el("hours").value) * selectedWorker.rate,
      customerName: el("customerName").value.trim(),
      phone: el("customerPhone").value.trim(),
      address: el("customerAddress").value.trim(),
    };

    const bookings = loadBookings();
    bookings.push(booking);
    saveBookings(bookings);

    // Confirmation
    alert(`Booking Confirmed ✅\n\nWorker: ${booking.workerName} (${booking.skill})\nDate: ${booking.date}\nHours: ${booking.hours}\nTotal: ${formatMoney(booking.total)}`);

    el("bookingForm").reset();
    el("hours").value = 2;
    updateCost();
    renderBookings();
  });
}

init();
