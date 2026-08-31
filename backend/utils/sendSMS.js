const twilio = require('twilio');

const sendSMS = async ({ phone, message }) => {
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // 1) Use Real Twilio API if credentials are provided
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const response = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone.startsWith('+') ? phone : `+91${phone}` // Defaulting to India code if missing
      });
      console.log(`[Twilio] Real SMS sent to ${phone}. SID: ${response.sid}`);
    } else {
      // 2) Mock SMS Simulation (Default for Hackathons)
      console.log('\n=========================================');
      console.log('📱 MOCK SMS SIMULATOR (No Twilio Keys Found)');
      console.log('=========================================');
      console.log(`To: ${phone}`);
      console.log(`Message: ${message}`);
      console.log('=========================================\n');
    }
  } catch (error) {
    console.error('❌ Twilio Error:', error.message);
    console.log('\n--- FALLBACK TO MOCK SMS ---');
    console.log(`📱 SMS SENT TO ${phone}:`);
    console.log(`Message: ${message}`);
    console.log('----------------------------\n');
  }
};

module.exports = sendSMS;
