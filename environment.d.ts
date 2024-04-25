declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      JWT_SECRET: string;
      SESSION_SECRET: string;
      MONGO_URI: string;
      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_USER: string;
      MAIL_PASSWORD: string;
      MAIL_FROM: string;

      EXCHANGE_API_ENDPOINT: string;
      EXCHANGE_API_KEY: string;
      TWO_FA_TOKEN_EXPIRATION: string;

      AAIO_SECRET_KEY: string;
      AAIO_MERCHANT_ID: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
