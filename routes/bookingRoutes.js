const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// ✅ Tạo payment - CẦN đăng nhập
router.post(
  '/create-payment',
  authController.protect,
  bookingController.createVNPayPayment,
);

// ✅ Return URL - User quay về sau khi thanh toán
router.get('/vnpay-return', bookingController.vnpayReturn);

// ✅ IPN - VNPAY gọi về để xác nhận (PHẢI LÀ GET)
router.get('/vnpay-ipn', bookingController.vnpayIpn);

router.use(authController.protect); // ✅ Bắt buộc có dòng này trước
router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
