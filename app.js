import { db, auth } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ===============================
// BOLÃO DA COPA - 1º TADS
// ===============================


// Usuários do sistema
const USERS = [
  "Haly Gabriel",
  "Gustavo Binow",
  "Filipe Santos",
  "Raphael Calabrez",
  "Ian Rocha",
  "Mateus Gambati",
  "Leonam Dezidério",
  "Igor Vintena",
  "Kaio Magalhães",
  "Thiago Amaral"
];

// Base de jogos vinda de data/matches.js
const SOURCE_MATCHES = Array.isArray(window.WORLD_CUP_GROUP_STAGE_MATCHES)
  ? window.WORLD_CUP_GROUP_STAGE_MATCHES
  : [];

// Chaves do localStorage
const STORAGE_KEYS = {
  CURRENT_USER: "bolao_current_user",
  ADMIN_AUTH: "bolao_admin_authenticated",
  MANUAL_LOCK: "bolao_manual_lock",

  // legado
  PREDICTIONS: "bolao_predictions",
  RESULTS: "bolao_official_results",

  // novo modelo
  ROUNDS_STATE: "bolao_rounds_state",
  RANKING_PREVIOUS_ORDER: "bolao_ranking_previous_order"
};

const CLOUD_KEYS = {
  RESULTS_COLLECTION: "results",
  SYSTEM_COLLECTION: "system",
  PREDICTIONS_COLLECTION: "predictions",
  CURRENT_ROUND_SYSTEM_DOC: "current_round"
};

let unsubscribeCloudResults = null;
let unsubscribeCloudSystem = null;
let unsubscribeCloudPredictions = null;



const TEAM_FLAGS = {
  "México": "https://flagcdn.com/w80/mx.png",
  "África do Sul": "https://flagcdn.com/w80/za.png",
  "Coreia do Sul": "https://flagcdn.com/w80/kr.png",
  "Tchéquia": "https://flagcdn.com/w80/cz.png",
  "Canadá": "https://flagcdn.com/w80/ca.png",
  "Bósnia e Herzegovina": "https://flagcdn.com/w80/ba.png",
  "Qatar": "https://flagcdn.com/w80/qa.png",
  "Suíça": "https://flagcdn.com/w80/ch.png",
  "Brasil": "https://flagcdn.com/w80/br.png",
  "Marrocos": "https://flagcdn.com/w80/ma.png",
  "Haiti": "https://flagcdn.com/w80/ht.png",
  "Escócia": "https://flagcdn.com/w80/gb-sct.png",
  "Estados Unidos": "https://flagcdn.com/w80/us.png",
  "Paraguai": "https://flagcdn.com/w80/py.png",
  "Austrália": "https://flagcdn.com/w80/au.png",
  "Türkiye": "https://flagcdn.com/w80/tr.png",
  "Alemanha": "https://flagcdn.com/w80/de.png",
  "Curaçao": "https://flagcdn.com/w80/cw.png",
  "Costa do Marfim": "https://flagcdn.com/w80/ci.png",
  "Equador": "https://flagcdn.com/w80/ec.png",
  "Holanda": "https://flagcdn.com/w80/nl.png",
  "Japão": "https://flagcdn.com/w80/jp.png",
  "Tunísia": "https://flagcdn.com/w80/tn.png",
  "Suécia": "https://flagcdn.com/w80/se.png",
  "Bélgica": "https://flagcdn.com/w80/be.png",
  "Egito": "https://flagcdn.com/w80/eg.png",
  "Irã": "https://flagcdn.com/w80/ir.png",
  "Nova Zelândia": "https://flagcdn.com/w80/nz.png",
  "Espanha": "https://flagcdn.com/w80/es.png",
  "Cabo Verde": "https://flagcdn.com/w80/cv.png",
  "Arábia Saudita": "https://flagcdn.com/w80/sa.png",
  "Uruguai": "https://flagcdn.com/w80/uy.png",
  "França": "https://flagcdn.com/w80/fr.png",
  "Senegal": "https://flagcdn.com/w80/sn.png",
  "Noruega": "https://flagcdn.com/w80/no.png",
  "Iraque": "https://flagcdn.com/w80/iq.png",
  "Argentina": "https://flagcdn.com/w80/ar.png",
  "Argélia": "https://flagcdn.com/w80/dz.png",
  "Áustria": "https://flagcdn.com/w80/at.png",
  "Jordânia": "https://flagcdn.com/w80/jo.png",
  "Portugal": "https://flagcdn.com/w80/pt.png",
  "Uzbequistão": "https://flagcdn.com/w80/uz.png",
  "Colômbia": "https://flagcdn.com/w80/co.png",
  "RD Congo": "https://flagcdn.com/w80/cd.png",
  "Inglaterra": "https://flagcdn.com/w80/gb-eng.png",
  "Croácia": "https://flagcdn.com/w80/hr.png",
  "Gana": "https://flagcdn.com/w80/gh.png",
  "Panamá": "https://flagcdn.com/w80/pa.png"
};

// Elementos DOM
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginUsersGrid = document.getElementById("loginUsersGrid");
const currentUserBadge = document.getElementById("currentUserBadge");
const logoutBtn = document.getElementById("logoutBtn");

const systemStatusBadge = document.getElementById("systemStatusBadge");
const systemStatusTitle = document.getElementById("systemStatusTitle");
const systemStatusText = document.getElementById("systemStatusText");
const nextDeadlineTitle = document.getElementById("nextDeadlineTitle");
const nextDeadlineText = document.getElementById("nextDeadlineText");
const submissionsCount = document.getElementById("submissionsCount");
const deadlineAlert = document.getElementById("deadlineAlert");

const matchesGrid = document.getElementById("matchesGrid");
const predictionsForm = document.getElementById("predictionsForm");
const submitPredictionsBtn = document.getElementById("submitPredictionsBtn");
const statusBox = document.getElementById("statusBox");

const historyEmptyState = document.getElementById("historyEmptyState");
const historySummary = document.getElementById("historySummary");
const historyGrid = document.getElementById("historyGrid");
const historyTotalPoints = document.getElementById("historyTotalPoints");
const historyExactHits = document.getElementById("historyExactHits");
const historyMisses = document.getElementById("historyMisses");

const roundResultsLocked = document.getElementById("roundResultsLocked");
const roundResultsSummary = document.getElementById("roundResultsSummary");
const roundResultsGrid = document.getElementById("roundResultsGrid");
const roundUsersCount = document.getElementById("roundUsersCount");
const roundMatchesCount = document.getElementById("roundMatchesCount");
const roundBestScore = document.getElementById("roundBestScore");
const roundStatusText = document.getElementById("roundStatusText");

const rankingTableBody = document.getElementById("rankingTableBody");
const rankingNotice = document.getElementById("rankingNotice");
const leaderSpotlight = document.getElementById("leaderSpotlight");
const leaderName = document.getElementById("leaderName");
const leaderStats = document.getElementById("leaderStats");

const openAdminBtn = document.getElementById("openAdminBtn");
const adminModal = document.getElementById("adminModal");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const closeAdminBackdrop = document.getElementById("closeAdminBackdrop");

const adminAuthSection = document.getElementById("adminAuthSection");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPasswordInput = document.getElementById("adminPassword");
const adminEmailInput = document.getElementById("adminEmail");
const adminPanel = document.getElementById("adminPanel");
const adminMatchesGrid = document.getElementById("adminMatchesGrid");
const adminResultsForm = document.getElementById("adminResultsForm");
const clearResultsBtn = document.getElementById("clearResultsBtn");
const resetSystemBtn = document.getElementById("resetSystemBtn");
const toggleLockBtn = document.getElementById("toggleLockBtn");
const exportDataBtn = document.getElementById("exportDataBtn");
const importDataInput = document.getElementById("importDataInput");
const adminLockStatus = document.getElementById("adminLockStatus");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const toastContainer = document.getElementById("toastContainer");

