/* eslint-disable */
import { showAlert } from './alerts';

document.getElementById('book-tour')?.addEventListener('click', async (e) => {
  e.preventDefault();
  console.log(e.target.dataset);
  const tourId = e.target.dataset.tourId;

  try {
    const res = await fetch('/api/v1/payment/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tourId }), // ví dụ 2 triệu
    });

    const data = await res.json();

    if (data.status === 'success') {
      // Optional: show immediate alert then redirect (delay small)
      showAlert('success', 'Đang chuyển sang cổng thanh toán...');
      setTimeout(() => {
        window.location.href = data.paymentUrl;
      }, 800);
    } else {
      showAlert('error', 'Không thể tạo giao dịch VNPay');
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi tạo thanh toán!');
  }
});
