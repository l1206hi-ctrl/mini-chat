// server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// 현재 디렉터리 계산 (ESM 방식)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 정적 파일 서빙 (index.html, js, css 등)
app.use(express.static(__dirname));

// 🔹 OpenRouter 프록시 엔드포인트
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "OPENROUTER_API_KEY 환경변수가 설정되지 않았어 ㅠㅠ" });
  }

  // 🔥 프론트에서 오는 옵션들까지 같이 받기
  const {
    messages,
    model,
    temperature,
    max_tokens,
    top_p,
  } = req.body;

  try {
    // 🔥 OpenRouter로 보낼 바디 구성
    const body = {
      // 👉 자유도 높은 모델 쓰고 싶으면 그대로 두고,
      //    너무 괴상하면 뒤 :abliterated 지워서 기본 모델 써도 돼
      model: model || "meta-llama/llama-3.1-70b-instruct:abliterated",
      messages,
    };

    // 옵션값이 숫자일 때만 붙이기 (undefined면 JSON에서 빠짐)
    if (typeof temperature === "number") {
      body.temperature = temperature;
    }
    if (typeof max_tokens === "number") {
      body.max_tokens = max_tokens;
    }
    if (typeof top_p === "number") {
      body.top_p = top_p;
    }

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Mini Chat",
      },
      body: JSON.stringify(body),
    });

    const data = await orRes.json();

    if (!orRes.ok) {
      console.error("OpenRouter error:", orRes.status, data);
      return res.status(orRes.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "OpenRouter 요청 중 에러 발생" });
  }
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행: http://localhost:${PORT}`);
});

