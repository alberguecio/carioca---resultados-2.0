function startApp() {
  console.log("Iniciar App"); // Añadamos un console.log para depuración
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('mainContent').classList.add('visible');
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
}

document.querySelector('.start-button').addEventListener('click', startApp);
document.querySelector('.start-button').addEventListener('touchend', startApp);

const ROUNDS = [
  "2 Tríos",
  "1 Trío + 1 Escalera",
  "2 Escaleras",
  "3 Tríos",
  "2 Tríos + 1 Escalera",
  "1 Trío + 2 Escaleras",
  "3 Escaleras",
  "4 Tríos",
  "Escala sucia (12 cartas)",
  "Escala real (13 cartas)"
];

let players = [];
let scores = [];
let currentRound = 0;
let currentPlayer = 0;

function setupPlayers() {
  const playerCount = parseInt(document.getElementById('playerCount').value);
  if (playerCount < 2 || playerCount > 6) {
    alert('Por favor ingrese un número de jugadores entre 2 y 6');
    return;
  }

  const playerInputs = document.getElementById('playerInputs');
  playerInputs.innerHTML = '';
  
  for (let i = 0; i < playerCount; i++) {
    const input = document.createElement('div');
    input.className = 'input-group';
    input.innerHTML = `
      <label for="player${i}">Jugador ${i + 1}:</label>
      <input type="text" id="player${i}" required>
    `;
    playerInputs.appendChild(input);
  }

  document.getElementById('setup').classList.add('hidden');
  document.getElementById('playerNames').classList.remove('hidden');
}

function startGame() {
  const playerInputs = document.querySelectorAll('#playerInputs input');
  players = Array.from(playerInputs).map(input => input.value.trim());
  
  if (players.some(name => !name)) {
    alert('Por favor ingrese todos los nombres de los jugadores');
    return;
  }

  // Initialize scores array
  scores = Array(ROUNDS.length).fill().map(() => Array(players.length).fill(null));
  
  // Setup table
  const tableHeader = document.querySelector('#scoreTable thead tr');
  tableHeader.innerHTML = '<th>Etapa</th>';
  players.forEach(player => {
    tableHeader.innerHTML += `<th>${player}</th>`;
  });

  // Make sure share options are hidden at game start
  document.getElementById('shareOptions').classList.add('hidden');
  document.getElementById('restartButton').classList.add('hidden');

  updateScoreTable();
  document.getElementById('playerNames').classList.add('hidden');
  document.getElementById('gameBoard').classList.remove('hidden');
  document.getElementById('scoreInput').classList.remove('hidden');
  updateCurrentPlayerText();
}

function updateScoreTable() {
  const tbody = document.querySelector('#scoreTable tbody');
  tbody.innerHTML = '';

  // Add rows for each round
  ROUNDS.forEach((round, roundIndex) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${round}</td>`;
    
    players.forEach((_, playerIndex) => {
      const score = scores[roundIndex][playerIndex];
      const total = calculateTotalForPlayer(playerIndex, roundIndex);
      tr.innerHTML += `<td>${score !== null ? `${score} (${total})` : '-'}</td>`;
    });
    
    tbody.appendChild(tr);
  });

  // Add total row
  const totalRow = document.createElement('tr');
  totalRow.innerHTML = '<td><strong>Total Final</strong></td>';
  players.forEach((_, playerIndex) => {
    const total = calculateTotalForPlayer(playerIndex);
    totalRow.innerHTML += `<td><strong>${total}</strong></td>`;
  });
  tbody.appendChild(totalRow);
}

function calculateTotalForPlayer(playerIndex, upToRound = scores.length - 1) {
  return scores.slice(0, upToRound + 1)
    .reduce((sum, round) => sum + (round[playerIndex] || 0), 0);
}

function updateCurrentPlayerText() {
  document.getElementById('currentPlayerText').textContent = 
    `Jugador Actual: ${players[currentPlayer]}`;
  document.getElementById('currentRoundText').textContent = 
    `Etapa Actual: ${ROUNDS[currentRound]}`;
}

let originalSubmitScore;
function submitScore() {
  const scoreInput = document.getElementById('score');
  const score = parseInt(scoreInput.value);

  if (isNaN(score) || score < 0) {
    alert('Por favor ingrese un puntaje válido');
    return;
  }

  scores[currentRound][currentPlayer] = score;
  scoreInput.value = '';
  
  // Move to next player/round
  currentPlayer++;
  if (currentPlayer >= players.length) {
    currentPlayer = 0;
    currentRound++;
  }

  updateScoreTable();

  // Check if game is over
  if (currentRound >= ROUNDS.length) {
    endGame();
    return;
  }

  updateCurrentPlayerText();
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
}

function endGame() {
  // Hide score input
  document.getElementById('scoreInput').classList.add('hidden');
  
  // Find winner
  const finalScores = players.map((_, index) => calculateTotalForPlayer(index));
  const winningScore = Math.min(...finalScores);
  const winnerIndex = finalScores.indexOf(winningScore);

  // Highlight winner in table
  const rows = document.querySelectorAll('#scoreTable tr');
  const lastRow = rows[rows.length - 1];
  const cells = lastRow.getElementsByTagName('td');
  cells[winnerIndex + 1].classList.add('winner');

  // Show sharing options and restart button
  document.getElementById('shareOptions').classList.remove('hidden');
  document.getElementById('restartButton').classList.remove('hidden');

  // Announce winner
  alert(`¡Juego terminado! Ganador: ${players[winnerIndex]} con ${winningScore} puntos!`);
}

function generateGameSummary() {
  let summary = "🎮 Resultados Carioca 🎮\n\n";
  
  // Add final scores
  const finalScores = players.map((player, index) => ({
    name: player,
    score: calculateTotalForPlayer(index)
  })).sort((a, b) => a.score - b.score); // Sort by score ascending
  
  const winningScore = finalScores[0].score;
  
  // Add player scores with emojis
  finalScores.forEach((player, index) => {
    const isWinner = player.score === winningScore;
    const position = index + 1;
    let icon = "🎲";
    
    // Special icons for top 3
    if (position === 1) icon = "👑";
    else if (position === 2) icon = "🥈";
    else if (position === 3) icon = "🥉";
    
    summary += `${icon} ${player.name}: ${player.score} puntos\n`;
  });
  
  // Add app promotion with emojis
  summary += "\n📱 ¡Descarga Carioca - Tabla de resultados!\n";
  summary += "📲 Disponible en App Store y Play Store\n";
  summary += "✨ by CrialTech";
  
  return summary;
}

async function shareWhatsApp() {
  const summary = generateGameSummary();
  const encodedSummary = encodeURIComponent(summary);
  window.open(`https://wa.me/?text=${encodedSummary}`, '_blank');
}

function restartGame() {
  players = [];
  scores = [];
  currentRound = 0;
  currentPlayer = 0;

  document.getElementById('gameBoard').classList.add('hidden');
  document.getElementById('scoreInput').classList.add('hidden');
  document.getElementById('shareOptions').classList.add('hidden');
  document.getElementById('restartButton').classList.add('hidden');
  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('playerCount').value = '2';
}

document.addEventListener('DOMContentLoaded', () => {
  // Prevent double-tap zoom on buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('touchend', e => {
      e.preventDefault();
    });
  });
    
  document.querySelector('.start-button').addEventListener('click', startApp);

  // Install service worker if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.error);
  }
});
