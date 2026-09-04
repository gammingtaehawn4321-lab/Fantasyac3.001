#include <jni.h>
#include <atomic>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>
#include <algorithm>
#include <climits>

#include "llama.h"

namespace {
struct Session {
    llama_model * model = nullptr;
    std::atomic<bool> cancelled{false};
    std::mutex operation_mutex;
    int context_size = 3072;
    int threads = 4;
};
std::mutex g_mutex;
std::unordered_map<jlong, Session*> g_sessions;
std::atomic<jlong> g_next{1};
std::once_flag g_backend_once;

std::string jstr(JNIEnv *env, jstring value) {
    if (!value) return {};
    const char *chars = env->GetStringUTFChars(value, nullptr);
    std::string out = chars ? chars : "";
    if (chars) env->ReleaseStringUTFChars(value, chars);
    return out;
}

std::string format_prompt(llama_model * model, const std::string & request_json) {
    const std::string system =
        "당신은 『판타지악』 전용 한국어 Narrator입니다. /no_think\n"
        "입력 JSON의 lockedFacts를 절대 변경하지 말고 referenceTexts와 participants를 참고해 자연스러운 게임 본문 로그만 출력하세요. "
        "JSON, 코드블록, 메타 발언, 분석 과정은 출력하지 마세요.";
    const std::string user = request_json;
    llama_chat_message msgs[2] = {
        {"system", system.c_str()},
        {"user", user.c_str()},
    };
    const char * tmpl = llama_model_chat_template(model, nullptr);
    int32_t needed = llama_chat_apply_template(tmpl, msgs, 2, true, nullptr, 0);
    if (needed <= 0) return system + "\n\n" + user;
    std::vector<char> buf(static_cast<size_t>(needed) + 8);
    int32_t written = llama_chat_apply_template(tmpl, msgs, 2, true, buf.data(), static_cast<int32_t>(buf.size()));
    if (written <= 0) return system + "\n\n" + user;
    return std::string(buf.data(), static_cast<size_t>(written));
}

std::string generate(Session * session, const std::string & request_json, int max_tokens, float temperature, float top_p) {
    if (!session || !session->model) return {};
    session->cancelled.store(false);
    const llama_vocab * vocab = llama_model_get_vocab(session->model);
    if (!vocab) return {};

    llama_context_params cp = llama_context_default_params();
    cp.n_ctx = static_cast<uint32_t>(session->context_size);
    cp.n_batch = static_cast<uint32_t>(std::min(session->context_size, 1024));
    cp.n_threads = static_cast<int32_t>(session->threads);
    cp.n_threads_batch = static_cast<int32_t>(session->threads);
    llama_context * ctx = llama_init_from_model(session->model, cp);
    if (!ctx) return {};

    llama_sampler * smpl = llama_sampler_chain_init(llama_sampler_chain_default_params());
    llama_sampler_chain_add(smpl, llama_sampler_init_top_p(std::clamp(top_p, 0.05f, 1.0f), 1));
    llama_sampler_chain_add(smpl, llama_sampler_init_temp(std::max(0.01f, temperature)));
    llama_sampler_chain_add(smpl, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));

    const std::string prompt = format_prompt(session->model, request_json);
    if (prompt.size() > static_cast<size_t>(INT32_MAX)) {
        llama_sampler_free(smpl); llama_free(ctx); return {};
    }
    const int32_t prompt_length = static_cast<int32_t>(prompt.size());
    const int32_t token_probe = llama_tokenize(vocab, prompt.c_str(), prompt_length, nullptr, 0, true, true);
    if (token_probe == INT32_MIN) {
        llama_sampler_free(smpl); llama_free(ctx); return {};
    }
    const int32_t token_count = token_probe < 0 ? -token_probe : token_probe;
    if (token_count <= 0 || token_count >= session->context_size - 16) {
        llama_sampler_free(smpl); llama_free(ctx); return {};
    }
    std::vector<llama_token> tokens(static_cast<size_t>(token_count));
    if (llama_tokenize(vocab, prompt.c_str(), prompt_length, tokens.data(), token_count, true, true) < 0) {
        llama_sampler_free(smpl); llama_free(ctx); return {};
    }

