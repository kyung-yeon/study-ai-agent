import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { PostgresRecordManager } from '@langchain/community/indexes/postgres';
import { index } from 'langchain/indexes';
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

const tableName = 'test_langchain';
const config = {
    postgresConnectionOptions: {
        connectionString: getDatabaseConnectionString(),
    },
    tableName,
    columns: {
        idColumnName: 'id',
        vectorColumnName: 'vector',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
    }
};

// postgres 연결
const model = new OpenAIEmbeddings();
const vectorStore = await PGVectorStore.initialize(model, config);

// 레코드 관리자 설정
const recordManagerConfig = {
    postgresConnectionOptions: {
        connectionString: getDatabaseConnectionString(),
    },
    tableName: 'upsertion_records',
};
const recordManager = new PostgresRecordManager('test_namespace', recordManagerConfig);

// 스키마 없다면 생성
await recordManager.createSchema();

const docs = [
    {
        pageContent: 'there are cats in the pond',
        metadata: { id: uuidv4(), source: 'cats.txt' }
    },
    {
        pageContent: 'there are also found in the pond',
        metadata: { id: uuidv4(), source: 'dogs.txt' }
    }
];

// 인덱싱 1회
const index_attempt_1 = await index({
    docsSource: docs,
    recordManager,
    vectorStore,
    options: {
        cleanup: 'incremental',
        sourceIdKey: 'source',
    }
});

console.log('index_attempt_1:', index_attempt_1);

// 인덱싱 2회
const index_attempt_2 = await index({
    docsSource: docs,
    recordManager,
    vectorStore,
    options: {
        cleanup: 'incremental',
        sourceIdKey: 'source',
    }
});

console.log('index_attempt_2:', index_attempt_2);

// 문서 수정 후 인덱싱 3회
docs[0].pageContent = 'there are cats in the pond new!';
const index_attempt_3 = await index({
    docsSource: docs,
    recordManager,
    vectorStore,
    options: {
        cleanup: 'incremental',
        sourceIdKey: 'source',
    }
});

console.log('index_attempt_3:', index_attempt_3);

// 결과
// index_attempt_1: { numAdded: 2, numDeleted: 0, numUpdated: 0, numSkipped: 0 }
// index_attempt_2: { numAdded: 0, numDeleted: 0, numUpdated: 0, numSkipped: 2 }
// index_attempt_3: { numAdded: 1, numDeleted: 1, numUpdated: 0, numSkipped: 1 }