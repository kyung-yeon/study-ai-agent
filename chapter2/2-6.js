import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const makrdownText = `
### CD (Continuous Delivery)

CD 는 개발자는 자동으로 소프트웨어의 새로운 버전을 즉시 배포할 수 있도록 지원합니다.
CI 과정을 통해 오류가 없다는것이 검증된 코드는 CD (지속적 전달)을 통해 실서비스로 지속적으로 배포가 됩니다.
CD 가 자주 일어나는 서비스는 항상 더 최신의 코드가 배포될 수 있고 이러한 환경은 시스템 오류에 대해 더 긴밀하게 대응할 수 있다는 장점이 되기도 합니다.
CD 가 동작할때에는 동작하던 시스템이 무중단으로 배포될 수 있도록 환경을 구성해둠으로써 안정적으로 새로운 시스템이 지속적으로 배포되도록 설정하는것도 중요합니다.
`;

const mdSpliiter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 50,
    chunkOverlap: 0,
});

// 정해진 chunkSize 만큼 분할
const mdDocs = await mdSpliiter.createDocuments([makrdownText], [{ source: 'https://kyungyeon.dev' }]);

console.log(mdDocs); // markdown 의 중단 지점을 기준으로 자연스럽게 텍스트가 분할된다.
