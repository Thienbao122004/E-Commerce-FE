# E-Commerce Platform for Local Brands with AI-based Product Category Tagging

**Project Code:** SP26SE114

## 📋 Project Information

**Duration:** January 1, 2026 - April 30, 2026

**Supervisor:** Phan Minh Tâm (tampm@fe.edu.vn)

### Team Members
- Nguyễn Hồ Quốc Thắng (SE183534)
- Lê Huỳnh Thiên Bảo (SE183554)
- Vũ An Khang (SE183550)
- Võ Thành Nam (SE183565)

## 🎯 Project Overview

### English
E-Commerce platform for local brands with AI-based product category tagging

### Vietnamese
Nền tảng thương mại điện tử dành cho các thương hiệu địa phương với AI phân loại và gắn nhãn sản phẩm

## 📖 Context

The growth of local Vietnamese brands, especially in fashion, handmade crafts, organic food, and cosmetics, has introduced new opportunities for small and medium-sized businesses to reach consumers across the country. However, these sellers often rely on fragmented sales channels such as Facebook, Instagram, TikTok, or Zalo, where product information is inconsistent, product categories are unclear, and customers have difficulty searching for suitable items.

Additionally, sellers spend significant time manually categorizing products, tagging attributes, and organizing product data. Manual classification is often inaccurate or inconsistent. As the number of products grows, maintaining a clean, standardized product structure becomes increasingly challenging.

Therefore, a specialized e-commerce platform for local brands is needed—one that not only provides modern shopping features but also includes AI-based product category tagging to assist sellers, standardize product classification, and improve the search and discovery experience for customers.

## 💡 Proposed Solutions

This project proposes a full-stack e-commerce platform designed for local Vietnamese brands, including buyer, seller, and admin roles. The platform allows sellers to manage shops, upload products, and process orders; customers can browse, search, and purchase products; and administrators can manage system operations.

A key innovation of the system is an AI-based product category tagging module. When a seller uploads a product, the AI analyzes the product name, description, and optional images to automatically suggest:
- Main category and subcategory
- Product tags such as style, material, or attributes
- Related keywords to improve product discovery

This reduces seller workload, ensures category consistency across different shops, and enhances the user's search experience.

## ✨ Functional Requirements

### 1. User & Authentication
- User registration and login
- Role-based access control (Customer, Seller, Admin)

### 2. Seller Portal
- Create and manage shop profile
- Create, edit, delete products with images, variants, and inventory
- Receive AI-based category & tag suggestions during product upload
- Manage orders and update order status

### 3. AI-based Product Category Tagging
- Analyze product title, description, and optional images
- Suggest main category, subcategory, and relevant tags
- Allow sellers to accept, override, or modify suggestions
- Log suggestions for future model improvement

### 4. Customer Portal
- Browse products by category, tags, brand, or popularity
- Search by keyword with improved relevance based on AI-tagged data
- Filter by price, category, shop, and attributes
- Add to cart, checkout, and track orders

### 5. Admin Portal
- Manage users, shops, products, and categories
- Approve or deactivate sellers or products
- Maintain product category taxonomy
- View system statistics and reports

### 6. Order & Payment
- Shopping cart management
- Checkout workflow with shipping details
- Payment gateway integration
- Order tracking and history

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API / Redux Toolkit
- **Form Handling:** React Hook Form
- **HTTP Client:** Axios / Fetch API
- **UI Components:** shadcn/ui / Material-UI

## 📦 Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable React components
│   ├── lib/             # Utility functions and helpers
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── tests/               # Test files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ecommerce-fe
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📝 Development Tasks

### Task Package 1: Requirements & System Design
- Gather and analyze requirements
- Design system architecture
- Create UI/UX mockups

### Task Package 2: Frontend Development (Customer Portal)
- Implement product browsing and search
- Build shopping cart functionality
- Create checkout flow

### Task Package 3: Seller Portal Implementation
- Build shop management interface
- Implement product management
- Create order management dashboard

### Task Package 4: Backend Integration
- Connect frontend with backend APIs
- Implement authentication flow
- Handle data synchronization

### Task Package 5: AI Module Integration
- Integrate AI-based category suggestions
- Display AI recommendations in seller portal
- Implement feedback mechanism

### Task Package 6: Testing, Deployment & Documentation
- Write unit and integration tests
- Deploy to production
- Complete documentation


