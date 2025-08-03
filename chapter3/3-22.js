import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { FunctionalTranslator } from "@langchain/core/structured_query";
import { getDatabaseConnectionString } from "../common/utils.js";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { AttributeInfo } from "langchain/chains/query_constructor";

const fields = [
    {
        name: 'genre',
        description: '영화 장르',
        type: 'string or array of strings',
    },
    {
        name: 'year',
        description: '영화 개봉 연도',
        type: 'number',
    },
    {
        name: 'director',
        description: '영화 감독',
        type: 'string',
    },
    {
        name: 'rating',
        description: '영화 평점 1-10점',
        type: 'number',
    },
    {
        name: 'length',
        description: '영화 상영 시간',
        type: 'number',
    },
    {
        name: 'language',
        description: '영화 언어',
        type: 'string or array of strings',
    },
];

const model = new OpenAIEmbeddings();
const db = await PGVectorStore.initialize(model, {
    postgresConnectionOptions: {
        connectionString: getDatabaseConnectionString(),
    }
});

const attributeInfos = fields.map((field) => {
    return new AttributeInfo(field.name, field.description, field.type);
});

const description = '영화에 대한 간략한 정보';
const selfQueryRetriever = SelfQueryRetriever.fromLLM({
    llm: new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 }),
    vectorStore: db,
    description,
    attributeInfo: attributeInfos,
    structuredQueryTranslator: new FunctionalTranslator(),
});

const result = await selfQueryRetriever.invoke('평점이 높은 (8.5점 이상) SF영화는 무엇인가요?');
console.log(result);