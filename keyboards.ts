export const apparatInfoKB = {
  inline_keyboard: [
    [
      { text: 'Не на связи', callback_data: 'notConnected' },
      { text: 'Купюрник не работает', callback_data: 'accepterNotWorking' },
      { text: 'Купюрник переполнен', callback_data: 'accepterIsFull' },
    ],
    [
      { text: 'Принтер не работает', callback_data: 'printerNotWorking' },
      { text: 'Нет платежей', callback_data: 'noPayments' },
      { text: 'Кончилась бумага', callback_data: 'outOfPaper' },
    ],

    [{ text: 'Админка', url: 'kg.quickpay.kg' }],
  ],
};
