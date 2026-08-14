"use strict";

/**
 * =========================================================
 * ChatGVTL Chat History
 * =========================================================
 *
 * Mengelola riwayat percakapan ChatGVTL.
 *
 * Tanggung jawab:
 *
 * - Menyimpan conversations
 * - Memuat conversations
 * - Mencari conversation
 * - Menghapus conversation
 * - Menghapus seluruh history
 * - Menghitung jumlah conversation
 * - Membuat backup history
 *
 * =========================================================
 */

const ChatGVTLHistory = (() => {

    const STORAGE_KEY =
        "conversations";


    /* =====================================================
       DEPENDENCY CHECK
       ===================================================== */

    function storageReady() {

        return (
            typeof ChatGVTLStorage !==
            "undefined"
        );

    }


    function chatReady() {

        return (
            typeof ChatGVTLChat !==
            "undefined"
        );

    }


    /* =====================================================
       GET ALL HISTORY
       ===================================================== */

    function getAll() {

        if (!storageReady()) {

            console.warn(
                "[ChatGVTL History] Storage unavailable."
            );

            return [];

        }


        const conversations =
            ChatGVTLStorage.get(
                STORAGE_KEY,
                []
            );


        return Array.isArray(
            conversations
        )
            ? conversations
            : [];

    }


    /* =====================================================
       SAVE ALL HISTORY
       ===================================================== */

    function save(
        conversations = []
    ) {

        if (!storageReady()) {

            return false;

        }


        if (
            !Array.isArray(
                conversations
            )
        ) {

            return false;

        }


        return ChatGVTLStorage.set(
            STORAGE_KEY,
            conversations
        );

    }


    /* =====================================================
       FIND CHAT
       ===================================================== */

    function find(
        chatId
    ) {

        if (!chatId) {

            return null;

        }


        const history =
            getAll();


        return (
            history.find(
                conversation =>
                    conversation.id ===
                    chatId
            ) || null
        );

    }


    /* =====================================================
       SEARCH HISTORY
       ===================================================== */

    function search(
        query = ""
    ) {

        const text =
            String(query)
                .trim()
                .toLowerCase();


        if (!text) {

            return getAll();

        }


        const history =
            getAll();


        return history.filter(
            conversation => {

                const title =
                    String(
                        conversation.title ||
                        ""
                    ).toLowerCase();


                const messages =
                    Array.isArray(
                        conversation.messages
                    )
                        ? conversation.messages
                        : [];


                const messageMatch =
                    messages.some(
                        message => {

                            return String(
                                message.content ||
                                ""
                            )
                            .toLowerCase()
                            .includes(text);

                        }
                    );


                return (
                    title.includes(text) ||
                    messageMatch
                );

            }
        );

    }


    /* =====================================================
       ADD CONVERSATION
       ===================================================== */

    function add(
        conversation
    ) {

        if (!conversation) {

            return false;

        }


        const history =
            getAll();


        /*
         * Hindari duplicate ID.
         */

        const exists =
            history.some(
                item =>
                    item.id ===
                    conversation.id
            );


        if (exists) {

            return false;

        }


        history.push(
            conversation
        );


        return save(
            history
        );

    }


    /* =====================================================
       UPDATE CONVERSATION
       ===================================================== */

    function update(
        chatId,
        changes = {}
    ) {

        if (!chatId) {

            return false;

        }


        const history =
            getAll();


        let found = false;


        const updated =
            history.map(
                conversation => {

                    if (
                        conversation.id !==
                        chatId
                    ) {

                        return conversation;

                    }


                    found = true;


                    return {

                        ...conversation,

                        ...changes,

                        updatedAt:
                            new Date()
                                .toISOString()

                    };

                }
            );


        if (!found) {

            return false;

        }


        return save(
            updated
        );

    }


    /* =====================================================
       DELETE CONVERSATION
       ===================================================== */

    function remove(
        chatId
    ) {

        if (!chatId) {

            return false;

        }


        const history =
            getAll();


        const filtered =
            history.filter(
                conversation =>
                    conversation.id !==
                    chatId
            );


        /*
         * Tidak ada perubahan.
         */

        if (
            filtered.length ===
            history.length
        ) {

            return false;

        }


        const result =
            save(
                filtered
            );


        /*
         * Jika chat yang dihapus
         * sedang aktif, bersihkan active chat.
         */

        if (
            result &&
            storageReady()
        ) {

            const activeChat =
                ChatGVTLStorage.getActiveChat();


            if (
                activeChat ===
                chatId
            ) {

                ChatGVTLStorage
                    .clearActiveChat();

            }

        }


        return result;

    }


    /* =====================================================
       CLEAR ALL HISTORY
       ===================================================== */

    function clear() {

        if (!storageReady()) {

            return false;

        }


        const result =
            ChatGVTLStorage.remove(
                STORAGE_KEY
            );


        ChatGVTLStorage
            .clearActiveChat();


        return result;

    }


    /* =====================================================
       COUNT
       ===================================================== */

    function count() {

        return getAll().length;

    }


    /* =====================================================
       SORT BY UPDATED TIME
       ===================================================== */

    function sortByRecent(
        conversations = null
    ) {

        const source =
            Array.isArray(
                conversations
            )
                ? [...conversations]
                : getAll();


        return source.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.updatedAt ||
                        a.createdAt ||
                        0
                    ).getTime();


                const dateB =
                    new Date(
                        b.updatedAt ||
                        b.createdAt ||
                        0
                    ).getTime();


                return dateB - dateA;

            }
        );

    }


    /* =====================================================
       GET RECENT CHATS
       ===================================================== */

    function recent(
        limit = 10
    ) {

        const history =
            sortByRecent();


        return history.slice(
            0,
            Math.max(
                0,
                limit
            )
        );

    }


    /* =====================================================
       EXPORT BACKUP
       ===================================================== */

    function exportData() {

        const history =
            getAll();


        return JSON.stringify(
            {

                version:
                    "1.0",

                exportedAt:
                    new Date()
                        .toISOString(),

                conversations:
                    history

            },
            null,
            2
        );

    }


    /* =====================================================
       IMPORT BACKUP
       ===================================================== */

    function importData(
        data
    ) {

        let parsed;


        /*
         * Data bisa berupa object
         * atau JSON string.
         */

        if (
            typeof data ===
            "string"
        ) {

            try {

                parsed =
                    JSON.parse(
                        data
                    );

            } catch (error) {

                console.error(
                    "[ChatGVTL History] Invalid JSON:",
                    error
                );

                return false;

            }

        } else {

            parsed =
                data;

        }


        if (
            !parsed ||
            !Array.isArray(
                parsed.conversations
            )
        ) {

            return false;

        }


        return save(
            parsed.conversations
        );

    }


    /* =====================================================
       GET ACTIVE CHAT
       ===================================================== */

    function getActive() {

        if (!storageReady()) {

            return null;

        }


        const activeId =
            ChatGVTLStorage.getActiveChat();


        if (!activeId) {

            return null;

        }


        return find(
            activeId
        );

    }


    /* =====================================================
       RESTORE ACTIVE CHAT
       ===================================================== */

    function restoreActive() {

        const active =
            getActive();


        if (!active) {

            return null;

        }


        if (
            chatReady() &&
            typeof ChatGVTLChat
                .selectChat ===
                "function"
        ) {

            ChatGVTLChat.selectChat(
                active.id
            );

        }


        return active;

    }


    /* =====================================================
       CREATE HISTORY ENTRY
       ===================================================== */

    function createEntry({
        id,
        title = "New chat",
        messages = [],
        createdAt = null,
        updatedAt = null
    } = {}) {

        const now =
            new Date()
                .toISOString();


        return {

            id:
                id ||

                (
                    typeof ChatGVTLMessages !==
                    "undefined"

                        ? ChatGVTLMessages
                            .generateId(
                                "chat"
                            )

                        : `chat_${Date.now()}`
                ),

            title:
                title ||

                "New chat",

            messages:
                Array.isArray(
                    messages
                )
                    ? messages
                    : [],

            createdAt:
                createdAt ||
                now,

            updatedAt:
                updatedAt ||
                now

        };

    }


    /* =====================================================
       RENAME CHAT
       ===================================================== */

    function rename(
        chatId,
        title
    ) {

        const cleanTitle =
            String(
                title || ""
            )
            .trim();


        if (!cleanTitle) {

            return false;

        }


        return update(
            chatId,
            {

                title:
                    cleanTitle

            }
        );

    }


    /* =====================================================
       GET TOTAL MESSAGE COUNT
       ===================================================== */

    function messageCount(
        chatId
    ) {

        const conversation =
            find(
                chatId
            );


        if (!conversation) {

            return 0;

        }


        return Array.isArray(
            conversation.messages
        )
            ? conversation.messages.length
            : 0;

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        getAll,

        save,

        find,

        search,

        add,

        update,

        remove,

        clear,

        count,

        sortByRecent,

        recent,

        exportData,

        importData,

        getActive,

        restoreActive,

        createEntry,

        rename,

        messageCount

    };

})();