const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  username: Joi.string().min(2).max(50).required(),
  boatNumber: Joi.string().pattern(/^TN\d{2}-[A-Z]{2}\d{3}$/).required(),
  phoneNumber: Joi.string().pattern(/^\+91\d{10}$/).required()
});

// User login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Boat profile update validation
const boatProfileSchema = Joi.object({
  boatName: Joi.string().min(2).max(100).optional(),
  boatType: Joi.string().valid('fishing', 'passenger', 'cargo').optional(),
  capacity: Joi.number().integer().min(1).max(100).optional(),
  registrationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  enginePower: Joi.number().positive().optional(),
  gpsDevice: Joi.string().optional(),
  emergencyEquipment: Joi.array().items(Joi.string()).optional()
});

// Emergency contact validation
const emergencyContactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phoneNumber: Joi.string().pattern(/^\+91\d{10}$/).required(),
  relationship: Joi.string().min(2).max(50).required(),
  isPrimary: Joi.boolean().default(false)
});

// Weather data validation
const weatherDataSchema = Joi.object({
  windSpeed: Joi.number().min(0).max(200).required(),
  windDirection: Joi.number().min(0).max(360).required(),
  temperature: Joi.number().min(-50).max(60).required(),
  humidity: Joi.number().min(0).max(100).required(),
  pressure: Joi.number().min(800).max(1200).required(),
  visibility: Joi.number().min(0).max(50).required(),
  seaCondition: Joi.string().valid('calm', 'slight', 'moderate', 'rough', 'very_rough', 'high').required(),
  tideSpeed: Joi.number().min(0).max(10).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

// Alert creation validation
const alertSchema = Joi.object({
  type: Joi.string().valid('weather', 'cyclone', 'tsunami', 'storm', 'emergency').required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(1000).required(),
  affectedAreas: Joi.array().items(Joi.string()).required(),
  estimatedTime: Joi.date().greater('now').required(),
  recommendedActions: Joi.array().items(Joi.string()).min(1).required(),
  voiceAlertText: Joi.string().min(5).max(500).required()
});

// Chat message validation
const chatMessageSchema = Joi.object({
  fromBoat: Joi.string().pattern(/^TN\d{2}-[A-Z]{2}\d{3}$/).required(),
  toBoat: Joi.string().pattern(/^TN\d{2}-[A-Z]{2}\d{3}$/).required(),
  message: Joi.string().min(1).max(1000).required(),
  messageType: Joi.string().valid('text', 'sos', 'location', 'weather').default('text'),
  timestamp: Joi.date().default(Date.now)
});

// Settings validation
const settingsSchema = Joi.object({
  language: Joi.string().valid('tamil', 'english').default('tamil'),
  alertVolume: Joi.number().min(0).max(100).default(80),
  notifications: Joi.boolean().default(true),
  autoLocation: Joi.boolean().default(true),
  loraEnabled: Joi.boolean().default(true),
  emergencyAutoAlert: Joi.boolean().default(true)
});

// Location update validation
const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().min(0).max(100).optional(),
  timestamp: Joi.date().default(Date.now)
});

module.exports = {
  registerSchema,
  loginSchema,
  boatProfileSchema,
  emergencyContactSchema,
  weatherDataSchema,
  alertSchema,
  chatMessageSchema,
  settingsSchema,
  locationSchema
}; 