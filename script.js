// Certifique-se de que os scripts do Firebase estão carregados antes deste código
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";


// Firebase Configuração
const firebaseConfig = {
  apiKey: "AIzaSyBvO-DbZSOcOB-2EWpjreQ21K6BcKXPOFI",
  authDomain: "bancodedados-1885b.firebaseapp.com",
  databaseURL: "https://bancodedados-1885b-default-rtdb.firebaseio.com",
  projectId: "bancodedados-1885b",
  storageBucket: "bancodedados-1885b.firebasestorage.app",
  messagingSenderId: "248100180231",
  appId: "1:248100180231:web:42aaea7c087199c26f75a2"
};


// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const countRef = ref(database, 'contador');
let count = 0;

// Carregar contagem
function loadCount() {
    onValue(countRef, (snapshot) => {
        count = snapshot.val() || 0;
        document.getElementById('count').innerText = count;
    });
}

// Salvar contagem
function saveCount() {
    set(countRef, count);
}

function increment() {
    count++;
    document.getElementById('count').innerText = count;
    saveCount();
}

function decrement() {
    if (confirm("Tem certeza de que deseja diminuir o número?")) {
        count--;
        document.getElementById('count').innerText = count;
        saveCount();
    }
}

window.onload = loadCount;