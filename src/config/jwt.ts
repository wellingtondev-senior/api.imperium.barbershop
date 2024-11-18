import 'dotenv/config'
const key:string = process.env.KEY_JWT

export const jwtConstants = {
    secret: key
  };
  