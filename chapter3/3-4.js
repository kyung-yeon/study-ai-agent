
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { getDatabaseConnectionString } from "../common/utils.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

try {
    const loader = new TextLoader('../common/assets/sample.txt');
    const raw_docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const docs = await splitter.splitDocuments(raw_docs);


    // const model = new OpenAIEmbeddings();
    // const db = await PGVectorStore.initialize(model, {
    //     postgresConnectionOptions: {
    //         connectionString: getDatabaseConnectionString(),
    //     }
    // });

    const prompt = ChatPromptTemplate.fromTemplate(
        '다음 컨텍스트만 사용해 질문에 답변하세요. 컨텍스트: {context}\n\n질문: {question}'
    );

    const llm = new ChatOpenAI({ temperature: 0, model: 'gpt-4o-mini' });

    const chain = prompt.pipe(llm);

    // const query = '오늘 날씨 어때?'; // 제공된 컨텍스트에는 날씨에 대한 정보가 포함되어 있지 않습니다. 다른 질문이 있으시면 도와드리겠습니다!
    const query = 'CD 는 무중단으로 실행하기위해 필요한거야?';
    const result = await chain.invoke({
        context: docs,
        question: query,
    })

    console.log(result.content);
} catch (error) {
    console.error(error)
}