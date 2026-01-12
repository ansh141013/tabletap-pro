import { auth } from "@/config/firebase";
import { GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

export const googleSignIn = async (): Promise<UserCredential> => {
    return await signInWithPopup(auth, googleProvider);
};
