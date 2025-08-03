
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { getDatabaseConnectionString } from "../common/utils.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda } from "@langchain/core/runnables";

try {
    const model = new OpenAIEmbeddings();
    const db = await PGVectorStore.initialize(model, {
        postgresConnectionOptions: {
            connectionString: getDatabaseConnectionString(),
        }
    });
    const retriever = db.asRetriever();

    const prompt = ChatPromptTemplate.fromTemplate(
        '다음 컨텍스트만 사용해 질문에 답변하세요. 컨텍스트: {context}\n\n질문: {question}'
    );

    const llm = new ChatOpenAI({ temperature: 0, model: 'gpt-4o-mini' });

    const query = '홍길동은 언제 출근해?';
    const qa = RunnableLambda.from(async (input) => {
        // 입력값에 대해 db - 임베딩 데이터 조회
        const docs = await retriever.invoke(input);
        // console.log('docs', docs);

        const formatted = await prompt.invoke({
            context: docs,
            question: query,
        })

        const answer = await llm.invoke(formatted);
        return { answer, docs };
    });

    const result = await qa.invoke(query); // 홍길동은 오늘 출근을 했고, 내일도 출근을 한다.
    console.log(result.answer.content);
    console.log(result.docs);
} catch (error) {
    console.error(error)
}