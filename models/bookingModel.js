const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!'],
  },

  // ✅ THÊM FIELD NÀY - Mã đơn hàng để tìm booking
  orderId: {
    type: String,
    required: [true, 'Booking must have an order ID'],
    unique: true,
  },

  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },

  paid: {
    type: Boolean,
    default: false,
  },

  // Thông tin VNPay
  vnpayTransactionNo: String,
  vnpayBankCode: String,
  vnpayCardType: String,
  vnpayPayDate: Date,
  vnpayResponseCode: String,

  // ✅ THÊM 2 FIELD NÀY
  transactionId: String,
  paidAt: Date,

  // Trạng thái booking
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'failed'],
    default: 'pending',
  },
});

// Index để tìm nhanh theo orderId
bookingSchema.index({ orderId: 1 });

// Populate tour và user khi query
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
