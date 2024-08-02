import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Card, Text, TextInput, Checkbox, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { fetchPeriodDateById, numberToWords } from '../services/CollectiblesServices';

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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [periodDate, setPeriodDate] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchPeriodDate = async () => {
      try {
        const date = await fetchPeriodDateById(item.period_id);
        setPeriodDate(date);
      } catch (error) {
        console.error('Failed to fetch period date:', error);
      }
    };

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
    if (!creditorsName) {
      newErrors.creditorsName = 'Please enter the creditor\'s name.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      setDialogVisible(false);
      // Handle the confirm action
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
    }
  };

  const handleCancel = () => {
    setDialogVisible(false);
  };

  const handleOpenDialog = () => {
    if (validateForm()) {
      setDialogVisible(true);
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
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
          value={creditorsName}
          onChangeText={setCreditorsName}
          error={!!errors.creditorsName}
        />
        {errors.creditorsName ? (
          <Text style={styles.errorText}>{errors.creditorsName}</Text>
        ) : null}

        <ConfirmationDialog
          visible={dialogVisible}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={handleCancel}
        />
      </ScrollView>

      <Button mode="contained" style={styles.button} onPress={handleOpenDialog}>
        PRINT RECEIPT
      </Button>
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
