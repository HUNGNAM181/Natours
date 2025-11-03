/* eslint-disable */

export const displayMap = (locations) => {
  // Tạo bản đồ
  const map = L.map('map', { zoomControl: false });

  // Thêm bản đồ nền (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    crossOrigin: '',
  }).addTo(map);

  const points = [];

  // Duyệt qua từng điểm trong tour
  locations.forEach((loc) => {
    const lat = loc.coordinates[1];
    const lng = loc.coordinates[0];
    points.push([lat, lng]);

    // ✅ Tạo marker
    const marker = L.marker([lat, lng]).addTo(map);

    // ✅ Tạo popup hiển thị sẵn (không cần click)
    const popup = L.popup({
      autoClose: false, // không tự đóng khi mở popup khác
      closeOnClick: false, // không đóng khi click ra ngoài
    })
      .setLatLng([lat, lng]) // đặt vị trí popup
      .setContent(`<p>Day ${loc.day}: ${loc.description}</p>`) // nội dung popup
      .openOn(map); // mở popup trên bản đồ

    // Gắn popup vào marker (để khi hover hoặc click vẫn có popup này)
    marker.bindPopup(popup);
  });

  // Căn bản đồ sao cho thấy hết tất cả điểm
  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);

  // Tắt zoom bằng cuộn chuột
  map.scrollWheelZoom.disable();
};