// ===============================
// INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  if (!SOURCE_MATCHES.length) {
    showToast("Base de jogos não carregada. Verifique data/matches.js", "error");
    return;
  }

  ensureRoundsState();

  renderLoginUsers();
  renderPredictionCards();
  renderAdminCards();

  restoreSession();
  renderRanking();
  updateSystemPanels();
  renderHistory();
  renderRoundResults();

  bindEvents();
  ensureRankingAnimationStyles();
  await hydrateCloudPhaseA();
  setupCloudListeners();
});


// ===============================
// EVENTOS
// ===============================
function bindEvents() {
  predictionsForm.addEventListener("submit", handlePredictionsSubmit);
  logoutBtn.addEventListener("click", logout);

  openAdminBtn.addEventListener("click", openAdminModal);
  closeAdminBtn.addEventListener("click", closeAdminModal);
  closeAdminBackdrop.addEventListener("click", closeAdminModal);

  adminLoginForm.addEventListener("submit", handleAdminLogin);
  adminResultsForm.addEventListener("submit", handleAdminResultsSubmit);
  clearResultsBtn.addEventListener("click", clearOfficialResults);
  resetSystemBtn.addEventListener("click", resetSystem);

  if (toggleLockBtn) {
    toggleLockBtn.addEventListener("click", toggleManualLock);
  }

  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportBackup);
  }

  if (importDataInput) {
    importDataInput.addEventListener("change", importBackup);
  }

  const toggleAdminPasswordBtn = document.getElementById("toggleAdminPassword");

  if (toggleAdminPasswordBtn && adminPasswordInput) {
    toggleAdminPasswordBtn.addEventListener("click", () => {
      const isHidden = adminPasswordInput.type === "password";
      adminPasswordInput.type = isHidden ? "text" : "password";
      toggleAdminPasswordBtn.textContent = isHidden ? "🙈" : "👁";
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      tabButtons.forEach((item) => item.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(targetTab).classList.add("active");

      if (targetTab === "historicoTab") {
        renderHistory();
      }

      if (targetTab === "rankingTab") {
        renderRanking();
      }

      if (targetTab === "rodadaTab") {
        renderRoundResults();
      }
    });
  });
}

// ===============================
// ESTRUTURA DE RODADAS
// ===============================
function ensureRoundsState() {
  const state = getRoundsState();
  const currentSignature = buildRoundSignature(SOURCE_MATCHES);

  if (!state.currentRoundKey) {
    const migrated = migrateLegacyData(state, currentSignature);

    if (!migrated) {
      const round = createRound(SOURCE_MATCHES, 1, "Fase de grupos");
      state.currentRoundKey = round.key;
      state.roundOrder.push(round.key);
      state.rounds[round.key] = round;
    }

    saveRoundsState(state);
    return;
  }

  const currentRound = getCurrentRound(state);

  if (!currentRound) {
    const round = createRound(SOURCE_MATCHES, state.roundOrder.length + 1, "Fase de grupos");
    state.currentRoundKey = round.key;
    state.roundOrder.push(round.key);
    state.rounds[round.key] = round;
    localStorage.removeItem(STORAGE_KEYS.MANUAL_LOCK);
    saveRoundsState(state);
    return;
  }

  if (currentRound.signature !== currentSignature) {
    if (roundHasData(currentRound)) {
      currentRound.archivedAt = new Date().toISOString();

      const newRound = createRound(
        SOURCE_MATCHES,
        state.roundOrder.length + 1,
        `Rodada ${state.roundOrder.length + 1}`
      );
      state.currentRoundKey = newRound.key;
      state.roundOrder.push(newRound.key);
      state.rounds[newRound.key] = newRound;

      localStorage.removeItem(STORAGE_KEYS.MANUAL_LOCK);
    } else {
      currentRound.matches = deepClone(SOURCE_MATCHES);
      currentRound.signature = currentSignature;
      currentRound.updatedAt = new Date().toISOString();
    }

    saveRoundsState(state);
  }
}

function migrateLegacyData(state, currentSignature) {
  const legacyPredictions = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS)) || {};
  const legacyResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS)) || {};

  const hasLegacyPredictions = Object.keys(legacyPredictions).length > 0;
  const hasLegacyResults = Object.keys(legacyResults).length > 0;

  if (!hasLegacyPredictions && !hasLegacyResults) {
    return false;
  }

  const round = createRound(SOURCE_MATCHES, 1, "Fase de grupos");
  round.signature = currentSignature;
  round.predictions = legacyPredictions;
  round.results = legacyResults;

  state.currentRoundKey = round.key;
  state.roundOrder.push(round.key);
  state.rounds[round.key] = round;

  return true;
}

function createRound(matches, number, labelOverride = null) {
  const now = new Date().toISOString();
  return {
    key: `round_${number}`,
    label: labelOverride || `Rodada ${number}`,
    createdAt: now,
    archivedAt: null,
    updatedAt: now,
    signature: buildRoundSignature(matches),
    matches: deepClone(matches),
    predictions: {},
    results: {}
  };
}

function buildRoundSignature(matches) {
  return JSON.stringify(
    matches.map((match) => ({
      teamA: match.teamA,
      teamB: match.teamB,
      date: match.date,
      time: match.time,
      stadium: match.stadium,
      city: match.city,
      group: match.group
    }))
  );
}

function roundHasData(round) {
  return (
    Object.keys(round.predictions || {}).length > 0 ||
    Object.keys(round.results || {}).length > 0
  );
}

function getRoundsState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUNDS_STATE)) || {
    version: 2,
    currentRoundKey: null,
    roundOrder: [],
    rounds: {}
  };
}

function saveRoundsState(state) {
  localStorage.setItem(STORAGE_KEYS.ROUNDS_STATE, JSON.stringify(state));
}

function getCurrentRound(state = getRoundsState()) {
  return state.rounds[state.currentRoundKey] || null;
}

function getAllRounds(state = getRoundsState()) {
  return state.roundOrder.map((key) => state.rounds[key]).filter(Boolean);
}

function updateCurrentRound(mutator) {
  const state = getRoundsState();
  const round = getCurrentRound(state);

  if (!round) return;

  mutator(round);
  round.updatedAt = new Date().toISOString();
  saveRoundsState(state);
}

function getCurrentMatches() {
  return getCurrentRound()?.matches || [];
}

function getCurrentPredictions() {
  return getCurrentRound()?.predictions || {};
}

function getCurrentOfficialResults() {
  return getCurrentRound()?.results || {};
}

function saveCurrentPredictions(data) {
  updateCurrentRound((round) => {
    round.predictions = data;
  });
  syncPredictionsToCloud().catch((error) => {
    console.error("Erro ao enviar palpites para a nuvem:", error);
    showToast("Palpites salvos localmente, mas houve falha ao sincronizar na nuvem.", "warning");
  });
}

function saveCurrentOfficialResults(data) {
  updateCurrentRound((round) => {
    round.results = data;
  });
  syncOfficialResultsToCloud().catch((error) => {
    console.error("Erro ao enviar resultados para a nuvem:", error);
    showToast("Resultados salvos localmente, mas houve falha ao sincronizar na nuvem.", "warning");
  });
}

function clearCurrentOfficialResults() {
  updateCurrentRound((round) => {
    round.results = {};
  });
  clearOfficialResultsFromCloud().catch((error) => {
    console.error("Erro ao limpar resultados da nuvem:", error);
    showToast("Resultados limpos localmente, mas houve falha ao sincronizar na nuvem.", "warning");
  });
}

