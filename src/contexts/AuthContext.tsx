import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/types/firebase';
import { toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signUp: (email: string, password: string, name?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await loadUserProfile(firebaseUser.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadUserProfile = async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setUserProfile(snap.data() as UserProfile);
            } else {
                // Just in case it wasn't created
                console.warn('User profile not found in Firestore');
                setUserProfile(null);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const createFirestoreUser = async (user: User, name?: string, role: 'owner' | 'staff' = 'owner') => {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
            const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email!,
                displayName: name || user.displayName || 'User',
                role: role,
                createdAt: serverTimestamp()
                // restaurantId will be set later during onboarding
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
        } else {
            setUserProfile(snap.data() as UserProfile);
        }
    };

    const signUp = async (email: string, password: string, name?: string) => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            // Update Auth Profile
            if (name && cred.user) {
                await updateProfile(cred.user, { displayName: name });
            }
            // Create Firestore Profile
            await createFirestoreUser(cred.user, name);
            toast.success('Account created successfully!');
        } catch (error: any) {
            console.error('Sign up error:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Email already in use.');
            } else {
                toast.error('Failed to create account.');
            }
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Signed in successfully!');
        } catch (error: any) {
            console.error('Sign in error:', error);
            toast.error('Invalid email or password.');
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            const cred = await signInWithPopup(auth, googleProvider);
            await createFirestoreUser(cred.user);
            toast.success('Signed in with Google!');
        } catch (error: any) {
            console.error('Google sign in error:', error);
            toast.error('Failed to sign in with Google.');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
            toast.success('Signed out.');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Password reset email sent.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to send reset email.');
            throw error;
        }
    };

    const updatePassword = async (password: string) => {
        if (!user) throw new Error("No user logged in");
        try {
            await firebaseUpdatePassword(user, password);
            toast.success("Password updated");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update password: " + error.message);
            throw error;
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        resetPassword,
        updatePassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
