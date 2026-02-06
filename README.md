# Business Nexus

A comprehensive platform connecting entrepreneurs and investors, facilitating collaboration, deal management, document sharing, and real-time communication.

## Architecture

Business Nexus follows a modern full-stack architecture with clear separation of concerns:

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Real-time Communication**: Socket.io for WebSocket connections
- **File Storage**: Cloudinary for document and image uploads
- **Email Service**: Nodemailer for password reset and notifications

### Frontend Architecture
- **Framework**: React 19 with Vite build tool
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: React Context API
- **HTTP Client**: Axios for API communication
- **Real-time Features**: Socket.io client for live chat and notifications
- **PDF Handling**: PDF.js for document preview
- **Video Calls**: Simple Peer for WebRTC-based video communication

### Database Schema
- **Users**: Entrepreneurs and Investors with role-based access
- **Connections**: Networking between entrepreneurs and investors
- **Deals**: Investment opportunities and funding rounds
- **Documents**: File uploads and sharing
- **Messages**: Real-time messaging system
- **Meetings**: Scheduled meetings and video calls
- **Video Calls**: WebRTC session management

### Real-time Features
- Live chat between connected users
- Real-time notifications for connection requests, messages, and updates
- Video calling capabilities
- Instant updates across the platform

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io
- JWT
- Bcrypt
- Cloudinary
- Nodemailer
- Multer

### Frontend
- React 19
- Vite
- Tailwind CSS
- Axios
- Socket.io-client
- PDF.js
- Simple Peer
- React Router DOM
- React Hot Toast

### DevOps
- Docker (for database services)
- Vercel (frontend deployment)
- Environment-based configuration

## API Documentation

All API endpoints require authentication via JWT token in the Authorization header: `Bearer <token>`

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/register` | Register new user | `{name, email, password, role}` |
| POST | `/login` | User login | `{email, password, role}` |
| POST | `/forgot-password` | Request password reset | `{email}` |
| POST | `/reset-password` | Reset password with token | `{token, password}` |
| POST | `/change-password` | Change user password | `{userId, currentPassword, newPassword}` |

### User Endpoints (`/api/users`)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/entrepreneurs` | Get all entrepreneurs | - |
| GET | `/investors` | Get all investors | - |
| GET | `/fetch-user` | Get user by ID and role | `userId, role` |
| GET | `/fetch-partner` | Get partner user (opposite role) | `userId, role` |

### Connection Endpoints (`/api/connections`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/send` | Send connection request (entrepreneur to investor) | `{receiverId}` |
| PUT | `/:id/accept` | Accept connection request | - |
| PUT | `/:id/reject` | Reject connection request | - |
| GET | `/requests` | Get connection requests for user | - |
| GET | `/` | Get user's connections | - |
| GET | `/status/:userId` | Get connection status between users | - |
| GET | `/sent` | Get sent connection requests | - |
| GET | `/connected-startups/:investorId` | Get connected startups count for investor | - |

### Deal Endpoints (`/api/deals`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/` | Create new deal (entrepreneur only) | `{title, description, amount, equity, deadline}` |
| GET | `/` | Get deals for current investor | - |
| GET | `/my-deals` | Get deals created by current entrepreneur | - |
| POST | `/:dealId/invest` | Invest in a deal (investor only) | `{amount}` |
| GET | `/:dealId` | Get deal by ID | - |

### Message Endpoints (`/api/messages`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/conversations` | Get all conversations for user | - |
| GET | `/:userId` | Get messages between two users | - |
| POST | `/send` | Send a message | `{receiverId, content}` |
| PUT | `/read/:conversationId` | Mark messages as read | - |
| GET | `/unread-count` | Get total unread message count | - |
| DELETE | `/conversation/:conversationId` | Delete a conversation | - |

### Meeting Endpoints (`/api/meetings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get meetings for user |
| POST | `/` | Schedule a new meeting |
| PUT | `/:id` | Update meeting |
| DELETE | `/:id` | Delete meeting |

### Document Endpoints (`/api/documents`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user's documents |
| POST | `/upload` | Upload a document |
| GET | `/:id` | Get document by ID |
| DELETE | `/:id` | Delete document |

### Profile Endpoints (`/api/profile`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user profile |
| PUT | `/` | Update user profile |
| POST | `/upload-avatar` | Upload profile avatar |

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
# Create .env file with required environment variables
npm start
```

### Frontend Setup
```bash
cd client
npm install
# Create .env file with VITE_API_BASE_URL
npm run dev
```

### Environment Variables

#### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/business_nexus
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
PORT=5000
```

#### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Usage

1. **Registration**: Users can register as either entrepreneurs or investors
2. **Profile Setup**: Complete profile with business details and preferences
3. **Networking**: Entrepreneurs can send connection requests to investors
4. **Deal Creation**: Entrepreneurs create investment deals with terms
5. **Investment**: Investors can browse and invest in deals
6. **Communication**: Connected users can chat in real-time
7. **Document Sharing**: Upload and share business documents
8. **Meetings**: Schedule and conduct video meetings

## Real-time Features

- **WebSocket Integration**: Socket.io enables real-time communication
- **Live Notifications**: Instant updates for connections, messages, and activities
- **Chat System**: Real-time messaging with read receipts
- **Video Calls**: Peer-to-peer video communication using WebRTC

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- File upload restrictions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
