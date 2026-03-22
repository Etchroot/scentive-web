#!/usr/bin/env node
/**
 * Scentive 번역 스크립트
 *
 * 사용법:
 *   ANTHROPIC_API_KEY=sk-ant-xxx node scripts/translate.js
 *
 * ko.json을 소스로 읽어 en / ja / zh JSON을 자동 생성합니다.
 * Node 18+ 필요 (내장 fetch 사용).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '../src/locales');

// .env 파일에서 ANTHROPIC_API_KEY 로드
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    });
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY 환경 변수를 설정해주세요.');
  console.error('   예: ANTHROPIC_API_KEY=sk-ant-xxx node scripts/translate.js');
  process.exit(1);
}

const TARGET_LANGS = {
  en: '영어',
  ja: '일본어',
  zh: '중국어(간체)',
};

const source = JSON.parse(
  fs.readFileSync(path.join(LOCALES_DIR, 'ko.json'), 'utf-8')
);

async function translate(obj, targetLangKo, targetLangCode) {
  const prompt = `아래 JSON은 한국어 웹사이트(향수 추천 서비스 "Scentive")의 UI 텍스트입니다.
이를 ${targetLangKo}로 번역해주세요.

번역 규칙:
1. JSON 키(key)는 절대 변경하지 마세요. 값(value)만 번역합니다.
2. "Scentive" 브랜드명은 번역하지 마세요.
3. \\n (줄바꿈 문자)은 그대로 유지하세요.
4. "keyword" 값은 반드시 같은 항목의 "text" 값 안에 포함된 단어(부분 문자열)여야 합니다.
5. "eyebrow" 키의 값(예: "— How it works", "— Our belief" 등)은 영어 그대로 두거나 ${targetLangKo}로 번역하세요.
6. "senseBadge" 값("Most unexplored")은 ${targetLangKo}로 번역하세요.
7. 번역 품질보다 뜻이 자연스럽게 통하는 것을 우선합니다.
8. 결과는 반드시 유효한 JSON만 반환하세요. 코드블록(\`\`\`)이나 설명 텍스트를 포함하지 마세요.

번역할 JSON:
${JSON.stringify(obj, null, 2)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 오류 (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  // JSON 추출 (코드블록 제거)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('응답에서 JSON을 찾을 수 없습니다.');

  return JSON.parse(jsonMatch[0]);
}

console.log('🌐 Scentive 번역 시작...\n');

for (const [lang, langKo] of Object.entries(TARGET_LANGS)) {
  process.stdout.write(`  ${langKo} (${lang}) 번역 중... `);
  try {
    const translated = await translate(source, langKo, lang);
    const outPath = path.join(LOCALES_DIR, `${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(translated, null, 2) + '\n', 'utf-8');
    console.log(`✅ 저장 완료 → src/locales/${lang}.json`);
  } catch (e) {
    console.log(`❌ 실패`);
    console.error(`     오류: ${e.message}`);
  }
}

console.log('\n✨ 번역 완료. 앱을 재시작하면 적용됩니다.');
