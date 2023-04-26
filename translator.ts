export interface ErrorMessages {
  outOfPaper: string;
  notConnected: string;
  accepterNotWorking: string;
  accepterIsFull: string;
  printerNotWorking: string;
  noPayments: string;
}

export const errorMessages: Record<keyof ErrorMessages, string> = {
  notConnected: 'Не на связи',
  accepterNotWorking: 'Купюрник не работает',
  accepterIsFull: 'Купюрник переполнен',
  printerNotWorking: 'Принтер не работает',
  noPayments: 'Нет платежей',
  outOfPaper: 'Кончилась бумага',
};
