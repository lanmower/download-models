const fs = require('fs');
require('dotenv').config()
const prompt = "chair"
// Replace 'YOUR_OPENAI_API_KEY' with your actual OpenAI GPT-3 API key
const apiKey = process.env.OPENAI;

async function askChatGPT(question, description) {
    try {
        const OpenAiApi = require("openai");

        const configuration = {
            apiKey,
        };
        const openai = new OpenAiApi(configuration);

        const completion = await await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: description + "\n" + question }],
        });
        console.log(completion.choices[0].message)
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error asking ChatGPT:', error.message);
        return null;
    }
}

async function processTSVLine(line) {
    const [description, url] = line.split('\t');
    const question = '- Ignore the number prefix, does this title describe a single ' + prompt + ' without any other objects like characters holding them or sitting in them or wearing them, respond only with the word yes, or no, please include nothing else in your response';
    const sanitizedDescription = description.replace(/[.,]/g, '').toLowerCase();
    const questionForChatGPT = `${question} ${sanitizedDescription}`;
    //console.log("ASKING", { questionForChatGPT, sanitizedDescription })
    return await askChatGPT(questionForChatGPT, sanitizedDescription)
        .then((answer) => {
            if (answer.replaceAll('.', '').toLowerCase().startsWith('yes')) return { description, url };
        });
}

async function main() {
    const inputFilePath = 'searched.tsv'; // Replace with the actual path to your input TSV file
    const outputFilePath = 'filtered.tsv'; // Replace with the desired output file path

    const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    const results = await Promise.all(lines.map(processTSVLine));
    console.log(results);
    // Filter and write lines with 'yes' answer to a new TSV file
    const filteredResults = results.filter(result => result?.description);
    let index = 0;
    const filteredTSV = filteredResults.map(result => `${result.description}\t${result.url}`).join('\n');
    fs.writeFileSync(outputFilePath, filteredTSV, 'utf-8');

    console.log('Filtered lines with "yes" answer written to:', outputFilePath);
}

main();
