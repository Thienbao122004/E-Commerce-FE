export type Review = {
  id: string
  buyerName: string
  buyerAvatar: string
  productName: string
  productImg: string
  rating: number
  comment: string
  images: string[]
  date: string
  sellerReply: string | null
  helpful: number
  orderId: string
}

export const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    buyerName: "Nguyễn Thị Lan",
    buyerAvatar: "NL",
    productName: "Bình gốm Bát Tràng thủ công",
    productImg: "",
    rating: 5,
    comment: "Sản phẩm rất đẹp và chất lượng, đúng như mô tả. Đóng gói cẩn thận, giao hàng nhanh. Mình rất hài lòng và sẽ ủng hộ shop dài dài!",
    images: [],
    date: "2025-03-01",
    sellerReply: "Cảm ơn bạn đã tin tưởng ủng hộ shop nha! Shop rất vui khi bạn hài lòng với sản phẩm. Chúc bạn sử dụng vui vẻ!",
    helpful: 4,
    orderId: "ORD-001",
  },
  {
    id: "r2",
    buyerName: "Trần Văn Minh",
    buyerAvatar: "TM",
    productName: "Túi thổ cẩm handmade",
    productImg: "",
    rating: 4,
    comment: "Túi đẹp, chất vải tốt, màu sắc đúng với ảnh. Chỉ hơi nhỏ hơn mình tưởng một chút nhưng vẫn ok. Giao hàng nhanh.",
    images: [],
    date: "2025-02-28",
    sellerReply: null,
    helpful: 2,
    orderId: "ORD-002",
  },
  {
    id: "r3",
    buyerName: "Lê Hoàng Phúc",
    buyerAvatar: "LP",
    productName: "Đèn tre trang trí",
    productImg: "",
    rating: 3,
    comment: "Sản phẩm tạm được nhưng đèn không sáng bằng ảnh quảng cáo. Mình hơi thất vọng một chút.",
    images: [],
    date: "2025-02-25",
    sellerReply: null,
    helpful: 1,
    orderId: "ORD-003",
  },
  {
    id: "r4",
    buyerName: "Phạm Thị Hoa",
    buyerAvatar: "PH",
    productName: "Bình gốm Bát Tràng thủ công",
    productImg: "",
    rating: 5,
    comment: "Tuyệt vời! Mình mua làm quà tặng cho bạn bè và ai cũng khen ngợi. Sẽ quay lại mua thêm.",
    images: [],
    date: "2025-02-20",
    sellerReply: "Cảm ơn bạn rất nhiều! Những phản hồi tích cực như này là động lực lớn để shop tiếp tục cải thiện chất lượng ạ.",
    helpful: 6,
    orderId: "ORD-004",
  },
  {
    id: "r5",
    buyerName: "Võ Thanh Tùng",
    buyerAvatar: "VT",
    productName: "Khăn dệt thổ cẩm",
    productImg: "",
    rating: 2,
    comment: "Màu sắc thực tế khác xa ảnh. Chất liệu không được như mô tả. Hơi thất vọng.",
    images: [],
    date: "2025-02-15",
    sellerReply: null,
    helpful: 0,
    orderId: "ORD-005",
  },
]

export const ratingColors: Record<number, string> = {
  5: "bg-green-100 text-green-700 border-green-200",
  4: "bg-lime-100 text-lime-700 border-lime-200",
  3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  2: "bg-orange-100 text-orange-700 border-orange-200",
  1: "bg-red-100 text-red-700 border-red-200",
}
