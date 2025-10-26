/* eslint-disable */

// Lấy dữ liệu tọa độ (locations) được nhúng từ thuộc tính data-locations trong thẻ HTML có id="map"
// dữ liệu này được truyền từ backend (ví dụ: Pug template -> JSON.stringify(tour.locations))
const locations = JSON.parse(document.getElementById('map').dataset.locations);

// Khởi tạo bản đồ Leaflet trong phần tử HTML có id="map"
// Tắt nút zoom (+ / -) mặc định bằng cách truyền option { zoomControl: false }
const map = L.map('map', { zoomControl: false });

// Thêm lớp tile (bản đồ nền) sử dụng nguồn dữ liệu từ OpenStreetMap (miễn phí)
// Thuộc tính attribution giúp hiển thị phần bản quyền ở góc bản đồ
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  crossOrigin: '', // Cho phép tải tile mà không vi phạm chính sách CORS
}).addTo(map); // Gắn layer này vào bản đồ

// Tạo một mảng trống để chứa danh sách tọa độ (lat, lng) của từng điểm trong chuyến tour
const points = [];

// Duyệt qua từng location trong mảng dữ liệu
locations.forEach((loc) => {
  // Push tọa độ của location vào mảng points
  // Lưu ý: trong dữ liệu, loc.coordinates = [lng, lat] → cần đảo lại thành [lat, lng] cho Leaflet
  points.push([loc.coordinates[1], loc.coordinates[0]]);

  // Tạo marker tại vị trí tương ứng trên bản đồ
  L.marker([loc.coordinates[1], loc.coordinates[0]])
    .addTo(map) // Gắn marker này lên bản đồ
    // Gắn popup hiển thị thông tin ngày và mô tả (ví dụ: Day 1: Arrive in Hanoi)
    .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
      autoClose: false, // Popup không tự đóng khi mở popup khác
    })
    .openPopup(); // Mở popup ngay khi marker được tạo
});

// Tạo đối tượng "bounds" bao quanh toàn bộ các điểm (points) để bản đồ tự zoom phù hợp
// .pad(0.5) giúp thêm khoảng trống xung quanh (padding) để không bị sát mép bản đồ
const bounds = L.latLngBounds(points).pad(0.5);

// Điều chỉnh vùng hiển thị của bản đồ sao cho bao gồm tất cả các marker
map.fitBounds(bounds);

// Tắt tính năng zoom bằng con lăn chuột (để tránh người dùng zoom quá sâu vô tình)
map.scrollWheelZoom.disable();
