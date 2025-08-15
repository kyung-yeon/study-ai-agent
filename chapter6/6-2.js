import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Calculator } from "@langchain/community/tools/calculator";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { Annotation, messagesStateReducer, START, END, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage } from '@langchain/core/messages';

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

const firstModelNode = async (state) => {
    const query = state.messages[state.messages.length - 1].content;
    const searchToolCall = {
        name: 'duckduckgo_search',
        args: { query },
        id: Math.random().toString(),
    };

    return {
        messages: [new AIMessage({ content: '', tool_calls: [searchToolCall] })]
    }
}

const modelNode = async (state) => {
    console.log('state.messages', state.messages);
    const res = await model.invoke(state.messages);
    return { messages: res };
}

const builder = new StateGraph(annotation)
    .addNode("first_model", firstModelNode)
    .addNode("model", modelNode)
    .addNode('tools', new ToolNode(tools))

    .addEdge(START, 'first_model')
    .addEdge('first_model', 'tools')
    .addEdge('tools', 'model')
    .addConditionalEdges('model', toolsCondition);


const app = builder.compile();
const result = await app.invoke({ messages: ['미국의 30대 대통령이 사망했을 때 몇 살이었나요?'] });
console.log('result', result);
// console.log('builder', builder);
