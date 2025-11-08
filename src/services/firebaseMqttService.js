// src/services/firebaseMqttService.js

// ✅ FIX: Import dari config dengan path yang benar
import { auth, database } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, set, onValue, off, push } from 'firebase/database';
import mqtt from 'mqtt';

// MQTT Configuration - Using free public broker
const MQTT_CONFIG = {
  brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
  topics: {
    relay1: 'smartlock/relay1',
    relay2: 'smartlock/relay2',
    relay3: 'smartlock/relay3',
    status: 'smartlock/status'
  }
};

class FirebaseMqttService {
  constructor() {
    this.mqttClient = null;
    this.isConnected = false;
    this.currentUser = null;
    this.relayStates = {
      relay1: false,
      relay2: false,
      relay3: false
    };

    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      console.log('Auth state changed:', user ? user.email : 'No user');
    });

    // Initialize MQTT connection
    this.connectMqtt();
  }

  // Connect to MQTT Broker
  connectMqtt() {
    try {
      console.log('Connecting to MQTT Broker...');
      this.mqttClient = mqtt.connect(MQTT_CONFIG.brokerUrl, {
        clientId: `web-client-${Math.random().toString(16).substr(2, 8)}`,
        reconnectPeriod: 5000 // Auto reconnect every 5 seconds
      });

      this.mqttClient.on('connect', () => {
        console.log('✅ Connected to MQTT Broker');
        this.isConnected = true;
        
        // Subscribe to all topics
        Object.values(MQTT_CONFIG.topics).forEach(topic => {
          this.mqttClient.subscribe(topic, (err) => {
            if (!err) {
              console.log(`✅ Subscribed to ${topic}`);
            } else {
              console.error(`❌ Failed to subscribe to ${topic}:`, err);
            }
          });
        });
      });

      this.mqttClient.on('message', (topic, message) => {
        const messageStr = message.toString();
        console.log(`📨 MQTT Message: ${topic} - ${messageStr}`);
        this.handleMqttMessage(topic, messageStr);
      });

      this.mqttClient.on('error', (error) => {
        console.error('❌ MQTT Error:', error);
        this.isConnected = false;
      });

      this.mqttClient.on('close', () => {
        console.log('🔌 MQTT Connection closed');
        this.isConnected = false;
      });

      this.mqttClient.on('offline', () => {
        console.log('🔴 MQTT Offline');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ MQTT Connection Error:', error);
    }
  }

  // Handle incoming MQTT messages
  handleMqttMessage(topic, message) {
    try {
      // Update relay states from status messages
      if (topic === MQTT_CONFIG.topics.status) {
        if (message.includes('Relay1:')) {
          const state = message.includes('ON');
          this.relayStates.relay1 = state;
          this.updateFirebaseState('relay1', state);
        } else if (message.includes('Relay2:')) {
          const state = message.includes('ON');
          this.relayStates.relay2 = state;
          this.updateFirebaseState('relay2', state);
        } else if (message.includes('Relay3:')) {
          const state = message.includes('ON');
          this.relayStates.relay3 = state;
          this.updateFirebaseState('relay3', state);
        }
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  // Update state to Firebase
  updateFirebaseState(relay, state) {
    try {
      const user = this.getCurrentUser();
      const timestamp = new Date().toISOString();
      
      // Update relay state
      set(ref(database, `relays/${relay}`), {
        state: state,
        lastUpdated: timestamp,
        updatedBy: user ? user.uid : 'anonymous',
        updatedByEmail: user ? user.email : 'anonymous'
      });

      // Log activity
      this.logActivity(relay, state, user);

    } catch (error) {
      console.error('Error updating Firebase:', error);
    }
  }

  // Log activity to Firebase
  logActivity(relay, state, user) {
    try {
      const timestamp = new Date().toISOString();
      const activitiesRef = ref(database, 'activities');
      
      push(activitiesRef, {
        device: `ESP32 - ${relay}`,
        user: user ? user.email : 'anonymous',
        userId: user ? user.uid : 'anonymous',
        action: `${relay} turned ${state ? 'ON' : 'OFF'}`,
        timestamp: timestamp,
        type: 'RELAY_CONTROL'
      });

    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Send command to ESP32 via MQTT
  sendCommand(relay, state) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.mqttClient) {
        console.error('❌ MQTT not connected');
        reject(new Error('MQTT not connected'));
        return;
      }

      const topic = MQTT_CONFIG.topics[relay];
      const message = state ? 'ON' : 'OFF';

      if (!topic) {
        console.error('❌ Invalid relay topic');
        reject(new Error('Invalid relay topic'));
        return;
      }

      this.mqttClient.publish(topic, message, (error) => {
        if (error) {
          console.error(`❌ Failed to publish to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`✅ Command sent: ${topic} - ${message}`);
          
          // Update local state optimistically
          this.relayStates[relay] = state;
          
          // Update Firebase
          this.updateFirebaseState(relay, state);
          
          resolve(true);
        }
      });
    });
  }

  // Listen to relay states from Firebase
  listenToRelayStates(callback) {
    try {
      const relayRef = ref(database, 'relays');
      
      onValue(relayRef, (snapshot) => {
        const data = snapshot.val();
        if (data && callback) {
          callback(data);
        }
      });

      // Return unsubscribe function
      return () => off(relayRef);
    } catch (error) {
      console.error('Error listening to relay states:', error);
      return () => {};
    }
  }

  // Listen to activities from Firebase
  listenToActivities(callback) {
    try {
      const activitiesRef = ref(database, 'activities');
      
      onValue(activitiesRef, (snapshot) => {
        const data = snapshot.val();
        if (data && callback) {
          // Convert object to array
          const activitiesArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          callback(activitiesArray);
        }
      });

      return () => off(activitiesRef);
    } catch (error) {
      console.error('Error listening to activities:', error);
      return () => {};
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Disconnect MQTT
  disconnect() {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.isConnected = false;
    }
  }
}

// Create singleton instance
export const firebaseMqttService = new FirebaseMqttService();