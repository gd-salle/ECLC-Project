import { BluetoothManager } from "react-native-bluetooth-escpos-printer";
import {
  PermissionsAndroid,
  Platform,
  DeviceEventEmitter,
  NativeEventEmitter,
  ToastAndroid,
  Alert,
} from "react-native";
import { PERMISSIONS, requestMultiple, RESULTS } from "react-native-permissions";

// Method to check if Bluetooth is enabled
export const isBluetoothEnabled = async () => {
  try {
    const enabled = await BluetoothManager.isBluetoothEnabled();
    if (!enabled) {
      const request = await requestMultiple([
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ]);

      if (request["android.permission.BLUETOOTH_CONNECT"] === RESULTS.GRANTED &&
          request["android.permission.BLUETOOTH_SCAN"] === RESULTS.GRANTED &&
          request["android.permission.ACCESS_FINE_LOCATION"] === RESULTS.GRANTED) {
        try {
          await BluetoothManager.enableBluetooth();
          return true;
        } catch (error) {
          console.error('Failed to enable Bluetooth:', error);
          Alert.alert('Error', 'Failed to enable Bluetooth. Please enable it manually in the settings.');
          if (Platform.OS === 'android') {
            BluetoothManager.openBluetoothSettings();
          }
          return false;
        }
      } else {
        Alert.alert('Permissions Denied', 'Bluetooth permissions are required to use this app.');
        return false;
      }
    }
    return Boolean(enabled);
  } catch (err) {
    console.error(err);
    return false;
  }
};

// Method to initialize Bluetooth event listeners
export const initializeBluetoothListeners = (pairedDevices, setPairedDevices, setFoundDs, setName, setBoundAddress) => {
  const bluetoothEventEmitter = Platform.OS === "ios"
    ? new NativeEventEmitter(BluetoothManager)
    : DeviceEventEmitter;

  bluetoothEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp) => deviceAlreadyPaired(rsp, pairedDevices, setPairedDevices));
  bluetoothEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp) => deviceFoundEvent(rsp, setFoundDs));
  bluetoothEventEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, () => {
    setName("");
    setBoundAddress("");
  });

  if (Platform.OS === "android") {
    bluetoothEventEmitter.addListener(BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, () => {
      ToastAndroid.show("Device Not Support Bluetooth !", ToastAndroid.LONG);
    });
  }
};

// Method to handle already paired devices
export const deviceAlreadyPaired = (rsp, pairedDevices, setPairedDevices) => {
  let ds = null;
  if (typeof rsp.devices === "object") {
    ds = rsp.devices;
  } else {
    try {
      ds = JSON.parse(rsp.devices);
    } catch (e) {}
  }
  if (ds && ds.length) {
    let pared = pairedDevices;
    if (pared.length < 1) {
      pared = pared.concat(ds || []);
    }
    setPairedDevices(pared);
  }
};

// Method to handle found devices
export const deviceFoundEvent = (rsp, setFoundDs) => {
  let r = null;
  try {
    if (typeof rsp.device === "object") {
      r = rsp.device;
    } else {
      r = JSON.parse(rsp.device);
    }
  } catch (e) {}

  if (r) {
    setFoundDs((foundDs) => {
      let found = foundDs || [];
      if (found.findIndex) {
        let duplicated = found.findIndex((x) => x.address == r.address);
        if (duplicated == -1) {
          found.push(r);
        }
      }
      return found;
    });
  }
};

// Method to connect to a Bluetooth device
export const connect = async (row, setLoading, setBoundAddress, setName) => {
  try {
    setLoading(true);
    await BluetoothManager.connect(row.address);
    setLoading(false);
    setBoundAddress(row.address);
    setName(row.name || 'UNKNOWN');
    console.log('Connected to device:', row);
  } catch (e) {
    setLoading(false);
    Alert.alert(e);
  }
};

// Method to unpair a Bluetooth device
export const unPair = async (address, setLoading, setBoundAddress, setName) => {
  setLoading(true);
  try {
    await BluetoothManager.unpaire(address);
    setLoading(false);
    setBoundAddress("");
    setName("");
  } catch (e) {
    setLoading(false);
    Alert.alert(e);
  }
};

// Method to scan for Bluetooth devices
export const scanDevices = async (setLoading, setFoundDs) => {
  setLoading(true);
  try {
    const s = await BluetoothManager.scanDevices();
    let found = s.found;
    try {
      found = JSON.parse(found);
    } catch (e) {}
    if (found && found.length) {
      setFoundDs(found);
    }
    setLoading(false);
  } catch (err) {
    setLoading(false);
    console.error(err);
  }
};

// Method to scan for Bluetooth devices with permissions
export const scan = async (scanDevices) => {
  try {
    const permissions = {
      title: "Bluetooth permissions",
      message: "This app needs access to Bluetooth to connect to devices.",
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK",
    };

    const bluetoothConnectGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      permissions
    );
    if (bluetoothConnectGranted === PermissionsAndroid.RESULTS.GRANTED) {
      const bluetoothScanGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        permissions
      );
      if (bluetoothScanGranted === PermissionsAndroid.RESULTS.GRANTED) {
        await scanDevices();
      }
    }
  } catch (err) {
    console.warn(err);
  }
};

// Method to scan Bluetooth devices with multiple permissions
export const scanBluetoothDevice = async (setLoading, scanDevices) => {
  setLoading(true);
  try {
    const request = await requestMultiple([
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ]);

    if (request["android.permission.ACCESS_FINE_LOCATION"] === RESULTS.GRANTED) {
      await scanDevices();
      setLoading(false);
    } else {
      setLoading(false);
    }
  } catch (err) {
    setLoading(false);
    console.error(err);
  }
};
