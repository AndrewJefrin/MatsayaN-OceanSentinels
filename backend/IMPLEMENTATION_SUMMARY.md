# Uyir Kavalan Backend Implementation Summary

## 🎯 Project Overview

The Uyir Kavalan backend is a comprehensive safety system designed specifically for Tamil Nadu fishermen. It provides real-time weather monitoring, emergency alerts, navigation assistance, and boat-to-boat communication to ensure the safety of fishermen at sea.

## 🏗 Architecture Overview

### Technology Stack
- **Backend Framework**: Express.js with Node.js 18+
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Storage (for voice files)
- **Authentication**: Firebase Auth + JWT tokens
- **APIs**: OpenWeatherMap, Google Text-to-Speech
- **Communication**: LoRa mesh network (simulated)

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │   Firebase      │
│   (React Native)│◄──►│   (Express.js)  │◄──►│   (Firestore)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   External APIs │
                       │ • OpenWeatherMap│
                       │ • Google TTS    │
                       │ • LoRa Network  │
                       └─────────────────┘
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── weather.js           # Weather data routes
│   │   ├── alerts.js            # Alert management routes
│   │   ├── navigation.js        # Navigation & maps routes
│   │   ├── chat.js              # Communication routes
│   │   └── settings.js          # Settings management routes
│   ├── services/
│   │   ├── authService.js       # User authentication
│   │   ├── weatherService.js    # Weather data processing
│   │   ├── alertService.js      # Emergency alerts & voice
│   │   ├── navigationService.js # Maps & navigation
│   │   ├── chatService.js       # LoRa communication
│   │   └── settingsService.js   # User preferences
│   ├── utils/
│   │   └── validation.js        # Input validation schemas
│   └── index.js                 # Main application file
├── firebase.json                # Firebase configuration
├── firestore.rules              # Database security rules
├── storage.rules                # Storage security rules
├── firestore.indexes.json       # Database indexes
├── package.json                 # Dependencies
├── env.example                  # Environment variables
└── README.md                    # Documentation
```

## 🔧 Core Features Implementation

### 1. User Authentication & Authorization

**Files**: `src/services/authService.js`, `src/routes/auth.js`, `src/middleware/auth.js`

**Features**:
- Boat registration with validation (TN23-BT456 format)
- Secure login with JWT tokens
- Role-based access control (fisherman/admin)
- Profile management
- Login activity logging

**Key Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update boat profile

### 2. Weather Monitoring & Signal Status

**Files**: `src/services/weatherService.js`, `src/routes/weather.js`

**Features**:
- Real-time weather data from OpenWeatherMap
- Signal status calculation (Green/Yellow/Red)
- Weather forecasting
- Sea condition assessment
- Automatic weather updates (every 30 minutes)

**Signal Status Logic**:
- **Green**: Safe conditions (risk score < 100)
- **Yellow**: Caution required (risk score 100-150)
- **Red**: Dangerous conditions (risk score > 150)

**Key Endpoints**:
- `GET /api/weather/{boatNumber}` - Get weather data
- `POST /api/weather/{boatNumber}/update` - Update with location
- `GET /api/weather/{boatNumber}/signal` - Get signal status

### 3. Emergency Alert System

**Files**: `src/services/alertService.js`, `src/routes/alerts.js`

**Features**:
- Tamil voice alert generation (Google TTS)
- Popup alert system
- Emergency SOS functionality
- Alert acknowledgment tracking
- Voice file caching

**Alert Types**:
- Weather alerts
- Cyclone warnings
- Tsunami alerts
- Storm warnings
- Emergency SOS

**Key Endpoints**:
- `POST /api/alerts` - Create alert (admin)
- `POST /api/alerts/sos` - Send SOS
- `GET /api/alerts/{boatNumber}` - Get boat alerts
- `POST /api/alerts/test-voice/{boatNumber}` - Test voice alert

### 4. Navigation & Maps

**Files**: `src/services/navigationService.js`, `src/routes/navigation.js`

**Features**:
- Safe port locations (Chennai, Tuticorin, etc.)
- Distance calculation (Haversine formula)
- Route planning
- Location tracking
- ETA calculations

**Safe Ports Included**:
- Chennai Port (சென்னை துறைமுகம்)
- Tuticorin Port (தூத்துக்குடி துறைமுகம்)
- Enayam Port (எண்ணாயம் துறைமுகம்)
- Kanyakumari Port (கன்னியாகுமரி துறைமுகம்)
- Rameshwaram Port (ராமேஸ்வரம் துறைமுகம்)

**Key Endpoints**:
- `GET /api/navigation/ports` - Get safe ports
- `POST /api/navigation/{boatNumber}/location` - Update location
- `GET /api/navigation/{boatNumber}/navigation` - Get navigation data

### 5. LoRa Communication System

**Files**: `src/services/chatService.js`, `src/routes/chat.js`

**Features**:
- Boat-to-boat messaging
- Offline message backup
- SOS broadcasting
- Message delivery tracking
- LoRa status monitoring

**Message Types**:
- Text messages
- SOS alerts
- Location sharing
- Weather updates

**Key Endpoints**:
- `POST /api/chat/send` - Send message
- `GET /api/chat/{boat1}/{boat2}` - Get chat messages
- `POST /api/chat/sos` - Send SOS message
- `GET /api/chat/{boatNumber}/lora-status` - Get LoRa status

### 6. Settings & Preferences

**Files**: `src/services/settingsService.js`, `src/routes/settings.js`

**Features**:
- User preferences management
- Emergency contacts
- Language settings (Tamil/English)
- Notification preferences
- Data export functionality

**Settings Categories**:
- Language preference
- Alert volume
- Notification settings
- Auto-location tracking
- LoRa communication settings

**Key Endpoints**:
- `GET /api/settings/{boatNumber}` - Get settings
- `PUT /api/settings/{boatNumber}` - Update settings
- `GET /api/settings/{boatNumber}/emergency-contacts` - Get contacts

## 🗂 Database Schema

### Firestore Collections

#### Users Collection
```javascript
{
  uid: "string",
  email: "string",
  username: "string",
  boatNumber: "string", // TN23-BT456 format
  phoneNumber: "string",
  role: "fisherman" | "admin",
  createdAt: "timestamp",
  lastLogin: "timestamp",
  isActive: "boolean",
  lastKnownLocation: {
    latitude: "number",
    longitude: "number",
    accuracy: "number",
    timestamp: "timestamp"
  }
}
```

#### Weather Data Collection
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

#### Signal Status Collection
```javascript
{
  level: "green" | "yellow" | "red",
  color: "string",
  riskScore: "number",
  reasons: ["array"],
  timestamp: "timestamp"
}
```

#### Alerts Collection
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

## 🔒 Security Implementation

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control
- Boat number validation
- Secure password hashing (bcrypt)

### Firestore Security Rules
- Users can only access their own data
- Admin-only endpoints for system management
- Boat-to-boat message restrictions
- Emergency contact privacy

### Data Validation
- Input validation using Joi schemas
- Boat number format validation (TN23-BT456)
- Phone number validation (+91XXXXXXXXXX)
- Location coordinate validation

## 📊 Scheduled Tasks

### Weather Updates
- **Frequency**: Every 30 minutes
- **Purpose**: Update weather data for all active boats
- **Implementation**: Cron job in `src/index.js`

### System Cleanup
- **Frequency**: Daily at 2 AM
- **Purpose**: Clean old logs and expired data
- **Implementation**: Cron job in `src/index.js`

### Health Checks
- **Frequency**: Every hour
- **Purpose**: Monitor system health
- **Implementation**: Cron job in `src/index.js`

## 🚀 Deployment Configuration

### Environment Variables
- Firebase configuration
- API keys (OpenWeatherMap, Google TTS)
- JWT secrets
- CORS settings
- Database configuration

### Firebase Setup
- Firestore database
- Storage bucket
- Security rules
- Service account key

### Production Considerations
- PM2 process management
- Docker containerization
- Load balancing
- Monitoring and logging

## 🧪 Testing Strategy

### API Testing
- Health check endpoint
- Authentication flows
- Weather data retrieval
- Alert creation and delivery
- Navigation calculations

### Integration Testing
- Firebase connectivity
- External API integration
- Voice alert generation
- LoRa communication simulation

## 📈 Performance Optimizations

### Database Indexes
- Optimized Firestore queries
- Composite indexes for complex queries
- Efficient data retrieval patterns

### Caching Strategy
- Voice alert caching
- Weather data caching
- User settings caching

### Rate Limiting
- API rate limiting
- Request throttling
- Abuse prevention

## 🔄 API Response Format

### Success Response
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🎯 Key Features Summary

### Safety Features
1. **Real-time Weather Monitoring** - Continuous weather updates with safety signal status
2. **Emergency Alert System** - Tamil voice alerts with popup notifications
3. **SOS Functionality** - Immediate distress signal broadcasting
4. **Location Tracking** - Real-time boat position monitoring
5. **Safe Port Navigation** - Nearest safe port calculation and routing

### Communication Features
1. **LoRa Mesh Network** - Offline boat-to-boat communication
2. **Message Backup** - Offline message storage and sync
3. **Broadcast Messaging** - System-wide announcements
4. **Emergency Contacts** - Family and rescue team notifications

### User Experience Features
1. **Tamil Language Support** - Full Tamil interface and voice alerts
2. **Customizable Settings** - User preferences and notifications
3. **Data Export** - User data backup and export
4. **Admin Dashboard** - System monitoring and management

## 🚀 Next Steps

### Phase 2 Enhancements
1. **Real LoRa Integration** - Hardware integration with TTGO devices
2. **Advanced Analytics** - Fishermen behavior analysis
3. **Machine Learning** - Weather pattern prediction
4. **Mobile App Integration** - Complete frontend development

### Scalability Considerations
1. **Microservices Architecture** - Service decomposition
2. **Message Queuing** - Redis/RabbitMQ integration
3. **CDN Integration** - Voice file delivery optimization
4. **Multi-region Deployment** - Geographic distribution

---

## 📞 Support & Contact

For technical support or questions about the implementation:
- Review the comprehensive README.md
- Check the API documentation
- Contact the development team

**Uyir Kavalan** - Empowering fishermen with technology for safer seas. 