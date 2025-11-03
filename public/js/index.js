/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';
import './booking.js'; // ✅ thêm dòng này để nút "Book tour now" hoạt động
import { showAlert } from './alerts.js'; // ✅ thêm để hiển thị alert thanh toán

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

// =============== MAPBOX ===============
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// =============== LOGIN FORM ===============
if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

// =============== LOGOUT ===============
if (logOutBtn) logOutBtn.addEventListener('click', logout);

// =============== UPDATE USER DATA ===============
if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });

// =============== UPDATE PASSWORD ===============
if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

// =============== PAYMENT ALERT HANDLER ===============
(function handlePaymentAlertFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('orderId');

    if (payment === 'success') {
      showAlert(
        'success',
        `Thanh toán thành công! 🎉 Mã đơn hàng: ${orderId || ''}`,
      );
      // Xóa query để không hiện lại alert khi F5
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'fail') {
      showAlert(
        'error',
        `Thanh toán thất bại! ❌ ${orderId ? `Mã đơn hàng: ${orderId}` : ''}`,
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (err) {
    console.error('Payment alert handler error:', err);
  }
})();
