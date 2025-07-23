const socket = io();
const tbody = document.querySelector('#opsTable tbody');

socket.on('arbOps', (ops) => {
  tbody.innerHTML = '';
  ops.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.pair}</td>
      <td>${o.price}</td>
      <td>${o.fairPrice}</td>
      <td>${o.diff}</td>
    `;
    tbody.appendChild(tr);
  });
