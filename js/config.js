/* =========================================================
   ChatGVTL — Configuration
   ========================================================= */

"use strict";


/* =========================================================
   APPLICATION CONFIG
   ========================================================= */

const ChatGVTLConfig = {

    app: {
        name: "ChatGVTL",
        version: "0.1.0",
        environment: "development"
    },


    brand: {
        name: "ChatGVTL",
        company: "RenAI GVTL",
        poweredBy: "RenAI GVTL"
    },


    router: {
        name: "RenAI Router",
        status: "online",
        defaultModel: "RenAI Auto"
    },


    chat: {
        maxInputLength: 12000,

        welcomeMessage:
            "Welcome to ChatGVTL",

        placeholder:
            "Ask ChatGVTL anything..."
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

        /*
         * Untuk sekarang API belum kita aktifkan.
         * Nanti bagian ini akan digunakan ketika
         * RenAI Router / backend sudah siap.
         */

        enabled: false,

        baseURL: "",

        endpoints: {
            chat: "/api/chat",
            models: "/api/models",
            health: "/api/health"
        }

    }

};


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ChatGVTLConfig = ChatGVTLConfig;