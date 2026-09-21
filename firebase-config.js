import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyAsb5ODBwdgTgv5kTAS28KImjRfOFMWlck",
    authDomain: "absensi-qr-554bc.firebaseapp.com",
    projectId: "absensi-qr-554bc",
    storageBucket: "absensi-qr-554bc.firebasestorage.app",
    messagingSenderId: "434923260118",
    appId: "1:434923260118:web:66a26f17726e5e6e1ca177"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


export {
    db,
    auth
};