/**
 * Gom nhóm chất liệu / thẻ trong dialog chọn từ nền tảng (seller).
 * Dùng token-based matching (tách từ theo dấu cách, order-independent).
 * Keyword "dài tay" khớp "tay dài"; "thu" KHÔNG khớp "thun".
 * Thứ tự nhóm quan trọng: nhóm đặc biệt (Trẻ em, Thú cưng…) đứng trước
 * nhóm chung (Áo, Quần…) để tránh keyword ngắn bắt nhầm.
 */

// ─── Shared helpers ───────────────────────────────────────────────────────────

function tokenize(s: string): string[] {
  return s.toLowerCase().normalize("NFC").split(/\s+/).filter(Boolean)
}

/** Khớp khi MỌI token của keyword xuất hiện như token riêng trong name. */
function kwMatchesTokens(nameTokens: string[], kw: string): boolean {
  const kwTokens = tokenize(kw)
  if (kwTokens.length === 0) return false
  return kwTokens.every((kt) => nameTokens.includes(kt))
}

// ─── Material groups ──────────────────────────────────────────────────────────

const MATERIAL_SEMANTIC_GROUPS: { label: string; keywords: string[] }[] = [
  {
    label: "Vải & sợi dệt",
    keywords: [
      "vải", "cotton", "polyester", "nylon", "denim", "jean", "kaki", "kate",
      "len", "wool", "lụa", "silk", "linen", "lanh", "viscose", "modal",
      "spandex", "elastane", "rayon", "satin", "chiffon", "canvas", "oxford",
      "twill", "flannel", "nỉ", "velvet", "nhung", "mesh", "lưới",
      "gấm", "đũi", "tweed", "cashmere", "sợi",
    ],
  },
  {
    label: "Da & giả da",
    keywords: [
      "da bò", "da thật", "da pu", "giả da", "simili", "leather",
      "cá sấu", "suede", "nubuck",
    ],
  },
  {
    label: "Kim loại & trang sức",
    keywords: [
      "bạc", "vàng", "bạch kim", "đồng", "thép", "titanium", "hợp kim",
      "zirconia", "swarovski", "kim cương", "inox", "rhodium",
    ],
  },
  {
    label: "Đá, gốm & thủy tinh",
    keywords: [
      "đá cẩm", "hoa cương", "marble", "granite", "gốm", "sứ", "ceramic",
      "thủy tinh", "pha lê", "porcelain", "đất nung",
    ],
  },
  {
    label: "Gỗ, tre & mây tre đan",
    keywords: ["gỗ", "tre", "mây", "cói", "bamboo", "mdf", "veneer"],
  },
  {
    label: "Cao su, silicon & nhựa",
    keywords: [
      "cao su", "rubber", "neoprene", "silicon", "silicone", "nhựa",
      "pvc", "bông pp", "eva", "tpe", "abs", "resin", "plastic",
    ],
  },
  {
    label: "Bông, xốp & đệm",
    keywords: ["bông", "foam", "xốp", "nệm", "memory foam", "latex", "gel"],
  },
  {
    label: "Giấy & bao bì",
    keywords: ["giấy", "bìa", "carton", "cardboard", "kraft"],
  },
]

const MATERIAL_LABEL_ORDER = [
  ...MATERIAL_SEMANTIC_GROUPS.map((g) => g.label),
  "Khác",
]

export function pickMaterialGroupLabel(name: string): string {
  const tokens = tokenize(name)
  for (const { label, keywords } of MATERIAL_SEMANTIC_GROUPS) {
    for (const kw of keywords) {
      if (kwMatchesTokens(tokens, kw)) return label
    }
  }
  return "Khác"
}

