"use strict";

/**
 * =========================================================
 * ChatGVTL Chat Engine
 * =========================================================
 *
 * Mengatur alur percakapan:
 *
 * User
 *  ↓
 * Message Manager
 *  ↓
 * State Manager
 *  ↓
 * Event Manager
 *  ↓
 * AI / RenAI Router
 *
 * Untuk sekarang engine ini belum memanggil backend AI.
 * Kita siapkan fondasinya terlebih dahulu.
 * =========================================================
 */

const ChatGVTLChat = (() => {

    /* =====================================================
       INTERNAL STATE
       ===================================================== */

    let initialized = false;


    /* =====================================================
       DEPENDENCY CHECK
       ===================================================== */

    function dependenciesReady() {

        const required = [

            "ChatGVTLState",

            "ChatGVTLEvents",

            "ChatGVTLMessages"

        ];


        const missing =
            required.filter(
                name =>
                    typeof window[name] ===
                    "undefined"
            );


        if (missing.length > 0) {

            console.warn(
                "[ChatGVTL Chat] Missing dependencies:",
                missing
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       CREATE CHAT ID
       ===================================================== */

    function generateChatId() {

        return ChatGVTLMessages.generateId(
            "chat"
        );

    }


    /* =====================================================
       CREATE CONVERSATION
       ===================================================== */

    function createConversation(
        title = "New chat"
    ) {

        const conversation = {

            id:
                generateChatId(),

            title:
                title || "New chat",

            messages:
                [],

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };


        ChatGVTLState.addConversation(
            conversation
        );


        ChatGVTLState.setActiveChat(
            conversation.id
        );


        ChatGVTLState.clearMessages();


        ChatGVTLEvents.emit(
            "chat:created",
            conversation
        );


        ChatGVTLEvents.emit(
            "chat:selected",
            conversation.id
        );


        saveActiveChat();


        return conversation;

    }


    /* =====================================================
       GET ACTIVE CHAT
       ===================================================== */

    function getActiveConversation() {

        const activeChatId =
            ChatGVTLState.getActiveChat();


        if (!activeChatId) {

            return null;

        }


        const conversations =
            ChatGVTLState.get(
                "conversations"
            );


        if (
            !Array.isArray(conversations)
        ) {

            return null;

        }


        return (
            conversations.find(
                conversation =>
                    conversation.id ===
                    activeChatId
            ) || null
        );

    }


    /* =====================================================
       SELECT CHAT
       ===================================================== */

    function selectChat(chatId) {

        if (!chatId) {

            return false;

        }


        const conversations =
            ChatGVTLState.get(
                "conversations"
            );


        const conversation =
            conversations.find(
                item =>
                    item.id ===
                    chatId
            );


        if (!conversation) {

            return false;

        }


        ChatGVTLState.setActiveChat(
            chatId
        );


        ChatGVTLState.setMessages(
            conversation.messages || []
        );


        ChatGVTLEvents.emit(
            "chat:selected",
            conversation
        );


        saveActiveChat();


        return true;

    }


    /* =====================================================
       DELETE CHAT
       ===================================================== */

    function deleteChat(chatId) {

        if (!chatId) {

            return false;

        }


        ChatGVTLState.removeConversation(
            chatId
        );


        const activeChat =
            ChatGVTLState.getActiveChat();


        if (
            activeChat === chatId
        ) {

            ChatGVTLState.setActiveChat(
                null
            );

            ChatGVTLState.clearMessages();

        }


        ChatGVTLEvents.emit(
            "chat:deleted",
            chatId
        );


        saveConversations();


        return true;

    }


    /* =====================================================
       ADD USER MESSAGE
       ===================================================== */

    function addUserMessage(
        content,
        options = {}
    ) {

        if (
            !content ||
            !String(content).trim()
        ) {

            return null;

        }


        let conversation =
            getActiveConversation();


        /*
         * Jika belum ada chat,
         * buat otomatis.
         */

        if (!conversation) {

            conversation =
                createConversation(
                    createTitle(content)
                );

        }


        const message =
            ChatGVTLMessages.user(
                String(content).trim(),
                options
            );


        ChatGVTLState.addMessage(
            message
        );


        updateConversationMessages();


        ChatGVTLEvents.emit(
            "chat:message",
            message
        );


        ChatGVTLEvents.emit(
            "chat:user-message",
            message
        );


        saveConversations();


        return message;

    }


    /* =====================================================
       CREATE ASSISTANT MESSAGE
       ===================================================== */

    function createAssistantMessage(
        options = {}
    ) {

        const message =
            ChatGVTLMessages.generating(
                options
            );


        ChatGVTLState.addMessage(
            message
        );


        updateConversationMessages();


        ChatGVTLEvents.emit(
            "chat:message",
            message
        );


        ChatGVTLEvents.emit(
            "generation:start",
            message
        );


        return message;

    }


    /* =====================================================
       UPDATE ASSISTANT MESSAGE
       ===================================================== */

    function updateAssistantMessage(
        messageId,
        content
    ) {

        const messages =
            ChatGVTLState.get(
                "messages"
            );


        const updated =
            ChatGVTLMessages.updateById(
                messages,
                messageId,
                {
                    content:
                        content
                }
            );


        ChatGVTLState.setMessages(
            updated
        );


        updateConversationMessages();


        const message =
            ChatGVTLMessages.find(
                updated,
                messageId
            );


        ChatGVTLEvents.emit(
            "chat:message:updated",
            message
        );


        return message;

    }


    /* =====================================================
       COMPLETE ASSISTANT MESSAGE
       ===================================================== */

    function completeAssistantMessage(
        messageId,
        content
    ) {

        const messages =
            ChatGVTLState.get(
                "messages"
            );


        const target =
            ChatGVTLMessages.find(
                messages,
                messageId
            );


        if (!target) {

            return null;

        }


        const completed =
            ChatGVTLMessages.complete(
                target,
                content
            );


        const updated =
            ChatGVTLMessages.updateById(
                messages,
                messageId,
                completed
            );


        ChatGVTLState.setMessages(
            updated
        );


        updateConversationMessages();


        ChatGVTLEvents.emit(
            "chat:message:updated",
            completed
        );


        ChatGVTLEvents.emit(
            "generation:complete",
            completed
        );


        saveConversations();


        return completed;

    }


    /* =====================================================
       ERROR ASSISTANT MESSAGE
       ===================================================== */

    function failAssistantMessage(
        messageId,
        errorMessage
    ) {

        const messages =
            ChatGVTLState.get(
                "messages"
            );


        const target =
            ChatGVTLMessages.find(
                messages,
                messageId
            );


        if (!target) {

            return null;

        }


        const failed =
            ChatGVTLMessages.error(
                target,
                errorMessage ||
                    "Something went wrong."
            );


        const updated =
            ChatGVTLMessages.updateById(
                messages,
                messageId,
                failed
            );


        ChatGVTLState.setMessages(
            updated
        );


        updateConversationMessages();


        ChatGVTLEvents.emit(
            "chat:message:updated",
            failed
        );


        ChatGVTLEvents.emit(
            "generation:error",
            failed
        );


        saveConversations();


        return failed;

    }


    /* =====================================================
       CANCEL ASSISTANT MESSAGE
       ===================================================== */

    function cancelAssistantMessage(
        messageId
    ) {

        const messages =
            ChatGVTLState.get(
                "messages"
            );


        const target =
            ChatGVTLMessages.find(
                messages,
                messageId
            );


        if (!target) {

            return null;

        }


        const cancelled =
            ChatGVTLMessages.cancel(
                target
            );


        const updated =
            ChatGVTLMessages.updateById(
                messages,
                messageId,
                cancelled
            );


        ChatGVTLState.setMessages(
            updated
        );


        updateConversationMessages();


        ChatGVTLEvents.emit(
            "chat:message:updated",
            cancelled
        );


        ChatGVTLEvents.emit(
            "generation:complete",
            cancelled
        );


        saveConversations();


        return cancelled;

    }


    /* =====================================================
       UPDATE ACTIVE CONVERSATION
       ===================================================== */

    function updateConversationMessages() {

        const activeChatId =
            ChatGVTLState.getActiveChat();


        if (!activeChatId) {

            return;

        }


        const messages =
            ChatGVTLState.get(
                "messages"
            );


        const conversations =
            ChatGVTLState.get(
                "conversations"
            );


        const updated =
            conversations.map(
                conversation => {

                    if (
                        conversation.id !==
                        activeChatId
                    ) {

                        return conversation;

                    }


                    return {

                        ...conversation,

                        messages:
                            ChatGVTLMessages.serialize(
                                messages
                            ),

                        updatedAt:
                            new Date()
                                .toISOString()

                    };

                }
            );


        ChatGVTLState.setConversations(
            updated
        );

    }


    /* =====================================================
       SAVE CONVERSATIONS
       ===================================================== */

    function saveConversations() {

        if (
            typeof ChatGVTLStorage ===
            "undefined"
        ) {

            return false;

        }


        const conversations =
            ChatGVTLState.get(
                "conversations"
            );


        return ChatGVTLStorage.set(
            ChatGVTLStorage.KEYS.CONVERSATIONS,
            conversations
        );

    }


    /* =====================================================
       SAVE ACTIVE CHAT
       ===================================================== */

    function saveActiveChat() {

        if (
            typeof ChatGVTLStorage ===
            "undefined"
        ) {

            return false;

        }


        const chatId =
            ChatGVTLState.getActiveChat();


        if (!chatId) {

            return ChatGVTLStorage.clearActiveChat();

        }


        return ChatGVTLStorage.setActiveChat(
            chatId
        );

    }


    /* =====================================================
       LOAD CONVERSATIONS
       ===================================================== */

    function loadConversations() {

        if (
            typeof ChatGVTLStorage ===
            "undefined"
        ) {

            return [];

        }


        const conversations =
            ChatGVTLStorage.get(
                ChatGVTLStorage.KEYS.CONVERSATIONS,
                []
            );


        if (
            !Array.isArray(conversations)
        ) {

            return [];

        }


        ChatGVTLState.setConversations(
            conversations
        );


        return conversations;

    }


    /* =====================================================
       LOAD ACTIVE CHAT
       ===================================================== */

    function loadActiveChat() {

        if (
            typeof ChatGVTLStorage ===
            "undefined"
        ) {

            return null;

        }


        const activeChatId =
            ChatGVTLStorage.getActiveChat();


        if (!activeChatId) {

            return null;

        }


        const selected =
            selectChat(
                activeChatId
            );


        if (!selected) {

            return null;

        }


        return activeChatId;

    }


    /* =====================================================
       CLEAR CURRENT CHAT
       ===================================================== */

    function clearCurrentChat() {

        ChatGVTLState.clearMessages();


        updateConversationMessages();


        ChatGVTLEvents.emit(
            "chat:cleared"
        );


        saveConversations();

    }


    /* =====================================================
       CREATE CHAT TITLE
       ===================================================== */

    function createTitle(
        content
    ) {

        const text =
            String(content)
                .trim()
                .replace(
                    /\s+/g,
                    " "
                );


        if (!text) {

            return "New chat";

        }


        const maxLength = 40;


        if (
            text.length <=
            maxLength
        ) {

            return text;

        }


        return (
            text.substring(
                0,
                maxLength
            ) + "..."
        );

    }


    /* =====================================================
       GET MESSAGES
       ===================================================== */

    function getMessages() {

        return ChatGVTLState.get(
            "messages"
        );

    }


    /* =====================================================
       GET CONVERSATIONS
       ===================================================== */

    function getConversations() {

        return ChatGVTLState.get(
            "conversations"
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function initialize() {

        if (initialized) {

            return true;

        }


        if (
            !dependenciesReady()
        ) {

            return false;

        }


        loadConversations();

        loadActiveChat();


        initialized = true;


        ChatGVTLEvents.emit(
            "chat:ready"
        );


        return true;

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        initialize,

        createConversation,

        getActiveConversation,

        selectChat,

        deleteChat,

        addUserMessage,

        createAssistantMessage,

        updateAssistantMessage,

        completeAssistantMessage,

        failAssistantMessage,

        cancelAssistantMessage,

        clearCurrentChat,

        getMessages,

        getConversations,

        saveConversations,

        loadConversations,

        loadActiveChat

    };

})();