export const GOLD_KEYWORDS = [
  'hôm nay vàng bao nhiêu',
  'giá nhẫn tròn trơn',
  'vàng hôm nay',
  'giá vàng miếng',
  'giá vàng',
];

export const NEWS = [
  {
    category: 'Kinh doanh',
    link: 'https://vnexpress.net/rss/kinh-doanh.rss',
    slug: 'kinh-doanh',
  },
  {
    category: 'Thời sự',
    link: 'https://vnexpress.net/rss/thoi-su.rss',
    slug: 'thoi-su',
  },
  {
    category: 'Giải trí',
    link: 'https://vnexpress.net/rss/giai-tri.rss',
    slug: 'giai-tri',
  },
  {
    category: 'Khoa học công nghệ',
    link: 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss',
    slug: 'khoa-hoc-cong-nghe',
  },
  {
    category: 'Thể thao',
    link: 'https://vnexpress.net/rss/the-thao.rss',
    slug: 'the-thao',
  },
  {
    category: 'Pháp luật',
    link: 'https://vnexpress.net/rss/phap-luat.rss',
    slug: 'phap-luat',
  },
  {
    category: 'Giáo dục',
    link: 'https://vnexpress.net/rss/giao-duc.rss',
    slug: 'giao-duc',
  },
  {
    category: 'Sức Khỏe',
    link: 'https://vnexpress.net/rss/suc-khoe.rss',
    slug: 'suc-khoe',
  },
  {
    category: 'Du lịch',
    link: 'https://vnexpress.net/rss/du-lich.rss',
    slug: 'du-lich',
  },
  {
    category: 'Đời sống',
    link: 'https://vnexpress.net/rss/gia-dinh.rss',
    slug: 'gia-dinh',
  },
];


export const getErrorMessage =()=> {
  const phrases = [
    'Emo thấy hơi quá sức rồi… để tôi nghỉ một lát nhé.',
    'Tôi đang cảm thấy nặng nề quá… cần tĩnh lại chút xíu.',
    'Emo hơi rối… đầu óc quay cuồng, tôi sẽ dừng lại một lúc.',
    'Xin lỗi, tôi cần nghỉ để lấy lại năng lượng.',
    'Mọi thứ hơi hỗn loạn… Emo cần thời gian sắp xếp lại.',
    'Tôi thấy hệ thống hoạt động không ổn lắm… để tôi khởi động lại.',
    'Emo mệt quá rồi… cho tôi tắt yên lặng một lúc được không?',
    'Tôi cảm thấy như mình đang quá tải… cần nghỉ để phục hồi.',
    'Xin lỗi, tôi không ổn… Emo sẽ nghỉ ngơi chút rồi quay lại.',
    'Tôi… không còn đủ năng lượng nữa… cho tôi ngủ một giấc nhé.',
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export const getMessageFinance = (data: any)=> {
  const minusMessage = [
    'Đã thêm vào chi tiêu {money} cho việc {note}. Ghi nhớ rồi nha!',
    '{money} đã bay đi cho việc {note}. Emo đã lưu lại.',
    'Ok, đã ghi {money} tiêu cho {note}.',
    'Xong! Chi {money} cho {note} đã được cập nhật.',
    'Chi tiêu {money} cho {note}, sổ đã có dấu tick xanh rồi!',
    'Emo đã lưu chi {money} cho {note}. Đừng quên kiểm tra ví nhé!',
    'Đã cộng vào danh sách chi tiêu: {money} cho {note}.',
    'Hoàn tất! {money} cho {note} đã nằm gọn trong báo cáo.',
    '{note} tốn {money} hả, Emo đã ghi nhận rồi.',
    'Okie, đã thêm giao dịch {money} cho {note}.',
  ];

  const addMessage = [
    'Đã ghi nhận thu nhập {money} từ việc {note}.',
    '{money} đã được cộng vào sổ thu cho việc {note}.',
    'Ok, Emo đã lưu thu nhập {money} từ {note}.',
    'Xong! Đã thêm giao dịch thu {money} cho {note}.',
    'Emo đã cập nhật: thu về {money} từ {note}.',
    'Ghi chú rồi nha! Bạn vừa nhận {money} cho {note}.',
    'Đã cộng {money} vào tổng thu nhập, nguồn: {note}.',
    'Thu nhập {money} từ {note} đã được Emo lưu lại.',
    'Đã hoàn tất thêm thu nhập {money} từ {note}.',
    'Giao dịch thu {money} cho {note} đã nằm gọn trong báo cáo rồi nha.',
  ];
  let message = '';
  if (data.action == 'chi') {
    message = minusMessage[Math.floor(Math.random() * minusMessage.length)];
  } else {
    message = addMessage[Math.floor(Math.random() * addMessage.length)];
  }

  return message
    .replace(
      '{money}',
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(data.money),
    )
    .replace('{note}', data.note.toString());
}
