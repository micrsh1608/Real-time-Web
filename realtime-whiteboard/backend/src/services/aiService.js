const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateDrawingCommands(prompt, retries = 3) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(
      `You are a drawing assistant. The user wants you to draw: "${prompt}".
       Respond ONLY with a valid JSON array of drawing commands. No explanation.
       Example: [{"type":"circle","x":200,"y":200,"radius":50,"color":"#000000"}]
       Supported types: circle, rect, line`
    );
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];

  } catch (err) {
    if (err.status === 429 && retries > 0) {
      console.log(`Rate limited, retrying in 5s... (${retries} left)`);
      await new Promise(r => setTimeout(r, 5000));
      return generateDrawingCommands(prompt, retries - 1);
    }
    throw err;
  }
}

module.exports = { generateDrawingCommands };