export function groupMaterialsForPicker<T extends { name: string }>(
  items: T[],
): { label: string; items: T[] }[] {
  const byLabel = new Map<string, T[]>()
  for (const it of items) {
    const lab = pickMaterialGroupLabel(it.name)
    if (!byLabel.has(lab)) byLabel.set(lab, [])
    byLabel.get(lab)!.push(it)
  }
  const out: { label: string; items: T[] }[] = []
  for (const lab of MATERIAL_LABEL_ORDER) {
    const arr = byLabel.get(lab)
    if (arr?.length) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "vi"))
      out.push({ label: lab, items: arr })
    }
  }
  return out
}

// ─── Tag groups ───────────────────────────────────────────────────────────────
// Dựa trên 526 tags thực tế trong DB.
// Thứ tự nhóm quan trọng: đặc thù → chung chung.

const TAG_SEMANTIC_GROUPS: { label: string; keywords: string[] }[] = [
  // 1. Đặc thù nhất — phải kiểm tra TRƯỚC khi các nhóm quần áo bắt nhầm
  {
    label: "Trẻ em & Bà bầu",
    keywords: [
      // bầu / thai sản
      "bầu", "thai nhi", "sơ sinh", "cho mẹ", "mẹ bầu",
      // em bé
      "em bé", "nôi em", "tã bỉm", "bình sữa", "hút sữa",
      "đồ ăn đặm", "bổ sung vi chất", "sữa bột",
      // đồ chơi & học tập cho trẻ
      "đồ chơi trẻ em", "đồ chơi giáo dục", "đồ chơi vận động",
      "trò chơi tập thể", "trò chơi trí tuệ",
      "bộ đồ chơi", "rô bốt đồ chơi", "xe điều khiển",
    ],
  },
  {
    label: "Thú cưng",
    keywords: [
      "thú cưng", "cho chó", "cho mèo",
      "cát vệ sinh", "sữa tắm thú cưng", "đồ chơi thú cưng",
      "phụ kiện thú cưng", "thức ăn cho",
    ],
  },

  // 2. Thời trang — áo đặc thù trước rồi mới dùng "áo" chung
  {
    label: "Áo & Áo khoác",
    keywords: [
      // compound "áo" (đặc thù)
      "áo thun", "áo sơ mi", "áo khoác", "áo polo", "áo len",
      "áo phông", "áo hai dây", "áo ống", "áo phao", "áo gío",
      "áo mưa", "áo gile", "áo dài",
      // single-word quốc tế
      "blazer", "hoodie", "cardigan", "sweater", "jacket",
      "windbreaker", "crop top", "baby tee", "t-shirt",
      "varsity jacket", "bomber", "polo",
      // fallback (bắt tất cả còn lại có "áo")
      "áo",
    ],
  },
  {
    label: "Quần",
    keywords: [
      "quần jeans", "quần short", "quần kaki", "quần tây",
      "quần legging", "quần jogger", "quần baggy", "quần bó",
      "quần lót", "quần ống loe", "quần ống rộng", "quần thể thao",
      "quần túi hộp", "quần dài", "quần ngắn",
      "cargo pants", "trackpants", "underwear",
      // fallback
      "quần",
    ],
  },
  {
    label: "Váy & Đầm",
    keywords: [
      "chân váy", "váy liền", "váy chữ a", "váy midi", "váy xếp ly",
      "set đồ",
      "váy", "đầm",
    ],
  },
  {
    label: "Đồ bơi, ngủ & mặc nhà",
    keywords: [
      "đồ bơi", "đồ ngủ", "đồ mặc nhà", "bikini", "phao bơi",
      "đồ câu cá", "đồ chạy",
    ],
  },
  {
    label: "Giày dép",
    keywords: [
      "chelsea boots", "giày cao gót", "giày thể thao",
      "boots", "sneakers", "sandals",
      "giày", "dép",
    ],
  },
  {
    label: "Túi xách & Balo",
    keywords: [
      "túi tote", "túi đeo chéo", "túi đựng mỹ phẩm", "túi hành lý",
      "túi ngủ", "túi xách", "ví cầm tay", "va li kéo",
      "ba lô", "balo", "backpack",
      "túi",
    ],
  },
  {
    label: "Phụ kiện thời trang",
    keywords: [
      "mũ lưỡi trai", "mũ len", "mũ bảo hiểm",
      "kính mát", "kính râm", "kính bơi", "kính cường lực",
      "khăn choàng", "khăn mặt", "khăn tắm",
      "thắt lưng", "cà vạt", "găng tay",
      "tất", "beanie", "cap", "ô che mưa",
      "mũ",
    ],
  },
  {
    label: "Trang sức",
    keywords: [
      "bông tai", "dây chuyền", "khuyên tai", "nhẫn",
      "vòng tay", "trang sức", "lắc tay",
    ],
  },

  // 3. Phong cách & màu sắc
  {
    label: "Phong cách & Kiểu dáng",
    keywords: [
      // styles
      "vintage", "retro", "streetwear", "casual", "gothic", "punk",
      "rock", "indie", "hip hop", "techwear", "darkwear", "y2k",
      "cottagecore", "old money", "korean style", "acubi",
      "local brand", "couple", "unisex",
      // fit / form
      "boxy fit", "form rộng", "slim fit", "regular fit", "relaxed fit",
      "suông", "ôm body", "oversize",
      // tính cách
      "minimalist", "tối giản", "basic", "cổ điển", "thanh lịch",
      "cá tính", "quyến rũ", "sexy", "cute",
      "dạo phố", "rách", "monogram",
      // oxford
      "oxford",
    ],
  },
  {
    label: "Màu sắc",
    keywords: [
      "đen", "trắng", "hồng", "xanh lá", "xanh dương", "xanh navy",
      "xanh rêu", "vàng", "nâu", "tím", "cam", "xám", "be", "kem",
      "pastel", "neon", "metallic",
    ],
  },
  {
    label: "Họa tiết & Chi tiết",
    keywords: [
      "camo", "caro", "kẻ sọc", "họa tiết rắn rí", "họa tiết",
      "cut-out", "dạ quang", "embroidery", "graphic",
      "in lụa", "in pet", "thêu nổi", "ren", "trơn",
    ],
  },
  {
    label: "Chất liệu vải",
    keywords: [
      "vải cotton", "vải linen", "cotton 2 chiều", "cotton 4 chiều",
      "french terry", "len sợi", "lụa to", "nhung tăm",
      "denim", "linen", "silk", "nylon", "polyester", "spandex", "len",
      "lụa", "nhung",
    ],
  },

  // 4. Điện tử & Nhà cửa
  {
    label: "Điện tử & Công nghệ",
    keywords: [
      "điện thoại thông minh", "máy tính bảng", "máy tính để bàn",
      "máy tính xách tay", "đồng hồ thông minh", "thiết bị thông minh",
      "thiết bị báo động", "thiết bị đo điện",
      "loa không dây", "tai nghe không dây", "tai nghe",
      "cáp sạc", "sạc dự phòng", "ổ cắm thông minh", "ổ cắm đa năng",
      "ổ cắm", "công tắc điện", "cảm biến chuyển động", "cảm biến khói",
      "chuông cửa thông minh", "khóa cửa vân tay",
      "chuột máy tính", "bàn phím", "màn hình", "tivi",
      "máy ảnh", "camera hành trình",
      "ốp lưng", "phụ kiện điện thoại", "kẹp điện thoại",
      "đèn năng lượng mặt trời",
    ],
  },
  {
    label: "Nội thất & Trang trí nhà",
    keywords: [
      "giường ngủ", "ghế sô pha", "ghế văn phòng", "ghế xếp",
      "bàn làm việc", "tủ quần áo", "tủ lạnh",
      "kệ sách", "kệ góc",
      "đèn trang trí", "khung tranh", "tường trang trí",
      "chăn ga gối", "gối tựa",
      "trang trí nhà", "đồ trang trí giáng sinh", "đồ trang trí tết",
      "đồ đựng trang trí", "lồng đèn trung thu",
      "tranh thêu tay", "tranh sơn mài",
      "đồ gỗ mỹ nghệ", "đồ gốm sứ",
      "sáp thơm phòng", "nhang thơm",
      "thảm lót sàn",
    ],
  },
  {
    label: "Gia dụng & Nhà bếp",
    keywords: [
      // bếp & nấu
      "bếp điện", "bếp hồng ngoại", "bếp từ", "lò nướng", "lò vi sóng",
      "nồi chiên không dầu", "nồi chảo", "lò nướng", "máy xay sinh tố",
      "máy ép trái cây", "đồ dùng nhà bếp", "ly tách",
      // giặt ủi
      "máy giặt", "bàn lá", "bàn ủi",
      // làm lạnh / làm mát
      "máy lạnh", "điều hòa", "quạt điều hòa", "quạt máy",
      "tủ lạnh",
      // lọc & xử lý
      "máy lọc không khí", "máy lọc nước", "máy hút bụi",
      "rô bốt hút bụi",
      // công cụ
      "máy khoan cầm tay", "máy cưa tay", "máy mài góc",
      "máy nén khí", "máy phun áp lực", "thang nhôm",
      "máy cắt cỏ", "dụng cụ thông tắc",
      // vệ sinh
      "vòi sen tắm", "vòi xịt vệ sinh", "bồn cầu", "chậu rửa mặt",
      "nước lau sàn", "nước rửa chén", "nước tẩy bồn cầu",
      "chất tẩy rửa", "dụng cụ vệ sinh", "bình xịt nước",
      // gia dụng
      "máy sấy tóc", "máy phát điện",
    ],
  },

  // 5. Thể thao & Dã ngoại
  {
    label: "Thể thao & Dã ngoại",
    keywords: [
      // môn thể thao
      "bóng đá", "bóng rổ", "cầu lông", "bóng bàn", "bóng chuyền",
      "basketball", "yoga", "gym", "chạy bộ", "bơi lội", "trượt ván",
      "skateboarding", "leo núi", "câu cá", "xe đạp điện", "xe đạp",
      "võ thuật", "đấm bốc",
      // dụng cụ / phụ kiện thể thao
      "vợt cầu lông", "vợt bóng bàn", "quả bóng bàn", "quả bóng chuyền",
      "quả cầu lông", "bao cát đấm bốc", "găng tay đấm bốc",
      "phụ kiện thể hình", "dụng cụ thể thao",
      "thảm tập", "nón bơi", "kính bơi",
      // dã ngoại
      "cắm trại", "camping", "lều cắm trại", "bếp cắm trại",
      "outdoor", "leo núi", "running",
      // thể thao tổng
      "thể thao",
    ],
  },

  // 6. Sức khỏe & Làm đẹp
  {
    label: "Sức khỏe & Làm đẹp",
    keywords: [
      // skincare & haircare
      "chăm sóc da", "chăm sóc tóc", "dầu gội", "dầu xả",
      "sữa rửa mặt", "sữa tắm", "dưỡng ẩm",
      "kem chống nắng", "kem dưỡng da", "kem nền",
      "tinh chất dưỡng da", "nước hoa hồng", "mặt nạ", "mặt nạ chống độc",
      // makeup
      "son môi", "son nước", "phấn phủ", "trang điểm", "mỹ phẩm",
      // perfume
      "nước hoa",
      // health
      "hỗ trợ giảm cân", "thiết bị y tế", "khẩu trang",
      "tinh bột nghệ", "nhân sâm", "nấm linh chi", "hạt dinh dưỡng",
    ],
  },

  // 7. Thực phẩm & Đồ uống
  {
    label: "Thực phẩm & Đồ uống",
    keywords: [
      "cà phê", "trà", "nước giải khát", "sô cô la",
      "bánh kẹo truyền thống", "bánh kẹo",
      "gạo", "gia vị", "ngũ cốc", "nông sản",
      "mật ong nguyên chất", "mật ong",
      "đặc sản vùng miền", "đặc sản",
      "đồ ăn vặt", "pa tê", "thủy hải sản khô",
      "thực phẩm chức năng", "thực phẩm đóng hộp", "thực phẩm hữu cơ",
      "thực phẩm", "thuần chay",
      "trứng gà", "yến sào",
    ],
  },

  // 8. Sách & Học tập
  {
    label: "Sách, Âm nhạc & Học tập",
    keywords: [
      "sách kinh tế", "sách kỹ năng", "sách ngoại ngữ", "sách văn học",
      "tiểu thuyết", "truyện tranh",
      "đàn ghi ta", "đàn phím điện tử", "đàn vi cầm", "sáo trúc",
      "màu nước", "giấy vẽ mỹ thuật",
      "dụng cụ học tập", "văn phòng phẩm", "sổ tay", "bút viết",
      "giấy in", "kim móc len",
      "sách",
    ],
  },

  // 9. Cây cảnh & Làm vườn
  {
    label: "Cây cảnh & Làm vườn",
    keywords: [
      "cây cảnh mini", "cây cảnh",
      "chậu trồng cây", "giàn trồng cây",
      "hạt giống hoa", "hạt giống rau", "hạt giống",
      "hệ thống tưới tự động", "lưới che nắng",
      "phân bón hữu cơ", "phân bón",
      "thuốc trừ sâu sinh học",
      "cuốc xẻng",
    ],
  },

  // 10. Hoạt động & Dịp
  {
    label: "Hoạt động & Dịp",
    keywords: [
      "đi biển", "đi chơi", "đi học", "đi làm",
      "công sở", "dạo phố",
      "mùa đông", "mùa hè", "mùa thu", "mùa xuân",
      "tiệc tùng", "party", "đám cưới", "hẹn hò",
      "quà tặng", "giỏ quà biếu", "thiệp chúc mừng",
      "trang phục hóa trang",
      "phong thủy", "vật phẩm phong thủy",
      "lồng đèn trung thu",
    ],
  },

  // 11. Tính năng & Chất lượng
  {
    label: "Tính năng & Chất lượng",
    keywords: [
      "chống nước", "chống tia uv", "kháng khuẩn",
      "co giãn", "thoáng khí", "bền màu", "mỏng nhẹ",
      "thân thiện môi trường", "sản phẩm tái chế",
      "thành phần thiên nhiên", "hữu cơ", "thuần tự nhiên",
      "độc quyền", "phiên bản giới hạn",
      "sản xuất tại việt nam", "local brand",
      "thủ công", "handmade",
    ],
  },

  // 12. Phương tiện & Phụ tùng
  {
    label: "Phương tiện & Phụ kiện xe",
    keywords: [
      "xe máy", "xe đạp điện", "phụ tùng xe máy",
      "camera hành trình", "bơm lốp di động", "bắt trùm xe",
      "tấm chắn nắng xe hơi", "thảm lót sàn ô tô",
      "kẹp điện thoại trên ô tô", "nước hoa xe hơi",
      "ắc quy xe", "nhật xe",
    ],
  },
]

const TAG_LABEL_ORDER = [
  ...TAG_SEMANTIC_GROUPS.map((g) => g.label),
  "Khác",
]

export function pickTagGroupLabel(name: string): string {
  const tokens = tokenize(name)
  for (const { label, keywords } of TAG_SEMANTIC_GROUPS) {
    for (const kw of keywords) {
      if (kwMatchesTokens(tokens, kw)) return label
    }
  }
  return "Khác"
}

export function groupTagsForPicker<T extends { name: string }>(
  items: T[],
): { label: string; items: T[] }[] {
  const byLabel = new Map<string, T[]>()
  for (const it of items) {
    const lab = pickTagGroupLabel(it.name)
    if (!byLabel.has(lab)) byLabel.set(lab, [])
    byLabel.get(lab)!.push(it)
  }
  const out: { label: string; items: T[] }[] = []
  for (const lab of TAG_LABEL_ORDER) {
    const arr = byLabel.get(lab)
    if (arr?.length) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "vi"))
      out.push({ label: lab, items: arr })
    }
  }
  return out
}