function isRoundResultsComplete(round) {
  const matches = round?.matches || [];
  const results = round?.results || {};
  return matches.length > 0 && Object.keys(results).length === matches.length;
}

// ===============================
// RENDERIZAÇÃO
// ===============================
function renderLoginUsers() {
  loginUsersGrid.innerHTML = "";

  USERS.forEach((user, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "login-user-card";

    let avatarContent = "👤";

    if (user === "Haly Gabriel") {
      avatarContent = `<img src="img/haly.jpg" alt="Haly Gabriel" class="login-user-photo">`;
    } else if (user === "Gustavo Binow") {
      avatarContent = `<img src="img/binow.png" alt="Gustavo Binow" class="login-user-photo">`;
    } else if (user === "Filipe Santos") {
      avatarContent = `<img src="img/feijão.png" alt="Filipe Santos" class="login-user-photo">`;
    } else if (user === "Ian Rocha") {
      avatarContent = `<img src="img/Ian.png" alt="Ian Rocha" class="login-user-photo">`;
    } else if (user === "Raphael Calabrez") {
      avatarContent = `<img src="img/Raphael.jpg" alt="Raphael Calabrez" class="login-user-photo">`;
    } else if (user === "Mateus Gambati") {
      avatarContent = `<img src="img/mateus.png" alt="Mateus Gambati" class="login-user-photo">`;
    } else if (user === "Leonam Dezidério") {
      avatarContent = `<img src="img/leo.png" alt="Leonam Dezidério" class="login-user-photo">`;
    } else if (user === "Igor Vintena") {
      avatarContent = `<img src="img/igor.jpg" alt="Igor Vintena" class="login-user-photo">`;
    } else if (user === "Kaio Magalhães") {
      avatarContent = `<img src="img/kaio.jpeg" alt="Kaio Magalhães" class="login-user-photo">`;
    } else if (user === "Thiago Amaral") {
      avatarContent = `<img src="img/Thiago.png" alt="Thiago Amaral" class="login-user-photo">`;
    }

    card.innerHTML = `
      <div class="login-user-icon">${avatarContent}</div>
      <h3>${user}</h3>
      <p>Participante ${index + 1}</p>
    `;

    card.addEventListener("click", () => login(user));
    loginUsersGrid.appendChild(card);
  });
}

function renderPredictionCards() {
  const matches = getCurrentMatches();
  matchesGrid.innerHTML = "";

  matches.forEach((match) => {
    const isBrazilLeft = match.teamA === "Brasil";
    const isBrazilRight = match.teamB === "Brasil";

    const card = document.createElement("article");
    card.className = "match-card";
    card.id = `match-card-${match.id}`;
    card.innerHTML = `
      <div class="match-header">
        <span class="match-number">${getCurrentRound()?.label || "Rodada atual"} • Grupo ${match.group} • Jogo ${match.id}</span>
        <span class="match-badge">${match.city}</span>
      </div>

      <div class="score-line">
        <div class="team ${isBrazilLeft ? "brazil-highlight" : ""}">
          <div class="team-flag">${getTeamFlag(match.teamA)}</div>
          <div class="team-info">
            <div class="team-name">${match.teamA}</div>
            ${isBrazilLeft ? `<span class="team-name-tag">Seleção Brasileira</span>` : `<div class="team-sub">Grupo ${match.group}</div>`}
          </div>
        </div>

        <div class="score-inputs">
          <input class="score-field" type="number" min="0" max="50" step="1" inputmode="numeric" id="match-${match.id}-a" placeholder="0" />
          <span class="score-separator">X</span>
          <input class="score-field" type="number" min="0" max="50" step="1" inputmode="numeric" id="match-${match.id}-b" placeholder="0" />
        </div>

        <div class="team right ${isBrazilRight ? "brazil-highlight" : ""}">
          <div class="team-info">
            <div class="team-name">${match.teamB}</div>
            ${isBrazilRight ? `<span class="team-name-tag">Seleção Brasileira</span>` : `<div class="team-sub">Grupo ${match.group}</div>`}
          </div>
          <div class="team-flag">${getTeamFlag(match.teamB)}</div>
        </div>
      </div>

      <div class="match-meta">
        <span class="meta-pill">🏷️ Grupo ${match.group}</span>
        <span class="meta-pill">📅 ${match.date}</span>
        <span class="meta-pill">⏰ ${match.time}</span>
        <span class="meta-pill">🏟️ ${match.stadium}</span>
        <span class="meta-pill">📍 ${match.city}</span>
      </div>

      <div class="match-feedback hidden" id="match-feedback-${match.id}"></div>
    `;

    matchesGrid.appendChild(card);
  });
}

function renderAdminCards() {
  const matches = getCurrentMatches();
  adminMatchesGrid.innerHTML = "";

  matches.forEach((match) => {
    const card = document.createElement("div");
    card.className = "admin-result-card";
    card.innerHTML = `
      <h3>${getCurrentRound()?.label || "Rodada atual"} — Grupo ${match.group} — Jogo ${match.id}</h3>

      <div class="admin-score-row">
        <span class="mini-team with-flag">
          <span class="mini-flag">${getTeamFlag(match.teamA)}</span>
          <span>${match.teamA}</span>
        </span>

        <input type="number" min="0" max="50" step="1" inputmode="numeric"
          id="admin-match-${match.id}-a" placeholder="0" />

        <span class="score-separator">X</span>

        <input type="number" min="0" max="50" step="1" inputmode="numeric"
          id="admin-match-${match.id}-b" placeholder="0" />

        <span class="mini-team with-flag right-team">
          <span>${match.teamB}</span>
          <span class="mini-flag">${getTeamFlag(match.teamB)}</span>
        </span>
      </div>

      <div class="match-meta">
        <span class="meta-pill">📅 ${match.date}</span>
        <span class="meta-pill">⏰ ${match.time}</span>
        <span class="meta-pill">🏟️ ${match.stadium}</span>
        <span class="meta-pill">📍 ${match.city}</span>
      </div>
    `;
    adminMatchesGrid.appendChild(card);
  });

  fillAdminResultsIfExists();
}

// ===============================
// LOGIN / SESSÃO
// ===============================
function login(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user);
  updateUIForCurrentUser();
  showToast("Login realizado com sucesso.", "success");
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  updateUIForCurrentUser();
  showToast("Você saiu do sistema.", "info");
}

function restoreSession() {
  updateUIForCurrentUser();
}

function updateUIForCurrentUser() {
  const currentUser = getCurrentUser();

  if (currentUser) {
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    currentUserBadge.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    openAdminBtn.classList.add("hidden");

    currentUserBadge.textContent = `Logado como: ${currentUser}`;
    loadPredictionsForUser(currentUser);
    updatePredictionStatus(currentUser);
    renderHistory();
    updateMatchFeedbackForUser(currentUser);
  } else {
    loginSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    currentUserBadge.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    openAdminBtn.classList.remove("hidden");

    clearPredictionInputs();
    clearMatchFeedback();
  }

  updateSystemPanels();
  renderRanking();
  renderRoundResults();
}

function md5(str) {
  return CryptoJS.MD5(str).toString();
}

function getCurrentUser() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

