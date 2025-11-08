// src/services/UserStatusReader.js

import { db } from '../Config/firebaseConfig'; 
import { ref, onValue, off } from 'firebase/database';

const USERS_ONLINE_PATH = 'dashboard/usersOnline'; 


/**
 * Mendengarkan perubahan status semua user secara real-time.
 * @param {function(Object[]): void} callback - Fungsi yang dipanggil setiap kali data user online berubah.
 * @returns {function(): void} - Fungsi cleanup untuk menghentikan listener.
 */
export const subscribeToOnlineUsers = (callback) => {
    const usersRef = ref(db, USERS_ONLINE_PATH);
    
    // Listener Real-time
    const unsubscribe = onValue(usersRef, (snapshot) => {
        const usersData = snapshot.val();
        const onlineUsers = [];
        
        if (usersData) {
            Object.keys(usersData).forEach((uid) => {
                const user = usersData[uid];
                onlineUsers.push({ uid, ...user });
            });
            
            // Urutkan berdasarkan aktivitas terakhir
            onlineUsers.sort((a, b) => b.lastActivity - a.lastActivity);

            callback(onlineUsers);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error("Error reading online user status:", error);
    });

    return () => {
        off(usersRef, 'value', unsubscribe);
    };
};