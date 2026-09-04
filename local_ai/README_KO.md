# 판타지악 Local Narrator

현재 1차 통합본은 PC에서 `llama.cpp`의 OpenAI 호환 localhost 서버를 사용합니다.
Android는 동일한 Narrator 계약을 유지한 채 다음 단계에서 네이티브 런타임을 붙입니다.

## Windows 빠른 시작

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./local_ai/scripts/windows_install_llama.ps1
./local_ai/scripts/windows_start.ps1 desktop-quality
```

판타지악 서버 `.env` 기본값은 `NARRATOR_PROVIDER=AUTO`입니다. localhost 모델이 켜져 있으면 로컬 Narrator를 사용하고, 꺼져 있으면 Gemini Narrator로 fallback 합니다.

## Galaxy A17

`galaxy-a17-safe` 프로필은 SM-A175N 6GB RAM을 기준으로 Qwen3 1.7B Q4_K_M / 컨텍스트 3072로 보수적으로 설정했습니다. Android 네이티브 앱 연결 전에는 PC용 스크립트로 실행되지 않습니다.
