"use strict";

/**
 * =========================================================
 * ChatGVTL State Manager
 * =========================================================
 *
 * Menyimpan state aplikasi selama ChatGVTL berjalan.
 *
 * Storage  = data yang ingin dipertahankan
 * State    = kondisi aplikasi saat ini
 *
 * =========================================================
 */

const ChatGVTLState = (() => {

    /* =====================================================
       DEFAULT STATE
       ===================================================== */

    const defaultState = {

        /* Application */

        initialized: false,

        /* User */

        user: null,

        isAuthenticated: false,


        /* Chat */

        activeChatId: null,

        messages: [],

        conversations: [],


        /* AI */

        selectedModel: "RenAI Auto",

        smartRouting: true,


        /* UI */

        sidebarOpen: true,

        settingsOpen: false,

        searchOpen: false,


        /* Composer */

        inputValue: "",

        isGenerating: false,


        /* Connection */

        routerStatus: "offline",

        serverStatus: "offline",

        connectionStatus: "offline"

    };


    /* =====================================================
       INTERNAL STATE
       ===================================================== */

    let state = {
        ...defaultState
    };


    /* =====================================================
       CLONE VALUE
       ===================================================== */

    function clone(value) {

        try {

            return JSON.parse(
                JSON.stringify(value)
            );

        } catch (error) {

            console.warn(
                "[ChatGVTL State] Clone failed:",
                error
            );

            return value;

        }

    }


    /* =====================================================
       GET ENTIRE STATE
       ===================================================== */

    function getState() {

        return clone(state);

    }


    /* =====================================================
       GET ONE VALUE
       ===================================================== */

    function get(key) {

        return state[key];

    }


    /* =====================================================
       SET ONE VALUE
       ===================================================== */

    function set(key, value) {

        if (
            !Object.prototype.hasOwnProperty.call(
                state,
                key
            )
        ) {

            console.warn(
                `[ChatGVTL State] Unknown state key: ${key}`
            );

            return false;

        }


        state[key] = value;

        return true;

    }


    /* =====================================================
       UPDATE MULTIPLE VALUES
       ===================================================== */

    function update(values = {}) {

        if (
            !values ||
            typeof values !== "object"
        ) {

            return false;

        }


        Object.keys(values).forEach(key => {

            if (
                Object.prototype.hasOwnProperty.call(
                    state,
                    key
                )
            ) {

                state[key] =
                    values[key];

            }

        });


        return true;

    }


    /* =====================================================
       RESET STATE
       ===================================================== */

    function reset() {

        state = {
            ...clone(defaultState)
        };


        return true;

    }


    /* =====================================================
       USER
       ===================================================== */

    function setUser(user) {

        state.user =
            user || null;

        state.isAuthenticated =
            Boolean(user);

    }


    function getUser() {

        return state.user;

    }


    function logout() {

        state.user = null;

        state.isAuthenticated =
            false;

    }


    /* =====================================================
       CHAT
       ===================================================== */

    function setActiveChat(chatId) {

        state.activeChatId =
            chatId || null;

    }


    function getActiveChat() {

        return state.activeChatId;

    }


    function setMessages(messages = []) {

        state.messages =
            Array.isArray(messages)
                ? messages
                : [];

    }


    function addMessage(message) {

        if (!message) {
            return false;
        }


        state.messages.push(
            message
        );


        return true;

    }


    function updateLastMessage(message) {

        if (
            state.messages.length === 0
        ) {

            return false;

        }


        state.messages[
            state.messages.length - 1
        ] = message;


        return true;

    }


    function clearMessages() {

        state.messages = [];

    }


    /* =====================================================
       CONVERSATIONS
       ===================================================== */

    function setConversations(
        conversations = []
    ) {

        state.conversations =
            Array.isArray(conversations)
                ? conversations
                : [];

    }


    function addConversation(
        conversation
    ) {

        if (!conversation) {
            return false;
        }


        state.conversations.push(
            conversation
        );


        return true;

    }


    function removeConversation(
        conversationId
    ) {

        state.conversations =
            state.conversations.filter(
                conversation =>
                    conversation.id !==
                    conversationId
            );

    }


    /* =====================================================
       AI MODEL
       ===================================================== */

    function setModel(model) {

        if (!model) {
            return false;
        }


        state.selectedModel =
            model;


        return true;

    }


    function getModel() {

        return state.selectedModel;

    }


    function setSmartRouting(enabled) {

        state.smartRouting =
            Boolean(enabled);

    }


    /* =====================================================
       UI STATE
       ===================================================== */

    function setSidebarOpen(open) {

        state.sidebarOpen =
            Boolean(open);

    }


    function toggleSidebar() {

        state.sidebarOpen =
            !state.sidebarOpen;


        return state.sidebarOpen;

    }


    function setSettingsOpen(open) {

        state.settingsOpen =
            Boolean(open);

    }


    function setSearchOpen(open) {

        state.searchOpen =
            Boolean(open);

    }


    /* =====================================================
       COMPOSER
       ===================================================== */

    function setInputValue(value) {

        state.inputValue =
            typeof value === "string"
                ? value
                : "";

    }


    function clearInput() {

        state.inputValue = "";

    }


    /* =====================================================
       GENERATION
       ===================================================== */

    function setGenerating(value) {

        state.isGenerating =
            Boolean(value);

    }


    /* =====================================================
       CONNECTION
       ===================================================== */

    function setRouterStatus(status) {

        state.routerStatus =
            status;

    }


    function setServerStatus(status) {

        state.serverStatus =
            status;

    }


    function setConnectionStatus(status) {

        state.connectionStatus =
            status;

    }


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function initialize() {

        if (
            typeof ChatGVTLStorage !==
            "undefined"
        ) {

            const savedUser =
                ChatGVTLStorage.getUser();


            if (savedUser) {

                setUser(
                    savedUser
                );

            }


            const savedSettings =
                ChatGVTLStorage.getSettings();


            if (
                savedSettings.defaultModel
            ) {

                setModel(
                    savedSettings.defaultModel
                );

            }


            if (
                typeof savedSettings.smartRouting
                === "boolean"
            ) {

                setSmartRouting(
                    savedSettings.smartRouting
                );

            }


            const savedActiveChat =
                ChatGVTLStorage.getActiveChat();


            if (savedActiveChat) {

                setActiveChat(
                    savedActiveChat
                );

            }

        }


        state.initialized =
            true;


        return true;

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        getState,

        get,

        set,

        update,

        reset,


        setUser,

        getUser,

        logout,


        setActiveChat,

        getActiveChat,

        setMessages,

        addMessage,

        updateLastMessage,

        clearMessages,


        setConversations,

        addConversation,

        removeConversation,


        setModel,

        getModel,

        setSmartRouting,


        setSidebarOpen,

        toggleSidebar,

        setSettingsOpen,

        setSearchOpen,


        setInputValue,

        clearInput,


        setGenerating,


        setRouterStatus,

        setServerStatus,

        setConnectionStatus,


        initialize

    };

})();