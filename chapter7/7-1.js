import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Calculator } from "@langchain/community/tools/calculator";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { Annotation, messagesStateReducer, START, END, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

const search = new DuckDuckGoSearch();
const calculator = new Calculator();

const tools = [search, calculator];
const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
}).bindTools(tools);

const annotation = Annotation.Root({
    messages: Annotation({
        reducer: messagesStateReducer,
        default: () => [],
    })
});

const generatePromt = new SystemMessage(
    `당신은 훌륭한 3단락 에세이를 작성하는 임무를 가진 에세이 어시스턴트입니다.
    사용자의 요청에 맞춰 최상의 에세이를 작성하세요.
    사용자가 비평을 제공하면, 이전 시도에 대한 수정 버전을 응답하세요.`
);

const generate = async (state) => {
    const answer = await model.invoke([generatePromt, ...state.messages]);
    return { messages: [answer] };
}

const reflectionPromt = new SystemMessage(
    `당신은 에세이 제출물을 평가하는 교사입니다. 사용자의 제출물에 대한 비평과 추천을 생성하세요. 길이, 깊이, 스타일 등과 같은 구체적인 요구사항을 포함한 자세한 추천을 제공하세요.`
);

const reflect = async (state) => {
    const clsMap = {
        ai: HumanMessage,
        human: AIMessage,
    };

    const translated = [
        reflectionPromt,
        state.messages[0],
        ...state.messages.slice(1).map(msg => new clsMap[msg._getType()](msg.content)),
    ];

    const answer = await model.invoke(translated);
    return { message: [new HumanMessage({ content: answer.content })] }
}

const shouldContinue = (state) => {
    if (state.message.length > 6) {
        return END;
    }

    return 'reflect';
}


const builder = new StateGraph(annotation)
    .addNode('generate', generate)
    .addNode('reflect', reflect)
    .addEdge(START, 'generate')
    .addConditionalEdges('generate', shouldContinue)
    .addEdge('reflect', 'generate')

const app = builder.compile();
const result = await app.invoke({ messages: [new HumanMessage({ content: '주제: 컴퓨터 과학의 중요성' })] });
console.log('result', result);