import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA94SDdt_haVQw4209CpEtWtNCJv3WmLv0",
  authDomain: "digginit-64c40.firebaseapp.com",
  projectId: "digginit-64c40",
  storageBucket: "digginit-64c40.firebasestorage.app",
  messagingSenderId: "929285318029",
  appId: "1:929285318029:web:dfa7f6ba09cd0bf647c9c4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

