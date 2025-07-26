const axios = require('axios');
require('dotenv').config();

// 메시지 타입 정의
class HumanMessage {
  constructor(content) {
    this.role = 'user';
    this.content = content;
  }
}

class AIMessage {
  constructor(content) {
    this.role = 'model';
    this.content = content;
  }
}

class SystemMessage {
  constructor(content) {
    this.role = 'user'; // Gemini는 system role을 지원하지 않으므로 user로 매핑
    this.content = content;
  }
}

class ChatMessage {
  constructor(role, content) {
    this.role = role;
    this.content = content;
  }
}

class GeminiChat {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash';
    this.conversationHistory = [];
  }

  // 메시지를 Gemini 형식으로 변환
  _convertToGeminiFormat(messages) {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  // 단일 메시지 전송
  async sendMessage(message) {
    if (typeof message === 'string') {
      message = new HumanMessage(message);
    }

    this.conversationHistory.push(message);
    return await this._sendRequest();
  }

  // 메시지 배열로 대화 전송
  async sendMessages(messages) {
    this.conversationHistory = [...this.conversationHistory, ...messages];
    return await this._sendRequest();
  }

  // 대화 히스토리 초기화
  clearHistory() {
    this.conversationHistory = [];
  }

  // API 요청 전송
  async _sendRequest() {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': this.apiKey,
      };

      const payload = {
        contents: this._convertToGeminiFormat(this.conversationHistory)
      };

      const response = await axios.post(
        `${this.baseURL}:generateContent`,
        payload,
        { headers }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      const aiMessage = new AIMessage(aiResponse);
      this.conversationHistory.push(aiMessage);

      return aiMessage;
    } catch (error) {
      console.error('Error calling Gemini API:', error.message);
      throw error;
    }
  }

  // 대화 히스토리 조회
  getHistory() {
    return [...this.conversationHistory];
  }
}

// 기존 함수 유지 (하위 호환성)
async function callGeminiAPI(prompt) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-goog-api-key': process.env.GEMINI_API_KEY,
    };
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      payload,
      {
        headers
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
  }
}

// 사용 예시
async function main() {
  try {
    // 새로운 채팅 인터페이스 사용
    console.log('=== 새로운 채팅 인터페이스 사용 ===');
    const chat = new GeminiChat();

    // 첫 번째 메시지
    const response1 = await chat.sendMessage('안녕하세요!');
    console.log('AI 응답:', response1.content);

    // 두 번째 메시지 (대화 히스토리 유지)
    const response2 = await chat.sendMessage('제 이름은 무엇인가요?');
    console.log('AI 응답:', response2.content);

    // 메시지 배열로 전송
    const messages = [
      new HumanMessage('프랑스의 수도는 어디인가요?'),
      new SystemMessage('간단하게 답변해주세요.')
    ];
    const response3 = await chat.sendMessages(messages);
    console.log('AI 응답:', response3.content);

    // 대화 히스토리 확인
    console.log('\n=== 대화 히스토리 ===');
    chat.getHistory().forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.role}]: ${msg.content}`);
    });

    console.log('\n=== 기존 방식 사용 ===');
    const result = await callGeminiAPI('프랑스의 수도는 어디인가요?');
    console.log('Gemini API Response:', result.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Failed to get response:', error);
  }
}

// main 함수 실행
main();