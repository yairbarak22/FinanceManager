/**
 * Parameters sent by Yemot on every webhook request.
 *
 * Always present (defaults enabled):
 *   ApiPhone, ApiDID, ApiExtension, ApiCallId, ApiTime
 *
 * Accumulated from previous `read` responses:
 *   PIN, TxType, CategoryKey, Amount
 *
 * Hangup:
 *   hangup = "yes"
 */
export interface IvrWebhookParams {
  ApiPhone?: string;
  ApiDID?: string;
  ApiExtension?: string;
  ApiCallId?: string;
  ApiTime?: string;
  PIN?: string;
  TxType?: string;
  CategoryKey?: string;
  Amount?: string;
  hangup?: string;
}

export type IvrSessionStatus = 'started' | 'completed' | 'failed';
