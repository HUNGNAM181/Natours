const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const vnpay = require('../utils/vnpay');

// ==========================================
// 1️⃣ TẠO PAYMENT URL
// ==========================================
exports.createVNPayPayment = async (req, res) => {
  try {
    console.log('📝 Request body:', req.body);
    console.log('👤 User:', req.user);

    const { tourId } = req.body;

    // ✅ Kiểm tra user đăng nhập
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'You must be logged in to book a tour',
      });
    }

    // ✅ Kiểm tra có tourId không
    if (!tourId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide tourId',
      });
    }

    // ✅ Lấy tour từ DB
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        status: 'error',
        message: 'Tour not found',
      });
    }

    // ✅ Lấy giá tour làm amount
    const amount = tour.price;
    console.log('💰 Amount:', amount);

    const orderId = `ORDER_${Date.now()}`;

    // ✅ Tạo booking trước khi thanh toán
    const booking = await Booking.create({
      tour: tourId,
      user: req.user.id,
      orderId,
      price: amount,
      status: 'pending',
    });

    console.log('✅ Booking created:', booking._id);

    // ✅ URL callback khi thanh toán xong
    const returnUrl = `${process.env.APP_URL}/api/v1/payment/vnpay-return`;
    // const ipnUrl = `${process.env.APP_URL}/api/v1/payment/vnpay-ipn`;

    // ✅ Tạo link thanh toán VNPay
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount * 100, // VNPAY yêu cầu nhân 100
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Booking tour ${tour.name}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      // vnp_IpnUrl: ipnUrl, // 👈 thêm dòng này
      vnp_Locale: 'vn',
    });

    // ✅ Gửi URL về frontend
    res.status(200).json({
      status: 'success',
      paymentUrl,
      bookingId: booking._id,
    });
  } catch (err) {
    console.error('❌ Create payment error:', err);
    res.status(500).json({
      status: 'error',
      message: err.message || 'Cannot create payment URL',
    });
  }
};

// ==========================================
// 2️⃣ XỬ LÝ KHI USER QUAY VỀ SAU KHI THANH TOÁN
// ==========================================
exports.vnpayReturn = async (req, res) => {
  try {
    // ✅ Log toàn bộ query string từ VNPay (rất hữu ích khi debug)
    console.log(
      '✅ Full VNPay query string:',
      JSON.stringify(req.query, null, 2),
    );

    // ✅ Xác thực chữ ký trả về từ VNPAY
    const result = vnpay.verifyReturnUrl(req.query);
    console.log('🧾 VNPay Verify Result:', result);

    // 👉 Gói `vnpay` không có `result.data`, tất cả nằm trực tiếp trong `result`
    const {
      vnp_TxnRef,
      vnp_Amount,
      vnp_TransactionNo,
      vnp_ResponseCode,
      vnp_BankCode,
      vnp_CardType,
    } = result;

    // ✅ Kiểm tra chữ ký hợp lệ và mã phản hồi "00" (thành công)
    if (result.isVerified && result.isSuccess && vnp_ResponseCode === '00') {
      // ✅ Tìm và cập nhật booking theo orderId
      const booking = await Booking.findOneAndUpdate(
        { orderId: vnp_TxnRef },
        {
          status: 'paid',
          paid: true,
          transactionId: vnp_TransactionNo,
          vnpayTransactionNo: vnp_TransactionNo,
          vnpayBankCode: vnp_BankCode,
          vnpayCardType: vnp_CardType,
          vnpayResponseCode: vnp_ResponseCode,
          paidAt: new Date(),
        },
        { new: true },
      );

      if (!booking) {
        console.error('❌ Booking not found for orderId:', vnp_TxnRef);
        return res.render('paymentFail', {
          error: 'Không tìm thấy đơn hàng. Vui lòng liên hệ hỗ trợ.',
        });
      }

      console.log('✅ Booking updated successfully:', booking._id);
      // Redirect về trang All Tours (home) kèm query để frontend show alert
      return res.redirect(
        `${process.env.APP_URL}/?payment=success&orderId=${encodeURIComponent(vnp_TxnRef)}`,
      );

      // // ✅ Hiển thị trang thanh toán thành công
      // return res.render('paymentSuccess', {
      //   orderId: vnp_TxnRef,
      //   amount: vnp_Amount / 100, // VNPay trả về nhân 100
      //   transactionNo: vnp_TransactionNo,
      //   bankCode: vnp_BankCode,
      //   cardType: vnp_CardType,
      // });
    }

    // ❌ Nếu thanh toán thất bại hoặc sai mã phản hồi
    console.warn('⚠️ Payment failed with code:', vnp_ResponseCode);

    // ✅ Cập nhật trạng thái booking thành failed
    await Booking.findOneAndUpdate(
      { orderId: vnp_TxnRef },
      {
        status: 'failed',
        vnpayResponseCode: vnp_ResponseCode,
      },
    );

    // Nếu thất bại, redirect với payment=fail
    // return res.redirect(
    //   `${process.env.APP_URL}/?payment=fail&orderId=${encodeURIComponent(vnp_TxnRef || '')}`,
    // );

    return res.render('paymentFail', {
      error:
        vnp_ResponseCode === '24'
          ? 'Bạn đã hủy giao dịch.'
          : `Thanh toán thất bại. Mã lỗi: ${vnp_ResponseCode}`,
    });
  } catch (err) {
    console.error('❌ Return URL processing error:', err);
    // redirect cũng trong trường hợp lỗi để user quay lại trang chính
    // return res.redirect(`${process.env.APP_URL}/?payment=fail`);

    return res.render('paymentFail', {
      error: 'Lỗi hệ thống. Vui lòng thử lại.',
    });
  }
};

// ==========================================
// 3️⃣ XỬ LÝ IPN (VNPAY GỌI ĐỂ XÁC NHẬN)
// ==========================================
exports.vnpayIpn = async (req, res) => {
  try {
    console.log('🔔 VNPay IPN Data:', req.query);

    // ✅ Verify chữ ký từ VNPAY (PHẢI DÙNG req.query)
    const verification = vnpay.verifyReturnUrl(req.query);

    if (verification.success && verification.data.vnp_ResponseCode === '00') {
      // ✅ Cập nhật booking
      const booking = await Booking.findOneAndUpdate(
        { orderId: verification.data.vnp_TxnRef },
        {
          status: 'paid',
          paid: true,
          transactionId: verification.data.vnp_TransactionNo,
          vnpayTransactionNo: verification.data.vnp_TransactionNo,
          vnpayBankCode: verification.data.vnp_BankCode,
          vnpayResponseCode: verification.data.vnp_ResponseCode,
          paidAt: new Date(),
        },
      );

      console.log('✅ IPN - Booking updated:', booking?._id);

      // ✅ Trả về cho VNPAY biết đã nhận
      res.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      console.log('❌ IPN - Invalid checksum');
      res.json({ RspCode: '97', Message: 'Invalid checksum' });
    }
  } catch (err) {
    console.error('❌ IPN error:', err);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
};
