const express = require('express');
const {
  createVNPayPayment,
  vnpayReturn,
  vnpayIpn,
} = require('../controllers/bookingController');
const { protect } = require('../controllers/authController');

const router = express.Router();

// ✅ Tạo payment - CẦN đăng nhập
router.post('/create-payment', protect, createVNPayPayment);

// ✅ Return URL - User quay về sau khi thanh toán
router.get('/vnpay-return', vnpayReturn);

// ✅ IPN - VNPAY gọi về để xác nhận (PHẢI LÀ GET)
router.get('/vnpay-ipn', vnpayIpn);

module.exports = router;
