
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

    const rewritePrompt = ChatPromptTemplate.fromTemplate(
        '웹 검색 엔진이 주어진 질문에 답할 수 있도록 더 나은 한글 검색어를 제공하세요. 쿼리는 \'**\'로 끝내세요.\n\n질문: {question} 답변:'
    );

    const llm = new ChatOpenAI({ temperature: 0, model: 'gpt-4o-mini' });

    const rewriter = rewritePrompt.pipe(llm).pipe((message) => {
        console.log('message', message);
        return message.content.replaceAll('"', '').replaceAll('**');
    })



    const query = '길동이는 잠자고 있다가 내일은 노트북 하고 그러나?';
    const qa = RunnableLambda.from(async (input) => {
        // 입력값에 대해 db - 임베딩 데이터 조회
        const newQuery = await rewriter.invoke({ question: input });
        // console.log(newQuery) // 길동이 내일 노트북 사용할까?\"**
        const docs = await retriever.invoke(newQuery);

        const formatted = await prompt.invoke({
            context: docs,
            question: query,
        })

        const answer = await llm.invoke(formatted);
        return answer;
    });

    const result = await qa.invoke(query); // 홍길동은 오늘 출근을 했고, 내일도 출근을 한다.
    console.log(result.content);
} catch (error) {
    console.error(error)
}