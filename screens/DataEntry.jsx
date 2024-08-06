import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Card, Text, TextInput, Checkbox, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import ConfirmationDialog from '../components/ConfirmationDialog';
import WarningConfirmationDialog from '../components/WarningConfimationDialog';
import { fetchPeriodDateById, numberToWords, updateCollectible } from '../services/CollectiblesServices';
import { printReceipt } from '../services/PrintService';
import { getConnectionStatus } from '../services/BluetoothService';
import BluetoothConfig from '../components/BluetoothConfig';
import { getConsultantInfo } from '../services/UserService';

const DataEntry = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { item } = route.params; // Access the passed data
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isChequeNumberVisible, setChequeNumberVisible] = useState(false);
  const [chequeNumber, setChequeNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [sumOf, setSumOf] = useState('');
  const [creditorsName, setCreditorsName] = useState('');
  const [confirmationDialogVisible, setConfirmationDialogVisible] = useState(false);
  const [warningDialogVisible, setWarningDialogVisible] = useState(false);
  const [periodDate, setPeriodDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmData, setConfirmData] = useState({});
  const [isBluetoothConfigVisible, setBluetoothConfigVisible] = useState(false);
  const [consultantName, setConsultantName] = useState('');

  useEffect(() => {
    const fetchConsultantInfo = async () => {
      try {
        const info = await getConsultantInfo();
        if (info) {
          setConsultantName(info.name); // Set the consultant's name
        }
      } catch (error) {
        console.error('Failed to fetch consultant info:', error);
      }
    };

    const fetchPeriodDate = async () => {
      try {
        const date = await fetchPeriodDateById(item.period_id);
        setPeriodDate(date);
      } catch (error) {
        console.error('Failed to fetch period date:', error);
      }
    };
    fetchConsultantInfo();
    fetchPeriodDate();
  }, [item.period_id]);

  const handleCheckboxChange = (method) => {
    setSelectedPaymentMethod(method);
    setChequeNumberVisible(method === 'Cheque');
    setErrors(prevErrors => ({ ...prevErrors, selectedPaymentMethod: '' }));
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = {};

    if (!selectedPaymentMethod) {
      newErrors.selectedPaymentMethod = 'Please select a payment method.';
      valid = false;
    }
    if (selectedPaymentMethod === 'Cheque' && !chequeNumber) {
      newErrors.chequeNumber = 'Please enter the cheque number.';
      valid = false;
    }
    if (!amountPaid) {
      newErrors.amountPaid = 'Please enter the amount paid.';
      valid = false;
    }
    if (!sumOf) {
      newErrors.sumOf = 'Please enter the sum of.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleOpenDialog = () => {
    if (validateForm()) {
      setConfirmData({
        account_number: item.account_number,
        period_id: item.period_id,
        payment_type: selectedPaymentMethod,
        cheque_number: chequeNumber,
        amount_paid: amountPaid,
        creditors_name: creditorsName,
      });
      setConfirmationDialogVisible(true);
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
    }
  };

  const handleConfirm = () => {
    setConfirmationDialogVisible(false);
    setWarningDialogVisible(true);
  };
  const bluetoothStatus = getConnectionStatus();
  const handleWarningConfirm = async () => {
    setWarningDialogVisible(false);
    try {
      if (bluetoothStatus) {
        console.log(bluetoothStatus)
        navigation.navigate('Collectibles');
        handlePrintReceipt();
        await updateCollectible(confirmData);
        Alert.alert('Success', 'Printed successfully.');
      } else {
        Alert.alert('Please connect to Bluetooth Printer', 'No bluetooth printer connected.');
        setBluetoothConfigVisible(true);  
      }
    } catch (error) {
      Alert.alert('Error', 'No bluetooth printer connected.');
      // console.error('Failed to print:', error);
    }
  };

  const handleAmountPaidChange = (value) => {
    setAmountPaid(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setSumOf(numberToWords(numericValue));
    } else {
      setSumOf('');
    }
  };

  const handlePrintReceipt = async () => {
    const dataToPrint = {
      account_number: item.account_number,
      name: item.name,
      remaining_balance: item.remaining_balance,
      payment_type: selectedPaymentMethod,
      cheque_number: chequeNumber,
      amount_paid: amountPaid,
      daily_due: item.daily_due,
      creditors_name: consultantName,
    };

    try {
      await printReceipt(dataToPrint);
    } catch (error) {
      console.error('Error printing receipt:', error);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Data Entry" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <Text style={styles.label}>Account Number</Text>
                <Text style={styles.label}>Balance</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.accountNumber}>{item.account_number}</Text>
                <Text style={styles.loanAmount}>₱ {item.remaining_balance}</Text>
              </View>
              <Divider style={{ padding: 2, marginTop: 5, marginBottom: 1 }} />
              <View style={styles.row}>
                <Text style={styles.label}>Account Name</Text>
                <Text style={styles.label}>Daily Due</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.agentName}>{item.name}</Text>
                <Text style={styles.value}>₱ {item.daily_due}</Text>
              </View>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{item.due_date}</Text>
            </Card.Content>
          </Card>
        </View>
        
        <Text style={styles.label}>Form of Payment</Text>
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={selectedPaymentMethod === 'Cash' ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxChange('Cash')}
          />
          <Text style={styles.checkboxLabel}>Cash</Text>
          <Checkbox
            status={selectedPaymentMethod === 'Cheque' ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxChange('Cheque')}
          />
          <Text style={styles.checkboxLabel}>Cheque</Text>
        </View>
        {errors.selectedPaymentMethod ? (
          <Text style={styles.errorText}>{errors.selectedPaymentMethod}</Text>
        ) : null}

        {isChequeNumberVisible && (
          <TextInput
            mode="flat"
            label="Cheque Number"
            style={styles.input}
            value={chequeNumber}
            onChangeText={setChequeNumber}
            error={!!errors.chequeNumber}
            keyboardType="numeric"
          />
        )}
        {errors.chequeNumber ? (
          <Text style={styles.errorText}>{errors.chequeNumber}</Text>
        ) : null}

        <View style={styles.dateContainer}>
          <TextInput
            mode="flat"
            label="Date"
            value={periodDate || 'Loading...'}
            style={[styles.input, { flex: 1 }]}
            editable={false}
          />
        </View>

        <TextInput
          mode="flat"
          label="Amount Paid"
          style={styles.input}
          value={amountPaid}
          onChangeText={handleAmountPaidChange}
          error={!!errors.amountPaid}
          keyboardType="numeric"
        />
        {errors.amountPaid ? (
          <Text style={styles.errorText}>{errors.amountPaid}</Text>
        ) : null}

        <TextInput
          mode="flat"
          label="The Sum of"
          style={styles.input}
          value={sumOf}
          onChangeText={setSumOf}
          editable={false}
          error={!!errors.sumOf}
        />
        {errors.sumOf ? (
          <Text style={styles.errorText}>{errors.sumOf}</Text>
        ) : null}

        <TextInput
          mode="flat"
          label="Creditor's Name"
          style={styles.input}
          value={consultantName}
          editable={ false }
        />

        <ConfirmationDialog
          visible={confirmationDialogVisible}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmationDialogVisible(false)}
          onClose={() => setConfirmationDialogVisible(false)}
          data={confirmData}
        />

        <WarningConfirmationDialog
          visible={warningDialogVisible}
          onConfirm={handleWarningConfirm}
          onCancel={() => setWarningDialogVisible(false)}
          onClose={() => setWarningDialogVisible(false)}
          data={confirmData}
        />
      </ScrollView>

      <Button mode="contained" style={styles.button} onPress={handleOpenDialog}>
        PRINT RECEIPT
      </Button>

      <BluetoothConfig
        visible={isBluetoothConfigVisible}
        onClose={() => setBluetoothConfigVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F2F5FA',
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 8,
    color: '#0f2045',
  },
  loanAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f2045',
  },
  accountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f2045',
  },
  agentName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#0f2045',
    lineHeight: 28,
  },
  code: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#0f2045',
  },
  column: {
    flex: 1,
  },
  label: {
    marginTop: 5,
    fontSize: 9,
    color: '#000000',
  },
  value: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#0f2045',
  },
  input: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    marginRight: 16,
  },
  button: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#002B5B',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
});

export default DataEntry;
