document.getElementById("appointmentForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const inputs = this.querySelectorAll("input");
  const name = inputs[0].value;
  const date = inputs[1].value;
  const time = inputs[2].value;

  const div = document.getElementById("appointmentList");
  const p = document.createElement("p");
  p.textContent = `${name} a un RDV le ${date} à ${time}`;
  div.appendChild(p);

  this.reset();
});

function randomVitals() {
  return {
    temp: (36 + Math.random() * 2).toFixed(1) + "°C",
    tension: (110 + Math.random() * 30).toFixed(0) + "/" + (70 + Math.random() * 20).toFixed(0),
    freq: (60 + Math.random() * 30).toFixed(0) + " bpm"
  };
}

const patients = ["Ahmed", "Leila", "Karim", "Sofia"];
const tbody = document.getElementById("monitorTable");
patients.forEach(name => {
  const vitals = randomVitals();
  const row = `<tr>
    <td>${name}</td>
    <td>${vitals.temp}</td>
    <td>${vitals.tension}</td>
    <td>${vitals.freq}</td>
  </tr>`;
  tbody.innerHTML += row;
});

document.getElementById("syncButton").addEventListener("click", () => {
  const system = document.getElementById("systems").value;
  alert(`Synchronisation avec le système ${system} réussie !`);
});
