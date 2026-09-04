# Fantasyac Android Native Shell — 3차

## 현재 구현
- Android Studio 프로젝트 구조
- applicationId `com.fantasyac.game`
- 최소 Android 9 (API 28), arm64-v8a
- WebView + persistent IndexedDB
- `AndroidFantasyac` JavaScript bridge
- 업데이트 전 세이브를 `files/backups/`에 저장
- 모델 기본 위치: `files/models/qwen3-1.7b-q4_k_m.gguf`
- llama.cpp 소스를 `native/third_party/llama.cpp`에 준비하면 CMake가 링크

## 준비
1. 루트에서 `npm install && npm run build`
2. `native/android/scripts/sync_web_assets.sh`
3. `native/android/scripts/prepare_llama_cpp.sh`
4. `native/android`를 Android Studio로 연다.
5. 동일 서명키를 영구 보존한다.

## 현재 제한
3차에서는 llama.cpp 모델 lifecycle/JNI 경계까지 연결되어 있지만 sampling API는 revision pin 전이라 fallback marker를 반환한다.
또한 Gemini Interpreter는 아직 Express `/api/rpg/action`을 사용한다. 완전 독립 모바일 실행은 4차에서 native Gemini transport를 붙인 뒤 완성된다.
