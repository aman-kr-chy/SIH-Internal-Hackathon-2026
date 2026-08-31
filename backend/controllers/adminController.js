const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle SaaS Subscription Request
// @route   POST /api/admin/subscribe
// @access  Private/Admin
const subscribeSaaS = async (req, res) => {
  const { organization, email, phone, plan } = req.body;

  try {
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">SaaS Subscription Request Received!</h2>
        <p>Hello,</p>
        <p>Thank you for expressing interest in our Smart Parking SaaS Platform. We have received your request for the <strong>${plan}</strong> plan.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Registration Details:</h3>
          <p style="margin: 5px 0;"><strong>Organization:</strong> ${organization}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
          <p style="margin: 5px 0;"><strong>Requested Plan:</strong> ${plan}</p>
        </div>

        <p>Our sales team will review your application and contact you shortly at <strong>${phone}</strong> or via this email address to set up your dedicated Operator Dashboard and configure your parking zones.</p>
        <br/>
        <p>Best regards,<br/>The Parul Smart Parking Team</p>
      </div>
    `;

    await sendEmail({
      email: email,
      subject: `Welcome to Smart Parking SaaS - ${plan} Plan Request`,
      html: htmlMessage
    });

    res.status(200).json({ message: 'Subscription request received and email sent successfully.' });
  } catch (error) {
    console.error("Subscription Email Error:", error);
    res.status(500).json({ message: 'Failed to process subscription request.' });
  }
};

module.exports = {
  getUsers,
  subscribeSaaS,
};
