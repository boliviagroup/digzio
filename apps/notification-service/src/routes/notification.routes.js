const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const axios = require('axios');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Send Email Notification
router.post('/email', async (req, res) => {
  try {
    const { to, subject, template_id, dynamic_template_data } = req.body;

    if (!process.env.SENDGRID_API_KEY) {
      console.log('Mock Email Sent:', { to, subject, template_id });
      return res.status(200).json({ message: 'Email sent (mocked)', mock: true });
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@digzio.co.za',
      subject,
      templateId: template_id,
      dynamicTemplateData: dynamic_template_data,
    };

    await sgMail.send(msg);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send WhatsApp Notification
router.post('/whatsapp', async (req, res) => {
  try {
    const { to, template_name, language_code = 'en', components = [] } = req.body;

    if (!process.env.WHATSAPP_TOKEN) {
      console.log('Mock WhatsApp Sent:', { to, template_name });
      return res.status(200).json({ message: 'WhatsApp message sent (mocked)', mock: true });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template_name,
        language: { code: language_code },
        components
      }
    };

    await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ message: 'WhatsApp message sent successfully' });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

module.exports = router;
