import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

// 🔐 Register a new user
export const handleRegister = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    localStorage.setItem("token", token);
    console.log("✅ Registered + token stored:", token);
    return { uid: userCredential.user.uid, token };
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    throw err;
  }
};

// 🔐 Login existing user
export const handleLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    localStorage.setItem("token", token);
    console.log("✅ Logged in + token stored:", token);
    return { uid: userCredential.user.uid, token };
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    throw err;
  }
};

