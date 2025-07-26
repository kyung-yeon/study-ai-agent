import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { v4 as uuidv4 } from 'uuid';

const POSTGRES_HOST = process.env.POSTGRES_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;
const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

const getDatabaseConnectionString = () => {
  const connectionString = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`;
  console.log('Connection string:', connectionString);
  return connectionString;
}

const ids = [uuidv4(), uuidv4()];

const model = new OpenAIEmbeddings();
const db = await PGVectorStore.initialize(model, {
  postgresConnectionOptions: {
    connectionString: getDatabaseConnectionString(),
  }
});

db.addDocuments([
  {
    pageContent: '홍길동은 오늘 출근을 했다.',
    metadata: { location: 'pond', topic: 'animals' }
  },
  {
    pageContent: '홍길동은 내일도 출근을 한다.',
    metadata: { location: 'pond', topic: 'animals' }
  }
], { ids })