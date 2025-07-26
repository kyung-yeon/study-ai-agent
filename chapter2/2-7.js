import 'dotenv/config';
dotenv.config({ path: '../.env' });
import { OpenAIEmbeddings } from '@langchain/openai';

const model = new OpenAIEmbeddings();
const embeddings = await model.embedDocuments([
    `Hi There!`,
    `Oh, hello!!!`,
    `What are you doing?`,
    `I'm doing my own thing!`,
    `How are you?`,
    `I'm doing good!`,
    `What are you doing?`,
    `I'm doing my own thing!`,
    `How are you?`,
    `I'm doing good!`,
]);

console.log(embeddings);

/**
 * 출력값 샘플..
 * [
  [
    -0.027562985196709633,
    0.0006013992824591696,
    -0.009888416156172752,
    -0.022333284839987755,
    -0.030936986207962036,
    0.021476808935403824,
    -0.0061607942916452885,
    -0.004850124940276146,
    0.008227369748055935,
    -0.028471369296312332,
    0.03475220128893852,
    -0.013872331008315086,
    -0.00735791539773345,
    ...
],[..],[..],[...],...]
 */