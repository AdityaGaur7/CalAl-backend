// server.js
const express = require('express');
const stripe = require('stripe')('sk_test_51POHrrSIkOV7J91Yt4SMQZX1FvgsUD1mzeXsEpdVvPSt6EXldR392m71bDvkRynzXHb4tHflpdFQWUcLmldEyxfF00u6eIRl5x'); // Replace with your Stripe secret key
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // For PayPal API

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Stripe payment intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount, couponCode } = req.body;

  // Apply discount if coupon code is valid (example code)
  let finalAmount = amount;
  if (couponCode === 'save20') {
    finalAmount = amount * 0.80; // 20% discount
 
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to the smallest currency unit
      currency: 'usd',
    });
    // console.log(paymentIntent);
    res.json({ clientSecret: paymentIntent.client_secret, amount: finalAmount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment intent: ' + error.message });
  }
});




// PayPal order creation
app.post('/create-paypal-order', async (req, res) => {
  const { amount, couponCode } = req.body;

  // Apply discount if coupon code is valid (example code)
  let finalAmount = amount;
  if (couponCode === 'save20') {
    finalAmount = amount * 0.80; // 20% discount
  }else{
    
  }

  const PAYPAL_CLIENT_ID = 'AW1aPzptTsRPlwWaVcDaJAY5uWAMoRecfU3PDoRTMOnLJZR0TTFt0-ObJ590cuf63HklMO6o1FGmGnYc';
  const PAYPAL_SECRET = 'EHZ6128b2dTVVVliaetM1gmiMZtXFfv-QjyGm_-TxkZ-OGUmOs-ga5N-B07FTiy2tFSj6Wb4KWz0uf_S';

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: finalAmount.toFixed(2) // Use discounted amount
          }
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal API error: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    res.json({ id: data.id, finalAmount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PayPal order: ' + error.message });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
