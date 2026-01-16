import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.responses.create({
    model: "gpt-5",
    input: "Mastraってどういう意味？",
});

console.log(response);
