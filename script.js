


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
let count = 0;

// Carregar contagem
function loadCount() {
    countRef.on('value', (snapshot) => {
        count = snapshot.val() || 0;
        document.getElementById('count').innerText = count;
    });
}

// Salvar contagem
function saveCount() {
    countRef.set(count);
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