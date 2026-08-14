/* =========================================================
   ChatGVTL — RenAI Router
   ========================================================= */

"use strict";

class ChatGVTLRouter {

    constructor(config) {
        this.config = config;
        this.currentModel = config.router.defaultModel;
        this.status = config.router.status;
    }

    getModel() {
        return this.currentModel;
    }

    setModel(modelName) {
        if (!modelName) return false;
        this.currentModel = modelName;
        return true;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
        return this.status;
    }

    async routeMessage(message, options = {}) {
        if (!message || !String(message).trim()) {
            throw new Error("Message cannot be empty.");
        }

        const payload = {
            message: String(message).trim(),
            model: options.model || this.currentModel,
            conversationId: options.conversationId || null,
            systemPrompt: options.systemPrompt ?? this.config.api.systemPrompt,
            temperature: options.temperature ?? this.config.api.temperature,
            maxTokens: options.maxTokens ?? this.config.api.maxTokens,
            messages: Array.isArray(options.messages) ? options.messages : null
        };

        if (!this.config.api.enabled) {
            return this.developmentResponse(payload);
        }

        return this.request(payload);
    }

    async request(payload) {
        const endpoint = this.config.api.baseURL;
        const apiKey = this.config.api.apiKey;

        if (!endpoint || endpoint.includes("YOUR-API-ENDPOINT")) {
            throw new Error("API endpoint belum diisi di js/api-config.js");
        }

        if (!apiKey || apiKey === "PASTE_YOUR_API_KEY_HERE") {
            throw new Error("API key belum diisi di js/api-config.js");
        }

        const messages = payload.messages?.length
            ? payload.messages
            : [
                ...(payload.systemPrompt
                    ? [{ role: "system", content: payload.systemPrompt }]
                    : []),
                { role: "user", content: payload.message }
            ];

        const body = {
            model: payload.model,
            messages,
            temperature: payload.temperature,
            max_tokens: payload.maxTokens
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                ...this.config.api.extraHeaders
            },
            body: JSON.stringify(body)
        });

        const raw = await response.text();
        let data = null;

        try {
            data = raw ? JSON.parse(raw) : {};
        } catch {
            data = { raw };
        }

        if (!response.ok) {
            const providerMessage =
                data?.error?.message ||
                data?.message ||
                raw ||
                `HTTP ${response.status}`;

            throw new Error(`API request failed (${response.status}): ${providerMessage}`);
        }

        const message = this.extractText(data);

        if (!message) {
            throw new Error("API berhasil dipanggil, tetapi response tidak berisi teks assistant yang dikenali.");
        }

        this.setStatus("online");

        return {
            success: true,
            mode: "api",
            model: data?.model || payload.model,
            message,
            raw: data,
            timestamp: new Date().toISOString()
        };
    }

    extractText(data) {
        if (!data) return "";

        if (typeof data.output_text === "string") {
            return data.output_text;
        }

        if (typeof data.message === "string") {
            return data.message;
        }

        if (typeof data.response === "string") {
            return data.response;
        }

        const choice = data.choices?.[0];
        const content = choice?.message?.content ?? choice?.text;

        if (typeof content === "string") {
            return content;
        }

        if (Array.isArray(content)) {
            return content
                .map(part => typeof part === "string" ? part : (part?.text || ""))
                .join("")
                .trim();
        }

        if (Array.isArray(data.output)) {
            return data.output
                .flatMap(item => item?.content || [])
                .map(part => part?.text || "")
                .join("")
                .trim();
        }

        return "";
    }

    async developmentResponse(payload) {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            mode: "development",
            model: payload.model,
            message:
                "ChatGVTL masih dalam mode development. Isi API key, endpoint, dan model di js/api-config.js untuk menghubungkan AI asli.",
            timestamp: new Date().toISOString()
        };
    }
}

window.ChatGVTLRouter =
    new ChatGVTLRouter(window.ChatGVTLConfig);
