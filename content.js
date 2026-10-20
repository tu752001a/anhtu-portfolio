/* ==========================================================================
   PHƯƠNG ANH TÚ · PAT — NỘI DUNG WEBSITE
   --------------------------------------------------------------------------
   Đây là file DUY NHẤT bạn cần sửa khi muốn đổi thông tin trên web.
   Người xem chỉ đọc được; chỉ ai có quyền vào kho code / tài khoản hosting
   (Vercel / GitHub) của bạn mới sửa và đăng lại được.

   Quy tắc:
   - Giữ nguyên dấu ngoặc kép "..." và dấu phẩy cuối mỗi dòng.
   - Ô nào để "" (rỗng) hoặc null thì web tự ẩn / ghi "Đang cập nhật".
   - youtubeId là phần sau "watch?v=" trong link YouTube.
     Ví dụ https://www.youtube.com/watch?v=TIqTqv7LYlE  ->  "TIqTqv7LYlE"
   - fx: hiệu ứng riêng cho từng sản phẩm. Chọn một trong:
     "notes" "vinyl" "waves" "hearts" "sparks" "rain" "petals" "rings" "comet"
   ========================================================================== */

window.PAT_CONTENT = {
  artist: {
    realName: "Trần Thanh Anh Tú",
    stageName: "Phương Anh Tú",
    rapName: "PAT",
    roles: ["Singer", "Songwriter", "Topliner"],
    tagline: "Ngôi sao sáng nhất trong dải ngân hà của chính mình.",
    intro:
      "Tôi viết nhạc như cách người ta ghi nhật ký: thật, gần và có nhịp thở. Mỗi bài hát là một ngôi sao, và trang web này là bầu trời tôi muốn bạn đi qua cùng tôi.",
    // Phần "Về tôi": mỗi phần tử là một đoạn văn, hiện ra lần lượt.
    about: [
      "Trần Thanh Anh Tú, nghệ danh Phương Anh Tú, rap name PAT. Ca sĩ, nhạc sĩ và topliner, người đi tìm giai điệu trước rồi mới tìm lời, để câu hát nào cũng có chỗ đứng trong tai người nghe.",
      "Tôi tin thái độ quan trọng hơn trình độ. Trình độ có thể học thêm mỗi ngày, còn thái độ cầu thị quyết định một người có đi được đường dài hay không. Tôi lắng nghe góp ý, sửa từng câu, thu lại từng đoạn cho đến khi bài hát nói đúng điều nó cần nói.",
      "Với tôi, âm nhạc là cách biến một thước phim trong đầu thành ngôn ngữ người khác cảm được. Một đoạn hook, một câu topline, một lớp hoà âm đều phải phục vụ câu chuyện đó.",
      "Phát hành và phân phối toàn cầu cùng Euphoria Media Vietnam."
    ],
    quote: "Thái độ quan trọng hơn trình độ."
  },

  // Thông tin liên hệ hiện ở phần cuối (sau khi bấm vào ngôi sao).
  // ĐIỀN email và số điện thoại của bạn vào đây.
  contact: {
    email: "tu752001a@gmail.com",
    phone: "0708980705"
  },

  socials: [
    { name: "Spotify", url: "https://open.spotify.com/artist/1loV9B7CYq91UCncD9nbbg" },
    { name: "Apple Music", url: "https://music.apple.com/us/artist/ph%C6%B0%C6%A1ng-anh-t%C3%BA/1778922650" },
    { name: "Facebook", url: "https://www.facebook.com/phuonganhtupat/" },
    { name: "TikTok", url: "https://www.tiktok.com/@phuonganhtu.pat" },
    { name: "Instagram", url: "https://www.instagram.com/phuonganhtupat/" },
    { name: "YouTube", url: "https://www.youtube.com/@phuonganhtu.patmusic" }
  ],

  publisher: {
    label: "World distribution / Publisher",
    name: "Euphoria Media Vietnam",
    url: "https://www.euphoriamedia.com/vi"
  },

  spotifyArtistId: "1loV9B7CYq91UCncD9nbbg",

  // Nhạc nền: file audio của bạn trong thư mục audio/, lặp liên tục, nhỏ nhẹ.
  // volume 0-1, duckVolume là mức khi đang nghe một bài hát khác trên web.
  bgMusic: { src: "audio/pat-bg.mp3", volume: 0.5, duckVolume: 0.08 },

  // TRACK: xếp theo thứ tự phát hành, bài đầu tiên ở trên cùng. Người xem mở khoá lần lượt.
  // audio:     file mp3 trong thư mục audio/ (đã cân loudness về -14 LUFS)
  // smartLink: link Euphoria (hiện đầu tiên, trước Spotify)
  // spotify:   link bài trên Spotify; để "" thì web mở trang tìm kiếm Spotify theo tên bài
  // story / formed / process: 3 ô "Về bài hát", "Hành trình ra đời", "Thẩm định âm nhạc"
  // Số đo (bpm, key) là ước lượng từ file master, có thể lệch nửa/gấp đôi nhịp hoặc khác cách bạn gọi tông.
  tracks: [
    {
      title: "Thức Tỉnh", artists: "Phương Anh Tú", date: "10/11/2024", genre: "Hip Hop/Rap", isrc: "QZZ782414806",
      audio: "audio/01-thuc-tinh.mp3", peaks: "01-thuc-tinh", smartLink: "https://euphoria.fm/thuc-tinh", spotify: "",
      dur: "2:09", bpm: 123, key: "La trưởng", fx: "sparks",
      story: "Bài mở màn cả hành trình và cũng là lần duy nhất PAT phát hành dưới nhãn Hip Hop/Rap. Đúng như tên gọi, đây là một cú giật mình tỉnh dậy: nhịp dày, chữ dồn, năng lượng đẩy thẳng về phía trước ngay từ đầu.",
      formed: "Single đầu tay, phát hành ngày 10/11/2024 qua Euphoria Media Vietnam. Đây là điểm xuất phát của mọi vì sao phía sau.",
      process: "Mật độ âm thanh dày nhất cả danh mục (gần 5 nhát đánh mỗi giây), hợp với flow rap liên tục. Phần nền trầm chiếm gần nửa năng lượng bài nên bass và kick rất chắc. Beat vào đầy đủ ở giây 17 và giữ độ nén đều (LRA 4 LU), nghe gọn và có lực. Điểm có thể nâng thêm: stereo khá hẹp (0,30), mở rộng lớp pad hoặc ad-lib sẽ cho bài thêm không gian."
    },
    {
      title: "Không Màu", artists: "Phương Anh Tú", date: "26/11/2024", genre: "House", isrc: "QZZ7P2411360",
      audio: "audio/02-khong-mau.mp3", peaks: "02-khong-mau", smartLink: "https://euphoria.fm/khong-mau", spotify: "",
      dur: "3:38", bpm: 117.5, key: "Mi thứ", fx: "waves",
      story: "Rẽ ngoặt sang House chỉ 16 ngày sau bài đầu tiên. Không Màu là một trạng thái lơ lửng: groove đều như nhịp tim lúc ngồi một mình, giọng hát lùi lại để nhịp điệu kể chuyện.",
      formed: "Phát hành ngày 26/11/2024, ngay sau Thức Tỉnh. Hai single cách nhau hơn hai tuần cho thấy PAT bước vào nghề với hai bộ mặt cùng lúc: rap và nhạc điện tử.",
      process: "Bài dài nhất danh mục (3 phút 38) nhưng dải động phẳng gần như tuyệt đối (LRA 1,1 LU), đúng tinh thần House để nghe liền mạch hoặc lên sàn. Giọng hát chỉ chiếm khoảng 14% năng lượng, nhạc cụ dẫn dắt. Master để headroom an toàn (đỉnh -3,8 dBTP). Nếu làm bản remix, có thể thêm một breakdown rõ rệt ở giữa bài để tạo điểm nhấn."
    },
    {
      title: "Em Đau", artists: "Phương Anh Tú", date: "01/08/2025", genre: "Pop", isrc: "QZYHM2508332",
      audio: "audio/03-em-dau.mp3", peaks: "03-em-dau", smartLink: "https://euphoria.fm/em-dau", spotify: "",
      dur: "2:31", bpm: 117.5, key: "Si giáng thứ", fx: "rain",
      story: "Bài Pop đầu tiên và cũng là bài nhiều cảm xúc nhất: có lúc thì thầm, có lúc vỡ oà. Tông thứ tối màu, âm sắc sáng ở dải cao, nghe như một nỗi đau được nói ra thật lòng chứ không giấu.",
      formed: "Ra mắt ngày 01/08/2025, sau khoảng lặng tám tháng kể từ Không Màu. Đây là lần đầu PAT chọn Pop làm thể loại chính, mở đường cho EP 075 về sau. Bài này cũng đang là nhạc nền của trang web.",
      process: "Dải động rộng nhất cả danh mục (LRA 13,1 LU): phần lời nhỏ nhẹ, phần cao trào bung mạnh. Bộ gõ nổi bật nhất trong 12 bài và dải cao (air) sáng, giúp giọng hát trong. Có một nhịp hạ ở khoảng 2:09 trước điệp khúc cuối, đúng chỗ để người nghe nín thở. Lưu ý kỹ thuật: đỉnh thực đạt +2,5 dBTP, nên đặt limiter trần -1 dBTP để tránh vỡ tiếng khi nền tảng chuyển mã."
    },
    {
      title: "Phiêu", artists: "Phương Anh Tú, Karrot", date: "09/09/2025", genre: "Pop", isrc: "QZYHM2508961",
      audio: "audio/04-phieu.mp3", peaks: "04-phieu", smartLink: "https://euphoria.fm/phieu", spotify: "",
      dur: "2:38", bpm: 152, key: "Rê trưởng", fx: "petals",
      story: "Sau Em Đau là một hơi thở nhẹ hẳn: tông trưởng, nhịp nhanh, cảm giác thả trôi đúng như chữ Phiêu. Lần đầu PAT đứng chung tên với Karrot.",
      formed: "Phát hành ngày 09/09/2025, chỉ khoảng năm tuần sau Em Đau. Hai bài ra liền nhau như hai mặt của cùng một mùa: một bên đau, một bên buông.",
      process: "Nhịp nhanh nhất danh mục (khoảng 152 BPM), tông Rê trưởng được nhận diện rõ (độ tin cậy 0,8). Hình ảnh stereo rộng hơn các single trước (0,39), tạo cảm giác bay. Cũng như Em Đau, đỉnh thực vượt 0 dBTP (+2,6), nên master lại với trần -1 dBTP nếu phát hành phiên bản mới."
    },
    {
      title: "Phận Anh", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", isrc: "QZYHM2602240",
      audio: "audio/05-phan-anh.mp3", peaks: "05-phan-anh", smartLink: "https://euphoria.fm/ep-075", spotify: "", ep: "075", epNo: 1,
      dur: "1:51", bpm: 117.5, key: "Mi thứ", fx: "notes",
      story: "Bài mở đầu EP 075. Giọng hát đứng trước tất cả, nền nhạc lùi về sau như một căn phòng tối để lời tự sự vang lên. Phận Anh đặt câu hỏi, và sáu bài phía sau lần lượt trả lời.",
      formed: "Track 1 của EP đầu tay 075, phát hành ngày 07/05/2026. Ngày hôm sau, bản 075 (Short Version) gồm 19 đoạn cắt ngắn được tung ra để dùng cho video ngắn.",
      process: "Giọng hát chiếm gần 60% năng lượng, dải trầm rất mỏng (0,20), một lựa chọn chủ động để lời được nghe rõ. Nhạc vào đủ khá muộn (giây 29) và có một nhịp ngắt ở khoảng 1:39 trước câu kết. Tông nghiêng về Mi thứ, và chính tông này sẽ được giải ở bài cuối EP. Dải động 8,2 LU cho bài nhiều chỗ thở."
    },
    {
      title: "Lalalove (Interlude)", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", isrc: "QZYHM2602241",
      audio: "audio/06-lalalove.mp3", peaks: "06-lalalove", smartLink: "https://euphoria.fm/ep-075", spotify: "", ep: "075", epNo: 2,
      dur: "1:30", bpm: 99, key: "Đô thăng trưởng", fx: "hearts",
      story: "Khúc dạo giữa đầu tiên của EP: chậm lại, ấm lên, gần như chỉ còn beat và giai điệu ngân nga. Một khoảng nghỉ ngọt ngào sau lời tự sự của Phận Anh.",
      formed: "Track 2 của EP 075 (07/05/2026). Trong bản Short Version, Lalalove được chia thành 4 đoạn, nhiều nhất trong các bài, cho thấy đây là chất liệu hợp với video ngắn.",
      process: "Nhịp chậm nhất EP (khoảng 99 BPM) và dải trầm dày nhất cả danh mục (0,77), giọng chỉ khoảng 10%, đúng vai trò interlude nghiêng về không khí. Độ nén đều (LRA 2,2 LU). Tông khó xác định chắc chắn (quanh Đô thăng), có thể do hoà âm nhiều nốt màu."
    },
    {
      title: "Chẳng Thể Níu Em Lại", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", isrc: "QZYHM2602242",
      audio: "audio/07-chang-the-niu-em-lai.mp3", peaks: "07-chang-the-niu-em-lai", smartLink: "https://euphoria.fm/ep-075", spotify: "", ep: "075", epNo: 3,
      dur: "2:41", bpm: 123, key: "La thứ", fx: "comet",
      story: "Nhịp quay lại nhanh, nhưng câu chuyện thì buông tay. Chẳng Thể Níu Em Lại là bài Pop có nhịp đi đều và chắc, kiểu nhảy được nhưng nghe kỹ lại buồn.",
      formed: "Track 3 của EP 075 (07/05/2026). Bài mở ra cặp đôi cùng tông La thứ với Sau Lớp Mặt Nạ ngay phía sau.",
      process: "Bộ gõ rõ và giàu chi tiết (0,30), stereo rộng vừa (0,41), beat vào đủ ở giây 18. Dải động gọn (LRA 4 LU) giúp bài giữ nhịp từ đầu đến cuối. Hai bài 3 và 4 cùng tông, cùng nhịp khoảng 123 BPM nên chuyển bài rất liền mạch."
    },
    {
      title: "Sau Lớp Mặt Nạ", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", isrc: "QZYHM2602243",
      audio: "audio/08-sau-lop-mat-na.mp3", peaks: "08-sau-lop-mat-na", smartLink: "https://euphoria.fm/ep-075", spotify: "", ep: "075", epNo: 4,
      dur: "2:25", bpm: 123, key: "La thứ", fx: "rings",
      story: "Trái tim của EP. Bài mở ra chậm rãi như người đang lưỡng lự tháo mặt nạ, rồi mới để toàn bộ âm thanh tràn vào. Đây cũng là bài duy nhất trong EP sau đó có thêm một phiên bản Phonk.",
      formed: "Track 4 của EP 075 (07/05/2026). Khoảng 50 ngày sau, bài được làm lại thành Sau Lớp Mặt Nạ (Phonk Version) cùng Karrot.",
      process: "Âm trường rộng nhất cả danh mục (stereo 0,80), nghe rất điện ảnh. Phần dẫn kéo dài: nhạc chỉ vào đầy đủ ở giây 45, có nhịp hạ ở khoảng 1:16. Tông La thứ rõ nhất trong các bài (độ tin cậy 0,86). Khoảng cách giữa phần nhẹ và phần mạnh vừa phải (LRA 7,7 LU)."
    },
    {
      title: "Bảo Rằng Là Chưa (Interlude)", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", isrc: "QZYHM2602244",
      audio: "audio/09-bao-rang-la-chua.mp3", peaks: "09-bao-rang-la-chua", smartLink: "https://euphoria.fm/ep-075", spotify: "", ep: "075", epNo: 5,
      dur: "0:49", bpm: 129, key: "Đô trưởng", fx: "sparks",
      story: "Khúc dạo ngắn nhất, chưa tới một phút, nhưng là bản lề của EP: từ tông thứ u tối chuyển sang Đô trưởng sáng sủa. Giọng hát vào ngay giây đầu, như một lời tự nhủ.",
      formed: "Track 5 của EP 075 (07/05/2026), đặt ngay trước Tìm và cùng tông Đô trưởng để dẫn thẳng vào bài.",
      process: "Dải cao sáng nhất danh mục (air 0,055) và stereo rộng (0,73) tạo cảm giác mở cửa sổ. Tông Đô trưởng nhận diện rất chắc (0,92). Giọng chiếm hơn một nửa năng lượng. Một interlude làm đúng việc của nó: ngắn, rõ, và nối hai nửa EP."
    },
    {
      title: "Tìm", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", isrc: "QZYHM2602245",
      audio: "audio/10-tim.mp3", peaks: "10-tim", smartLink: "https://euphoria.fm/ep-075", spotify: "", ep: "075", epNo: 6,
      dur: "2:39", bpm: 123, key: "Đô trưởng", fx: "comet",
      story: "Bài hát mộc nhất về mặt sản xuất và gần người nghe nhất: giọng hát gần như đứng một mình phía trước. Sau những gì đã mất ở nửa đầu EP, Tìm là hành trình đi tìm lại.",
      formed: "Track 6 của EP 075 (07/05/2026), nối liền từ Bảo Rằng Là Chưa. Bản Short Version cắt Tìm thành 3 đoạn.",
      process: "Giọng chiếm tỷ lệ cao nhất cả danh mục (0,64) và dải trầm mỏng nhất (0,12), sản xuất chừa chỗ cho lời. Phần dẫn dài (nhạc vào đủ ở giây 42), dải động rộng (LRA 10,2 LU) nên cao trào có sức nặng. Đây là bài thể hiện rõ nhất chất giọng và khả năng topline của PAT."
    },
    {
      title: "Đừng Như Thế", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", isrc: "QZYHM2602246",
      audio: "audio/11-dung-nhu-the.mp3", peaks: "11-dung-nhu-the", smartLink: "https://euphoria.fm/ep-075", spotify: "", ep: "075", epNo: 7,
      dur: "3:04", bpm: 117.5, key: "Mi trưởng", fx: "petals",
      story: "Bài khép lại EP và là bài dài nhất trong 075. Mở đầu EP là Phận Anh ở Mi thứ, kết thúc là Đừng Như Thế ở Mi trưởng: cùng một nốt gốc nhưng ánh sáng đã khác, như một lời chấp nhận.",
      formed: "Track 7, track cuối của EP 075 (07/05/2026). Trong bản Short Version, bài được chia thành 5 đoạn, nhiều nhất trong cả bản.",
      process: "Cấu trúc gọn (LRA 5,1 LU), stereo rộng (0,68), nhạc vào đủ ở giây 19. Việc đặt Mi thứ ở đầu và Mi trưởng ở cuối là một quyết định sắp xếp EP rất có chủ đích, giúp cả bảy bài nghe như một câu chuyện liền mạch."
    },
    {
      title: "Sau Lớp Mặt Nạ (Phonk Version)", artists: "Karrot, Phương Anh Tú", date: "26/06/2026", genre: "House", isrc: "HKK972601595",
      audio: "audio/12-sau-lop-mat-na-phonk.mp3", peaks: "12-sau-lop-mat-na-phonk", smartLink: "https://euphoria.fm/sau-lop-mat-na-phonk", spotify: "",
      dur: "2:28", bpm: 129, key: "La thứ", fx: "vinyl",
      story: "Cùng một câu chuyện, đổi sang áo Phonk: trầm hơn, gắt hơn, tối hơn. Bản phối biến một bài Pop ballad thành bài để bật lớn trong xe lúc nửa đêm.",
      formed: "Phát hành ngày 26/06/2026, khoảng 50 ngày sau EP 075, cùng Karrot (lần hợp tác thứ hai sau Phiêu).",
      process: "Giữ tông La thứ của bản gốc nhưng đẩy nhịp lên khoảng 129 BPM. Dải trầm tăng gấp đôi so với bản gốc (0,72 so với 0,36) và bài to nhất danh mục (-8,7 LUFS ở master). Giọng lùi xuống làm chất liệu (khoảng 12%). Đỉnh thực +1 dBTP, nên hạ trần limiter về -1 dBTP cho các bản sau."
    }
  ],

  // EP: tracklist lấy theo tên bài ở mục tracks phía trên (ep: "075").
  eps: [
    {
      id: "075", title: "075", date: "07/05/2026", upc: "7316482434541", smartLink: "https://euphoria.fm/ep-075", fx: "vinyl",
      story: "EP đầu tay gồm 7 bài, đi từ Phận Anh (Mi thứ) đến Đừng Như Thế (Mi trưởng). Hai khúc interlude Lalalove và Bảo Rằng Là Chưa chia EP thành ba chặng: tự sự, buông tay, và tìm lại. Một ngày sau, bản 075 (Short Version) với 19 đoạn cắt ngắn ra mắt cho video ngắn."
    }
  ],

  // NHẠC QUẢNG CÁO: thêm dự án theo mẫu { brand, title, year, role, youtubeId, link, fx }
  ads: [],

  // Phần mềm làm nhạc
  tools: [
    { name: "FL Studio", note: "Dựng beat, sắp xếp, hoà âm" },
    { name: "Cakewalk", note: "Thu âm vocal, comp, chỉnh giọng" }
  ],
  instruments: ["Acoustic guitar", "Electric guitar", "Bass", "Piano", "Trống", "Synth"],

  thanks:
    "Cảm ơn bạn đã đi cùng tôi qua từng vì sao. Mỗi lượt nghe, mỗi lời nhắn của bạn là ánh sáng để tôi tiếp tục viết. Nếu bạn cần một giọng hát, một topline hay một câu chuyện bằng âm nhạc, tôi luôn sẵn sàng lắng nghe."
};
