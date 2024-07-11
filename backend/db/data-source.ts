import * as dotenv from 'dotenv';
import {DataSource} from 'typeorm'
import {DataSourceOptions} from "typeorm/data-source/DataSourceOptions";
dotenv.config({
  path: `env/${!process.env.NODE_ENV ? '.env.local' : `.env.${process.env.NODE_ENV}`}`,
});

export const dataSourceOptions:DataSourceOptions ={
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
  synchronize: false,
  entities: ['dist/db/entities/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
  charset: 'utf8mb4',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
