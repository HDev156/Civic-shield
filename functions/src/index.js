/**
 * Firebase Cloud Functions for Civic Shield
 * Handles automatic SMS sending via Twilio
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

// Get Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const twilioClient = twilio(accountSid, authToken);

/**
 * Send emergency SMS when SOS alert is created
 */
exports.sendEmergencySMS = functions.firestore
  .document('sos_alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    console.log('🚨 New SOS Alert:', context.params.alertId);
    
    try {
      // Get emergency contacts from user's data
      const userId = data.userId;
      const contactsSnapshot = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('emergency_contacts')
        .get();
      
      if (contactsSnapshot.empty) {
        console.log('⚠️ No emergency contacts found');
        return null;
      }
      
      const contacts = contactsSnapshot.docs.map(doc => doc.data());
      const mapsLink = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
      
      const message = `🚨 EMERGENCY ALERT

I may be in danger. My live location:
${mapsLink}

Type: ${data.type.toUpperCase()}
Time: ${new Date(data.createdAt).toLocaleString()}

Sent from Civic Shield`;

      // Send SMS to all contacts
      const promises = contacts.map(async (contact) => {
        try {
          const result = await twilioClient.messages.create({
            body: message,
            from: twilioPhone,
            to: contact.phone
          });
          console.log(`✅ SMS sent to ${contact.name}: ${result.sid}`);
          return result;
        } catch (error) {
          console.error(`❌ Failed to send SMS to ${contact.name}:`, error);
          return null;
        }
      });
      
      await Promise.all(promises);
      console.log('✅ All SMS sent');
      
      return null;
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return null;
    }
  });

/**
 * Send location updates every 30 seconds
 */
exports.sendLocationUpdate = functions.firestore
  .document('location_updates/{updateId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    console.log('📍 Location Update:', context.params.updateId);
    
    try {
      const userId = data.userId;
      const contactsSnapshot = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('emergency_contacts')
        .get();
      
      if (contactsSnapshot.empty) {
        return null;
      }
      
      const contacts = contactsSnapshot.docs.map(doc => doc.data());
      const mapsLink = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
      
      const message = `📍 LIVE LOCATION UPDATE

Current location:
${mapsLink}

Time: ${new Date(data.timestamp).toLocaleTimeString()}
Accuracy: ±${Math.round(data.accuracy)}m

Civic Shield - Live Tracking Active`;

      // Send to all contacts
      const promises = contacts.map(async (contact) => {
        try {
          const result = await twilioClient.messages.create({
            body: message,
            from: twilioPhone,
            to: contact.phone
          });
          console.log(`✅ Update sent to ${contact.name}`);
          return result;
        } catch (error) {
          console.error(`❌ Failed to send update to ${contact.name}:`, error);
          return null;
        }
      });
      
      await Promise.all(promises);
      
      return null;
    } catch (error) {
      console.error('❌ Error sending location update:', error);
      return null;
    }
  });

/**
 * Send voice recording link when available
 */
exports.sendRecordingLink = functions.firestore
  .document('incidents/{incidentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if recording URL was just added
    if (!before.recordingUrl && after.recordingUrl) {
      console.log('🎤 Recording available:', after.recordingUrl);
      
      try {
        const userId = after.userId;
        const contactsSnapshot = await admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('emergency_contacts')
          .get();
        
        if (contactsSnapshot.empty) {
          return null;
        }
        
        const contacts = contactsSnapshot.docs.map(doc => doc.data());
        
        const message = `🎤 VOICE RECORDING AVAILABLE

Emergency recording from Civic Shield:
${after.recordingUrl}

Time: ${new Date(after.createdAt).toLocaleTimeString()}

Listen to this recording for evidence.`;

        // Send to all contacts
        const promises = contacts.map(async (contact) => {
          try {
            const result = await twilioClient.messages.create({
              body: message,
              from: twilioPhone,
              to: contact.phone
            });
            console.log(`✅ Recording link sent to ${contact.name}`);
            return result;
          } catch (error) {
            console.error(`❌ Failed to send recording link to ${contact.name}:`, error);
            return null;
          }
        });
        
        await Promise.all(promises);
        
        return null;
      } catch (error) {
        console.error('❌ Error sending recording link:', error);
        return null;
      }
    }
    
    return null;
  });
