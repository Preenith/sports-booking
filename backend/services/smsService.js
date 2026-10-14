const https = require('https');
require('dotenv').config();

/**
 * SMS Service for sending booking confirmation messages
 * Supports MSG91, Fast2SMS, and Twilio
 */

// Validate phone number
function validatePhoneNumber(phone) {
    if (!phone) return false;
    // Remove spaces, dashes, parentheses, and leading 0
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^0+/, '');
    // Check if it's a valid Indian phone number (10 digits starting with 6-9)
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    return indianPhoneRegex.test(cleanPhone);
}

// Format phone number to include country code
function formatPhoneNumber(phone) {
    if (!phone) return null;
    // Remove spaces, dashes, parentheses, and leading 0
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^0+/, '');
    // If already has country code with +, return as is
    if (cleanPhone.startsWith('+91') && cleanPhone.length === 13) {
        return cleanPhone;
    }
    // If has country code without +, add it
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        return '+' + cleanPhone;
    }
    // Add country code for Indian numbers (with + for E.164 format)
    if (cleanPhone.length === 10) {
        return '+91' + cleanPhone;
    }
    return cleanPhone;
}

// Send SMS using MSG91
async function sendViaMSG91(phoneNumber, message) {
    return new Promise((resolve, reject) => {
        const authKey = process.env.SMS_API_KEY;
        const senderId = process.env.SMS_SENDER_ID || 'SPORTC';
        const route = 4; // Transactional route
        const country = '91';

        const data = JSON.stringify({
            sender: senderId,
            route: route,
            country: country,
            sms: [{
                message: message,
                to: [phoneNumber]
            }]
        });

        const options = {
            hostname: 'control.msg91.com',
            path: '/api/v5/flow/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authkey': authKey
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.type === 'success') {
                        resolve({ success: true, provider: 'MSG91', response });
                    } else {
                        reject({ success: false, provider: 'MSG91', error: response.message });
                    }
                } catch (error) {
                    reject({ success: false, provider: 'MSG91', error: error.message });
                }
            });
        });

        req.on('error', (error) => {
            reject({ success: false, provider: 'MSG91', error: error.message });
        });

        req.write(data);
        req.end();
    });
}

// Send SMS using Fast2SMS
async function sendViaFast2SMS(phoneNumber, message) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
        const senderId = process.env.SMS_SENDER_ID || 'FSTSMS';

        console.log("Fast2SMS key configured:", !!apiKey);

        const data = JSON.stringify({
            route: 'q',
            message: message,
            numbers: phoneNumber
        });

        const options = {
            hostname: 'www.fast2sms.com',
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.return === true) {
                        resolve({ success: true, provider: 'Fast2SMS', response });
                    } else {
                        reject({ success: false, provider: 'Fast2SMS', error: response.message });
                    }
                } catch (error) {
                    reject({ success: false, provider: 'Fast2SMS', error: error.message });
                }
            });
        });

        req.on('error', (error) => {
            reject({ success: false, provider: 'Fast2SMS', error: error.message });
        });

        req.write(data);
        req.end();
    });
}

// Send SMS using TextBee
async function sendViaTextBee(phoneNumber, message) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.TEXTBEE_API_KEY;

        console.log("TextBee key configured:", !!apiKey);

        const data = JSON.stringify({
            recipients: [phoneNumber],
            message: message
        });

        const options = {
            hostname: 'api.textbee.dev',
            path: '/api/v1/gateway/send-sms',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    console.log("TextBee response:", response);
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        resolve({ success: true, provider: 'TextBee', response });
                    } else {
                        reject({ success: false, provider: 'TextBee', error: response.message || response.error || 'Unknown error' });
                    }
                } catch (error) {
                    reject({ success: false, provider: 'TextBee', error: error.message });
                }
            });
        });

        req.on('error', (error) => {
            reject({ success: false, provider: 'TextBee', error: error.message });
        });

        req.write(data);
        req.end();
    });
}

// Send SMS using Twilio
async function sendViaTwilio(phoneNumber, message) {
    return new Promise((resolve, reject) => {
        const accountSid = process.env.SMS_API_KEY;
        const authToken = process.env.SMS_API_SECRET;
        const fromNumber = process.env.SMS_SENDER_ID;

        const data = new URLSearchParams();
        data.append('To', phoneNumber);
        data.append('From', fromNumber);
        data.append('Body', message);

        const options = {
            hostname: 'api.twilio.com',
            path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64')
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.sid) {
                        resolve({ success: true, provider: 'Twilio', response });
                    } else {
                        reject({ success: false, provider: 'Twilio', error: response.message });
                    }
                } catch (error) {
                    reject({ success: false, provider: 'Twilio', error: error.message });
                }
            });
        });

        req.on('error', (error) => {
            reject({ success: false, provider: 'Twilio', error: error.message });
        });

        req.write(data.toString());
        req.end();
    });
}

// Main function to send booking confirmation SMS
async function sendBookingConfirmationSMS(phoneNumber, bookingDetails) {
    try {
        // Validate phone number
        if (!validatePhoneNumber(phoneNumber)) {
            console.error('Invalid phone number:', phoneNumber);
            return { success: false, error: 'Invalid phone number' };
        }

        // Format phone number
        const formattedPhone = formatPhoneNumber(phoneNumber);

        // Format date
        const bookingDate = new Date(bookingDetails.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Format time
        const formatTime = (time) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        };

        // Create SMS message
        const message = `Hello ${bookingDetails.userName}, your stadium booking is confirmed! Stadium: ${bookingDetails.facilityName}, Date: ${bookingDate}, Time: ${formatTime(bookingDetails.startTime)}–${formatTime(bookingDetails.endTime)}, Booking ID: ${bookingDetails.bookingId}, Amount: ₹${bookingDetails.amount}. Status: Confirmed. Thank you for using SportConnect.`;

        // Get SMS provider from environment
        const provider = process.env.SMS_PROVIDER || 'MSG91';

        let result;
        switch (provider.toLowerCase()) {
            case 'msg91':
                result = await sendViaMSG91(formattedPhone, message);
                break;
            case 'fast2sms':
                result = await sendViaFast2SMS(formattedPhone, message);
                break;
            case 'textbee':
                result = await sendViaTextBee(formattedPhone, message);
                break;
            case 'twilio':
                result = await sendViaTwilio(formattedPhone, message);
                break;
            default:
                console.error('Unsupported SMS provider:', provider);
                return { success: false, error: 'Unsupported SMS provider' };
        }

        // Log result
        if (result.success) {
            console.log('SMS sent successfully via', result.provider, 'to', formattedPhone);
        } else {
            console.error('SMS sending failed via', result.provider, ':', result.error);
        }

        return result;

    } catch (error) {
        console.error('SMS service error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendBookingConfirmationSMS,
    validatePhoneNumber,
    formatPhoneNumber
};
