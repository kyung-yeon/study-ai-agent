
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

    const perspectivesPrompt = ChatPromptTemplate.fromTemplate(
        '당신은 AI 언어 모델 어시스턴트입니다. 주어진 사용자 질문의 다섯 가지 버전을 생성하여 벡터 데이터베이스에서 관련 문서를 검색하세요. 사용자 질문에 대한 다양한 관점을 생성함으로써 사용자가 거리 기반 유사도 검색의 한계를 극복할 수 있도록 돕는것이 목표입니다. 이러한 대체 질문을 개행으로 구분하여 제공하세요. 원래질문: {question}'
    );


    const llm = new ChatOpenAI({ temperature: 0, model: 'gpt-4o-mini' });
    const queryGen = perspectivesPrompt.pipe(llm).pipe((message) => message.content.split('\n'));

    const retrieverChain = queryGen
        .pipe(retriever.batch.bind(retriever))
        .pipe((documentList) => {
            const dedupedDocs = {};
            documentList.flat().forEach((doc) => {
                dedupedDocs[doc.pagecontent] = doc;
            })

            console.log('values', Object.values(dedupedDocs));
            return Object.values(dedupedDocs);
        });

    console.log('다중 쿼리 검색');
    const multiQueryQa = RunnableLambda.from(async (input) => {
        const docs = await retrieverChain.invoke({ question: input });
        console.log('docs', docs);

        const formatted = await prompt.invoke({
            context: docs,
            question: input,
        })

        const answer = await llm.invoke(formatted);
        return answer;
    });

    const result = await multiQueryQa.invoke('홍길동은 몇살일까 성별은 뭘까? 대해 모든걸 알려줘');
    console.log(result.content);
} catch (error) {
    console.error(error)
} finally {
    process.exit(1);
}