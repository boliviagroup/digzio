const express = require('express');
const router = express.Router();
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const axios = require('axios');

// Initialize AWS SES
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'af-south-1' });

// Send Email Notification
router.post('/email', async (req, res) => {
  try {
    const { to, subject, body_html, body_text } = req.body;

    if (!process.env.SES_FROM_EMAIL) {
      console.log('Mock Email Sent:', { to, subject });
      return res.status(200).json({ message: 'Email sent (mocked)', mock: true });
    }

    const params = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@digzio.co.za',
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: body_html || '<p>Hello from Digzio!</p>',
            Charset: 'UTF-8'
          },
          Text: {
            Data: body_text || 'Hello from Digzio!',
            Charset: 'UTF-8'
          }
        }
      }
    };

    await sesClient.send(new SendEmailCommand(params));
    res.status(200).json({ message: 'Email sent successfully via SES' });
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
