const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1) Create a transporter
    // If EMAIL_USER is configured, use Gmail, otherwise fall back to a mock ethereal account
    let transporter;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Mock account for development if no real credentials are provided
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('⚠️ Using Ethereal Mock Email Service (No real credentials found in .env)');
    }

    // 2) Define the email options
    const mailOptions = {
      from: 'Parul Smart Parking <noreply@parulsmartparking.com>',
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    // 3) Actually send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${options.email}`);
    
    if (!process.env.EMAIL_USER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

module.exports = sendEmail;
