import { StateGraph, Annotation, messagesStateReducer, START, END, MemorySaver } from '@langchain/langgraph'


const State = {
    messages: Annotation({
        reducer: messagesStateReducer,
        default: () => []
    })
}

const builder = new StateGraph(State);

const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0
});

const chatbot = async (state) => {
    const answer = await model.invoke(state.messages);
    return {
        messages: answer
    };
}

// 노드 추가 (4-3)
builder = builder.addNode('chatbot', chatbot);

// 엣지 추가 (4-4)
builder = builder.addEdge(START, 'chatbot').addEdge('chatbot', END);

// 메모리 기능 추가 (4-7)
const graph = builder.compile({ checkpointer: new MemorySaver() });