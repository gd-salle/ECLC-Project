import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Alert, Platform } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AuthDialog from '../components/AutheticationDialog';
import AdminToolsDialog from '../components/AdminToolsDialog';
import AccountCreationDialog from '../components/AccountCreationDialog';
import ExportConfirmationDialog from '../components/ExportConfirmationDialog';
import CollectionDateDialog from '../components/CollectionDateDialog';
import BluetoothConfig from '../components/BluetoothConfig';
import { handleImport } from '../services/FileService';
import { getConsultantInfo } from '../services/UserService';
import { fetchAllPeriods, fetchLatestPeriodDate, fetchLatestPeriodID, fetchAllCollectibles } from '../services/CollectiblesServices';
import { exportCollectibles } from '../services/FileService';
import { isBluetoothEnabled, getConnectionStatus } from '../services/BluetoothService';
import { getAdmin, getConsultant } from '../services/UserService';

const HomeScreen = () => {
  const [consultant, setConsultant] = useState('');
  const [area, setArea] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [authAction, setAuthAction] = useState(null);
  const [isAdminToolsVisible, setAdminToolsVisible] = useState(false);
  const [isExportConfirmationVisible, setExportConfirmationVisible] = useState(false);
  const [isAccountCreationVisible, setAccountCreationVisible] = useState(false);
  const [isCollectionDateDialogVisible, setCollectionDateDialogVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(() => {});
  const [isBluetoothConfigVisible, setBluetoothConfigVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      await fetchConsultantInfo();
      await fetchAndSetLatestPeriodDate();
    };

    const checkBluetooth = async () => {
      const bluetoothEnabled = await isBluetoothEnabled();
      if (!bluetoothEnabled) {
        Alert.alert(
          'Bluetooth Required',
          'Please enable Bluetooth to use this app.',
          [{ text: 'OK' }]
        );
      } else {
        setBluetoothConfigVisible(true); // Show the BluetoothConfig modal if Bluetooth is enabled
      }
    };

    fetchData();
    checkBluetooth();
  }, []);

  const fetchConsultantInfo = async () => {
    try {
      const consultantInfo = await getConsultantInfo();
      if (consultantInfo) {
        setConsultant(consultantInfo.name);
        setArea(consultantInfo.area);
      }
    } catch (error) {
      console.error('Failed to fetch consultant info:', error);
    }
  };

  const fetchAndSetLatestPeriodDate = async () => {
    try {
      const latestDate = await fetchLatestPeriodDate();
      if (latestDate) {
        setCollectionDate(latestDate || '');
      }
    } catch (error) {
      console.error('Failed to fetch latest period date:', error);
    }
  };

  const handleStartCollection = () => {
    setAuthAction('consultant');
    setDialogVisible(true);
  };

  const handleTest = async () => {
    try {
      const periodData = await fetchAllPeriods();
      const isConnected = getConnectionStatus();
      const collectibles = await fetchAllCollectibles();
      console.log('Collectibles:', collectibles);
      console.log('Period Data:', periodData);
      console.log('Status', isConnected);
    } catch (error) {
      console.error('Error fetching period data:', error);
    }
  };

  const handleAdminTools = () => {
    setAuthAction('admin');
    setDialogVisible(true);
  };

  const handleDialogClose = () => {
    setDialogVisible(false);
  };

const handleDialogConfirm = async (username, password) => {
  try {
    if (authAction === 'consultant') {
      // Handle consultant authentication
      const consultant = await getConsultant(username, password);
      const admin = await getAdmin(username, password);
      if (admin) {
        setDialogVisible(false);
        navigation.navigate('Collectibles');
      } else if (consultant) {
        setDialogVisible(false);
        navigation.navigate('Collectibles');
      } else {
        Alert.alert('Authentication Failed', 'Invalid consultant credentials.');
      }
    } else if (authAction === 'admin') {
      // Handle admin authentication
      const admin = await getAdmin(username, password);
      if (admin) {
        setDialogVisible(false);
        // Proceed with admin action (e.g., show AdminTools dialog)
        setAdminToolsVisible(true); // Or handle other admin actions
      } else {
        // Check if the credentials are for a consultant
        const consultant = await getConsultant(username, password);
        if (consultant) {
          Alert.alert('Access Denied', 'Consultants cannot access admin features.');
        } else {
          Alert.alert('Authentication Failed', 'Invalid admin credentials.');
        }
      }
    }
  } catch (error) {
    Alert.alert('Error', 'An error occurred during authentication.');
  }
};


