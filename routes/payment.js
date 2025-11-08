const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');

// Ganti dengan key dari Midtrans Dashboard (sandbox dulu)
const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: 'SB-Mid-server-XXXXXX',
  clientKey: 'SB-Mid-client-XXXXXX',
});

// E-Wallet + VA creator
router.post('/create', async (req, res) => {
  const { method, amount, username } = req.body;

  try {
    const order_id = `ORDER-${Date.now()}`;
    let parameter = {
      transaction_details: {
        order_id,
        gross_amount: amount,
      },
      customer_details: {
        first_name: username || 'User',
      },
    };

    if (['dana', 'gopay', 'shopeepay'].includes(method.toLowerCase())) {
      parameter.payment_type = method.toLowerCase();
      if (method === 'shopeepay') {
        parameter.shopeePay = { callback_url: 'myapp://payment/success' };
      }
    } else {
      parameter.payment_type = 'bank_transfer';
      parameter.bank_transfer = { bank: method.toLowerCase() };
    }

    const charge = await coreApi.charge(parameter);
    res.json({ success: true, data: charge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
