#import "FantasyacLlamaBridge.h"
#include <atomic>
#include <string>
#include <vector>
#include <algorithm>
#include <climits>
#include <cstdint>
#include <dispatch/dispatch.h>

#if __has_include(<llama/llama.h>)
#include <llama/llama.h>
#define FANTASYAC_HAS_LLAMA 1
#elif __has_include("llama.h")
#include "llama.h"
#define FANTASYAC_HAS_LLAMA 1
#else
#define FANTASYAC_HAS_LLAMA 0
#endif

static void FantasyacSetLlamaError(NSError **error, NSInteger code, NSString *message) {
    if (error) {
        *error = [NSError errorWithDomain:@"FantasyacLlama" code:code userInfo:@{NSLocalizedDescriptionKey: message}];
    }
}

@implementation FantasyacLlamaBridge {
#if FANTASYAC_HAS_LLAMA
    llama_model *_model;
#endif
    int _contextSize;
    std::atomic<bool> _cancelled;
}

- (nullable instancetype)initWithModelPath:(NSString *)path contextSize:(int)contextSize error:(NSError **)error {
    self = [super init];
    if (!self) return nil;
    _contextSize = MAX(1024, contextSize);
    _cancelled.store(false);
#if FANTASYAC_HAS_LLAMA
    static dispatch_once_t once;
    dispatch_once(&once, ^{ llama_backend_init(); });

    llama_model_params mp = llama_model_default_params();
    mp.n_gpu_layers = 99;
    _model = llama_model_load_from_file(path.UTF8String, mp);
    if (!_model) {
        // Some devices / OS versions can reject Metal offload while the GGUF itself is valid.
        // Retry once with CPU-only layers before declaring the model unusable.
        mp = llama_model_default_params();
        mp.n_gpu_layers = 0;
        _model = llama_model_load_from_file(path.UTF8String, mp);
    }
    if (!_model) {
        FantasyacSetLlamaError(error, 100, @"GGUF model load failed (Metal and CPU fallback)");
        return nil;
    }
    // The bundled narrator path supports decoder-only text models (Qwen-family GGUF).
    // Reject encoder / non-decoder models early instead of entering an invalid decode path.
    if (llama_model_has_encoder(_model) || !llama_model_has_decoder(_model)) {
        llama_model_free(_model);
        _model = nullptr;
        FantasyacSetLlamaError(error, 110, @"Unsupported GGUF architecture: decoder-only text model required");
        return nil;
    }
    return self;
#else
    FantasyacSetLlamaError(error, 101, @"llama.xcframework is not linked");
    return nil;
#endif
}

