import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getDatabaseConnectionString } from "../common/utils.js";


// document load and split
const loader = new TextLoader('../common/assets/sample.txt');
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

const retriever = db.asRetriever({ k: 2 });
const result = await retriever.invoke('고대 그리스 철할자의 주요 인물은 누구인가요?');

console.log('result', result);