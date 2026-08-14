"use strict";

/**
 * =========================================================
 * ChatGVTL Storage
 * =========================================================
 *
 * Centralized localStorage manager.
 *
 * Semua penyimpanan frontend ChatGVTL diarahkan melalui
 * module ini supaya nantinya mudah dipindahkan ke backend
 * database tanpa membongkar seluruh aplikasi.
 * =========================================================
 */

const ChatGVTLStorage = (() => {

    const PREFIX = "chatgvtl_";


    const KEYS = {
        SETTINGS: "settings",
        USER: "user",
        CHAT_HISTORY: "chat_history",
        ACTIVE_CHAT: "active_chat",
        CONVERSATIONS: "conversations",
        THEME: "theme"
    };


    /**
     * ---------------------------------------------------------
     * Build storage key
     * ---------------------------------------------------------
     */

    function getKey(key) {

        return `${PREFIX}${key}`;

    }


    /**
     * ---------------------------------------------------------
     * Check localStorage availability
     * ---------------------------------------------------------
     */

    function isAvailable() {

        try {

            const testKey =
                `${PREFIX}storage_test`;

            localStorage.setItem(
                testKey,
                "ok"
            );

            localStorage.removeItem(
                testKey
            );

            return true;

        } catch (error) {

            console.warn(
                "[ChatGVTL Storage] localStorage unavailable.",
                error
            );

            return false;

        }

    }


    /**
     * ---------------------------------------------------------
     * Save data
     * ---------------------------------------------------------
     */

    function set(key, value) {

        if (!isAvailable()) {
            return false;
        }


        try {

            localStorage.setItem(
                getKey(key),
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "[ChatGVTL Storage] Failed to save:",
                key,
                error
            );

            return false;

        }

    }


    /**
     * ---------------------------------------------------------
     * Read data
     * ---------------------------------------------------------
     */

    function get(key, fallback = null) {

        if (!isAvailable()) {
            return fallback;
        }


        try {

            const value =
                localStorage.getItem(
                    getKey(key)
                );


            if (value === null) {
                return fallback;
            }


            return JSON.parse(value);

        } catch (error) {

            console.error(
                "[ChatGVTL Storage] Failed to read:",
                key,
                error
            );

            return fallback;

        }

    }


    /**
     * ---------------------------------------------------------
     * Remove data
     * ---------------------------------------------------------
     */

    function remove(key) {

        if (!isAvailable()) {
            return false;
        }


        try {

            localStorage.removeItem(
                getKey(key)
            );

            return true;

        } catch (error) {

            console.error(
                "[ChatGVTL Storage] Failed to remove:",
                key,
                error
            );

            return false;

        }

    }


    /**
     * ---------------------------------------------------------
     * Clear all ChatGVTL data
     * ---------------------------------------------------------
     */

    function clear() {

        if (!isAvailable()) {
            return false;
        }


        try {

            const keysToRemove = [];


            for (
                let index = 0;
                index < localStorage.length;
                index++
            ) {

                const key =
                    localStorage.key(index);


                if (
                    key &&
                    key.startsWith(PREFIX)
                ) {

                    keysToRemove.push(key);

                }

            }


            keysToRemove.forEach(key => {

                localStorage.removeItem(key);

            });


            return true;

        } catch (error) {

            console.error(
                "[ChatGVTL Storage] Failed to clear storage:",
                error
            );

            return false;

        }

    }


    /**
     * ---------------------------------------------------------
     * Check whether key exists
     * ---------------------------------------------------------
     */

    function has(key) {

        if (!isAvailable()) {
            return false;
        }


        return (
            localStorage.getItem(
                getKey(key)
            ) !== null
        );

    }


    /**
     * ---------------------------------------------------------
     * Get all ChatGVTL storage data
     * ---------------------------------------------------------
     */

    function getAll() {

        const result = {};


        if (!isAvailable()) {
            return result;
        }


        Object.values(KEYS).forEach(key => {

            const value =
                get(key, null);


            if (value !== null) {

                result[key] = value;

            }

        });


        return result;

    }


    /**
     * ---------------------------------------------------------
     * Settings helpers
     * ---------------------------------------------------------
     */

    function getSettings() {

        return get(
            KEYS.SETTINGS,
            {}
        );

    }


    function saveSettings(settings) {

        return set(
            KEYS.SETTINGS,
            settings
        );

    }


    function resetSettings() {

        return remove(
            KEYS.SETTINGS
        );

    }


    /**
     * ---------------------------------------------------------
     * User helpers
     * ---------------------------------------------------------
     */

    function getUser() {

        return get(
            KEYS.USER,
            null
        );

    }


    function saveUser(user) {

        return set(
            KEYS.USER,
            user
        );

    }


    function removeUser() {

        return remove(
            KEYS.USER
        );

    }


    /**
     * ---------------------------------------------------------
     * Chat history helpers
     * ---------------------------------------------------------
     */

    function getChatHistory() {

        return get(
            KEYS.CHAT_HISTORY,
            []
        );

    }


    function saveChatHistory(history) {

        return set(
            KEYS.CHAT_HISTORY,
            history
        );

    }


    function clearChatHistory() {

        return remove(
            KEYS.CHAT_HISTORY
        );

    }


    /**
     * ---------------------------------------------------------
     * Active chat helpers
     * ---------------------------------------------------------
     */

    function getActiveChat() {

        return get(
            KEYS.ACTIVE_CHAT,
            null
        );

    }


    function setActiveChat(chatId) {

        return set(
            KEYS.ACTIVE_CHAT,
            chatId
        );

    }


    function clearActiveChat() {

        return remove(
            KEYS.ACTIVE_CHAT
        );

    }


    /**
     * ---------------------------------------------------------
     * Public API
     * ---------------------------------------------------------
     */

    return {

        PREFIX,

        KEYS,

        isAvailable,

        set,

        get,

        remove,

        clear,

        has,

        getAll,

        getSettings,

        saveSettings,

        resetSettings,

        getUser,

        saveUser,

        removeUser,

        getChatHistory,

        saveChatHistory,

        clearChatHistory,

        getActiveChat,

        setActiveChat,

        clearActiveChat

    };

})();