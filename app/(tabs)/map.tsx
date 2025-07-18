import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [zoomLevel, setZoomLevel] = useState(12);
  const [selectedPort, setSelectedPort] = useState(null);
  const webViewRef = useRef(null);

  // Chennai coordinates (default center)
  const defaultLat = 13.0827;
  const defaultLng = 80.2707;

  const safePorts = [
    { 
      id: 1, 
      name: 'சென்னை துறைமுகம்', 
      distance: '12.5 km', 
      eta: '25 நிமிடங்கள்',
      lat: 13.0827,
      lng: 80.2707
    },
    { 
      id: 2, 
      name: 'காசிமோடு துறைமுகம்', 
      distance: '8.2 km', 
      eta: '18 நிமிடங்கள்',
      lat: 13.1056,
      lng: 80.2864
    },
    { 
      id: 3, 
      name: 'புதுச்சேரி துறைமுகம்', 
      distance: '15.8 km', 
      eta: '35 நிமிடங்கள்',
      lat: 11.9416,
      lng: 79.8083
    },
  ];

  // HTML content for OpenStreetMap with markers
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .custom-popup {
                background: white;
                border-radius: 8px;
                padding: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            const map = L.map('map').setView([${defaultLat}, ${defaultLng}], ${zoomLevel});
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Boat location marker
            const boatIcon = L.divIcon({
                html: '<div style="background: #0066CC; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🚢</div>',
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const boatMarker = L.marker([${defaultLat}, ${defaultLng}], { icon: boatIcon })
                .addTo(map)
                .bindPopup('<div class="custom-popup"><strong>உங்கள் படகு</strong><br>Current Location</div>');

            // Safe ports markers
            const ports = ${JSON.stringify(safePorts)};
            ports.forEach(port => {
                const portIcon = L.divIcon({
                    html: '<div style="background: #28A745; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-size: 12px;">⚓</div>',
                    className: 'custom-div-icon',
                    iconSize: [25, 25],
                    iconAnchor: [12.5, 12.5]
                });
                
                L.marker([port.lat, port.lng], { icon: portIcon })
                    .addTo(map)
                    .bindPopup('<div class="custom-popup"><strong>' + port.name + '</strong><br>Distance: ' + port.distance + '<br>ETA: ' + port.eta + '</div>');
            });

            // Cyclone warning zone (simulated)
            const cycloneIcon = L.divIcon({
                html: '<div style="background: #DC3545; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 18px;">⚠️</div>',
                className: 'custom-div-icon',
                iconSize: [35, 35],
                iconAnchor: [17.5, 17.5]
            });
            
            L.marker([${defaultLat + 0.1}, ${defaultLng + 0.1}], { icon: cycloneIcon })
                .addTo(map)
                .bindPopup('<div class="custom-popup"><strong>புயல் எச்சரிக்கை</strong><br>Cyclone Warning Zone</div>');

            // Add click handler for map
            map.on('click', function(e) {
                console.log('Map clicked at:', e.latlng.lat, e.latlng.lng);
            });

            // Function to update zoom level
            function updateZoom(level) {
                map.setZoom(level);
            }

            // Function to center on boat
            function centerOnBoat() {
                map.setView([${defaultLat}, ${defaultLng}], ${zoomLevel});
            }

            // Expose functions to React Native
            window.updateMapZoom = updateZoom;
            window.centerOnBoat = centerOnBoat;
        </script>
    </body>
    </html>
  `;

  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel + 1, 18);
    setZoomLevel(newZoom);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoom', level: newZoom }));
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel - 1, 1);
    setZoomLevel(newZoom);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoom', level: newZoom }));
  };

  const centerOnBoat = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'center' }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>கடல் வரைபடம்</Text>
        <Text style={styles.headerSubtitle}>OpenStreetMap View</Text>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.mapView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onMessage={(event) => {
            console.log('Message from WebView:', event.nativeEvent.data);
          }}
        />

        {/* Map controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <MaterialIcons name="zoom-in" size={24} color="#0066CC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <MaterialIcons name="zoom-out" size={24} color="#0066CC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={centerOnBoat}>
            <MaterialIcons name="my-location" size={24} color="#0066CC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Port information */}
      <View style={styles.portInfo}>
        <Text style={styles.portInfoTitle}>பாதுகாப்பான துறைமுகங்கள்</Text>
        <ScrollView style={styles.portsList}>
          {safePorts.map((port) => (
            <TouchableOpacity
              key={port.id}
              style={[
                styles.portItem,
                selectedPort === port.id && styles.selectedPortItem
              ]}
              onPress={() => setSelectedPort(port.id)}
            >
              <View style={styles.portIcon}>
                <MaterialIcons name="anchor" size={20} color="#28A745" />
              </View>
              <View style={styles.portDetails}>
                <Text style={styles.portName}>{port.name}</Text>
                <Text style={styles.portDistance}>{port.distance}</Text>
              </View>
              <Text style={styles.portEta}>{port.eta}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ETA Banner */}
      <View style={styles.etaBanner}>
        <MaterialIcons name="schedule" size={20} color="#fff" />
        <Text style={styles.etaText}>அருகிலுள்ள பாதுகாப்பான துறைமுகம்: 18 நிமிடங்கள்</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  mapView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  mapControls: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  controlButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  portInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  portInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  portsList: {
    flex: 1,
  },
  portItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedPortItem: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  portIcon: {
    marginRight: 15,
  },
  portDetails: {
    flex: 1,
  },
  portName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  portDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  portEta: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 15,
    paddingHorizontal: 20,
    margin: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  etaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});