// ===============================
// PALPITES
// ===============================
function handlePredictionsSubmit(event) {
  event.preventDefault();

  const currentUser = getCurrentUser();
  const matches = getCurrentMatches();

  if (!currentUser) {
    showToast("Faça login para enviar seus palpites.", "error");
    return;
  }

  if (isPredictionsClosed()) {
    showToast("Os palpites estão fechados.", "error");
    updateSystemPanels();
    updatePredictionStatus(currentUser);
    return;
  }

  const allPredictions = getCurrentPredictions();

  if (allPredictions[currentUser]) {
    showToast("Você já enviou seus palpites. Edição bloqueada.", "error");
    updatePredictionStatus(currentUser);
    return;
  }

  const predictions = {};

  for (const match of matches) {
    const inputA = document.getElementById(`match-${match.id}-a`);
    const inputB = document.getElementById(`match-${match.id}-b`);

    const rawA = inputA.value.trim();
    const rawB = inputB.value.trim();

    const valueA = rawA === "" ? "0" : rawA;
    const valueB = rawB === "" ? "0" : rawB;

    if (!isValidNonNegativeInteger(valueA) || !isValidNonNegativeInteger(valueB)) {
      showToast(`Use apenas números inteiros não negativos no Jogo ${match.id}.`, "error");
      return;
    }

    predictions[match.id] = {
      teamA: parseInt(valueA, 10),
      teamB: parseInt(valueB, 10)
    };
  }

  allPredictions[currentUser] = {
    submittedAt: new Date().toISOString(),
    matches: predictions
  };

  saveCurrentPredictions(allPredictions);

  lockPredictionInputs(true);
  submitPredictionsBtn.disabled = true;
  updatePredictionStatus(currentUser);
  updateSystemPanels();
  renderHistory();
  renderRoundResults();
  updateMatchFeedbackForUser(currentUser);
  renderRanking();

  showToast("Palpites enviados com sucesso.", "success");
}

function loadPredictionsForUser(user) {
  const allPredictions = getCurrentPredictions();
  const userPrediction = allPredictions[user];
  const matches = getCurrentMatches();

  clearPredictionInputs();

  if (!userPrediction) {
    const mustLock = isPredictionsClosed();
    lockPredictionInputs(mustLock);
    submitPredictionsBtn.disabled = mustLock;
    return;
  }

  matches.forEach((match) => {
    const data = userPrediction.matches[match.id];
    if (!data) return;

    document.getElementById(`match-${match.id}-a`).value = data.teamA;
    document.getElementById(`match-${match.id}-b`).value = data.teamB;
  });

  lockPredictionInputs(true);
  submitPredictionsBtn.disabled = true;
}

function clearPredictionInputs() {
  const matches = getCurrentMatches();

  matches.forEach((match) => {
    const inputA = document.getElementById(`match-${match.id}-a`);
    const inputB = document.getElementById(`match-${match.id}-b`);

    if (inputA) inputA.value = "";
    if (inputB) inputB.value = "";
  });

  const mustLock = isPredictionsClosed();
  lockPredictionInputs(mustLock);
  submitPredictionsBtn.disabled = mustLock;
}

function lockPredictionInputs(lock) {
  const matches = getCurrentMatches();

  matches.forEach((match) => {
    const inputA = document.getElementById(`match-${match.id}-a`);
    const inputB = document.getElementById(`match-${match.id}-b`);

    if (inputA) inputA.disabled = lock;
    if (inputB) inputB.disabled = lock;
  });
}

function updatePredictionStatus(user) {
  const allPredictions = getCurrentPredictions();
  const userPrediction = allPredictions[user];
  const locked = isPredictionsClosed();
  const currentRound = getCurrentRound();

  statusBox.className = "status-box";

  if (userPrediction) {
    const submittedDate = formatDateTime(userPrediction.submittedAt);
    statusBox.classList.add("success");
    statusBox.innerHTML = `
      <strong>${currentRound?.label || "Rodada atual"} enviada</strong><br>
      Seus palpites já foram salvos.<br>
      <small>Enviado em: ${submittedDate}</small>
    `;
    return;
  }

  if (locked) {
    statusBox.classList.add("warning");
    statusBox.innerHTML = `
      <strong>Palpites encerrados</strong><br>
      O prazo para envio já foi fechado.
    `;
    return;
  }

  statusBox.classList.add("warning");
  statusBox.innerHTML = `
    <strong>Aguardando envio</strong><br>
    Preencha os jogos da ${currentRound?.label?.toLowerCase() || "rodada atual"} e clique em <em>Enviar palpites</em>.
  `;
}

function updateMatchFeedbackForUser(user) {
  clearMatchFeedback();

  const predictions = getCurrentPredictions();
  const officialResults = getCurrentOfficialResults();
  const userPrediction = predictions[user];
  const currentRound = getCurrentRound();
  const hasOfficialResults = isRoundResultsComplete(currentRound);

  if (!userPrediction || !hasOfficialResults) return;

  currentRound.matches.forEach((match) => {
    const feedbackEl = document.getElementById(`match-feedback-${match.id}`);
    const prediction = userPrediction.matches[match.id];
    const result = officialResults[match.id];

    if (!feedbackEl || !prediction || !result) return;

    const analysis = analyzeMatch(prediction, result);

    feedbackEl.classList.remove("hidden");
    feedbackEl.className = `match-feedback ${analysis.className}`;
    feedbackEl.innerHTML = `
      <span class="feedback-icon">${analysis.icon}</span>
      <div>
        <strong>${analysis.label}</strong><br>
        <small>
          Seu palpite: ${prediction.teamA} x ${prediction.teamB} |
          Resultado: ${result.teamA} x ${result.teamB} |
          +${analysis.points} ponto${analysis.points !== 1 ? "s" : ""}
        </small>
      </div>
    `;
  });
}

function clearMatchFeedback() {
  const matches = getCurrentMatches();

  matches.forEach((match) => {
    const feedbackEl = document.getElementById(`match-feedback-${match.id}`);
    if (!feedbackEl) return;

    feedbackEl.className = "match-feedback hidden";
    feedbackEl.innerHTML = "";
  });
}

