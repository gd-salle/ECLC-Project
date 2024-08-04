import { openDatabase } from './Database';
// import * as SQLite from 'expo-sqlite';

export const fetchCollectibles = async () => {
    try {
        const db = await openDatabase();
        const allRows = await db.getAllAsync('SELECT * FROM collectibles c JOIN period p ON c.period_id = p.period_id WHERE c.is_printed = 0 AND p.isExported = 0');

        // Map the rows from the database to your Collectibles object
        const collectibles = allRows.map(row => ({
            account_number: row.account_number,
            name: row.name,
            remaining_balance: row.remaining_balance,
            due_date: row.due_date,
            payment_type: row.payment_type,
            cheque_number: row.cheque_number,
            amount_paid: row.amount_paid,
            daily_due: row.daily_due,
            creditors_name: row.creditors_name,
            is_printed: row.is_printed,
            period_id: row.period_id,
        }));

        return collectibles;

    } catch (error) {
        console.error('Error fetching collectibles:', error);
        throw error;
    }
};

export const fetchAllCollectibles = async () => {
    try {
        const db = await openDatabase();
        const allRows = await db.getAllAsync('SELECT * FROM collectibles');

        // Map the rows from the database to your Collectibles object
        const collectibles = allRows.map(row => ({
            account_number: row.account_number,
            name: row.name,
            remaining_balance: row.remaining_balance,
            due_date: row.due_date,
            payment_type: row.payment_type,
            cheque_number: row.cheque_number,
            amount_paid: row.amount_paid,
            daily_due: row.daily_due,
            creditors_name: row.creditors_name,
            is_printed: row.is_printed,
            period_id: row.period_id,
        }));

        return collectibles;

    } catch (error) {
        console.error('Error fetching collectibles:', error);
        throw error;
    }
};

export const storePeriodDate = async (date) => {
  try {
    const db = await openDatabase();
    await db.runAsync(`
      INSERT INTO period (date, isExported)
      VALUES (?, 0)
    `, [date]);
    
    // Fetch the last inserted row ID
    const result = await db.getFirstAsync(`
      SELECT last_insert_rowid() AS lastInsertRowid
    `);

    if (!result || result.lastInsertRowid === undefined) {
      throw new Error('Failed to retrieve the inserted period ID');
    }

    const periodID = result.lastInsertRowid;
    console.log('Date stored successfully:', date);
    return periodID;
  } catch (error) {
    console.error('Error storing date:', error);
    throw error;
  }
};

export const fetchAllPeriods = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getAllAsync(`
      SELECT * FROM period
    `);
    return result;
  } catch (error) {
    console.error('Error fetching period data:', error);
    throw error;
  }
};

export const fetchLatestPeriodID = async () => {
    try {
      const db = await openDatabase();
      const result = await db.getFirstAsync(`
        SELECT period_id FROM period
        ORDER BY period_id DESC
        LIMIT 1
      `);
      return result;
    } catch (error) {
      console.error('Error fetching period data:', error);
      throw error;
    }
};

export const fetchLatestPeriodDate = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getFirstAsync(`
      SELECT date, isExported FROM period
      ORDER BY period_id DESC
      LIMIT 1
    `);
    return result && result.isExported === 0 ? result.date : null;
  } catch (error) {
    console.error('Error fetching latest period date:', error);
    throw error;
  }
};

export const fetchPeriodDateById = async (periodId) => {
  try {
    const db = await openDatabase();
    const result = await db.getFirstAsync(`
      SELECT date FROM period
      WHERE period_id = ?
    `, [periodId]);
    return result ? result.date : null;
  } catch (error) {
    console.error('Error fetching period date by ID:', error);
    throw error;
  }
};

export const numberToWords = (num) => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const g = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

  const makeGroup = (num) => {
    const hundreds = Math.floor(num / 100);
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    let str = '';

    if (hundreds) {
      str += a[hundreds] + ' Hundred ';
    }

    if (tens >= 2) {
      str += b[tens] + ' ';
      if (ones) {
        str += a[ones] + ' ';
      }
    } else if (tens >= 1) {
      str += a[tens * 10 + ones] + ' ';
    } else if (ones) {
      str += a[ones] + ' ';
    }

    return str.trim();
  };

  const convertToWords = (num) => {
    let result = '';
    let groupIndex = 0;

    while (num > 0) {
      const groupNum = num % 1000;
      if (groupNum > 0) {
        result = makeGroup(groupNum) + ' ' + g[groupIndex] + ' ' + result;
      }
      num = Math.floor(num / 1000);
      groupIndex++;
    }

    return result.trim();
  };

  return num === 0 ? 'Zero' : convertToWords(num);
};

export const exportCollectibles = async (periodId) => {
  try {
    const db = await openDatabase();

    // Check if all collectibles for the given period are printed
    const unprintedCollectibles = await db.getAllAsync(`
      SELECT account_number FROM collectibles
      WHERE period_id = ? AND is_printed = 0
    `, [periodId]);

    if (unprintedCollectibles.length > 0) {
      console.log('Not all collectibles are printed. Export aborted.');
      throw new Error('Not all collectibles are printed. Export aborted.');
    }

    // Update the period to mark as exported
    await db.runAsync(`
      UPDATE period
      SET isExported = 1
      WHERE period_id = ?
    `, [periodId]);

    console.log(`Period with ID ${periodId} marked as exported.`);
  } catch (error) {
    console.error('Error exporting collectibles:', error);
    throw error;
  }
};

export const updateCollectible = async ({
  account_number,
  period_id,
  payment_type,
  cheque_number,
  amount_paid,
  creditors_name
}) => {
  try {
    const db = await openDatabase();

    await db.runAsync(`
      UPDATE collectibles
      SET 
        payment_type = ?,
        cheque_number = ?,
        amount_paid = ?,
        creditors_name = ?,
        is_printed = 1
      WHERE account_number = ? AND period_id = ?
    `, [payment_type, cheque_number, amount_paid, creditors_name, account_number, period_id]);

    console.log('Collectible updated successfully.');
  } catch (error) {
    console.error('Error updating collectible:', error);
    throw error;
  }
};