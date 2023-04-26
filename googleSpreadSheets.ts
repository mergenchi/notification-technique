import { GoogleSpreadsheet } from 'google-spreadsheet';
import { ErrorMessages, errorMessages } from './translator';
import dotenv from 'dotenv';
dotenv.config();

export interface Message {
  id_apparat: string;
  name_apparat?: string;
  id_technicians: number;
  name_technicians: string;
  last_transaction_date: string;
  date_send_message: string;
  timedelta?: string | number | boolean;
  date_technicians_response: string;
  error_type: string;
  comment?: string;
}

export interface TechnicsList {
  [key: string]: string;
}

export class GoogleSheets {
  private _documentIdToWrite: string;
  private _documentIdToRead: string;
  private _client_email: string;
  private _private_key: string;

  constructor(client_email: string, private_key: string, documentIdToWrite: string, documentIdToRead: string) {
    this._client_email = client_email;
    this._private_key = private_key;
    this._documentIdToWrite = documentIdToWrite;
    this._documentIdToRead = documentIdToRead;
  }

  get client_email(): string {
    return this._client_email;
  }

  get private_key(): string {
    return this._private_key;
  }
  async setNewDocumentIdToWrite(documentIdToWrite: string) {
    const required_fields = [
      'id_apparat',
      'name_apparat',
      'id_technicians',
      'name_technicians',
      'last_transaction_date',
      'date_send_message',
      'timedelta',
      'date_technicians_response',
      'error_type',
      'comment',
    ];
    const doc = new GoogleSpreadsheet(documentIdToWrite);
    await doc.useServiceAccountAuth({
      client_email: this._client_email,
      private_key: this._private_key,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    if (rows[0]._rawData.toString() === required_fields.toString()) {
      this._documentIdToWrite = documentIdToWrite;
      return true;
    } else {
      return false;
    }
  }

  // private async getSheet(documentId: string) {
  //   const doc = new GoogleSpreadsheet(documentId);
  //   await doc.useServiceAccountAuth({
  //     client_email: this.client_email,
  //     private_key: this.private_key,
  //   });
  //   await doc.loadInfo();
  //   return doc.sheetsByIndex[0];
  // }

  public async write(message: Message) {
    const doc = new GoogleSpreadsheet(this._documentIdToWrite);
    await doc.useServiceAccountAuth({
      client_email: this._client_email,
      private_key: this._private_key,
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const row = await sheet.addRow({
      id_apparat: message.id_apparat,
      name_apparat: message.name_apparat ? message.name_apparat : '',
      id_technicians: message.id_technicians,
      last_transaction_date: message.last_transaction_date,
      name_technicians: message.name_technicians,
      date_send_message: message.date_send_message,
      date_technicians_response: message.date_technicians_response,
      timedelta: `=F${sheet.rowCount + 1}-E${sheet.rowCount + 1}`,
      error_type: errorMessages[message.error_type as keyof ErrorMessages],
    });
  }

  public async read(): Promise<TechnicsList> {
    const doc = new GoogleSpreadsheet(this._documentIdToRead);
    await doc.useServiceAccountAuth({
      client_email: this._client_email,
      private_key: this._private_key,
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.reduce((obj: any, { id_technika, tg_id }) => {
      obj[id_technika] = tg_id;
      return obj;
    }, {});
  }
}