// ===============================
// HISTÓRICO ACUMULADO
// ===============================
function renderHistory() {
  const currentUser = getCurrentUser();
  const rounds = getAllRounds();

  historyGrid.innerHTML = "";

  if (!currentUser || rounds.length === 0) {
    historyEmptyState.classList.remove("hidden");
    historySummary.classList.add("hidden");
    return;
  }

  const totalStats = {
    points: 0,
    exact: 0,
    misses: 0
  };

  let hasAnyRoundContent = false;

  rounds.forEach((round) => {
    const userPrediction = round.predictions?.[currentUser];
    const hasOfficialResults = isRoundResultsComplete(round);

    const card = document.createElement("article");
    card.className = "history-card";

    if (!userPrediction) {
      card.innerHTML = `
        <div class="history-card-header">
          <span class="match-number">${round.label}</span>
          <span class="match-badge">Sem envio</span>
        </div>

        <div class="history-result error">
          <span class="history-result-icon">❌</span>
          <div>
            <strong>Você não enviou palpites nesta rodada</strong>
            <p>Esta rodada permanece no seu histórico mesmo sem participação.</p>
          </div>
        </div>
      `;
      historyGrid.appendChild(card);
      hasAnyRoundContent = true;
      return;
    }

    hasAnyRoundContent = true;

    let roundPoints = 0;
    let roundExact = 0;
    let roundMisses = 0;

    const gamesHtml = round.matches.map((match) => {
      const prediction = userPrediction.matches?.[match.id];

      if (!prediction) {
        return `
          <div class="history-result error">
            <span class="history-result-icon">❌</span>
            <div>
              <strong>${match.teamA} x ${match.teamB}</strong>
              <p>Palpite não encontrado para este jogo.</p>
            </div>
          </div>
        `;
      }

      if (!hasOfficialResults) {
        return `
          <div class="history-result pending">
            <span class="history-result-icon">⏳</span>
            <div>
              <strong>${match.teamA} x ${match.teamB}</strong>
              <p>Seu palpite: ${prediction.teamA} x ${prediction.teamB}</p>
              <p>Resultados oficiais ainda não cadastrados.</p>
            </div>
          </div>
        `;
      }

      const result = round.results[match.id];
      const analysis = analyzeMatch(prediction, result);

      roundPoints += analysis.points;
      roundExact += analysis.type === "exact" ? 1 : 0;
      roundMisses += analysis.type === "miss" ? 1 : 0;

      return `
        <div class="history-result ${analysis.className}">
          <span class="history-result-icon">${analysis.icon}</span>
          <div>
            <strong>${match.teamA} x ${match.teamB} — ${analysis.label}</strong>
            <p>Seu palpite: ${prediction.teamA} x ${prediction.teamB}</p>
            <p>Resultado oficial: ${result.teamA} x ${result.teamB}</p>
            <p>Pontuação: +${analysis.points} ponto${analysis.points !== 1 ? "s" : ""}</p>
          </div>
        </div>
      `;
    }).join("");

    if (hasOfficialResults) {
      totalStats.points += roundPoints;
      totalStats.exact += roundExact;
      totalStats.misses += roundMisses;
    }

    card.innerHTML = `
      <div class="history-card-header">
        <span class="match-number">${round.label}</span>
        <span class="match-badge">${hasOfficialResults ? `Total: ${roundPoints} pts` : "Aguardando resultado"}</span>
      </div>

      <div class="history-summary-card" style="margin-bottom: 16px;">
        <span class="mini-label">RODADA</span>
        <strong>${round.label}</strong>
        <p style="margin: 8px 0 0; color: var(--muted);">
          ${round.matches.length} jogo(s) • ${hasOfficialResults ? `${roundPoints} pts na rodada` : "Em andamento"}
        </p>
      </div>

      <div class="history-grid">
        ${gamesHtml}
      </div>
    `;

    historyGrid.appendChild(card);
  });

  if (!hasAnyRoundContent) {
    historyEmptyState.classList.remove("hidden");
    historySummary.classList.add("hidden");
    return;
  }

  historyEmptyState.classList.add("hidden");
  historySummary.classList.remove("hidden");
  historyTotalPoints.textContent = `${totalStats.points} pts`;
  historyExactHits.textContent = totalStats.exact;
  historyMisses.textContent = totalStats.misses;
}

// ===============================
// PALPITES DA RODADA ATUAL
// ===============================
function renderRoundResults() {
  const currentRound = getCurrentRound();
  const predictions = getCurrentPredictions();
  const officialResults = getCurrentOfficialResults();
  const hasOfficialResults = isRoundResultsComplete(currentRound);

  if (!currentRound) return;

  roundResultsGrid.innerHTML = "";

  if (!hasOfficialResults) {
    roundResultsLocked.classList.remove("hidden");
    roundResultsSummary.classList.add("hidden");
    roundUsersCount.textContent = "0";
    roundMatchesCount.textContent = `${currentRound.matches.length}`;
    roundBestScore.textContent = "0 pts";
    roundStatusText.textContent = "Aguardando";
    return;
  }

  roundResultsLocked.classList.add("hidden");
  roundResultsSummary.classList.remove("hidden");

  let bestScoreValue = 0;
  let usersWithPrediction = 0;

  USERS.forEach((user) => {
    const userPrediction = predictions[user];
    const card = document.createElement("article");
    card.className = "history-card";

    if (!userPrediction) {
      card.innerHTML = `
        <div class="history-card-header">
          <span class="match-number">${user}</span>
          <span class="match-badge">Sem envio</span>
        </div>

        <div class="history-result error">
          <span class="history-result-icon">❌</span>
          <div>
            <strong>Usuário não enviou palpites</strong>
            <p>Não há palpites registrados para a rodada atual.</p>
          </div>
        </div>
      `;
      roundResultsGrid.appendChild(card);
      return;
    }

    usersWithPrediction += 1;

    const stats = calculateStatsForRound(userPrediction.matches, officialResults, currentRound.matches);

    if (stats.points > bestScoreValue) {
      bestScoreValue = stats.points;
    }

    const gamesHtml = currentRound.matches.map((match) => {
      const prediction = userPrediction.matches[match.id];
      const result = officialResults[match.id];
      const analysis = analyzeMatch(prediction, result);

      return `
        <div class="history-result ${analysis.className}">
          <span class="history-result-icon">${analysis.icon}</span>
          <div>
            <strong>${match.teamA} x ${match.teamB} — ${analysis.label}</strong>
            <p>Palpite: ${prediction.teamA} x ${prediction.teamB}</p>
            <p>Resultado oficial: ${result.teamA} x ${result.teamB}</p>
            <p>Pontuação: +${analysis.points} ponto${analysis.points !== 1 ? "s" : ""}</p>
          </div>
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <div class="history-card-header">
        <span class="match-number">${user}</span>
        <span class="match-badge">Total: ${stats.points} pts</span>
      </div>

      <div class="history-summary-card" style="margin-bottom: 16px;">
        <span class="mini-label">DESEMPENHO NA ${currentRound.label.toUpperCase()}</span>
        <strong>${stats.points} pts</strong>
        <p style="margin: 8px 0 0; color: var(--muted);">
          ${stats.exact} exato(s) • ${stats.misses} erro(s)
        </p>
      </div>

      <div class="history-grid">
        ${gamesHtml}
      </div>
    `;

    roundResultsGrid.appendChild(card);
  });

  roundUsersCount.textContent = `${usersWithPrediction}`;
  roundMatchesCount.textContent = `${currentRound.matches.length}`;
  roundBestScore.textContent = `${bestScoreValue} pts`;
  roundStatusText.textContent = currentRound.label;
}

// ===============================
// ADMIN
// ===============================
function openAdminModal() {
  adminModal.classList.remove("hidden");
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true";

  if (isAuthenticated) {
    adminAuthSection.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    fillAdminResultsIfExists();
    updateAdminLockUI();
  } else {
    adminAuthSection.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    adminPasswordInput.value = "";
  }
}

function closeAdminModal() {
  adminModal.classList.add("hidden");
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
    adminAuthSection.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    fillAdminResultsIfExists();
    updateAdminLockUI();
    showToast("Acesso de administrador liberado.", "success");
  } catch (error) {
  console.error("ERRO LOGIN ADMIN:", error);
  showToast(`Erro admin: ${error.code || "desconhecido"}`, "error");
  }
}

function handleAdminResultsSubmit(event) {
  event.preventDefault();

  const currentRound = getCurrentRound();
  const results = {};

  for (const match of currentRound.matches) {
    const inputA = document.getElementById(`admin-match-${match.id}-a`);
    const inputB = document.getElementById(`admin-match-${match.id}-b`);

    const valueA = inputA.value.trim();
    const valueB = inputB.value.trim();

    if (valueA === "" || valueB === "") {
      showToast(`Preencha os dois placares oficiais do Jogo ${match.id}.`, "error");
      return;
    }

    if (!isValidNonNegativeInteger(valueA) || !isValidNonNegativeInteger(valueB)) {
      showToast(`Os resultados oficiais do Jogo ${match.id} devem ser inteiros não negativos.`, "error");
      return;
    }

    results[match.id] = {
      teamA: parseInt(valueA, 10),
      teamB: parseInt(valueB, 10)
    };
  }

  saveCurrentOfficialResults(results);

  renderRanking();
  renderHistory();
  renderRoundResults();
  updateSystemPanels();
  updateMatchFeedbackForUser(getCurrentUser() || "");

  showToast("Resultados oficiais salvos e ranking atualizado.", "success");
}

function fillAdminResultsIfExists() {
  const results = getCurrentOfficialResults();
  const matches = getCurrentMatches();

  matches.forEach((match) => {
    const inputA = document.getElementById(`admin-match-${match.id}-a`);
    const inputB = document.getElementById(`admin-match-${match.id}-b`);

    if (!inputA || !inputB) return;

    if (!results[match.id]) {
      inputA.value = "";
      inputB.value = "";
      return;
    }

    inputA.value = results[match.id].teamA;
    inputB.value = results[match.id].teamB;
  });
}

function clearOfficialResults() {
  const hasResults = Object.keys(getCurrentOfficialResults()).length > 0;

  if (!hasResults) {
    showToast("Não há resultados oficiais cadastrados para limpar.", "info");
    return;
  }

  const confirmClear = confirm("Deseja realmente limpar os resultados oficiais da rodada atual?");
  if (!confirmClear) return;

  clearCurrentOfficialResults();
  fillAdminResultsIfExists();
  renderRanking();
  renderHistory();
  renderRoundResults();
  clearMatchFeedback();
  updateSystemPanels();

  showToast("Resultados oficiais removidos da rodada atual.", "info");
}

function resetSystem() {
  const confirmReset = confirm(
    "⚠️ ATENÇÃO!\n\nIsso vai apagar TODOS os dados do bolão:\n- rodadas\n- histórico\n- palpites\n- resultados oficiais\n- ranking acumulado\n- autenticação do admin\n- bloqueio manual\n\nDeseja continuar?"
  );

  if (!confirmReset) return;

  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.PREDICTIONS);
  localStorage.removeItem(STORAGE_KEYS.RESULTS);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  signOut(auth).catch(()=>{});
  localStorage.removeItem(STORAGE_KEYS.MANUAL_LOCK);
  localStorage.removeItem(STORAGE_KEYS.ROUNDS_STATE);
  resetCloudPhaseA().catch((error) => console.error("Erro ao limpar nuvem no reset:", error));

  showToast("Sistema resetado com sucesso!", "success");

  setTimeout(() => {
    location.reload();
  }, 1000);
}

