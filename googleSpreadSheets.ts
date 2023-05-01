import { GoogleSpreadsheet } from 'google-spreadsheet';
import { ErrorMessages, errorMessages } from './translator';
import dotenv from 'dotenv';
dotenv.config();

export interface NewMessage {
  id: string;
  apparat_id: string;
  apparat_name?: string;
  last_trans_date: string;
  date_send_message: string;
  timedelta: string | number | boolean;
  comment?: string;
}

export interface UpdateMessage {
  name_technicians: string;
  id_technicians: number;
  id: string;
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
  private _requiredFieldsForWrites = [
    'id',
    'apparat_id',
    'apparat_name',
    'id_technicians',
    'name_technicians',
    'last_trans_date',
    'date_send_message',
    'timedelta',
    'date_technicians_response',
    'error_type',
    'comment',
  ];
  private _requiredFieldsForRead = ['id_technika', 'tg_id', 'name', 'region'];

  constructor(client_email: string, private_key: string, documentIdToWrite: string, documentIdToRead: string) {
    this._client_email = client_email;
    this._private_key = private_key;
    this._documentIdToRead = documentIdToRead;
    this._documentIdToWrite = documentIdToWrite;
    (async () => {
      await this.setNewDocumentIdToWrite(documentIdToWrite);
      await this.setNewDocumentIdToRead(documentIdToRead);
    })();
  }

  public get required_fields() {
    return this._requiredFieldsForWrites;
  }

  public get documentIdToWrite(): string {
    return this._documentIdToWrite;
  }

  public get documentIdToRead(): string {
    return this._documentIdToRead;
  }

  public get client_email(): string {
    return this._client_email;
  }

  public get private_key(): string {
    return this._private_key;
  }

  private async authenticate(documentId: string) {
    const doc = new GoogleSpreadsheet(documentId);
    await doc.useServiceAccountAuth({
      client_email: this._client_email,
      private_key: this._private_key,
    });
    await doc.loadInfo();
    return doc.sheetsByIndex[0];
  }

  private async fieldChecker(documentId: string, mode: string) {
    const sheet = await this.authenticate(documentId);
    const rows = await sheet.getRows();

    const requiredFields = mode === 'read' ? this._requiredFieldsForRead : this._requiredFieldsForWrites;
    if (sheet.headerValues.toString() !== requiredFields.toString()) {
      throw new Error(
        `Invalid sheet format! Google Spreadsheet should have the following fields: ${requiredFields.toLocaleString()}`,
      );
    }
    return true;
  }

  public async setNewDocumentIdToWrite(documentIdToWrite: string) {
    await this.fieldChecker(documentIdToWrite, 'write');
  }

  public async setNewDocumentIdToRead(documentIdToWrite: string) {
    await this.fieldChecker(documentIdToWrite, 'read');
  }

  public async write(message: NewMessage) {
    const sheet = await this.authenticate(this._documentIdToWrite);

    await sheet.addRow({
      id: message.id,
      apparat_id: message.apparat_id,
      apparat_name: message.apparat_name || 'Пусто',
      last_trans_date: message.last_trans_date,
      date_send_message: message.date_send_message,
      timedelta: message.timedelta!,
    });
  }

  public async update(message: UpdateMessage) {
    const sheet = await this.authenticate(this._documentIdToWrite);
    const rows = await sheet.getRows();
    try {
      const rowToUpdate = rows.find((row) => row.id === message.id)!;
      rowToUpdate.id_technicians = message.id_technicians;
      rowToUpdate.name_technicians = message.name_technicians;
      rowToUpdate.error_type = errorMessages[message.error_type as keyof ErrorMessages];
      rowToUpdate.date_technicians_response = new Date().toLocaleString('ru-RU');
      await rowToUpdate.save();
    } catch (e) {
      return new Error('Произошла ошибка на стороне Гугл');
    }
  }

  public async read(): Promise<TechnicsList> {
    const sheet = await this.authenticate(this._documentIdToRead);
    const rows = await sheet.getRows();
    return rows.reduce((obj: any, { id_technika, tg_id }) => {
      obj[id_technika] = tg_id;
      return obj;
    }, {});
  }
}
