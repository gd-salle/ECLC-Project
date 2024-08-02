import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Modal, Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const BluetoothConfig = ({ visible, onClose }) => {
  const [connectedDevice, setConnectedDevice] = useState({ name: 'Device Name', address: '00:02:5B:B3:BF:4D' });
  const [bluetoothDevices, setBluetoothDevices] = useState([
    { name: 'Device Name', address: '01:1A:6B:B3:BF:4D' },
    { name: 'Device Name', address: '01:1A:6B:B3:BF:4D' },
    { name: 'Device Name', address: '01:1A:6B:B3:BF:4D' },
  ]);
  const [nearbyDevices, setNearbyDevices] = useState([
    { name: 'Device Name', address: '01:1A:6B:B3:BF:4D' },
    { name: 'Device Name', address: '01:1A:6B:B3:BF:4D' },
    { name: 'Device Name', address: '01:1A:6B:B3:BF:4D' },
  ]);

  const renderConnectedDeviceItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity onPress={() => console.log('Disconnect')}>
        <Text style={styles.disconnect}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDeviceItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity onPress={() => console.log('Connect')}>
        <Text style={styles.connect}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNearbyDeviceItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity onPress={() => console.log('Pair')}>
        <Text style={styles.pair}>Pair</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.overlay}>
      <View style={styles.dialog}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Bluetooth Active</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionTitle}>Printer connected to the application:</Text>
        <FlatList
          data={[connectedDevice]}
          renderItem={renderConnectedDeviceItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
        />

        <Text style={styles.sectionTitle}>Bluetooth connected to this device:</Text>
        <FlatList
          data={bluetoothDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
        />

        <Text style={styles.sectionTitle}>Nearby devices:</Text>
        <FlatList
          data={nearbyDevices}
          renderItem={renderNearbyDeviceItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
        />

        <Button mode="contained" onPress={() => console.log('Scan Devices')} style={styles.scanButton}>
          SCAN DEVICES
        </Button>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '90%',
    padding: 20,
    backgroundColor: '#EBF4F6',
    borderRadius: 10,
    alignSelf: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A154D',
  },
  closeButton: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A154D',
    marginTop: 20,
    marginBottom: 10,
  },
  list: {
    maxHeight: 150,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flexDirection: 'column',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#000000',
  },
  disconnect: {
    color: 'red',
    fontWeight: 'bold',
  },
  connect: {
    color: '#0A154D',
    fontWeight: 'bold',
  },
  pair: {
    color: '#0A154D',
    fontWeight: 'bold',
  },
  scanButton: {
    marginTop: 20,
    backgroundColor: '#0A154D',
  },
});

export default BluetoothConfig;
