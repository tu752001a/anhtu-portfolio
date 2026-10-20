/* ==========================================================================
   PHƯƠNG ANH TÚ · PAT — NỘI DUNG WEBSITE
   --------------------------------------------------------------------------
   Đây là file DUY NHẤT bạn cần sửa khi muốn đổi thông tin trên web.
   Người xem chỉ đọc được; chỉ ai có quyền vào kho code / tài khoản hosting
   (Vercel / GitHub) của bạn mới sửa và đăng lại được.

   Quy tắc:
   - Giữ nguyên dấu ngoặc kép "..." và dấu phẩy cuối mỗi dòng.
   - Ô nào để "" (rỗng) thì web tự ẩn.
   - fx: hiệu ứng riêng cho từng sản phẩm. Chọn một trong:
     "notes" "vinyl" "waves" "hearts" "sparks" "rain" "petals" "rings" "comet"
   ========================================================================== */

window.PAT_CONTENT = {
  artist: {
    realName: "Trần Thanh Anh Tú",
    stageName: "Phương Anh Tú",
    rapName: "PAT",
    roles: ["Singer", "Songwriter", "Topliner"],
    // Thông điệp chính, hiện ở trang đầu và cuối hành trình
    mission: "Chỉ cần bản thân muốn, mọi thứ đều có thể thực hiện. Hãy cứ làm, tiếp tục cố gắng và không bao giờ hối tiếc.",
    tagline: "Tôi kể chuyện của mình bằng âm nhạc, và kể bằng tất cả năng lượng tích cực tôi có.",
    intro:
      "Mười hai bài hát, một EP, hai năm phát hành liên tục. Không có bài nào ra đời vì may mắn: tất cả đều bắt đầu từ một ý muốn, rồi được làm đến cùng.",
    // Phần "Chân dung": mỗi phần tử là một đoạn văn, hiện ra lần lượt.
    about: [
      "Trần Thanh Anh Tú, nghệ danh Phương Anh Tú, rap name PAT. Ca sĩ, nhạc sĩ và topliner. Tôi tìm giai điệu trước rồi mới tìm lời, vì một câu hát chỉ ở lại trong tai người nghe khi giai điệu của nó đủ tự nhiên để hát theo.",
      "Tôi đi từ rap (Thức Tỉnh) sang House (Không Màu), rồi Pop (Em Đau, Phiêu), rồi một EP bảy bài, rồi một bản Phonk. Mỗi lần đổi thể loại là một lần tự đặt mình vào chỗ chưa quen, và tôi chọn làm điều đó thay vì đứng yên.",
      "Tôi tin thái độ quan trọng hơn trình độ. Trình độ học thêm được mỗi ngày; thái độ cầu thị quyết định ai đi được đường dài. Tôi lắng nghe góp ý, sửa từng câu, thu lại từng đoạn cho đến khi bài hát nói đúng điều nó cần nói.",
      "Âm nhạc của tôi được phát hành và phân phối toàn cầu cùng Euphoria Media Vietnam."
    ],
    quote: "Chỉ cần bản thân muốn, mọi thứ đều có thể thực hiện."
  },

  // Liên hệ: hiện thành một mục riêng ngay dưới mạng xã hội, bấm là gửi mail / gọi / nhắn Zalo.
  contact: {
    email: "tu752001a@gmail.com",
    phone: "0708980705",
    zalo: "0708980705"
  },

  socials: [
    { name: "Spotify", url: "https://open.spotify.com/artist/1loV9B7CYq91UCncD9nbbg" },
    { name: "Apple Music", url: "https://music.apple.com/us/artist/ph%C6%B0%C6%A1ng-anh-t%C3%BA/1778922650" },
    { name: "YouTube", url: "https://www.youtube.com/@phuonganhtu.patmusic" },
    { name: "Facebook", url: "https://www.facebook.com/phuonganhtupat/" },
    { name: "TikTok", url: "https://www.tiktok.com/@phuonganhtu.pat" },
    { name: "Instagram", url: "https://www.instagram.com/phuonganhtupat/" }
  ],

  publisher: {
    label: "Phát hành & phân phối toàn cầu",
    name: "Euphoria Media Vietnam",
    url: "https://www.euphoriamedia.com/vi"
  },

  spotifyArtistId: "1loV9B7CYq91UCncD9nbbg",

  // Nhạc nền: file audio của bạn, lặp liên tục.
  // Khi có bất kỳ âm thanh nào khác (bài hát, video, ban nhạc), nhạc nền tắt hẳn
  // và chỉ bật lại sau quietSeconds giây im lặng.
  bgMusic: { src: "audio/pat-bg.mp3", volume: 0.5, quietSeconds: 20 },

  // TRACK: xếp theo thứ tự phát hành.
  // Bài KHÔNG có ep: nằm trong "Chòm sao Track", mở khoá lần lượt.
  // Bài CÓ ep: "075": nằm trong chương EP 075 (mở ra sau khi nhận hộp quà).
  // story = "Câu chuyện bài hát", journey = "Tiến trình ra đời".
  tracks: [
    {
      title: "Thức Tỉnh", artists: "Phương Anh Tú", date: "10/11/2024", genre: "Hip Hop/Rap",
      audio: "audio/01-thuc-tinh.mp3", peaks: "01-thuc-tinh", smartLink: "https://euphoria.fm/thuc-tinh", spotify: "",
      dur: "2:09", fx: "sparks",
      story: "Bài hát đầu tiên, và đúng như tên gọi: một cú giật mình tỉnh dậy. Thức Tỉnh không mở đầu bằng lời chào; nó lao thẳng vào nhịp, chữ dồn dập, năng lượng đẩy về phía trước từ giây đầu tiên. Đây là PAT ở dạng nguyên bản nhất: muốn được nghe, và không chờ ai cho phép.",
      journey: "Single đầu tay, phát hành ngày 10/11/2024 cùng Euphoria Media Vietnam. Bài được dựng quanh flow rap: beat dày, kick và bass chắc, mọi khoảng trống đều được lấp bằng chữ. Phần nhạc vào trọn vẹn ở giây 17 và giữ một lực đều đến hết bài. Đây là lần duy nhất PAT phát hành dưới nhãn Hip Hop/Rap, và là điểm xuất phát của mọi vì sao phía sau."
    },
    {
      title: "Không Màu", artists: "Phương Anh Tú", date: "26/11/2024", genre: "House",
      audio: "audio/02-khong-mau.mp3", peaks: "02-khong-mau", smartLink: "https://euphoria.fm/khong-mau", spotify: "",
      dur: "3:38", fx: "waves",
      story: "Có những ngày không vui cũng không buồn, chỉ là không màu. Bài hát giữ đúng trạng thái đó: một groove House đều như nhịp tim lúc ngồi một mình, giọng hát lùi lại để nhịp điệu kể chuyện. Nghe một lần thì thấy nhẹ, nghe lần thứ ba mới thấy nó đọng lại.",
      journey: "Chỉ 16 ngày sau Thức Tỉnh, PAT rẽ hẳn sang nhạc điện tử. Hai single liền nhau cho thấy ngay từ đầu anh không chọn một ngăn kéo để nằm yên. Không Màu là bài dài nhất trong danh mục (3:38), được giữ phẳng và liền mạch từ đầu đến cuối để người nghe trôi theo, đúng tinh thần một bài House."
    },
    {
      title: "Em Đau", artists: "Phương Anh Tú", date: "01/08/2025", genre: "Pop",
      audio: "audio/03-em-dau.mp3", peaks: "03-em-dau", smartLink: "https://euphoria.fm/em-dau", spotify: "",
      dur: "2:31", fx: "rain",
      story: "Bài hát dám nói thẳng: em đau. Có lúc thì thầm, có lúc vỡ oà, không giấu, không làm màu. Em Đau là bài nhiều cảm xúc nhất của PAT, và cũng là bài chọn đúng khoảnh khắc nín thở trước điệp khúc cuối để cú bung sau đó đánh trúng người nghe.",
      journey: "Ra mắt ngày 01/08/2025, sau tám tháng im lặng kể từ Không Màu. Tám tháng đó kết thúc bằng một quyết định: lần đầu tiên chọn Pop làm thể loại chính. Bản phối để khoảng cách giữa phần nhẹ và phần mạnh rộng nhất trong tất cả các bài, bộ gõ sắc và dải cao sáng để giọng hát trong. Con đường dẫn tới EP 075 bắt đầu từ đây."
    },
    {
      title: "Phiêu", artists: "Phương Anh Tú, Karrot", date: "09/09/2025", genre: "Pop",
      audio: "audio/04-phieu.mp3", peaks: "04-phieu", smartLink: "https://euphoria.fm/phieu", spotify: "",
      dur: "2:38", fx: "petals",
      story: "Sau một bài đau là một bài buông. Phiêu nhanh, sáng, thả trôi, đúng như chữ Phiêu: không cần biết đi đâu, chỉ cần đang đi. Nếu Em Đau là đêm thì Phiêu là buổi sáng hôm sau.",
      journey: "Phát hành ngày 09/09/2025, chỉ năm tuần sau Em Đau, và là lần đầu PAT đứng chung tên với Karrot. Bài có nhịp nhanh nhất trong cả danh mục, tông trưởng, âm trường mở rộng hơn các single trước để tạo cảm giác bay. Hai bài ra liền nhau như hai mặt của cùng một mùa."
    },
    {
      title: "Phận Anh", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 1,
      audio: "audio/05-phan-anh.mp3", peaks: "05-phan-anh", smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "1:51", fx: "notes",
      story: "Bài mở đầu EP 075. Giọng hát đứng trước tất cả, nền nhạc lùi về sau như một căn phòng tối để lời tự sự vang lên. Phận Anh đặt ra câu hỏi, và sáu bài phía sau lần lượt trả lời.",
      journey: "Track 1 của EP đầu tay 075, phát hành ngày 07/05/2026. Bản phối cố ý giữ phần trầm thật mỏng để từng chữ được nghe rõ; nhạc chỉ vào đầy đủ ở giây 29 và có một nhịp ngắt ngay trước câu kết. Bài mở EP bằng một màu thứ u tối, và màu đó sẽ được giải ở bài cuối cùng."
    },
    {
      title: "Lalalove (Interlude)", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 2,
      audio: "audio/06-lalalove.mp3", peaks: "06-lalalove", smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "1:30", fx: "hearts",
      story: "Một khoảng nghỉ ngọt ngào ngay sau lời tự sự của Phận Anh. Chậm lại, ấm lên, gần như chỉ còn beat và giai điệu ngân nga, đủ để người nghe mỉm cười trước khi câu chuyện rẽ hướng.",
      journey: "Track 2 của EP 075. Đây là bài chậm nhất EP với phần trầm dày nhất cả danh mục: một interlude được làm để cảm, không để kể. Trong bản 075 (Short Version) ra mắt một ngày sau EP, Lalalove được cắt thành 4 đoạn cho video ngắn."
    },
    {
      title: "Chẳng Thể Níu Em Lại", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 3,
      audio: "audio/07-chang-the-niu-em-lai.mp3", peaks: "07-chang-the-niu-em-lai", smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "2:41", fx: "comet",
      story: "Nhịp đi nhanh và chắc, kiểu nghe là muốn nhún theo, nhưng lời thì đang buông tay. Chẳng Thể Níu Em Lại là nỗi buồn mặc áo sáng màu, và chính sự đối lập đó làm bài hát dính lâu.",
      journey: "Track 3 của EP 075. Bộ gõ được làm chi tiết để giữ nhịp từ đầu đến cuối, beat vào đủ ở giây 18. Bài mở ra cặp đôi cùng màu với Sau Lớp Mặt Nạ ngay phía sau, nên hai bài nối vào nhau gần như không có đường may."
    },
    {
      title: "Sau Lớp Mặt Nạ", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 4,
      audio: "audio/08-sau-lop-mat-na.mp3", peaks: "08-sau-lop-mat-na", smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "2:25", fx: "rings",
      story: "Trái tim của EP. Bài mở ra chậm rãi như một người đang lưỡng lự có nên tháo mặt nạ hay không, rồi mới để toàn bộ âm thanh tràn vào. Thứ còn lại sau lớp mặt nạ là sự thật, và bài hát chọn nói sự thật.",
      journey: "Track 4 của EP 075. Đây là bài có âm trường rộng nhất trong danh mục, nghe rất điện ảnh; phần dẫn kéo dài đến giây 45 mới vào trọn vẹn. Câu chuyện này đủ sức sống để khoảng 50 ngày sau được làm lại thành một bản Phonk cùng Karrot."
    },
    {
      title: "Bảo Rằng Là Chưa (Interlude)", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 5,
      audio: "audio/09-bao-rang-la-chua.mp3", peaks: "09-bao-rang-la-chua", smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "0:49", fx: "sparks",
      story: "Chưa đầy một phút, nhưng là bản lề của cả EP. Giọng hát vào ngay giây đầu như một lời tự nhủ, và lần đầu tiên trong 075, màu nhạc chuyển từ tối sang sáng.",
      journey: "Track 5 của EP 075, đặt ngay trước Tìm để dẫn thẳng vào bài. Dải cao sáng và âm trường mở rộng tạo cảm giác như mở một cánh cửa sổ. Một interlude làm đúng việc của nó: ngắn, rõ, và nối hai nửa EP lại với nhau."
    },
    {
      title: "Tìm", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 6,
      audio: "audio/10-tim.mp3", peaks: "10-tim", smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "2:39", fx: "comet",
      story: "Sau những gì đã mất ở nửa đầu EP, Tìm là hành trình đi tìm lại. Đây là bài mộc nhất về sản xuất và gần người nghe nhất: giọng hát gần như đứng một mình phía trước, không có gì để nấp.",
      journey: "Track 6 của EP 075, nối liền từ Bảo Rằng Là Chưa. Giọng hát chiếm tỷ lệ lớn nhất cả danh mục, phần trầm mỏng nhất, mọi lựa chọn sản xuất đều chừa chỗ cho lời. Phần dẫn dài đến giây 42 để cao trào có sức nặng. Muốn biết PAT hát và viết topline thế nào, hãy nghe bài này trước."
    },
    {
      title: "Đừng Như Thế", artists: "Phương Anh Tú", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 7,
      audio: "audio/11-dung-nhu-the.mp3", peaks: "11-dung-nhu-the", smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "3:04", fx: "petals",
      story: "Bài khép lại EP và là bài dài nhất trong 075. Mở đầu bằng Phận Anh ở màu thứ, kết thúc bằng Đừng Như Thế ở màu trưởng: cùng một nốt gốc nhưng ánh sáng đã khác, như một lời chấp nhận và bước tiếp.",
      journey: "Track 7, track cuối của EP 075. Cấu trúc gọn, âm trường rộng, nhạc vào đủ ở giây 19. Việc đặt màu thứ ở đầu và màu trưởng ở cuối là một quyết định sắp xếp có chủ đích, giúp cả bảy bài nghe như một câu chuyện liền mạch. Trong bản Short Version, bài được chia thành 5 đoạn, nhiều nhất cả bản."
    },
    {
      title: "Sau Lớp Mặt Nạ (Phonk Version)", artists: "Karrot, Phương Anh Tú", date: "26/06/2026", genre: "House",
      audio: "audio/12-sau-lop-mat-na-phonk.mp3", peaks: "12-sau-lop-mat-na-phonk", smartLink: "https://euphoria.fm/sau-lop-mat-na-phonk", spotify: "",
      dur: "2:28", fx: "vinyl",
      story: "Cùng một câu chuyện, đổi sang áo Phonk: trầm hơn, gắt hơn, tối hơn. Bản phối biến một bài Pop thành bài để bật thật lớn trong xe lúc nửa đêm.",
      journey: "Phát hành ngày 26/06/2026, khoảng 50 ngày sau EP 075, đánh dấu lần hợp tác thứ hai với Karrot sau Phiêu. Bản mới giữ màu của bản gốc nhưng đẩy nhịp nhanh hơn, phần trầm dày gấp đôi và là bài mạnh nhất cả danh mục; giọng hát lùi xuống làm chất liệu cho beat. Một bài hát cũ, một đời sống mới."
    }
  ],

  // EP: tracklist lấy theo các bài có ep: "075" ở trên.
  eps: [
    {
      id: "075", title: "075", date: "07/05/2026", smartLink: "https://euphoria.fm/ep-075", fx: "vinyl",
      story: "EP đầu tay gồm 7 bài, đi từ Phận Anh đến Đừng Như Thế. Hai khúc interlude Lalalove và Bảo Rằng Là Chưa chia EP thành ba chặng: tự sự, buông tay và tìm lại. Nghe theo thứ tự, bạn sẽ thấy màu nhạc đi từ tối sang sáng. Một ngày sau, bản 075 (Short Version) với 19 đoạn cắt ngắn ra mắt cho video ngắn."
    }
  ],

  // NHẠC QUẢNG CÁO: video nằm trong thư mục video/.
  // shape: "wide" (ngang 16:9) hoặc "tall" (dọc 9:16)
  ads: [
    {
      brand: "Livotec", title: "2K · Brand Livotec", kind: "Music video thương hiệu", shape: "wide",
      video: "video/livotec.mp4", poster: "video/livotec.jpg", fx: "waves",
      credits: ["Sáng tác: Phương Anh Tú", "Sản xuất âm nhạc: Fillinus"],
      story: "Một ca khúc thương hiệu dài hơn một phút rưỡi, đi cùng một ngày của gia đình trẻ: cái nóng, điện sụt áp, bình nước nóng, quạt và máy lọc không khí. Giai điệu phải đủ vui để cả nhà cùng hát, đủ dễ nhớ để người xem nhắc lại tên Livotec sau khi video kết thúc."
    },
    {
      brand: "BCONS New Sky", title: "BCONS New Sky · TikTok", kind: "Video ngắn TikTok", shape: "tall",
      video: "video/bcons.mp4", poster: "video/bcons.jpg", fx: "sparks",
      credits: ["Âm nhạc: Phương Anh Tú"],
      story: "Video dọc gần 50 giây cho dự án căn hộ BCONS New Sky. Chữ chạy theo nhịp nhạc, từng câu bật lên đúng phách, đúng kiểu nội dung giữ chân người xem trên TikTok ngay từ giây đầu."
    }
  ],

  // Phần mềm làm nhạc
  tools: [
    { name: "FL Studio", note: "Dựng beat, sắp xếp, hoà âm" },
    { name: "Cakewalk", note: "Thu âm vocal, comp, chỉnh giọng" }
  ],
  instruments: ["Acoustic guitar", "Electric guitar", "Bass", "Piano", "Trống", "Synth"],

  thanks:
    "Cảm ơn bạn đã đi cùng tôi đến tận ngôi sao cuối cùng. Mỗi lượt nghe, mỗi lời nhắn của bạn là lý do để tôi tiếp tục viết. Bản guitar này là lời tri ân của tôi gửi đến bạn, người đã nghe và đã thương âm nhạc của tôi.",
  messageInvite:
    "Bạn có lời chúc, một câu hỏi, một góp ý hay muốn hợp tác? Nhắn thẳng cho tôi qua Zalo, tôi đọc từng tin."
};
