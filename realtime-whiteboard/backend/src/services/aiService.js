const { GoogleGenerativeAI } = require("@google/generative-ai");

// Biến lưu trữ instance của AI để tái sử dụng (Singleton pattern)
let genAI = null;
let model = null;

/**
 * Hàm khởi tạo AI Client
 * Chỉ chạy khi có request đầu tiên, đảm bảo lúc này dotenv đã được nạp xong từ app.js
 */
const getAIModel = () => {
  if (!model) {
    const key = process.env.GEMINI_API_KEY;
    console.log(`[System] Initializing Gemini AI (Key Length: ${key?.length || 0})`);
    
    if (!key) {
      throw new Error("API Key chưa được nạp. Hãy kiểm tra lại file .env và require('dotenv').config() trong app.js");
    }

    genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return model;
};

async function askAI(prompt, roomId) {
  try {
    // Khởi tạo hoặc lấy model đã được khởi tạo
    const activeModel = getAIModel();

    const isDrawCommand = /draw|vẽ|tạo|create|make|circle|square|triangle|line|star/i.test(prompt);

    if (isDrawCommand) {
      console.log(`[AI-ACTION] Drawing: ${prompt}`);
      const systemPrompt = `You are an AI drawing assistant for a collaborative whiteboard.
When asked to draw something, respond with ONLY a JSON object in this format (no markdown, no explanation, no backticks):
DRAW:{"strokes":[{"userId":"ai","userName":"AI","color":"#9b59b6","width":3,"points":[{"x":100,"y":100},{"x":200,"y":200}]}]}

Keep drawings creative yet simple. The canvas is 1200x700.
Use multiple strokes with different colors if appropriate.
For a circle: approximate with ~24 points. For a square: 4 corner points + close.
Try to center your drawing on the canvas.`;

      const result = await activeModel.generateContent(`${systemPrompt}\n\nDraw: ${prompt}`);
      const response = await result.response;
      let text = response.text().trim();
      
      // Xử lý dọn dẹp chuỗi JSON phòng trường hợp AI trả về markdown
      text = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      return text;
      
    } else {
      console.log(`[AI-ACTION] Chat: ${prompt}`);
      const result = await activeModel.generateContent(`You are a helpful assistant inside a collaborative whiteboard app. Keep answers concise (2-3 sentences max). You can also draw things if asked.\n\nUser: ${prompt}`);
      const response = await result.response;
      return response.text().trim();
    }
    
  } catch (err) {
    console.error('--- AI ERROR DETAIL ---');
    console.error(err);
    // Trả về message rõ ràng hơn để Frontend dễ hiển thị
    return `AI Error: ${err.message}`;
  }
}

module.exports = { askAI };