    llama_batch batch = llama_batch_get_one(tokens.data(), static_cast<int32_t>(tokens.size()));
    std::string response;
    for (int generated = 0; generated < max_tokens && !session->cancelled.load(); ++generated) {
        const int used = llama_memory_seq_pos_max(llama_get_memory(ctx), 0) + 1;
        if (used + batch.n_tokens >= static_cast<int>(llama_n_ctx(ctx))) break;
        if (llama_decode(ctx, batch) != 0) break;
        const llama_token tok = llama_sampler_sample(smpl, ctx, -1);
        if (llama_vocab_is_eog(vocab, tok)) break;
        char piece_buf[512];
        const int n = llama_token_to_piece(vocab, tok, piece_buf, sizeof(piece_buf), 0, true);
        if (n > 0) response.append(piece_buf, static_cast<size_t>(n));
        llama_token next = tok;
        batch = llama_batch_get_one(&next, 1);
    }

    llama_sampler_free(smpl);
    llama_free(ctx);
    return response;
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_fantasyac_game_LocalAIEngine_nativeRuntimeAvailable(JNIEnv *, jobject) { return JNI_TRUE; }

extern "C" JNIEXPORT jlong JNICALL
Java_com_fantasyac_game_LocalAIEngine_nativeLoadModel(JNIEnv *env, jobject, jstring path, jint ctx, jint threads) {
    std::call_once(g_backend_once, [] { llama_backend_init(); });
    llama_model_params params = llama_model_default_params();
    params.n_gpu_layers = 0;
    auto *model = llama_model_load_from_file(jstr(env, path).c_str(), params);
    if (!model) return 0;
    auto *session = new Session();
    session->model = model;
    session->context_size = std::max(1024, static_cast<int>(ctx));
    session->threads = std::clamp(static_cast<int>(threads), 1, 16);
    const jlong id = g_next.fetch_add(1);
    std::lock_guard<std::mutex> lock(g_mutex);
    g_sessions[id] = session;
    return id;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_fantasyac_game_LocalAIEngine_nativeGenerate(JNIEnv *env, jobject, jlong handle, jstring requestJson, jint maxTokens, jfloat temperature, jfloat topP) {
    Session *session = nullptr;
    std::unique_lock<std::mutex> operation_lock;
    {
        std::lock_guard<std::mutex> lock(g_mutex);
        auto it = g_sessions.find(handle);
        if (it != g_sessions.end()) {
            session = it->second;
            // Acquire the per-session operation lock while the global map lock still
            // guarantees that nativeFree cannot delete the Session underneath us.
            operation_lock = std::unique_lock<std::mutex>(session->operation_mutex);
        }
    }
    if (!session) return env->NewStringUTF("");
    const auto out = generate(session, jstr(env, requestJson), std::max(32, static_cast<int>(maxTokens)), temperature, topP);
    return env->NewStringUTF(out.c_str());
}

extern "C" JNIEXPORT void JNICALL
Java_com_fantasyac_game_LocalAIEngine_nativeCancel(JNIEnv *, jobject, jlong handle) {
    std::lock_guard<std::mutex> lock(g_mutex);
    auto it = g_sessions.find(handle);
    if (it != g_sessions.end()) it->second->cancelled.store(true);
}

extern "C" JNIEXPORT void JNICALL
Java_com_fantasyac_game_LocalAIEngine_nativeFree(JNIEnv *, jobject, jlong handle) {
    Session *session = nullptr;
    {
        std::lock_guard<std::mutex> lock(g_mutex);
        auto it = g_sessions.find(handle);
        if (it != g_sessions.end()) { session = it->second; g_sessions.erase(it); }
    }
    if (!session) return;
    // Wait for any in-flight generation to finish. nativeCancel does not take this
    // lock and can still flip the atomic cancellation flag immediately.
    std::lock_guard<std::mutex> operation_lock(session->operation_mutex);
    if (session->model) llama_model_free(session->model);
    delete session;
}
