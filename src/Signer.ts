import { sign, Request } from "aws4";
import * as https from "https";

export class Signer {
  constructor(
    private accessKeyId: string,
    private secretAccessKey: string,
    private sessionToken: string
  ) {}

  sign(opts: https.RequestOptions) {
    sign(opts as Request, {
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      sessionToken: this.sessionToken,
    });
  }
}
