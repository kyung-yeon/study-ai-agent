import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// pdf 추출
const loader = new PDFLoader('./assets/sample.pdf');
const docs = await loader.load();

// pdf -> text 분할
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

// 정해진 chunkSize 만큼 분할
const splittedCocs = await splitter.splitDocuments(docs);

console.log(splittedCocs);
