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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const countRef = database.ref('contador');

// Carregar a contagem do Firebase
function loadCount() {
    countRef.on('value', (snapshot) => {
        const data = snapshot.val();
        count = data || 0;
        document.getElementById('count').innerText = count;
    });
}

// Salvar a contagem no Firebase
function saveCount() {
    countRef.set(count);
}

// Incrementar
function increment() {
    count++;
    document.getElementById('count').innerText = count;
    saveCount();
}

// Decrementar
function decrement() {
    if (confirm("Tem certeza de que deseja diminuir o número?")) {
        count--;
        document.getElementById('count').innerText = count;
        saveCount();
    }
}

window.onload = loadCount;