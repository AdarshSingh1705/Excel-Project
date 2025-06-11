# Excel Data Visualization and Management Platform

A comprehensive web application for uploading, managing, and visualizing Excel/CSV data with user authentication and role-based access control.

## 🌟 Features

### 🔐 Authentication & User Management
- Secure user registration and login using Firebase Authentication
- Email/password and social login options
- Role-based access control (User & Admin)
- Protected routes based on user roles
- Session management and token-based authentication

### 📊 File Management
- Upload Excel (.xlsx, .xls) and CSV files
- View and manage uploaded files
- File history tracking with timestamps
- File metadata storage (size, upload date, row count)
- Responsive file upload with progress indicators

### 📈 Data Visualization
- Interactive charts and graphs
  - Line charts
  - Bar charts
  - Pie charts
  - 3D surface plots
- Real-time data updates
- Customizable chart properties
- Responsive design for all screen sizes

### 👨‍💼 Admin Dashboard
- View all users and their activities
- Monitor system usage statistics
- Manage user roles and permissions
- View and manage all uploaded files
- System health monitoring

### 🔄 Real-time Updates
- Live updates for file uploads
- Real-time dashboard refreshes
- WebSocket integration for instant notifications

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Firebase Authentication** for user management
- **Chart.js** / **D3.js** for data visualization
- **Axios** for API requests

### Backend
- **Node.js** with **Express**
- **Firebase Admin SDK** for authentication and Firestore
- **Multer** for file upload handling
- **XLSX** for Excel file parsing
- **Socket.IO** for real-time updates
- **Express Validator** for request validation

### Database
- **Firestore** for document storage
- Real-time data synchronization
- Secure data access rules

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Firebase project with Authentication and Firestore enabled
- Service account key for Firebase Admin

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Set up Firebase Admin**
   - Download your Firebase Admin SDK private key
   - Save it as `serviceAccountKey.json` in the project root
   - Update Firebase configuration in `server.js` if needed

5. **Start the development server**
   ```bash
   # Start backend
   npm run server
   
   # In a new terminal, start frontend
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📂 Project Structure

```
project/
├── public/                  # Static files
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/          # Reusable React components
│   │   ├── AdminDashboard/   # Admin-specific components
│   │   ├── Dashboard/        # User dashboard components
│   │   ├── UploadFile/       # File upload components
│   │   └── common/          # Shared components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── store/               # State management
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main App component
│   └── main.tsx             # Entry point
├── server/                  # Backend server code
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── utils/               # Server utilities
│   └── server.js            # Main server file
├── .env                    # Environment variables
├── .eslintrc.js            # ESLint configuration
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure file upload handling
- Rate limiting for API endpoints
- CORS protection
- Environment variable protection

## 📝 API Documentation

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user info

### Files
- `POST /api/upload` - Upload a file
- `GET /api/files` - Get user's files
- `GET /api/files/:id` - Get file by ID
- `DELETE /api/files/:id` - Delete a file

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id` - Update user role (admin only)
- `GET /api/admin/stats` - Get system statistics (admin only)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for authentication and database
- Vite for the amazing development experience
- All open-source libraries used in this project

## 👥 For Users

### Getting Started
1. **Register** for a new account or **Login** if you already have one
2. **Upload** your Excel/CSV file using the upload button
3. **Visualize** your data using different chart types
4. **Save** your visualizations for future reference

### Key Features for Users
- 📤 **Easy Upload**: Drag and drop your Excel/CSV files
- 📊 **Multiple Chart Types**: Choose from various visualization options
- 🔍 **Data Filtering**: Filter and sort your data as needed
- 💾 **Save & Share**: Save your work and share insights with others
- 📱 **Responsive**: Works on desktop and mobile devices

### Tips
- Make sure your Excel files have headers in the first row
- For best results, clean your data before uploading
- Use the preview feature to verify your data before finalizing

## 📧 Contact

For any questions or feedback, please contact [as.adarshsingh13@gmail.com]

---

Made with ❤️ by Adarsh Singh