function toggleManualLock() {
  const currentlyLocked = isManualLockEnabled();
  const nextValue = !currentlyLocked;

  localStorage.setItem(STORAGE_KEYS.MANUAL_LOCK, JSON.stringify(nextValue));
  syncSystemStateToCloud().catch((error) => {
    console.error("Erro ao sincronizar bloqueio manual:", error);
    showToast("Bloqueio alterado localmente, mas houve falha ao sincronizar na nuvem.", "warning");
  });

  updateAdminLockUI();
  updateSystemPanels();
  updatePredictionStatus(getCurrentUser() || "");
  loadPredictionsForUser(getCurrentUser() || "");

  showToast(
    nextValue ? "Palpites fechados manualmente." : "Palpites reabertos manualmente.",
    "info"
  );
}

function updateAdminLockUI() {
  if (!toggleLockBtn || !adminLockStatus) return;

  const manualLock = isManualLockEnabled();
  const automaticLock = isAutomaticLockActive();

  toggleLockBtn.textContent = manualLock
    ? "Reabrir palpites manualmente"
    : "Fechar palpites manualmente";

  if (manualLock) {
    adminLockStatus.textContent = "Status: palpites fechados manualmente pelo administrador.";
    return;
  }

  if (automaticLock) {
    adminLockStatus.textContent = "Status: palpites fechados automaticamente pelo horário do primeiro jogo da rodada atual.";
    return;
  }

  adminLockStatus.textContent = "Status: palpites abertos para envio na rodada atual.";
}

function exportBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    data: {
      currentUser: localStorage.getItem(STORAGE_KEYS.CURRENT_USER),
      adminAuthenticated: localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true",
      manualLock: isManualLockEnabled(),
      roundsState: getRoundsState()
    }
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "backup-bolao-1tads.json";
  link.click();

  URL.revokeObjectURL(url);

  showToast("Backup exportado com sucesso.", "success");
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);

      if (!parsed.data) {
        throw new Error("Arquivo inválido.");
      }

      if (parsed.data.roundsState) {
        localStorage.setItem(
          STORAGE_KEYS.ROUNDS_STATE,
          JSON.stringify(parsed.data.roundsState)
        );
      } else {
        localStorage.setItem(
          STORAGE_KEYS.PREDICTIONS,
          JSON.stringify(parsed.data.predictions || {})
        );

        localStorage.setItem(
          STORAGE_KEYS.RESULTS,
          JSON.stringify(parsed.data.officialResults || {})
        );
      }

      localStorage.setItem(
        STORAGE_KEYS.MANUAL_LOCK,
        JSON.stringify(!!parsed.data.manualLock)
      );

      if (parsed.data.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, parsed.data.currentUser);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }

      if (parsed.data.adminAuthenticated) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  signOut(auth).catch(()=>{});
      }

      ensureRoundsState();
      renderPredictionCards();
      renderAdminCards();
      fillAdminResultsIfExists();
      updateAdminLockUI();
      updateSystemPanels();
      updateUIForCurrentUser();
      renderHistory();
      renderRoundResults();

      showToast("Backup importado com sucesso.", "success");
    } catch (error) {
      showToast("Falha ao importar backup. Verifique o arquivo.", "error");
    } finally {
      importDataInput.value = "";
    }
  };

  reader.readAsText(file);
}

// ===============================
// STATUS / BLOQUEIO
// ===============================
function updateSystemPanels() {
  const currentRound = getCurrentRound();
  const predictions = getCurrentPredictions();
  const submittedCount = Object.keys(predictions).length;
  const hasOfficialResults = isRoundResultsComplete(currentRound);
  const manualLock = isManualLockEnabled();
  const automaticLock = isAutomaticLockActive();
  const closed = isPredictionsClosed();
  const firstMatch = getFirstMatch();

  submissionsCount.textContent = `${submittedCount}/${USERS.length}`;

  if (firstMatch) {
    nextDeadlineTitle.textContent = `${firstMatch.date} às ${firstMatch.time}`;
    nextDeadlineText.textContent = `${firstMatch.teamA} x ${firstMatch.teamB}`;
  } else {
    nextDeadlineTitle.textContent = "--";
    nextDeadlineText.textContent = "Sem jogos cadastrados";
  }

  systemStatusBadge.className = "system-badge";

  if (hasOfficialResults) {
    systemStatusBadge.textContent = "Resultados cadastrados";
    systemStatusBadge.classList.add("success");
    systemStatusTitle.textContent = `${currentRound?.label || "Rodada atual"} finalizada`;
    systemStatusText.textContent = "O ranking já está sendo calculado com base nos placares oficiais desta rodada e das anteriores.";
  } else if (manualLock) {
    systemStatusBadge.textContent = "Palpites fechados manualmente";
    systemStatusBadge.classList.add("warning");
    systemStatusTitle.textContent = `${currentRound?.label || "Rodada atual"} fechada manualmente`;
    systemStatusText.textContent = "O administrador encerrou o envio dos palpites antes do prazo automático.";
  } else if (automaticLock) {
    systemStatusBadge.textContent = "Palpites encerrados";
    systemStatusBadge.classList.add("warning");
    systemStatusTitle.textContent = "Prazo encerrado";
    systemStatusText.textContent = "Os palpites foram fechados automaticamente no horário do primeiro jogo da rodada atual.";
  } else {
    systemStatusBadge.textContent = "Palpites abertos";
    systemStatusBadge.classList.add("open");
    systemStatusTitle.textContent = `${currentRound?.label || "Rodada atual"} em andamento`;
    systemStatusText.textContent = "Os participantes ainda podem enviar seus palpites dentro do prazo da rodada atual.";
  }

  if (deadlineAlert) {
    if (closed) {
      deadlineAlert.classList.remove("hidden");
      deadlineAlert.className = "deadline-alert closed";
      deadlineAlert.innerHTML = `
        <strong>Prazo encerrado.</strong>
        Os palpites da rodada atual foram bloqueados e não podem mais ser enviados.
      `;
    } else if (firstMatch) {
      deadlineAlert.classList.remove("hidden");
      deadlineAlert.className = "deadline-alert open";
      deadlineAlert.innerHTML = `
        <strong>Prazo aberto.</strong>
        Os palpites serão encerrados automaticamente em ${firstMatch.date} às ${firstMatch.time}.
      `;
    } else {
      deadlineAlert.classList.add("hidden");
    }
  }

  updateAdminLockUI();
}

