/* =========================================================
   ChatGVTL — Configuration
   ========================================================= */

"use strict";

const api = window.ChatGVTLAPIConfig || {};

const ChatGVTLConfig = {

    app: {
        name: "ChatGVTL",
        version: "0.2.0",
        environment: "development"
    },

    brand: {
        name: "ChatGVTL",
        company: "RenAI GVTL",
        poweredBy: "RenAI GVTL"
    },

    router: {
        name: "RenAI Router",
        status: api.ENABLED ? "ready" : "offline",
        defaultModel: api.MODEL || "RenAI Auto"
    },

    chat: {
        maxInputLength: 12000,
        welcomeMessage: "Welcome to ChatGVTL",
        placeholder: "Ask ChatGVTL anything..."
    },

    ui: {
        sidebar: {
            mobileBreakpoint: 720
        },
        composer: {
            minHeight: 42,
            maxHeight: 180
        }
    },

    storage: {
        chatHistoryKey: "chatgvtl_chat_history",
        settingsKey: "chatgvtl_settings",
        activeChatKey: "chatgvtl_active_chat"
    },

    api: {
        enabled: Boolean(api.ENABLED),
        baseURL: api.ENDPOINT || "",
        apiKey: api.API_KEY || "",
        model: api.MODEL || "RenAI Auto",
        systemPrompt: api.SYSTEM_PROMPT || "",
        temperature: api.TEMPERATURE ?? 0.7,
        maxTokens: api.MAX_TOKENS ?? 2048,
        extraHeaders: api.EXTRA_HEADERS || {},
        endpoints: {
            chat: "",
            models: "",
            health: ""
        }
    }
};

window.ChatGVTLConfig = ChatGVTLConfig;
