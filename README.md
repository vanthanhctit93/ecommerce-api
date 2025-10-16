# Nodejs #

```bash
# version: 1.0.0

# run serve with nodemon
npm run serve
```

#### 1 - Basic Server Setup

* Set up a basic server using Node.js and Express.js
* Handle HTTP requests and responses
* Serve static files and HTML pages
<!--* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)-->

#### 2 - User Registration and Authentication

* Implement user registration and login functionality
* Use bcrypt for password hashing and authentication
* Store user information in a MongoDB database

#### 3 - RESTful API Development

* Design and develop a RESTful API using Express.js
* Implement CRUD operations for a specific resource (e.g., users, products)
* Handle authentication and authorization for API endpoints

#### 4 - Real-Time Chat Application

* Build a real-time chat application using Socket.IO
* Enable users to send and receive messages in real-time
* Implement features like private messaging and online user status

#### 5 - Image Upload and Processing

* Allow users to upload images to the server
* Use libraries like Multer for handling file uploads
* Implement image processing functionalities using libraries like Sharp

#### 6 - Payment Gateway Integration

* Integrate a payment gateway (e.g., Stripe) into your application
* Implement payment processing for products or services
* Handle successful and failed payment transactions

#### 7 - Blogging Platform

* Develop a blogging platform with features like creating, editing, and deleting blog posts
* Implement user authentication and authorization for creating and managing blog posts
* Use a database like MongoDB to store blog post data

#### 8 - Social Media Authentication

* Allow users to authenticate using social media platforms (e.g., Facebook, Google)
* Implement OAuth authentication for social media integration
* Store user information and handle authentication tokens

#### 9 - E-commerce Store

* Build an e-commerce store with features like product listing, searching, and filtering
* Implement a shopping cart functionality
* Integrate payment gateways for processing orders
  
#### 10 - File Sharing Application

* Develop a file sharing application using Node.js and Express.js
* Enable users to upload and download files securely
* Implement file access control and user permissions


#### 11 - Weather App

* Develop a weather application that fetches weather data from an API
* Allow users to search for weather information based on location
* Display weather forecasts and related information

#### 12 - URL Shortener

* Create a URL shortener application that generates short URLs for long URLs
* Implement redirection from short URLs to the original URLs
* Store URL mappings in a database for retrieval and redirection

# E-commerce API

## Setup Instructions

### 1. Clone repository
```bash
git clone https://github.com/your-username/ecommerce-api.git
cd ecommerce-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Then edit `.env` file:
```env
PORT=8000
MONGODB_URL="mongodb://127.0.0.1:27017/nodejs"
SESSION_SECRET="your-session-secret"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
STRIPE_SECRET_KEY="sk_test_your_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### 4. Start MongoDB
Make sure MongoDB is running on `localhost:27017`

### 5. Run development server
```bash
npm run serve
```

Server will start on `http://localhost:8000`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `MONGODB_URL` | MongoDB connection string | Yes |
| `SESSION_SECRET` | Session secret key | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe API key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Logout

### User Profile
- `GET /user/profile` - Get user profile (Private)
- `PUT /user/profile` - Update profile (Private)
- `PUT /user/change-password` - Change password (Private)
- `DELETE /user/account` - Delete account (Private)

### Articles
- `GET /article/list` - Get all articles
- `GET /article/:id` - Get article by ID
- `POST /article/create` - Create article (Private)
- `PUT /article/update/:id` - Update article (Private)
- `DELETE /article/delete/:id` - Delete article (Private)

### Products
- `GET /product/list` - Get all products
- `GET /product/:id` - Get product by ID
- `POST /product/create` - Create product (Private)
- `PUT /product/update/:id` - Update product (Private)
- `DELETE /product/delete/:id` - Delete product (Private)

### Cart
- `GET /cart` - Get cart (Private)
- `POST /cart/create` - Add to cart (Private)
- `PUT /cart/update` - Update cart (Private)
- `DELETE /cart/remove` - Remove from cart (Private)

### Payment
- `POST /checkout` - Checkout (Private)
- `POST /payment/webhook` - Stripe webhook

## Technologies Used

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Stripe Payment
- Socket.IO
- bcryptjs
- Helmet, CORS, Rate Limiting

## License

ISC