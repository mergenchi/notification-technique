import { Context, NarrowedContext, Telegraf, session } from 'telegraf';
import cron from 'node-cron';
import { queryDatabase } from './getApparatsFromPg';
import { GoogleSheets } from './googleSpreadSheets';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';
import { apparatInfoKB } from './keyboards';

const bot = new Telegraf('6043603974:AAFTsNX3jFYVSPa0RC05MCUOBsYRO2C00C4');
bot.use(session());

const googleSheet = new GoogleSheets(
  process.env.CLIENT_EMAIL!,
  process.env.PRIVATE_KEY!,
  '18cGUuBGlMu6zaJIXj6lypOc28ufkTVSt1R_SMlB6V0o',
  '1D0Z7UOyHuZZA-nl_PA1lDEVZF-N-KenCGFmjHd1DQp0',
);

cron.schedule('* * * * *', async () => {
  const apparats = await queryDatabase();
  const technic = await googleSheet.read();

  apparats.forEach(async (apparat) => {
    if (apparat.id_technika && technic.hasOwnProperty(apparat.id_technika)) {
      await bot.telegram.sendMessage(
        technic[apparat.id_technika],
        `Номер терминала: ${apparat.apparat_id}\nНазвание точки: ${apparat.apparat_name}\nДата последнего платежа: ${
          apparat.last_trans_date
        }\nДата отправки уведомления: ${new Date().toLocaleString('ru-RU')}`,
        {
          reply_markup: apparatInfoKB,
        },
      );
    } else {
      await bot.telegram.sendMessage(
        561418543,
        `Номер терминала: ${apparat.apparat_id}\nНазвание точки: ${apparat.apparat_name}\nДата последнего платежа: ${
          apparat.last_trans_date
        }\nДата отправки уведомления: ${new Date().toLocaleString('ru-RU')}`,
        {
          reply_markup: apparatInfoKB,
        },
      );
    }
  });
});

function getApparatInfoFromMessage(message: CallbackQuery.AbstractQuery['message']): {
  apparatId?: string;
  apparatName?: string;
  lastTransDate?: string;
  sendMessageDate?: string;
} {
  // Extract the apparat ID and name from the message text
  const regex =
    /Номер терминала: (\d+)\nНазвание точки: (.+)\nДата последнего платежа: (.+)\nДата отправки уведомления: (.+)/;
  const match = message.text && message.text.match(regex);
  if (match) {
    return {
      apparatId: match[1],
      apparatName: match[2],
      lastTransDate: match[3],
      sendMessageDate: match[4],
    };
  } else {
    return {};
  }
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
      const { apparatId, apparatName, lastTransDate, sendMessageDate } = apparatInfo;

      await googleSheet.write({
        id_apparat: apparatId!,
        name_apparat: apparatName,
        id_technicians: ctx.chat?.id!,
        name_technicians: ctx.from?.first_name!,
        date_send_message: sendMessageDate!,
        last_transaction_date: new Date(lastTransDate!).toLocaleString('ru-RU'),
        date_technicians_response: new Date().toLocaleString('ru-RU'),
        error_type: callbackData,
      });
      const res = await ctx.deleteMessage();
      return res;
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
  } catch {
    await ctx.editMessageText(ctx.update.callback_query.message?.text! + '\n\nНе получилось отправить', {
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
