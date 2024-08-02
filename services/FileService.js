import { openDatabase } from "./Database";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { storePeriodDate } from './CollectiblesServices';

// Function to insert collectibles data into the database
export const insertCollectiblesIntoDatabase = async (entry) => {
  try {
    const db = await openDatabase();
    const { account_number, name, remaining_balance, due_date, amount_paid, daily_due, is_printed, period_id } = entry;
    await db.runAsync(
      'INSERT OR IGNORE INTO collectibles (account_number, name, remaining_balance, due_date, amount_paid, daily_due, is_printed, period_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [account_number, name, parseFloat(remaining_balance), due_date, parseFloat(amount_paid), parseFloat(daily_due), is_printed, period_id]
    );
  } catch (error) {
    console.error('Error inserting collectibles data into the database:', error);
  }
};

// Function to handle import of CSV file
export const handleImport = async (selectedCollectionDate) => {
  console.log('Starting handleImport');
  
  const result = await DocumentPicker.getDocumentAsync({
    type: 'text/comma-separated-values',
    copyToCacheDirectory: true
  });

  console.log('Document picker result:', result);

  if (result.canceled) {
    console.log('Document picker canceled');
    return;
  }

  const assets = result.assets;
  if (!assets) {
    console.log('No assets found');
    return false;
  }

  const file = assets[0];
  const csvFile = {
    name: file.name,
    uri: file.uri,
    mimetype: file.mimeType,
    size: file.size,
  };

  console.log('Selected file:', csvFile);

  // Store the date only if the user proceeds with the file
  const periodID = await storePeriodDate(selectedCollectionDate);

  console.log('Period ID:', periodID);

  try {
    const content = await FileSystem.readAsStringAsync(csvFile.uri);
    await processCSVContent(content, selectedCollectionDate, periodID);
    console.log('File processed successfully');
    return true;
  } catch (e) {
    console.log('Error reading file:', e);
    Alert.alert('Error', 'Failed to read file');
    return false;
  }
};

const processCSVContent = async (content, selectedCollectionDate, periodID) => {
  const requiredHeaders = [
    'account_number', 'name', 'remaining_balance', 'due_date',
    'amount_paid', 'daily_due', 'is_printed', 'period_id'
  ];

  const rows = content.split('\n').map(row => row.trim()).filter(row => row.length > 0);
  if (rows.length < 2) {
    Alert.alert('Error', 'The CSV file is empty or does not contain enough data.');
    return;
  }

  const headers = rows[0].split(',').map(header => header.trim());

  // Verify that the headers contain all required headers
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    Alert.alert('Error', `Invalid CSV format. Missing headers: ${missingHeaders.join(', ')}`);
    return;
  }

  const data = rows.slice(1).map(row => {
    const values = row.split(',').map(value => value.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });

  for (const entry of data) {
    if (entry['period_id'] === '0') {
      entry['period_id'] = periodID.toString();
    }
    await insertCollectiblesIntoDatabase(entry);
  }

  Alert.alert('Success', 'Collectibles Successfully Imported');
};
