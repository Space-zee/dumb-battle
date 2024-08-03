export const parseJwt = (token: string): { telegramUserId: number } => {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
};
