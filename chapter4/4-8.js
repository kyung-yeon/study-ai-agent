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

const thread1 = { configurable: { thread_id: '1' } };

const result1 = await graph.invoke({
    messages: [new HumanMessage("안녕하세요. 저는 민혁입니다.")],
    thread1,
});

const result2 = await graph.invoke({
    messages: [new HumanMessage("제 이름이 뭐죠?")],
    thread1,
});


// 4-9 graph 상태 확인
const stateSnapshot = await graph.getState(thread1)

// 4-10 상태 수정
await graph.updateState(thread1, { messages: [new HumanMessage("저는 LLM이 좋아요")] });