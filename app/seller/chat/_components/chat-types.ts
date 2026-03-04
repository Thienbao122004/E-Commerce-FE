export type Message = {
  id: string
  from: "seller" | "buyer"
  text: string
  time: string
  status?: "sent" | "delivered" | "read"
}

export type Conversation = {
  id: string
  buyerName: string
  buyerAvatar: string
  lastMessage: string
  lastTime: string
  unread: number
  online: boolean
  productName?: string
  productImg?: string
  messages: Message[]
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    buyerName: "Nguyễn Thị Lan",
    buyerAvatar: "NL",
    lastMessage: "Shop ơi còn hàng không ạ?",
    lastTime: "10:32",
    unread: 2,
    online: true,
    productName: "Bình gốm Bát Tràng",
    productImg: "",
    messages: [
      { id: "m1", from: "buyer", text: "Chào shop, mình muốn hỏi về sản phẩm bình gốm Bát Tràng ạ", time: "10:25" },
      { id: "m2", from: "seller", text: "Chào bạn! Shop đang có hàng nhé, bạn muốn hỏi thêm thông tin gì không ạ?", time: "10:27", status: "read" },
      { id: "m3", from: "buyer", text: "Cho mình hỏi kích thước bình là bao nhiêu ạ?", time: "10:28" },
      { id: "m4", from: "seller", text: "Bình cao 25cm, đường kính miệng 8cm, đường kính thân 15cm bạn nhé. Chất liệu gốm Bát Tràng thủ công 100%.", time: "10:30", status: "read" },
      { id: "m5", from: "buyer", text: "Shop ơi còn hàng không ạ?", time: "10:32" },
    ],
  },
  {
    id: "c2",
    buyerName: "Trần Văn Minh",
    buyerAvatar: "TM",
    lastMessage: "Ok shop mình đặt nhé",
    lastTime: "Hôm qua",
    unread: 0,
    online: false,
    productName: "Túi thổ cẩm handmade",
    messages: [
      { id: "m1", from: "buyer", text: "Shop ship đến Đà Nẵng không ạ?", time: "Hôm qua 14:10" },
      { id: "m2", from: "seller", text: "Có bạn ơi, shop ship toàn quốc qua Giao Hàng Nhanh nhé. Phí ship Đà Nẵng khoảng 30k.", time: "Hôm qua 14:12", status: "read" },
      { id: "m3", from: "buyer", text: "Ok shop mình đặt nhé", time: "Hôm qua 14:20" },
    ],
  },
  {
    id: "c3",
    buyerName: "Lê Hoàng Phúc",
    buyerAvatar: "LP",
    lastMessage: "Bạn có thể cho mình xem thêm màu không?",
    lastTime: "Hôm qua",
    unread: 1,
    online: true,
    messages: [
      { id: "m1", from: "buyer", text: "Bạn có thể cho mình xem thêm màu không?", time: "Hôm qua 20:05" },
    ],
  },
  {
    id: "c4",
    buyerName: "Phạm Thị Hoa",
    buyerAvatar: "PH",
    lastMessage: "Cảm ơn shop nhiều nha 🌸",
    lastTime: "2 ngày trước",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", from: "buyer", text: "Mình vừa nhận được hàng rồi shop ơi. Đẹp lắm!", time: "2 ngày trước 09:00" },
      { id: "m2", from: "seller", text: "Ủa thật không ạ? Bạn thích màu nào nhất?", time: "2 ngày trước 09:05", status: "read" },
      { id: "m3", from: "buyer", text: "Cảm ơn shop nhiều nha 🌸", time: "2 ngày trước 09:10" },
    ],
  },
  {
    id: "c5",
    buyerName: "Võ Thanh Tùng",
    buyerAvatar: "VT",
    lastMessage: "Giá có thể giảm thêm không ạ?",
    lastTime: "3 ngày trước",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", from: "buyer", text: "Giá có thể giảm thêm không ạ?", time: "3 ngày trước 15:30" },
      { id: "m2", from: "seller", text: "Shop hiện không có chương trình giảm giá bạn ơi, nhưng nếu mua từ 3 sản phẩm trở lên shop có thể hỗ trợ phí ship nhé.", time: "3 ngày trước 15:35", status: "read" },
    ],
  },
]
