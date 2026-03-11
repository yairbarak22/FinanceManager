export interface IvrWebhookParams {
  ApiPhone?: string;
  PIN?: string;
  CategoryAudio?: string;
  Amount?: string;
  NameAudio?: string;
}

export type IvrSessionStatus = 'pending' | 'processing' | 'completed' | 'failed';
