import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

// pdf 추출
const loader = new PDFLoader('./assets/sample.pdf');
const docs = await loader.load();

console.log(docs);