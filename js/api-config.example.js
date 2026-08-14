"use strict";

/* =========================================================
   ChatGVTL — API Configuration
   =========================================================

   DEVELOPMENT ONLY
   API keys placed in frontend JavaScript can be seen by users.
   For production, move the key to the server/RenAI Router.

   QUICK START:
   1. Put your API key in API_KEY.
   2. Put your provider's chat-completions URL in ENDPOINT.
   3. Put the model name in MODEL.
   4. Save this file.

   The router accepts OpenAI-compatible JSON responses such as:
   { choices: [{ message: { content: "..." } }] }
   ========================================================= */

const ChatGVTLAPIConfig = {

    ENABLED: true,

    API_KEY: "PASTE_YOUR_API_KEY_HERE",

    ENDPOINT: "https://YOUR-API-ENDPOINT/v1/chat/completions",

    MODEL: "YOUR_MODEL_NAME",

    SYSTEM_PROMPT:
        "You are ChatGVTL, an AI assistant powered by RenAI GVTL.",

    TEMPERATURE: 0.7,

    MAX_TOKENS: 2048,

    EXTRA_HEADERS: {
        // Example:
        // "X-Custom-Header": "value"
    }
};

window.ChatGVTLAPIConfig = ChatGVTLAPIConfig;
