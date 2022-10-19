declare module 'verify-github-webhook-secret' {
  declare type VerifySecret =
    | (
      req: http$IncomingMessage,
      secret: string,
    ) => Promise<boolean>
    | (
      body: string,
      secret: string,
      xHubSignature?: string | Array<string>,
    ) => Promise<boolean>;

  declare module.exports: {
    verifySecret: VerifySecret,
  };
}