function getFirstMatch() {
  const matches = getCurrentMatches();

  if (!matches.length) return null;

  return [...matches].sort((a, b) => getMatchDateTime(a) - getMatchDateTime(b))[0];
}

function getMatchDateTime(match) {
  const [day, month, year] = match.date.split("/");
  return new Date(`${year}-${month}-${day}T${match.time}:00`);
}

function isManualLockEnabled() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MANUAL_LOCK)) || false;
}

function isAutomaticLockActive() {
  const firstMatch = getFirstMatch();
  if (!firstMatch) return false;

  const firstMatchDate = getMatchDateTime(firstMatch);
  return new Date() >= firstMatchDate;
}

function isPredictionsClosed() {
  return isManualLockEnabled() || isAutomaticLockActive();
}

// ===============================
// RANKING E PONTUAÇÃO
// ===============================
function renderRanking() {
  const rounds = getAllRounds();

  const ranking = USERS.map((user) => {
    const stats = calculateTotalUserStats(user, rounds);

    return {
      user,
      ...stats
    };
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return a.misses - b.misses;
  });

  const previousOrder = getPreviousRankingOrder();
  rankingTableBody.innerHTML = "";

  ranking.forEach((item, index) => {
    const row = document.createElement("tr");

    if (index === 0 && item.points > 0) {
      row.classList.add("leader");
    }

    const medal =
      index === 0 ? "🥇" :
      index === 1 ? "🥈" :
      index === 2 ? "🥉" : `${index + 1}º`;

    const positionBadgeClass = index === 0 ? "position-badge first" : "position-badge";
    const movement = getRankingMovement(item.user, index, previousOrder);

    row.innerHTML = `
      <td><span class="${positionBadgeClass}">${medal}</span></td>
      <td>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span>${item.user}</span>
          <span style="${movement.style}">${movement.label}</span>
        </div>
      </td>
      <td><span class="points-pill">🏆 ${item.points} pts</span></td>
      <td>${item.exact}</td>
      <td>${item.misses}</td>
    `;

    rankingTableBody.appendChild(row);
  });

  savePreviousRankingOrder(ranking.map((item) => item.user));

  const leader = ranking[0];
  const bestExact = [...ranking].sort((a, b) => b.exact - a.exact || b.points - a.points)[0];
  const mostMisses = [...ranking].sort((a, b) => b.misses - a.misses || a.points - b.points)[0];

  if (leader && leader.points > 0) {
    leaderSpotlight.classList.remove("hidden");
    leaderName.textContent = leader.user;
    leaderStats.textContent = `${leader.points} pts • ${leader.exact} placar(es) exato(s) • ${getMovementSummary(leader.user, ranking, previousOrder)}`;
  } else {
    leaderSpotlight.classList.add("hidden");
  }

  const completedRounds = rounds.filter(isRoundResultsComplete).length;

  rankingNotice.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
      <div class="history-summary-card">
        <span class="mini-label">LÍDER GERAL</span>
        <strong>${leader ? leader.user : "--"}</strong>
        <p style="margin:8px 0 0; color: var(--muted);">
          ${leader ? `${leader.points} pts • ${leader.exact} exato(s)` : "Aguardando resultados"}
        </p>
      </div>

      <div class="history-summary-card">
        <span class="mini-label">MELHOR ATAQUE</span>
        <strong>${bestExact ? bestExact.user : "--"}</strong>
        <p style="margin:8px 0 0; color: var(--muted);">
          ${bestExact ? `${bestExact.exact} placar(es) exato(s)` : "Sem dados"}
        </p>
      </div>

      <div class="history-summary-card">
        <span class="mini-label">MAIS ERROS</span>
        <strong>${mostMisses ? mostMisses.user : "--"}</strong>
        <p style="margin:8px 0 0; color: var(--muted);">
          ${mostMisses ? `${mostMisses.misses} erro(s)` : "Sem dados"}
        </p>
      </div>
    </div>

    <div style="margin-top: 14px;">
      <strong>Status:</strong>
      ${completedRounds === 0
        ? " aguardando resultados oficiais. Enquanto nenhuma rodada for concluída, a pontuação exibirá 0 ponto para todos."
        : " ranking geral acumulado e atualizado automaticamente. A pontuação soma todas as rodadas concluídas."}
    </div>
  `;
}



function ensureRankingAnimationStyles() {
  if (document.getElementById("rankingAnimationStyles")) return;

  const style = document.createElement("style");
  style.id = "rankingAnimationStyles";
  style.textContent = `
    @keyframes rankingRise {
      0% { transform: translateY(6px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }

    @keyframes rankingFall {
      0% { transform: translateY(-6px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

function getPreviousRankingOrder() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.RANKING_PREVIOUS_ORDER)) || [];
}

function savePreviousRankingOrder(order) {
  localStorage.setItem(STORAGE_KEYS.RANKING_PREVIOUS_ORDER, JSON.stringify(order));
}

function getRankingMovement(user, currentIndex, previousOrder) {
  const previousIndex = previousOrder.indexOf(user);

  if (previousIndex === -1) {
    return {
      label: "● novo",
      style: "padding:4px 8px; border-radius:999px; background:rgba(255,255,255,0.08); color: var(--muted); font-size:0.78rem; font-weight:700;"
    };
  }

  const diff = previousIndex - currentIndex;

  if (diff > 0) {
    return {
      label: `↑${diff}`,
      style: "padding:4px 8px; border-radius:999px; background:rgba(0,156,59,0.16); color:#d8ffe8; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; animation: rankingRise 0.6s ease;"
    };
  }

  if (diff < 0) {
    return {
      label: `↓${Math.abs(diff)}`,
      style: "padding:4px 8px; border-radius:999px; background:rgba(223,77,97,0.16); color:#ffd6dc; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; animation: rankingFall 0.6s ease;"
    };
  }

  return {
    label: "",
    style: "display:none;"
  };
}

function getMovementSummary(user, ranking, previousOrder) {
  const currentIndex = ranking.findIndex((item) => item.user === user);
  const previousIndex = previousOrder.indexOf(user);

  if (currentIndex === -1 || previousIndex === -1) return "estreando no ranking";
  if (previousIndex > currentIndex) return `subiu ${previousIndex - currentIndex} posição(ões)`;
  if (previousIndex < currentIndex) return `caiu ${currentIndex - previousIndex} posição(ões)`;
  return "manteve a posição";
}


function calculateTotalUserStats(user, rounds) {
  const total = {
    points: 0,
    exact: 0,
    misses: 0
  };

  rounds.forEach((round) => {
    if (!isRoundResultsComplete(round)) return;

    const userPrediction = round.predictions?.[user];
    if (!userPrediction) return;

    const stats = calculateStatsForRound(userPrediction.matches, round.results, round.matches);

    total.points += stats.points;
    total.exact += stats.exact;
    total.misses += stats.misses;
  });

  return total;
}

function calculateStatsForRound(userPredictions, officialResults, matches) {
  const stats = {
    points: 0,
    exact: 0,
    misses: 0
  };

  matches.forEach((match) => {
    const prediction = userPredictions?.[match.id];
    const result = officialResults?.[match.id];

    if (!prediction || !result) return;

    const analysis = analyzeMatch(prediction, result);

    stats.points += analysis.points;
    stats.exact += analysis.type === "exact" ? 1 : 0;
    stats.misses += analysis.type === "miss" ? 1 : 0;
  });

  return stats;
}

function analyzeMatch(prediction, result) {
  if (prediction.teamA === result.teamA && prediction.teamB === result.teamB) {
    return {
      points: 3,
      type: "exact",
      label: "Placar exato",
      icon: "✅",
      className: "success"
    };
  }

  return {
    points: 0,
    type: "miss",
    label: "Sem pontuação",
    icon: "❌",
    className: "error"
  };
}


// ===============================
// FIREBASE - FASE A
// ===============================
async function hydrateCloudPhaseA() {
  try {
    await Promise.all([
      fetchOfficialResultsFromCloud(),
      fetchSystemStateFromCloud(),
      fetchPredictionsFromCloud()
    ]);

    fillAdminResultsIfExists();
    updateSystemPanels();
    renderRanking();
    renderHistory();
    renderRoundResults();
    const currentUser = getCurrentUser();
    if (currentUser) {
      updatePredictionStatus(currentUser);
      updateMatchFeedbackForUser(currentUser);
    }
  } catch (error) {
    console.error("Falha ao carregar dados da nuvem:", error);
    showToast("Não foi possível carregar os dados online. O sistema seguirá com os dados locais.", "warning");
  }
}

function setupCloudListeners() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  if (unsubscribeCloudResults) unsubscribeCloudResults();
  if (unsubscribeCloudSystem) unsubscribeCloudSystem();
  if (unsubscribeCloudPredictions) unsubscribeCloudPredictions();

  unsubscribeCloudResults = onSnapshot(
    doc(db, CLOUD_KEYS.RESULTS_COLLECTION, currentRound.key),
    (snapshot) => {
      if (!snapshot.exists()) {
        updateCurrentRound((round) => {
          round.results = {};
        });
      } else {
        const data = snapshot.data() || {};
        updateCurrentRound((round) => {
          round.results = data.matches || {};
        });
      }

      fillAdminResultsIfExists();
      renderRanking();
      renderHistory();
      renderRoundResults();
      updateSystemPanels();
      const currentUser = getCurrentUser();
      if (currentUser) {
        updatePredictionStatus(currentUser);
        updateMatchFeedbackForUser(currentUser);
      }
    },
    (error) => {
      console.error("Listener de resultados falhou:", error);
    }
  );

  unsubscribeCloudSystem = onSnapshot(
    doc(db, CLOUD_KEYS.SYSTEM_COLLECTION, CLOUD_KEYS.CURRENT_ROUND_SYSTEM_DOC),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() || {};

      if (typeof data.manualLock === "boolean") {
        localStorage.setItem(STORAGE_KEYS.MANUAL_LOCK, JSON.stringify(data.manualLock));
      }

      updateAdminLockUI();
      updateSystemPanels();
      const currentUser = getCurrentUser();
      if (currentUser) {
        updatePredictionStatus(currentUser);
        loadPredictionsForUser(currentUser);
      }
    },
    (error) => {
      console.error("Listener do sistema falhou:", error);
    }
  );

  unsubscribeCloudPredictions = onSnapshot(
    doc(db, CLOUD_KEYS.PREDICTIONS_COLLECTION, currentRound.key),
    (snapshot) => {
      const data = snapshot.exists() ? (snapshot.data() || {}) : {};
      updateCurrentRound((round) => {
        round.predictions = data.users || {};
      });

      const currentUser = getCurrentUser();
      if (currentUser) {
        loadPredictionsForUser(currentUser);
        updatePredictionStatus(currentUser);
        updateMatchFeedbackForUser(currentUser);
      }
      renderHistory();
      renderRoundResults();
      renderRanking();
      updateSystemPanels();
    },
    (error) => {
      console.error("Listener de palpites falhou:", error);
    }
  );
}

async function fetchOfficialResultsFromCloud() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  const snapshot = await getDoc(doc(db, CLOUD_KEYS.RESULTS_COLLECTION, currentRound.key));
  if (!snapshot.exists()) return;

  const data = snapshot.data() || {};
  updateCurrentRound((round) => {
    round.results = data.matches || {};
  });
}