- (nullable NSString *)generateRequestJSON:(NSString *)requestJSON maxTokens:(int)maxTokens temperature:(float)temperature topP:(float)topP error:(NSError **)error {
#if !FANTASYAC_HAS_LLAMA
    FantasyacSetLlamaError(error, 101, @"llama.xcframework is not linked");
    return nil;
#else
    _cancelled.store(false);
    llama_context_params cp = llama_context_default_params();
    cp.n_ctx = (uint32_t)_contextSize;
    // The old 1024-token batch cap made valid 2K-4K prompts fail during the first decode.
    cp.n_batch = (uint32_t)_contextSize;
    llama_context *ctx = llama_init_from_model(_model, cp);
    if (!ctx) {
        FantasyacSetLlamaError(error, 102, @"llama context initialization failed");
        return nil;
    }
    const llama_vocab *vocab = llama_model_get_vocab(_model);
    if (!vocab) {
        FantasyacSetLlamaError(error, 102, @"llama vocabulary unavailable");
        llama_free(ctx);
        return nil;
    }

    std::string system = "당신은 『판타지악』 전용 한국어 Narrator입니다. /no_think\nlockedFacts를 변경하지 말고 게임 본문 로그만 출력하세요. JSON/코드/분석 과정은 출력하지 마세요.";
    std::string user = requestJSON.UTF8String ?: "{}";
    llama_chat_message msgs[2] = {{"system", system.c_str()}, {"user", user.c_str()}};
    const char *tmpl = llama_model_chat_template(_model, nullptr);
    std::string prompt;
    if (tmpl != nullptr) {
        int32_t needed = llama_chat_apply_template(tmpl, msgs, 2, true, nullptr, 0);
        if (needed > 0 && needed < INT32_MAX - 8) {
            std::vector<char> formatted(static_cast<size_t>(needed) + 8);
            int32_t n = llama_chat_apply_template(
                tmpl,
                msgs,
                2,
                true,
                formatted.data(),
                static_cast<int32_t>(formatted.size())
            );
            if (n > 0 && static_cast<size_t>(n) <= formatted.size()) {
                prompt.assign(formatted.data(), static_cast<size_t>(n));
            } else if (n > static_cast<int32_t>(formatted.size()) && n < INT32_MAX - 8) {
                // Some template implementations report a larger required buffer on the
                // second pass. Retry once rather than reading beyond the vector.
                formatted.resize(static_cast<size_t>(n) + 8);
                n = llama_chat_apply_template(
                    tmpl,
                    msgs,
                    2,
                    true,
                    formatted.data(),
                    static_cast<int32_t>(formatted.size())
                );
                if (n > 0 && static_cast<size_t>(n) <= formatted.size()) {
                    prompt.assign(formatted.data(), static_cast<size_t>(n));
                }
            }
        }
    }
    if (prompt.empty()) prompt = system + "\n\n" + user;

    if (prompt.size() > static_cast<size_t>(INT32_MAX)) {
        FantasyacSetLlamaError(error, 103, @"Prompt is too large to tokenize");
        llama_free(ctx);
        return nil;
    }
    const int32_t promptLength = static_cast<int32_t>(prompt.size());
    const int32_t tokenProbe = llama_tokenize(vocab, prompt.c_str(), promptLength, nullptr, 0, true, true);
    if (tokenProbe == INT32_MIN) {
        FantasyacSetLlamaError(error, 104, @"Prompt tokenization overflow");
        llama_free(ctx);
        return nil;
    }
    const int32_t nt = tokenProbe < 0 ? -tokenProbe : tokenProbe;
    if (nt <= 0 || nt >= _contextSize - 16) {
        FantasyacSetLlamaError(error, 103, @"Prompt is empty or exceeds the local context window");
        llama_free(ctx);
        return nil;
    }
    std::vector<llama_token> tokens(static_cast<size_t>(nt));
    if (llama_tokenize(vocab, prompt.c_str(), promptLength, tokens.data(), nt, true, true) < 0) {
        FantasyacSetLlamaError(error, 104, @"Prompt tokenization failed");
        llama_free(ctx);
        return nil;
    }

    float safeTopP = std::max(0.05f, std::min(1.0f, topP));
    const float safeTemperature = std::max(0.01f, temperature);
    llama_sampler *smpl = llama_sampler_chain_init(llama_sampler_chain_default_params());
    if (!smpl) {
        FantasyacSetLlamaError(error, 106, @"Sampler initialization failed");
        llama_free(ctx);
        return nil;
    }
    llama_sampler_chain_add(smpl, llama_sampler_init_top_p(safeTopP, 1));
    llama_sampler_chain_add(smpl, llama_sampler_init_temp(safeTemperature));
    llama_sampler_chain_add(smpl, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));

    llama_batch batch = llama_batch_get_one(tokens.data(), (int32_t)tokens.size());
    llama_token nextToken = 0; // Must outlive every batch that points at it.
    std::string out;
    const int limit = MAX(32, maxTokens);
    for (int i = 0; i < limit && !_cancelled.load(); ++i) {
        const int used = llama_memory_seq_pos_max(llama_get_memory(ctx), 0) + 1;
        if (used + batch.n_tokens >= (int)llama_n_ctx(ctx)) {
            if (out.empty()) FantasyacSetLlamaError(error, 107, @"Local context window exhausted before generation");
            break;
        }
        const int decodeStatus = llama_decode(ctx, batch);
        if (decodeStatus != 0) {
            FantasyacSetLlamaError(error, 108, [NSString stringWithFormat:@"llama_decode failed (%d)", decodeStatus]);
            llama_sampler_free(smpl);
            llama_free(ctx);
            return nil;
        }
        const llama_token tok = llama_sampler_sample(smpl, ctx, -1);
        if (llama_vocab_is_eog(vocab, tok)) break;

        char stackBuffer[512];
        int n = llama_token_to_piece(vocab, tok, stackBuffer, static_cast<int32_t>(sizeof(stackBuffer)), 0, true);
        if (n > 0) {
            out.append(stackBuffer, (size_t)n);
        } else if (n < 0 && n != INT32_MIN) {
            const int required = -n;
            std::vector<char> dynamicBuffer((size_t)required);
            n = llama_token_to_piece(vocab, tok, dynamicBuffer.data(), required, 0, true);
            if (n > 0) out.append(dynamicBuffer.data(), (size_t)n);
        }

        nextToken = tok;
        batch = llama_batch_get_one(&nextToken, 1);
    }

    llama_sampler_free(smpl);
    llama_free(ctx);
    if (_cancelled.load() && out.empty()) {
        FantasyacSetLlamaError(error, 109, @"Local narration cancelled");
        return nil;
    }
    NSString *result = [[NSString alloc] initWithBytes:out.data() length:out.size() encoding:NSUTF8StringEncoding];
    if (!result) {
        FantasyacSetLlamaError(error, 105, @"Generated text was not valid UTF-8");
        return nil;
    }
    return result;
#endif
}

- (void)cancel { _cancelled.store(true); }

- (void)dealloc {
#if FANTASYAC_HAS_LLAMA
    if (_model) llama_model_free(_model);
#endif
}
@end
