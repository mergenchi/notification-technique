import { GoogleSheets } from './googleSpreadSheets';

const apparats = [
  {
    apparat_id: 12579106,
    apparat_name: 'склад бишкек',
    id_technika: '5465464',
    last_trans_date: '2023-03-27T06:42:10.000Z',
    avg_p_day: 344,
  },
  {
    apparat_id: 12427007,
    apparat_name: 'Кафе Мунгуш (Макс\\Дамирбек)',
    id_technika: 'o1',
    last_trans_date: '2023-03-27T12:07:54.000Z',
    avg_p_day: 34,
  },
  {
    apparat_id: 12168029,
    apparat_name: 'Народный «Шумкар- ЦГ»(Нрс\\Эд)',
    id_technika: 'b5',
    last_trans_date: '2023-03-28T20:13:15.000Z',
    avg_p_day: 13961,
  },
];

async function main() {
  const g = new GoogleSheets(
    process.env.CLIENT_EMAIL!,
    process.env.PRIVATE_KEY!,
    '18cGUuBGlMu6zaJIXj6lypOc28ufkTVSt1R_SMlB6V0',
    '1hr91wVlAPYV-32g4HdR8c8tj5Vz_RM446Ld8oK5zTSc',
  );

  const t = await g.read();

  for (const app of apparats) {
    if (t.hasOwnProperty(app.id_technika)) {
      console.log(app.id_technika);
    } else {
      console.log('1');
    }
  }
}

main();
