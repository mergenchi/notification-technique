import { Context, NarrowedContext, Telegraf, session } from 'telegraf';
import cron from 'node-cron';
import { Apparats, queryDatabase } from './getApparatsFromPg';
import { GoogleSheets, TechnicsList } from './googleSpreadSheets';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';
import { apparatInfoKB } from './keyboards';
import { v4 as uuidv4 } from 'uuid';

const bot = new Telegraf('6043603974:AAFTsNX3jFYVSPa0RC05MCUOBsYRO2C00C4');
bot.use(session());

const googleSheet = new GoogleSheets(
  process.env.CLIENT_EMAIL!,
  process.env.PRIVATE_KEY!,
  process.env.DOCUMENTIDTOWRITE!,
  process.env.DOCUMENTIDTOREAD!,
);

async function sendNotification(apparat: Apparats, technic: TechnicsList) {
  const id = uuidv4();
  const date_send_message = new Date();
  const { apparat_id, apparat_name, last_trans_date, id_technika } = apparat;
  const technikId = id_technika && technic.hasOwnProperty(id_technika) ? technic[id_technika] : 561418543;
  const timedelta = (date_send_message.valueOf() - new Date(last_trans_date).valueOf()) / 3600000;

  await Promise.all([
    googleSheet.write({
      id,
      apparat_id,
      apparat_name,
      last_trans_date: new Date(last_trans_date).toLocaleString('ru-RU'),
      date_send_message: date_send_message.toLocaleString('ru-RU'),
      timedelta,
    }),
    bot.telegram.sendMessage(
      technikId,
      `Идентификатор: ${id}\nНомер терминала: ${apparat_id}\nНазвание точки: ${apparat_name}\nДата последнего платежа: ${new Date(
        last_trans_date,
      ).toLocaleString('ru-RU')}\nДата отправки уведомления: ${date_send_message.toLocaleString('ru-RU')}`,
      {
        reply_markup: apparatInfoKB,
      },
    ),
  ]);
}

async function getData() {
  try {
    const [apparats, technic] = await Promise.all([queryDatabase(), googleSheet.read()]);
    console.log(apparats.length);

    for await (const apparat of apparats) {
      await sendNotification(apparat, technic);
    }
  } catch (error) {
    console.error(error);
  }
}
cron.schedule('* * * * *', getData);

function getApparatInfoFromMessage(message: CallbackQuery.AbstractQuery['message']) {
  const matches = message.text.match(
    /Идентификатор: (.+)\nНомер терминала: (.+)\nНазвание точки: (.+)\nДата последнего платежа: (.+)\nДата отправки уведомления: (.+)/,
  );

  if (!matches) {
    return {};
  }

  const [_, id, apparat_id, apparat_name, last_trans_date, date_send_message] = matches;

  return {
    id,
    apparat_id,
    apparat_name,
    last_trans_date: new Date(last_trans_date),
    date_send_message: new Date(date_send_message),
  };
}

async function handleApparatAction(
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  callbackData: string,
) {
  if (ctx.update.callback_query && ctx.update.callback_query.message) {
    const message = ctx.update.callback_query.message;
    const apparatInfo = getApparatInfoFromMessage(message);

    if (apparatInfo) {
      const { id } = apparatInfo;
      try {
        const res = await googleSheet.update({
          date_technicians_response: new Date().toLocaleString('ru-RU'),
          error_type: callbackData,
          id: id!,
          id_technicians: ctx.from?.id!,
          name_technicians: ctx.from?.first_name!,
        });
        return res;
      } catch (e) {
        return e;
      }
    }
  }
}

async function handleApparatActionWithLoading(
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  actionType: string,
) {
  try {
    await ctx.editMessageText('Loading...');
    await handleApparatAction(ctx, actionType);
    await ctx.deleteMessage();
  } catch {
    await ctx.editMessageText(ctx.update.callback_query.message.text! + '\n\nНе получилось отправить', {
      reply_markup: apparatInfoKB,
    });
  }
}

bot.action('notConnected', async (ctx) => {
  await handleApparatActionWithLoading(ctx, 'notConnected');
});

bot.action('accepterNotWorking', async (ctx) => {
  await handleApparatActionWithLoading(ctx, 'accepterNotWorking');
});

bot.action('accepterIsFull', async (ctx) => {
  await handleApparatActionWithLoading(ctx, 'accepterIsFull');
});

bot.action('printerNotWorking', async (ctx) => {
  await handleApparatActionWithLoading(ctx, 'printerNotWorking');
});

bot.action('noPayments', async (ctx) => {
  await handleApparatActionWithLoading(ctx, 'noPayments');
});

bot.action('outOfPaper', async (ctx) => {
  await handleApparatActionWithLoading(ctx, 'outOfPaper');
});

bot.launch();