const handleExport = async () => {
  try {
    const latestPeriod = await fetchLatestPeriodID();
    if (!latestPeriod || !latestPeriod.period_id) {
      Alert.alert('Error', 'No period found to export');
      return;
    }

    const status = await exportCollectibles(latestPeriod.period_id);

    if (status === 'success') {
      Alert.alert('Success', 'Collectibles exported successfully!');
    } else if (status === 'canceled') {
      Alert.alert('Canceled', 'Export was canceled.');
    }

  } catch (e) {
    let msg;
    if (e instanceof Error) {
      msg = e.message;
    } else {
      // Handle case where `e` is not an instance of Error
      msg = 'An unknown error occurred';
    }
    Alert.alert('Error', msg || 'Failed to export data');
  }
};


  const confirmExport = async () => {
    setExportConfirmationVisible(false);
    handleExport();
  };

  const handleExportDialogClose = () => {
    setExportConfirmationVisible(false);
  };

  const handleAccountCreation = () => {
    setAdminToolsVisible(false);
    setTimeout(() => {
      setAccountCreationVisible(true);
    }, 300);
  };

  const handleAccountCreationClose = () => {
    setAccountCreationVisible(false);
  };

  const handleAccountCreationConfirm = async (consultantName, area, username, password) => {
    try {
      console.log('New Account:', { consultantName, area, username, password });
      await fetchConsultantInfo();
      setAdminToolsVisible(true);
      setAccountCreationVisible(false);
    } catch (error) {
      console.error('Error adding consultant:', error);
    }
  };

  const handleCollectionDateDialogClose = () => {
    setCollectionDateDialogVisible(false);
  };

  const handleCollectionDateDialogConfirm = async (date) => {
    setCollectionDate(date);
    const importSuccessful = await handleImport(date);
    if (!importSuccessful) {
      setCollectionDate(''); // Reset collection date if import failed
    }
    setCollectionDateDialogVisible(false);
    pendingAction();
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>EXTRA CASH LENDING CORP.</Text>
      <TextInput
        label="Consultant"
        value={consultant}
        onChangeText={setConsultant}
        mode="outlined"
        editable={false}
        style={styles.input}
      />
      <TextInput
        label="Area"
        value={area}
        onChangeText={setArea}
        mode="outlined"
        editable={false}
        style={styles.input}
      />
      <TextInput
        label="Date of Collection"
        value={collectionDate}
        onChangeText={setCollectionDate}
        mode="outlined"
        editable={false}
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleStartCollection}
        style={styles.startButton}
        labelStyle={styles.startButtonText}
      >
        START COLLECTION
      </Button>
      <Button
        mode="outlined"
        onPress={handleAdminTools}
        style={styles.adminButton}
        labelStyle={styles.adminButtonText}
      >
        ADMIN TOOLS
      </Button>
      <Button
        mode="outlined"
        onPress={handleTest}
        style={styles.adminButton}
        labelStyle={styles.adminButtonText}
      >
        TEST
      </Button>

      {/* <Button
        mode="outlined"
        onPress={handleShowBluetoothConfig}
        style={styles.adminButton}
        labelStyle={styles.adminButtonText}
      >
        SHOW BLUETOOTH CONFIG
      </Button> */}

      <AuthDialog 
        visible={isDialogVisible} 
        onClose={handleDialogClose} 
        onConfirm={handleDialogConfirm} 
        isConsultantAuth={authAction === 'consultant'} 
      />
      <AdminToolsDialog
        visible={isAdminToolsVisible}
        onClose={() => setAdminToolsVisible(false)}
        onImport={() => {
          setPendingAction(() => () => {
            // Perform any additional actions after successful import
          });
          setCollectionDateDialogVisible(true);
        }}
        onExport={() => setExportConfirmationVisible(true)}
        onCreateAccount={handleAccountCreation}
      />
      <AccountCreationDialog
        visible={isAccountCreationVisible}
        onClose={handleAccountCreationClose}
        onConfirm={handleAccountCreationConfirm}
      />
      <ExportConfirmationDialog
        visible={isExportConfirmationVisible}
        onConfirm={confirmExport}
        onCancel={() => setExportConfirmationVisible(false)}
        onClose={handleExportDialogClose}
      />
      <CollectionDateDialog
        visible={isCollectionDateDialogVisible}
        onClose={handleCollectionDateDialogClose}
        onConfirm={handleCollectionDateDialogConfirm}
      />
      <BluetoothConfig
        visible={isBluetoothConfigVisible}
        onClose={() => setBluetoothConfigVisible(false)}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 15,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#0A154D',
    borderRadius: 5,
    marginBottom: 10,
  },
  startButtonText: {
    color: '#FFF',
  },
  adminButton: {
    width: '100%',
    borderColor: '#0A154D',
    borderRadius: 5,
    marginBottom: 10,
  },
  adminButtonText: {
    color: '#0A154D',
  },
});
