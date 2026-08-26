# Retail Next Software API

A clean, modular REST API built with Node.js and Express for the **Retail Next** POS and Inventory Management system.

---

## 🛠️ Tech Stack & Features

- **Runtime**: Node.js (ES Modules `import/export`)
- **Framework**: Express.js
- **Security**: Helmet, CORS
- **Logging**: Morgan HTTP logger
- **Environment**: Dotenv
- **Hot Reloading**: Nodemon

---

## 📁 Project Structure

```
retail-next-software-api/
├── src/
│   ├── config/
│   │   └── index.js              # Environment and app configuration
│   ├── controllers/
│   │   ├── categories.controller.js
│   │   ├── customers.controller.js
│   │   ├── orders.controller.js
│   │   └── products.controller.js
│   ├── data/
│   │   └── mockData.js           # In-memory mock data (extensible with DB)
│   ├── middlewares/
│   │   ├── errorHandler.js       # Global error handling middleware
│   │   └── notFoundHandler.js    # 404 route handler
│   ├── routes/
│   │   ├── categories.routes.js
│   │   ├── customers.routes.js
│   │   ├── health.routes.js
│   │   ├── index.js              # Combined API routes (/api/v1)
│   │   ├── orders.routes.js
│   │   └── products.routes.js
│   ├── app.js                    # Express app configuration & middleware
│   └── server.js                 # Server entry point
├── .env.example
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` if not already present:
```bash
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*
API_PREFIX=/api/v1

# Firebase Admin SDK
FIREBASE_PROJECT_ID="retail-next-software"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@retail-next-software.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY="public_NeXgvX195/XyDVlmynBe7kS0eUs="
IMAGEKIT_PRIVATE_KEY="private_TeYodf7QIX/JOMivpd5ASQp6Rrs="
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/doonext"
```

### Usage in Code
- **Firebase**:
  ```javascript
  import { db, auth, admin } from './config/firebase.js';
  // Example: const snapshot = await db.collection('products').get();
  ```
- **ImageKit**:
  ```javascript
  import { imagekit, getImageKitAuth } from './config/imagekit.js';
  // Example: upload an image or generate client auth tokens
  // const uploadResult = await imagekit.upload({ file: base64Str, fileName: 'product.jpg' });
  ```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Run in Production Mode
```bash
npm start
```

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/api/v1`

### 🏥 System Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status and uptime |

### 📦 Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | Get all products (supports `?search=`, `?categoryId=`, `?status=`) |
| `GET` | `/products/:id` | Get single product by ID or Barcode |
| `POST` | `/products` | Create a new product |
| `PUT` | `/products/:id` | Update product details |
| `DELETE` | `/products/:id` | Remove a product |

### 🏷️ Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | List all item categories |
| `GET` | `/categories/:id` | Get category by ID |
| `POST` | `/categories` | Create new category |
| `PUT` | `/categories/:id` | Update category details |
| `DELETE` | `/categories/:id` | Delete category |

### 👥 Customers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/customers` | List all customers (supports `?search=`) |
| `GET` | `/customers/:id` | Get customer by ID or Phone |
| `POST` | `/customers` | Create new customer account |
| `PUT` | `/customers/:id` | Update customer credit limit or details |

### 🧾 Orders & Billing
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/orders` | List sales orders (supports `?paymentStatus=`, `?paymentMethod=`) |
| `GET` | `/orders/:id` | Get order/invoice by ID or orderNumber |
| `POST` | `/orders` | Create sales / credit order |

### 🖼️ Media & Uploads (ImageKit)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/upload/auth` | Get ImageKit client-side upload authentication parameters |

"# retail-next-software-api" 
