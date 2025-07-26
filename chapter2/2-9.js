import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
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

// document load and split
const loader = new TextLoader('./assets/sample.txt');
const raw_docs = await loader.load();
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const docs = await splitter.splitDocuments(raw_docs);

// create embeddings from docs
const model = new OpenAIEmbeddings();
const db = await PGVectorStore.fromDocuments(docs, model, {
  postgresConnectionOptions: {
    connectionString: getDatabaseConnectionString(),
  }
});

// search
const result = await db.similaritySearch('query', 4);
console.log('result:', result);

/*

[
  Document {
    pageContent: '### CI (Continuous Integratin)\n' +
      '\n' +
      '지속적인 통합(CI)은 변경된 코드에 대해 충분한 검증을 거친 후 프로덕션 릴리스를 위해 자동으로 배포가 준비되는 일련의 과정입니다.\n' +
      '수많은 개발자는 하루에도 여러번의 commit 을 메인 브랜치에 병합할 수 있습니다.\n' +
      '각자 다른 코드들의 main 브랜치에 병합될 때 트리거를 이용해 자동으로 build 하고 테스트합니다. \n' +
      '그리고 오류가 발생했을 땐 개밸자에게 즉각 피드백을 제공합니다.\n' +
      'CI를 통해 개발자는 코드의 검증을 위해 사용되는 시간을 줄일 수 잇습니다. 또한 오류가 있는 코드는 main 브랜치에 병합되지 않도록 방어도 할 수 있습니다.\n' +
      'CI 가 정상적으로 동작하기 위해서는 충분한 테스트코드의 작성이 선행되어야 합니다. (TDD 영상 연결)\n' +
      '\n' +
      '### CD (Continuous Delivery)\n' +
      '\n' +
      'CD 는 개발자는 자동으로 소프트웨어의 새로운 버전을 즉시 배포할 수 있도록 지원합니다.\n' +
      'CI 과정을 통해 오류가 없다는것이 검증된 코드는 CD (지속적 전달)을 통해 실서비스로 지속적으로 배포가 됩니다.\n' +
      'CD 가 자주 일어나는 서비스는 항상 더 최신의 코드가 배포될 수 있고 이러한 환경은 시스템 오류에 대해 더 긴밀하게 대응할 수 있다는 장점이 되기도 합니다.\n' +
      'CD 가 동작할때에는 동작하던 시스템이 무중단으로 배포될 수 있도록 환경을 구성해둠으로써 안정적으로 새로운 시스템이 지속적으로 배포되도록 설정하는것도 중요합니다.',
    metadata: { loc: [Object], source: './assets/sample.txt' },
    id: '8c9fef49-11c7-454f-9b65-dae2e6b1d2db'
  }
]

*/