# 모바일 Local Narrator 모델 배치

기본 모바일 모델 파일명은 `qwen3-1.7b-q4_k_m.gguf`이다.

- Android: 앱 내부 `files/models/qwen3-1.7b-q4_k_m.gguf`
- iPad/iPhone: Application Support `Fantasyac/Models/qwen3-1.7b-q4_k_m.gguf`

4차 런타임은 모델이 위 위치에 존재하면 앱 내부 llama.cpp로 직접 추론한다. 모델이 없으면 Local Narrator는 실패하고, 기기에 Gemini API 키가 저장되어 있다면 Gemini Narrator fallback으로 로그를 계속 생성한다.

모델 자체는 앱 업데이트 패키지에 포함하지 않는다. 따라서 일반 앱 업데이트로 모델/세이브가 덮어써지지 않는다.