async function fetchSystemStateFromCloud() {
  const snapshot = await getDoc(
    doc(db, CLOUD_KEYS.SYSTEM_COLLECTION, CLOUD_KEYS.CURRENT_ROUND_SYSTEM_DOC)
  );
  if (!snapshot.exists()) return;

  const data = snapshot.data() || {};

  if (typeof data.manualLock === "boolean") {
    localStorage.setItem(STORAGE_KEYS.MANUAL_LOCK, JSON.stringify(data.manualLock));
  }
}

async function fetchPredictionsFromCloud() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  const snapshot = await getDoc(doc(db, CLOUD_KEYS.PREDICTIONS_COLLECTION, currentRound.key));
  if (!snapshot.exists()) return;

  const data = snapshot.data() || {};
  updateCurrentRound((round) => {
    round.predictions = data.users || {};
  });
}

async function syncPredictionsToCloud() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  await setDoc(
    doc(db, CLOUD_KEYS.PREDICTIONS_COLLECTION, currentRound.key),
    {
      roundKey: currentRound.key,
      roundLabel: currentRound.label,
      users: getCurrentPredictions(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function syncOfficialResultsToCloud() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  await setDoc(doc(db, CLOUD_KEYS.RESULTS_COLLECTION, currentRound.key), {
    roundKey: currentRound.key,
    roundLabel: currentRound.label,
    matches: getCurrentOfficialResults(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function clearOfficialResultsFromCloud() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  await deleteDoc(doc(db, CLOUD_KEYS.RESULTS_COLLECTION, currentRound.key));
}

async function syncSystemStateToCloud() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  await setDoc(doc(db, CLOUD_KEYS.SYSTEM_COLLECTION, CLOUD_KEYS.CURRENT_ROUND_SYSTEM_DOC), {
    roundKey: currentRound.key,
    manualLock: isManualLockEnabled(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function resetCloudPhaseA() {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  await Promise.all([
    deleteDoc(doc(db, CLOUD_KEYS.RESULTS_COLLECTION, currentRound.key)),
    deleteDoc(doc(db, CLOUD_KEYS.SYSTEM_COLLECTION, CLOUD_KEYS.CURRENT_ROUND_SYSTEM_DOC)),
    deleteDoc(doc(db, CLOUD_KEYS.PREDICTIONS_COLLECTION, currentRound.key))
  ]);
}

// ===============================
// UTILITÁRIOS
// ===============================
function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function isValidNonNegativeInteger(value) {
  return /^\d+$/.test(value);
}

function formatDateTime(isoString) {
  if (!isoString) return "-";

  const date = new Date(isoString);

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function getTeamFlag(teamName) {
  const src = TEAM_FLAGS[teamName];

  if (!src) {
    return `
      <span class="team-flag-fallback" title="${teamName}">🏳️</span>
    `;
  }

  return `
    <img
      src="${src}"
      alt="Bandeira de ${teamName}"
      class="team-flag-img"
      loading="lazy"
    >
  `;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    toast.style.transition = "0.25s ease";

    setTimeout(() => toast.remove(), 250);
  }, 3000);
}