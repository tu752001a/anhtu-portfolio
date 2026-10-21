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
    tagline: "Một chàng trai từng không tin vào chính mình, và đã chọn kể lại hành trình ấy bằng âm nhạc.",
    intro:
      "Mười hai bài hát, một EP đầu tay, hai năm không ngừng phát hành. Đây không phải câu chuyện của người có sẵn mọi thứ. Đây là câu chuyện của người đã muốn, đã làm, và chưa từng hối tiếc.",
    // Phần "Chân dung": mỗi phần tử là một đoạn văn, hiện ra lần lượt như người kể chuyện.
    about: [
      "Có một chàng trai từng không dám tin vào chính mình. Trần Thanh Anh Tú lớn lên cùng nỗi tự ti: nghi ngờ từng quyết định của bản thân, dễ nổi nóng mỗi khi việc không thành, mỗi khi loay hoay mãi mà không tìm ra lối ra.",
      "Đã có những ngày anh bất lực đến mức đập phá đồ đạc, hét lên giữa căn nhà vì những bất đồng không gỡ được. Tú không giấu những ngày ấy. Nhìn lại, chính chúng đã dạy anh điều quan trọng nhất: muốn lớn lên thì phải biết lắng nghe, và chịu bỏ thêm thời gian mày mò cho đến khi hiểu.",
      "Rồi anh quyết định thay đổi, bắt đầu từ chính diện mạo của mình, để bước vào nghệ thuật một cách nghiêm túc. Em Đau ra đời đúng vào thời khắc ấy. Bài hát trở thành cột mốc đánh dấu một Phương Anh Tú mới, và tiếp cho anh niềm tin để bước tiếp trên con đường âm nhạc.",
      "Con đường ấy chưa bao giờ trải sẵn. Một bài hát hoàn chỉnh cần tiền thu âm, tiền phối khí, tiền phát hành, và hiếm khi mọi thứ đi đúng như dự tính. Có lúc phải tính từng khoản, có bài phải chờ rất lâu mới đủ điều kiện ra mắt, có kế hoạch phải làm lại từ đầu.",
      "Nhưng Tú đã học được cách không để hoàn cảnh quyết định thay mình. Thiếu điều kiện thì học thêm để tự làm: tự viết lời, tự tìm giai điệu, tự thu giọng trên Cakewalk, tự dựng beat trên FL Studio. Mỗi lần một bài hát được phát hành là một lần anh chứng minh với chính mình rằng muốn là làm được.",
      "Từ chàng trai tự ti năm nào, hôm nay anh có mười hai bài hát phát hành toàn cầu, một EP đầu tay, và những thương hiệu tin tưởng giao giai điệu của họ cho mình. Không phải vì anh giỏi hơn ai. Chỉ vì anh không dừng lại.",
      "Nếu bạn cũng đang nghi ngờ chính mình, hãy đọc câu chuyện này như một lời nhắn: con đường đến đích không bao giờ thiếu sự nỗ lực, và sự nỗ lực thì không phụ người kiên trì."
    ],
    quote: "Chỉ cần bản thân muốn, mọi thứ đều có thể thực hiện."
  },

  // Ảnh ở chương Chân dung (card nghệ sĩ bo góc). Thêm ảnh: tải vào photos/ rồi thêm một dòng.
  photos: [
    { src: "photos/pat-01.jpg", caption: "Phương Anh Tú · PAT" },
    { src: "photos/pat-02.jpg", caption: "Thái độ trước, trình độ sau" },
    { src: "photos/pat-03.jpg", caption: "Muốn là làm" },
    { src: "photos/pat-04.jpg", caption: "Không bao giờ hối tiếc" }
  ],

  // Liên hệ: hiện ở cuối cùng hành trình (chương Ngôi sao), bấm là gửi mail / gọi / nhắn Zalo.
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

  // Theo dõi nhanh ở chương Phòng thu. YouTube có ?sub_confirmation=1 để bật sẵn hộp xác nhận đăng ký.
  follow: [
    { name: "YouTube", action: "Đăng ký kênh", url: "https://www.youtube.com/@phuonganhtu.patmusic?sub_confirmation=1" },
    { name: "TikTok", action: "Theo dõi", url: "https://www.tiktok.com/@phuonganhtu.pat" },
    { name: "Facebook", action: "Theo dõi", url: "https://www.facebook.com/phuonganhtupat/" },
    { name: "Instagram", action: "Theo dõi", url: "https://www.instagram.com/phuonganhtupat/" }
  ],

  // Chỉ hiện một dòng nhỏ ở cuối trang, tách riêng khỏi phần liên hệ.
  publisher: {
    label: "Đơn vị phân phối",
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
      title: "Thức Tỉnh", artists: "Phương Anh Tú", producer: "Karrot", date: "10/11/2024", genre: "Hip Hop/Rap",
      audio: "audio/01-thuc-tinh.mp3", peaks: "01-thuc-tinh", highlight: [83, 123], smartLink: "https://euphoria.fm/thuc-tinh", spotify: "",
      dur: "2:09", fx: "sparks",
      story: "Mọi hành trình đều có một khoảnh khắc người ta thôi ngủ quên. Với Tú, đó là lúc chàng trai từng trút cơn giận lên đồ đạc quyết định trút nó vào từng câu chữ. Thức Tỉnh không chào hỏi, không rào đón: beat nặng nện xuống, flow dồn dập lao về phía trước, như một người đang tự lay mình dậy và hét lên rằng mình muốn được nghe.",
      journey: "Single đầu tay, phát hành ngày 10/11/2024, beat do Karrot sản xuất. Bài được dựng quanh flow rap, kick và bass chắc, gần như không chừa khoảng lặng nào; phần nhạc vào trọn vẹn ở giây 17 và giữ một lực đều đến hết. Đây cũng là bài đầu tiên của bộ đôi PAT và Karrot: từ đây, mọi bản beat của các single đều qua tay Karrot. Bước đầu tiên luôn là bước khó nhất, và họ đã cùng bước."
    },
    {
      title: "Không Màu", artists: "Phương Anh Tú", producer: "Karrot", date: "26/11/2024", genre: "House",
      audio: "audio/02-khong-mau.mp3", peaks: "02-khong-mau", highlight: [18, 58], smartLink: "https://euphoria.fm/khong-mau", spotify: "",
      dur: "3:38", fx: "waves",
      story: "Sau cú giật mình tỉnh dậy là những ngày dài chưa biết mình là ai. Không vui, không buồn, chỉ là không màu. Bài hát giữ đúng trạng thái đó: một nhịp House đều như bước chân của người vẫn đi dù chưa thấy điểm đến, giọng hát lùi lại để nhịp điệu kể thay. Nghe lần đầu thấy nhẹ; nghe lần thứ ba mới hiểu sự bình thản ấy đã phải cố gắng thế nào mới giữ được.",
      journey: "Phát hành ngày 26/11/2024, chỉ mười sáu ngày sau Thức Tỉnh, Karrot tiếp tục ngồi ghế Music Producer. Từ rap rẽ ngoặt sang nhạc điện tử, hai single liền nhau cho thấy ngay từ đầu Tú không chọn một ngăn kéo an toàn để nằm yên. Đây là bài dài nhất danh mục (3:38), được giữ phẳng và liền mạch từ đầu đến cuối để người nghe trôi theo, đúng tinh thần một bài House."
    },
    {
      title: "Em Đau", artists: "Phương Anh Tú", producer: "Karrot", date: "01/08/2025", genre: "House",
      audio: "audio/03-em-dau.mp3", peaks: "03-em-dau", highlight: [20, 60], smartLink: "https://euphoria.fm/em-dau", spotify: "",
      dur: "2:31", fx: "rain",
      story: "Tám tháng im lặng. Tám tháng chàng trai ấy nhìn lại mình, học cách lắng nghe, và quyết định thay đổi, bắt đầu từ chính diện mạo để làm nghệ thuật cho nghiêm túc. Em Đau là bài hát của khoảnh khắc đó: dám nói thẳng nỗi đau, có lúc thì thầm, có lúc vỡ oà, không giấu và không làm màu. Nó đánh dấu sự ra đời của một Phương Anh Tú mới, và là lý do anh tin mình có thể đi tiếp.",
      journey: "Phát hành ngày 01/08/2025, Music Producer: Karrot. Tú trở lại với House, nhưng là một bản House biết đau: khoảng cách giữa phần nhẹ và phần mạnh rộng nhất trong mọi bài của anh, có một nhịp nín thở ngay trước điệp khúc cuối để cú bung sau đó đánh trúng người nghe. Bộ gõ sắc, dải cao sáng để giọng hát trong. Từ cột mốc này, con đường dẫn đến EP 075 bắt đầu."
    },
    {
      title: "Phiêu", artists: "Phương Anh Tú", producer: "Karrot", date: "09/09/2025", genre: "Pop",
      audio: "audio/04-phieu.mp3", peaks: "04-phieu", highlight: [100, 140], smartLink: "https://euphoria.fm/phieu", spotify: "",
      dur: "2:38", fx: "petals",
      story: "Người vừa dám đối diện nỗi đau thì cũng xứng đáng được buông. Phiêu là buổi sáng sau đêm dài: nhanh, sáng, thả trôi, không cần biết đi đâu, chỉ cần đang đi. Và Tú không đi một mình: phía sau giai điệu vẫn là người bạn đồng hành Karrot, người dựng nên mọi bản beat từ ngày đầu.",
      journey: "Phát hành ngày 09/09/2025, chỉ năm tuần sau Em Đau, Music Producer: Karrot. Đây là bài có nhịp nhanh nhất trong danh mục, âm trường mở rộng hơn các single trước để tạo cảm giác bay. Hai bài ra liền nhau như hai mặt của cùng một mùa: một mặt để khóc, một mặt để cười."
    },
    {
      title: "Phận Anh", artists: "Phương Anh Tú", producer: "souL", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 1,
      audio: "audio/05-phan-anh.mp3", peaks: "05-phan-anh", highlight: [30, 70], smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "1:51", fx: "notes",
      story: "EP 075 mở ra bằng một lời tự sự. Phận Anh là giọng của người đứng một mình trong căn phòng tối, kể lại những gì đã qua mà không đổ lỗi cho ai. Câu hỏi được đặt ra ở đây, và sáu bài phía sau sẽ lần lượt trả lời.",
      journey: "Track 1 của EP đầu tay 075, phát hành ngày 07/05/2026. Bản phối cố ý giữ phần trầm thật mỏng để từng chữ được nghe rõ; nhạc chỉ vào đầy đủ ở giây 29, và có một nhịp ngắt ngay trước câu kết. Một bài mở màn chọn sự chân thật thay vì sự ồn ào."
    },
    {
      title: "Lalalove (Interlude)", artists: "Phương Anh Tú", producer: "souL", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 2,
      audio: "audio/06-lalalove.mp3", peaks: "06-lalalove", highlight: [45, 85], smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "1:30", fx: "hearts",
      story: "Giữa những dòng tự sự nặng trĩu, Lalalove là một khoảng thở ngọt ngào. Chậm lại, ấm lên, gần như chỉ còn beat và giai điệu ngân nga, đủ để người nghe mỉm cười trước khi câu chuyện rẽ sang hướng khác.",
      journey: "Track 2 của EP 075. Đây là bài chậm nhất EP, với phần trầm dày nhất cả danh mục: một interlude được souL làm để cảm chứ không để kể."
    },
    {
      title: "Chẳng Thể Níu Em Lại", artists: "Phương Anh Tú", producer: "souL", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 3,
      audio: "audio/07-chang-the-niu-em-lai.mp3", peaks: "07-chang-the-niu-em-lai", highlight: [102, 142], smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "2:41", fx: "comet",
      story: "Có những cuộc chia tay diễn ra khi nhạc vẫn còn đang vui. Chẳng Thể Níu Em Lại là nỗi buồn mặc áo sáng màu: nhịp đi nhanh và chắc, nghe là muốn nhún theo, nhưng lời thì đang buông tay. Chính sự đối lập ấy làm bài hát dính lâu trong đầu người nghe.",
      journey: "Track 3 của EP 075. Bộ gõ được làm chi tiết để giữ nhịp từ đầu đến cuối, beat vào đủ ở giây 18. Bài nối liền sang Sau Lớp Mặt Nạ ngay phía sau, như hai cảnh liên tiếp của cùng một bộ phim."
    },
    {
      title: "Sau Lớp Mặt Nạ", artists: "Phương Anh Tú", producer: "souL", date: "07/05/2026", genre: "Trap", ep: "075", epNo: 4,
      audio: "audio/08-sau-lop-mat-na.mp3", peaks: "08-sau-lop-mat-na", highlight: [88, 128], smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "2:25", fx: "rings",
      story: "Trái tim của EP. Ai cũng từng đeo một lớp mặt nạ để trông ổn hơn, mạnh mẽ hơn, ít tổn thương hơn. Bài hát mở ra chậm rãi như một người đang lưỡng lự có nên tháo nó xuống, rồi để toàn bộ âm thanh tràn vào. Thứ còn lại sau lớp mặt nạ là sự thật, và Tú chọn nói sự thật.",
      journey: "Track 4 của EP 075, khoác lên mình chất Trap, với âm trường rộng nhất trong danh mục và một không khí rất điện ảnh. Phần dẫn kéo dài đến giây 45 mới vào trọn vẹn. Câu chuyện này đủ sức sống để khoảng năm mươi ngày sau được tái sinh thành một bản Phonk cùng Karrot."
    },
    {
      title: "Bảo Rằng Là Chưa (Interlude)", artists: "Phương Anh Tú", producer: "souL", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 5,
      audio: "audio/09-bao-rang-la-chua.mp3", peaks: "09-bao-rang-la-chua", highlight: [14, 44], smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "0:49", fx: "sparks",
      story: "Chưa đầy một phút, nhưng là bản lề của cả EP. Giọng hát vào ngay giây đầu như một lời tự nhủ: chưa đâu, chưa phải lúc bỏ cuộc. Và lần đầu tiên trong 075, ánh sáng bắt đầu len vào.",
      journey: "Track 5 của EP 075, đặt ngay trước Tìm để dẫn thẳng vào bài. Dải cao sáng và âm trường mở rộng tạo cảm giác như mở một cánh cửa sổ. Một interlude làm đúng việc của nó: ngắn, rõ, và nối hai nửa của EP lại với nhau."
    },
    {
      title: "Tìm", artists: "Phương Anh Tú", producer: "souL", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 6,
      audio: "audio/10-tim.mp3", peaks: "10-tim", highlight: [112, 152], smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "2:39", fx: "comet",
      story: "Sau tất cả những gì đã mất ở nửa đầu EP, Tìm là hành trình đi tìm lại, tìm một người, và cũng là tìm lại chính mình. Đây là bài mộc nhất và gần người nghe nhất: giọng hát gần như đứng một mình phía trước, không có gì để nấp.",
      journey: "Track 6 của EP 075, nối liền từ Bảo Rằng Là Chưa. Giọng hát chiếm tỷ lệ lớn nhất cả danh mục, phần trầm mỏng nhất, mọi lựa chọn sản xuất đều chừa chỗ cho lời; phần dẫn dài đến giây 42 để cao trào có sức nặng. Muốn biết PAT hát và viết topline thế nào, hãy nghe bài này trước."
    },
    {
      title: "Đừng Như Thế", artists: "Phương Anh Tú", producer: "souL", date: "07/05/2026", genre: "Pop", ep: "075", epNo: 7,
      audio: "audio/11-dung-nhu-the.mp3", peaks: "11-dung-nhu-the", highlight: [137, 177], smartLink: "https://euphoria.fm/ep-075", spotify: "",
      dur: "3:04", fx: "petals",
      story: "Bài khép lại EP và là lời của một người đã đi qua đủ đau để biết dịu dàng. Đừng Như Thế không trách, không níu; nó chấp nhận và bước tiếp. Bảy bài hát, bắt đầu trong căn phòng tối của Phận Anh và kết thúc ở đây, nơi ánh sáng đã khác.",
      journey: "Track 7, track cuối của EP 075 và là bài dài nhất trong EP (3:04). Cấu trúc gọn, âm trường rộng, nhạc vào đủ ở giây 19. Thứ tự bảy bài được sắp có chủ đích để cả EP nghe như một câu chuyện liền mạch từ tối sang sáng. Bài hát còn có một MV animation do Tú và souL cùng dựng, MV mà Tú tâm đắc nhất: hãy xem ở chương Music Video."
    },
    {
      title: "Sau Lớp Mặt Nạ (Phonk Version)", artists: "Phương Anh Tú", producer: "Karrot", date: "26/06/2026", genre: "Phonk",
      audio: "audio/12-sau-lop-mat-na-phonk.mp3", peaks: "12-sau-lop-mat-na-phonk", highlight: [64, 104], smartLink: "https://euphoria.fm/sau-lop-mat-na-phonk", spotify: "",
      dur: "2:28", fx: "vinyl",
      story: "Một câu chuyện cũ, một đời sống mới. Khi đã dám tháo mặt nạ, Tú quay lại bài hát ấy và trao nó cho Karrot khoác áo Phonk: trầm hơn, gắt hơn, tối hơn, đủ để bật thật lớn trong xe lúc nửa đêm. Đó là cách anh nói rằng nỗi đau hôm qua giờ đã thành năng lượng.",
      journey: "Phát hành ngày 26/06/2026, khoảng năm mươi ngày sau EP 075, Music Producer: Karrot. Từ bản gốc Trap, bản Phonk đẩy nhịp nhanh hơn, phần trầm dày gấp đôi và là bài mạnh nhất cả danh mục; giọng hát lùi xuống làm chất liệu cho beat."
    }
  ],

  // EP: tracklist lấy theo các bài có ep: "075" ở trên.
  eps: [
    {
      id: "075", title: "075", date: "07/05/2026", smartLink: "https://euphoria.fm/ep-075", fx: "vinyl",
      producer: "souL",
      producerStory: "Toàn bộ EP 075 do souL sản xuất. souL là người yêu nghệ thuật kể chuyện bằng âm thanh và hình ảnh. Anh trầm tính, ít nói, hiếm khi đứng trước ống kính, nhưng mọi thứ anh làm ra đều mang một câu chuyện và một tầng cảm xúc sâu mà phải nghe đến lần thứ hai mới chạm hết. Nếu Tú là người kể, souL là người dựng nên căn phòng để câu chuyện ấy vang lên: bảy bản phối đi từ tối sang sáng, và cả MV animation Đừng Như Thế mà hai người cùng nhau làm.",
      story: "Nếu Em Đau là cột mốc, thì 075 là cả một chương đời được kể trọn. Bảy bài hát, đi từ lời tự sự của Phận Anh đến sự bình thản của Đừng Như Thế. Hai khúc interlude Lalalove và Bảo Rằng Là Chưa chia EP thành ba chặng: tự sự, buông tay và tìm lại. Nghe theo thứ tự, bạn sẽ thấy câu chuyện đi từ tối sang sáng."
    }
  ],

  // MUSIC VIDEO: chương ngay sau EP. featured: true = MV được ghim, nổi bật nhất.
  musicVideos: {
    featured: { title: "Đừng Như Thế", kind: "MV Animation", youtubeId: "x34-0uG1odQ", url: "https://youtu.be/x34-0uG1odQ",
      story: "MV Tú tâm đắc nhất. Một thế giới animation trôi lơ lửng, nơi từng khung hình được Tú và souL tự tay dựng để kể nốt chương cuối của EP 075: buông bỏ không phải là thua, mà là để bước tiếp nhẹ hơn." },
    list: [
      { title: "Thức Tỉnh", kind: "MV Lyrics", youtubeId: "EM65tyvpDFw", url: "https://www.youtube.com/shorts/EM65tyvpDFw", tall: true },
      { title: "Không Màu", kind: "MV Lyrics", youtubeId: "D42U_eTztks", url: "https://youtu.be/D42U_eTztks" },
      { title: "Em Đau", kind: "MV Lyrics", youtubeId: "TIqTqv7LYlE", url: "https://youtu.be/TIqTqv7LYlE" },
      { title: "EP 075", kind: "Full MV Lyrics", youtubeId: "DfcjU95wujw", url: "https://youtu.be/DfcjU95wujw" },
      { title: "Sau Lớp Mặt Nạ (Phonk Version)", kind: "MV Lyrics", youtubeId: "Sm_u1gMewuo", url: "https://youtu.be/Sm_u1gMewuo" }
    ],
    thanks: "Cảm ơn bạn đã ghé xem! Nếu MV chạm được vào bạn, hãy bấm Đăng ký kênh và Thích video để PAT có thêm động lực kể tiếp những câu chuyện mới nhé ♥"
  },

  // NHẠC QUẢNG CÁO: video nằm trong thư mục video/.
  // shape: "wide" (ngang 16:9) hoặc "tall" (dọc 9:16)
  ads: [
    {
      brand: "Livotec", title: "Livotec", kind: "Music video thương hiệu", shape: "wide",
      video: "video/livotec.mp4", poster: "video/livotec.jpg", fx: "waves",
      // khung hình kèm theo (t = giây trong video; bấm vào ảnh để tua tới đó)
      stills: [
        { src: "video/livotec-s1.jpg", t: 8, cap: "Cả nhà vào nhịp" },
        { src: "video/livotec-s2.jpg", t: 30, cap: "Bữa cơm gia đình" },
        { src: "video/livotec-s3.jpg", t: 55, cap: "Nỗi lo mùi clo" },
        { src: "video/livotec-s4.jpg", t: 82, cap: "Livotec lên sóng" }
      ],
      credits: ["Sáng tác: Phương Anh Tú", "Sản xuất âm nhạc: Fillinus"],
      story: "Một ca khúc thương hiệu dài hơn một phút rưỡi, đi cùng một ngày của gia đình trẻ: cái nóng, điện sụt áp, bình nước nóng, quạt và máy lọc không khí. Giai điệu phải đủ vui để cả nhà cùng hát, đủ dễ nhớ để người xem nhắc lại tên Livotec sau khi video kết thúc."
    },
    {
      brand: "BCONS New Sky", title: "BCONS New Sky", kind: "Video ngắn TikTok", shape: "tall",
      video: "video/bcons.mp4", poster: "video/bcons.jpg", fx: "sparks",
      stills: [
        { src: "video/bcons-s1.jpg", t: 4, cap: "Chữ bật theo phách" },
        { src: "video/bcons-s2.jpg", t: 16, cap: "Từng câu đúng nhịp" },
        { src: "video/bcons-s3.jpg", t: 28, cap: "Toà nhà New Sky" },
        { src: "video/bcons-s4.jpg", t: 42, cap: "Hook chốt hạ" }
      ],
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
    "Cảm ơn bạn đã đi cùng tôi đến tận ngôi sao cuối cùng. Từ một chàng trai từng không tin vào chính mình, tôi có hôm nay vì có những người như bạn chịu dừng lại và lắng nghe. Mỗi lượt nghe, mỗi lời nhắn là lý do để tôi tiếp tục viết. Bản guitar mộc này là lời tri ân tôi gửi đến bạn, người đã nghe và đã thương âm nhạc của tôi.",
  messageInvite:
    "Bạn có lời chúc, một câu hỏi, một góp ý hay muốn hợp tác? Nhắn thẳng cho tôi qua Zalo, tôi đọc từng tin."
};
