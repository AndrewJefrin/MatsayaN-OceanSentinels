# Uyir Kavalan Backend

A comprehensive backend system for the Uyir Kavalan fishermen safety application, providing real-time weather alerts, navigation aid, and boat-to-boat communication via LoRa.

## 🚢 Features

### Core Functionality
- **User Authentication & Authorization** - Secure boat registration and login
- **Real-time Weather Monitoring** - OpenWeatherMap integration with signal status
- **Emergency Alert System** - Tamil voice alerts with popup notifications
- **Navigation & Maps** - Safe port locations and route calculation
- **LoRa Communication** - Offline boat-to-boat messaging
- **Settings Management** - User preferences and emergency contacts

### Safety Features
- **Signal Status Engine** - Color-coded safety levels (Green/Yellow/Red)
- **SOS Emergency System** - Immediate distress signal broadcasting
- **Voice Alerts** - Tamil language audio notifications
- **Location Tracking** - Real-time boat position monitoring

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth + JWT
- **Voice Synthesis**: Google Text-to-Speech (gTTS)
- **Weather API**: OpenWeatherMap
- **Maps**: OpenStreetMap integration
- **Communication**: LoRa mesh network (simulated)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Firebase project setup
- OpenWeatherMap API key

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Download service account key to `src/serviceAccountKey.json`
   - Enable Firestore and Storage

5. **Start the server**
   ```bash
   npm run dev    # Development mode
   npm start      # Production mode
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | Yes |
| `WEATHER_NEWS_API_KEY` | Weather News API key | No |

### Firebase Configuration

1. **Service Account Key**
   - Download from Firebase Console
   - Place in `src/serviceAccountKey.json`

2. **Firestore Rules**
   - Deploy using `firebase deploy --only firestore:rules`

3. **Storage Rules**
   - Deploy using `firebase deploy --only storage`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "fisherman@example.com",
  "password": "securepassword",
  "username": "Fisherman Name",
  "boatNumber": "TN23-BT456",
  "phoneNumber": "+919876543210"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "fisherman@example.com",
  "password": "securepassword"
}
```

### Weather Endpoints

#### Get Weather Data
```http
GET /api/weather/{boatNumber}
Authorization: Bearer <token>
```

#### Update Weather with Location
```http
POST /api/weather/{boatNumber}/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

### Alert Endpoints

#### Create Emergency Alert (Admin)
```http
POST /api/alerts
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "type": "cyclone",
  "severity": "high",
  "title": "Cyclone Warning",
  "description": "Cyclone approaching Tamil Nadu coast",
  "affectedAreas": ["Chennai", "Tuticorin"],
  "estimatedTime": "2024-01-15T18:00:00Z",
  "recommendedActions": ["Return to shore immediately"],
  "voiceAlertText": "சூறாவளி எச்சரிக்கை. கரையை நோக்கி திரும்பவும்."
}
```

#### Send SOS Alert
```http
POST /api/alerts/sos
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": {
    "latitude": 13.0827,
    "longitude": 80.2707
  },
  "message": "Engine failure, need assistance"
}
```

### Navigation Endpoints

#### Update Boat Location
```http
POST /api/navigation/{boatNumber}/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "accuracy": 10
}
```

#### Get Safe Ports
```http
GET /api/navigation/ports
```

### Chat Endpoints

#### Send Message
```http
POST /api/chat/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "toBoat": "TN23-BT789",
  "message": "Hello, how's the weather there?",
  "messageType": "text"
}
```

#### Get Chat Messages
```http
GET /api/chat/{boat1}/{boat2}?limit=50
Authorization: Bearer <token>
```

### Settings Endpoints

#### Get User Settings
```http
GET /api/settings/{boatNumber}
Authorization: Bearer <token>
```

#### Update Settings
```http
PUT /api/settings/{boatNumber}
Authorization: Bearer <token>
Content-Type: application/json

{
  "language": "tamil",
  "alertVolume": 80,
  "notifications": true
}
```

## 🗂 Database Schema

### Firestore Collections

#### Users
```javascript
{
  uid: "string",
  email: "string",
  username: "string",
  boatNumber: "string", // Format: TN23-BT456
  phoneNumber: "string",
  role: "fisherman" | "admin",
  createdAt: "timestamp",
  lastLogin: "timestamp",
  isActive: "boolean",
  emergencyContacts: ["array"],
  settings: {
    language: "tamil" | "english",
    alertVolume: "number",
    notifications: "boolean",
    autoLocation: "boolean",
    loraEnabled: "boolean"
  }
}
```

#### Weather Data
```javascript
{
  windSpeed: "number",
  windDirection: "number",
  temperature: "number",
  humidity: "number",
  pressure: "number",
  visibility: "number",
  seaCondition: "string",
  tideSpeed: "number",
  latitude: "number",
  longitude: "number",
  timestamp: "timestamp"
}
```

#### Signal Status
```javascript
{
  level: "green" | "yellow" | "red",
  color: "string",
  riskScore: "number",
  reasons: ["array"],
  timestamp: "timestamp"
}
```

#### Alerts
```javascript
{
  id: "string",
  type: "weather" | "cyclone" | "tsunami" | "storm" | "emergency",
  severity: "low" | "medium" | "high" | "critical",
  title: "string",
  description: "string",
  affectedAreas: ["array"],
  estimatedTime: "timestamp",
  recommendedActions: ["array"],
  voiceAlertText: "string",
  voiceUrl: "string",
  createdAt: "timestamp",
  isActive: "boolean"
}
```

## 🔒 Security

### Authentication
- JWT-based authentication
- Role-based access control (fisherman/admin)
- Boat number validation
- Secure password hashing (bcrypt)

### Authorization
- Users can only access their own boat data
- Admin-only endpoints for system management
- Firestore security rules enforcement

### Data Protection
- Input validation using Joi
- CORS configuration
- Helmet.js security headers
- Rate limiting (configurable)

## 📊 Scheduled Tasks

### Weather Updates
- **Frequency**: Every 30 minutes
- **Purpose**: Update weather data for all active boats
- **Endpoint**: Automatic via cron job

### System Cleanup
- **Frequency**: Daily at 2 AM
- **Purpose**: Clean old logs and expired data
- **Endpoint**: Automatic via cron job

### Health Checks
- **Frequency**: Every hour
- **Purpose**: Monitor system health
- **Endpoint**: Automatic via cron job

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   ```

2. **Firebase Deployment**
   ```bash
   firebase deploy
   ```

3. **PM2 (Recommended)**
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name "uyir-kavalan-backend"
   ```

### Docker Deployment
```bash
docker build -t uyir-kavalan-backend .
docker run -p 3000:3000 uyir-kavalan-backend
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### API Testing
```bash
# Using curl
curl -X GET http://localhost:3000/health

# Using Postman
# Import the provided Postman collection
```

## 📈 Monitoring

### Health Check
```http
GET /health
```

### Logs
- Application logs: `./logs/app.log`
- Error tracking: Console output
- Performance monitoring: Built-in Express monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added LoRa communication simulation
- **v1.2.0** - Enhanced voice alert system
- **v1.3.0** - Added admin dashboard features

---

**Uyir Kavalan** - Protecting fishermen's lives through technology. 