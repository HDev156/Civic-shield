import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Vibration 
} from 'react-native';

interface CountdownModalProps {
  visible: boolean;
  onCancel: () => void;
  onSendNow: () => void;
  onAutoSend: () => void;
  incidentType: 'kidnap' | 'assault' | 'emergency';
}

export default function CountdownModal({ 
  visible, 
  onCancel, 
  onSendNow, 
  onAutoSend,
  incidentType 
}: CountdownModalProps) {
  const [countdown, setCountdown] = useState(10);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setCountdown(10);
      console.log('⏱️ SOS Countdown Started: 10 seconds');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || countdown <= 0) return;

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        console.log(`⏱️ Countdown: ${newValue} seconds remaining`);
        
        // Vibrate on each second
        Vibration.vibrate(50);

        // Auto-send when countdown reaches 0
        if (newValue === 0) {
          console.log('🚨 Countdown reached 0 - Auto-sending SOS!');
          clearInterval(timer);
          onAutoSend();
        }

        return newValue;
      });
    }, 1000);

    // Scale animation for countdown number
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearInterval(timer);
  }, [countdown, visible]);

  // Pulse animation for the circle
  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [visible]);

  const getIncidentColor = () => {
    switch (incidentType) {
      case 'kidnap': return '#8B0000';
      case 'assault': return '#FF6347';
      case 'emergency': return '#FF8C00';
      default: return '#FF0000';
    }
  };

  const getIncidentIcon = () => {
    switch (incidentType) {
      case 'kidnap': return '🚨';
      case 'assault': return '⚠️';
      case 'emergency': return '🆘';
      default: return '🚨';
    }
  };

  const handleCancel = () => {
    console.log('❌ User cancelled SOS countdown');
    Vibration.cancel();
    onCancel();
  };

  const handleSendNow = () => {
    console.log('⚡ User pressed Send Now - Immediate SOS');
    Vibration.cancel();
    onSendNow();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.icon}>{getIncidentIcon()}</Text>
          
          <Text style={styles.title}>SOS Alert Activating</Text>
          
          <Text style={styles.subtitle}>
            Emergency alert will be sent in:
          </Text>

          <Animated.View 
            style={[
              styles.countdownCircle,
              { 
                backgroundColor: getIncidentColor(),
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.countdownText,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              {countdown}
            </Animated.Text>
          </Animated.View>

          <Text style={styles.warningText}>
            Your location will be shared with emergency contacts
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.sendNowButton]}
              onPress={handleSendNow}
            >
              <Text style={styles.sendNowText}>⚡ Send Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.typeText}>
            Type: {incidentType.toUpperCase()}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  countdownCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  sendNowButton: {
    backgroundColor: '#FF0000',
  },
  sendNowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
  },
});
