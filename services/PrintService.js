import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

export const printReceipt = async (data) => {
    const { account_number, name, remaining_balance, payment_type, cheque_number, amount_paid, daily_due } = data;
    const columnWidths = [15, 18];
    
    try {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText('EXTRA CASH', { align: 'center' });
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('LENDING CORPORATION', {});
        await BluetoothEscposPrinter.printText('\r\n', {});

        await BluetoothEscposPrinter.printText('--------------------------------', {});
        await BluetoothEscposPrinter.printText('COLLECTION RECEIPT', {});
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('--------------------------------', {});
        await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Account Number', account_number.toString()],
            {},
        );

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Name', name],
            {},
        );

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Balance', remaining_balance.toString()],
            {},
        );
        
        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Payment Type', payment_type],
            {},
        );

        if (payment_type === 'Cheque') {
            await BluetoothEscposPrinter.printColumn(
                columnWidths,
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
                ['Cheque Number', cheque_number.toString()],
                {},
            );
        }

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Amount Paid', amount_paid.toString()],
            {},
        );

        const newBalance = remaining_balance - amount_paid;
        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['New Balance', newBalance.toString()],
            {},
        );

        await BluetoothEscposPrinter.printText('\r\n', {});

        await BluetoothEscposPrinter.printColumn(
            [48],
            [BluetoothEscposPrinter.ALIGN.LEFT],
            ['Signature: .....................'],
            {},
        );
        
        await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    } catch (e) {
        alert(e.message || 'ERROR');
    }
};
