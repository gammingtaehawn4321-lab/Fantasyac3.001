# 판타지악 Native Stage 4

모바일 앱은 더 이상 Fantasyac Express 서버가 필수가 아니다.

## Android / iPad 공통 실행 경로
1. 제목 화면에서 Gemini API Key를 1회 저장
2. 플레이어 입력 -> Native Gemini Interpreter (`gemini-3.6-flash`)
3. React GameEngine이 수치/상태를 확정
4. 앱 내부 llama.cpp Local Narrator가 최종 로그 생성
5. 로컬 모델이 없거나 로드 실패 시, 저장된 Gemini 키로 Native Gemini Narrator fallback

API 키는 React/localStorage/IndexedDB에 저장하지 않는다.
- Android: Android Keystore 기반 AES-GCM 암호화
- iOS/iPadOS: Keychain (`AfterFirstUnlockThisDeviceOnly`)

외부 URL은 시스템 브라우저에서 열어 JS Native Bridge가 외부 페이지에 노출되지 않도록 제한한다.
