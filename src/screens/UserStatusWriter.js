// src/services/UserStatusWriter.js

import { db, auth } from '../Config/firebaseConfig'; 
import { ref, set, onDisconnect } from 'firebase/database';


/**
 * Mengambil UID pengguna aktif dari Firebase Authentication.
 */
export const getCurrentUserUid = () => {
    const user = auth.currentUser;
    return user ? user.uid : null;
};


/**
 * Menerbitkan status user ke Firebase (Online/Offline) dengan onDisconnect.
 */
export const writeUserStatus = (status, userData) => {
    const uid = getCurrentUserUid();
    if (!uid) return;

    try {
        const userStatusRef = ref(db, `dashboard/usersOnline/${uid}`);
        
        const dataToWrite = { ...userData, status: status, lastActivity: Date.now() };

        set(userStatusRef, dataToWrite);

        if (status === 'Online') {
            // Set data yang akan ditulis saat koneksi terputus
            onDisconnect(userStatusRef).set({
                ...userData,
                status: 'Offline',
                lastActivity: Date.now(),
            }).catch(err => {
                // Ignore error onDisconnect jika koneksi memang buruk
            });
        } else if (status === 'Offline') {
             // Batalkan onDisconnect saat user sengaja pindah/tutup
             onDisconnect(userStatusRef).cancel();
        }
        
    } catch (error) {
        // Abaikan error (misal: DB belum siap)
    }
};