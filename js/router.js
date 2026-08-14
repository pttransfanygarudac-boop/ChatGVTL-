/* =========================================================
   ChatGVTL — Frontend Router
   ========================================================= */

"use strict";


class ChatGVTLRouter {

    constructor(config) {

        this.config = config;

        this.currentModel =
            config.router.defaultModel;

        this.status =
            config.router.status;

    }


    /* =====================================================
       GET CURRENT MODEL
       ====================================================== */

    getModel() {
        return this.currentModel;
    }


    /* =====================================================
       SET MODEL
       ====================================================== */

    setModel(modelName) {

        if (!modelName) {
            return false;
        }

        this.currentModel = modelName;

        return true;
    }


    /* =====================================================
       GET ROUTER STATUS
       ====================================================== */

    getStatus() {
        return this.status;
    }


    /* =====================================================
       SET ROUTER STATUS
       ====================================================== */

    setStatus(status) {

        this.status = status;

        return this.status;
    }


    /* =====================================================
       ROUTE MESSAGE
       ====================================================== */

    async routeMessage(message, options = {}) {

        if (!message || !message.trim()) {
            throw new Error("Message cannot be empty.");
        }

        const payload = {

            message: message.trim(),

            model:
                options.model ||
                this.currentModel,

            conversationId:
                options.conversationId || null

        };


        /*
         * API belum aktif.
         *
         * Nanti request sebenarnya akan masuk
         * ke RenAI Router melalui endpoint ini.
         */

        if (this.config.api.enabled) {

            return this.request(
                this.config.api.endpoints.chat,
                payload
            );

        }


        /*
         * Development fallback.
         *
         * Ini hanya untuk testing frontend.
         */

        return this.developmentResponse(payload);
    }


    /* =====================================================
       API REQUEST
       ====================================================== */

    async request(endpoint, payload) {

        const response = await fetch(
            this.config.api.baseURL + endpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)
            }
        );


        if (!response.ok) {

            throw new Error(
                `Router request failed: ${response.status}`
            );

        }


        return response.json();
    }


    /* =====================================================
       DEVELOPMENT RESPONSE
       ====================================================== */

    async developmentResponse(payload) {

        await new Promise(resolve => {
            setTimeout(resolve, 700);
        });


        return {

            success: true,

            mode: "development",

            model: payload.model,

            message:
                "RenAI Router development mode aktif. " +
                "Backend AI belum terhubung.",

            timestamp:
                new Date().toISOString()

        };
    }

}


/* =========================================================
   CREATE GLOBAL ROUTER
   ========================================================= */

window.ChatGVTLRouter =
    new ChatGVTLRouter(
        window.ChatGVTLConfig
    );