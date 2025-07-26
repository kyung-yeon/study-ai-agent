import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';

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

const model = new OpenAIEmbeddings();
const db = await PGVectorStore.initialize(model, {
  postgresConnectionOptions: {
    connectionString: getDatabaseConnectionString(),
  }
});

// const results = await db.similaritySearchWithScore('김철수의 직업은 웹디자이너이다.', 1);
/*
score: 0.20166587854413331
doc: 홍길동은 오늘 출근을 했다.
*/

const results = await db.similaritySearchWithScore('홍길동은 내일 출근을 하는가?', 1);
/*
score: 0.07977932691573442
doc: 홍길동은 오늘 출근을 했다.
*/

for (const [doc, score] of results) {
  console.log('score:', score);
  console.log('doc:', doc.pageContent);
}