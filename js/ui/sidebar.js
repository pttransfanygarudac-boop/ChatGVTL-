"use strict";

/**
 * =========================================================
 * ChatGVTL Sidebar
 * =========================================================
 *
 * Mengatur sidebar ChatGVTL:
 *
 * - Open / close sidebar
 * - New Chat
 * - Menampilkan conversation history
 * - Memilih conversation
 * - Rename conversation
 * - Delete conversation
 * - Search conversation
 *
 * =========================================================
 */

const ChatGVTLSidebar = (() => {

    let initialized = false;

    let elements = {};

    let searchQuery = "";


    /* =====================================================
       ELEMENTS
       ===================================================== */

    function cacheElements() {

        elements = {

            sidebar:
                document.querySelector(
                    "[data-chatgvtl-sidebar]"
                ),

            toggle:
                document.querySelector(
                    "[data-sidebar-toggle]"
                ),

            close:
                document.querySelector(
                    "[data-sidebar-close]"
                ),

            newChat:
                document.querySelector(
                    "[data-new-chat]"
                ),

            search:
                document.querySelector(
                    "[data-chat-search]"
                ),

            history:
                document.querySelector(
                    "[data-chat-history]"
                )

        };

    }


    /* =====================================================
       CHECK DEPENDENCIES
       ===================================================== */

    function dependenciesReady() {

        const required = [

            "ChatGVTLState",

            "ChatGVTLEvents",

            "ChatGVTLChat",

            "ChatGVTLHistory"

        ];


        const missing =
            required.filter(
                name =>
                    typeof window[name] ===
                    "undefined"
            );


        if (missing.length > 0) {

            console.warn(
                "[ChatGVTL Sidebar] Missing dependencies:",
                missing
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       OPEN SIDEBAR
       ===================================================== */

    function open() {

        if (!elements.sidebar) {
            return;
        }


        elements.sidebar.classList.add(
            "is-open"
        );


        elements.sidebar.classList.remove(
            "is-closed"
        );


        ChatGVTLState.setSidebarOpen(
            true
        );


        ChatGVTLEvents.emit(
            "sidebar:opened"
        );

    }


    /* =====================================================
       CLOSE SIDEBAR
       ===================================================== */

    function close() {

        if (!elements.sidebar) {
            return;
        }


        elements.sidebar.classList.remove(
            "is-open"
        );


        elements.sidebar.classList.add(
            "is-closed"
        );


        ChatGVTLState.setSidebarOpen(
            false
        );


        ChatGVTLEvents.emit(
            "sidebar:closed"
        );

    }


    /* =====================================================
       TOGGLE SIDEBAR
       ===================================================== */

    function toggle() {

        const isOpen =
            ChatGVTLState.get(
                "sidebarOpen"
            );


        if (isOpen) {

            close();

        } else {

            open();

        }


        ChatGVTLEvents.emit(
            "sidebar:toggled",
            {
                open:
                    !isOpen
            }
        );

    }


    /* =====================================================
       CREATE NEW CHAT
       ===================================================== */

    function createNewChat() {

        const conversation =
            ChatGVTLChat.createConversation(
                "New chat"
            );


        clearSearch();


        render();


        ChatGVTLEvents.emit(
            "sidebar:new-chat",
            conversation
        );


        return conversation;

    }


    /* =====================================================
       SELECT CHAT
       ===================================================== */

    function selectChat(chatId) {

        if (!chatId) {
            return;
        }


        const selected =
            ChatGVTLChat.selectChat(
                chatId
            );


        if (!selected) {
            return;
        }


        render();


        /*
         * Pada mobile,
         * sidebar ditutup setelah chat dipilih.
         */

        if (
            window.innerWidth <= 768
        ) {

            close();

        }

    }


    /* =====================================================
       DELETE CHAT
       ===================================================== */

    function deleteChat(
        chatId
    ) {

        if (!chatId) {
            return;
        }


        const conversation =
            ChatGVTLHistory.find(
                chatId
            );


        if (!conversation) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${conversation.title}"?`
            );


        if (!confirmed) {
            return;
        }


        ChatGVTLHistory.remove(
            chatId
        );


        ChatGVTLChat.deleteChat(
            chatId
        );


        render();

    }


    /* =====================================================
       RENAME CHAT
       ===================================================== */

    function renameChat(
        chatId
    ) {

        if (!chatId) {
            return;
        }


        const conversation =
            ChatGVTLHistory.find(
                chatId
            );


        if (!conversation) {
            return;
        }


        const title =
            window.prompt(
                "Enter a new chat name:",
                conversation.title
            );


        if (
            title === null
        ) {

            return;

        }


        const cleanTitle =
            title.trim();


        if (!cleanTitle) {

            return;

        }


        ChatGVTLHistory.rename(
            chatId,
            cleanTitle
        );


        const conversations =
            ChatGVTLHistory.getAll();


        ChatGVTLState.setConversations(
            conversations
        );


        render();

    }


    /* =====================================================
       SEARCH
       ===================================================== */

    function search(
        query
    ) {

        searchQuery =
            String(
                query || ""
            ).trim();


        render();

    }


    /* =====================================================
       CLEAR SEARCH
       ===================================================== */

    function clearSearch() {

        searchQuery = "";


        if (elements.search) {

            elements.search.value =
                "";

        }

    }


    /* =====================================================
       GET DISPLAYED HISTORY
       ===================================================== */

    function getDisplayedHistory() {

        if (searchQuery) {

            return ChatGVTLHistory.search(
                searchQuery
            );

        }


        return ChatGVTLHistory.sortByRecent();

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value || ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }


    /* =====================================================
       FORMAT DATE
       ===================================================== */

    function formatDate(
        date
    ) {

        if (!date) {

            return "";

        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "";

        }


        const now =
            new Date();


        const sameDay =
            parsed.toDateString() ===
            now.toDateString();


        if (sameDay) {

            return parsed.toLocaleTimeString(
                [],
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );

        }


        return parsed.toLocaleDateString(
            [],
            {
                day:
                    "numeric",

                month:
                    "short"
            }
        );

    }


    /* =====================================================
       CREATE CHAT ITEM
       ===================================================== */

    function createChatItem(
        conversation
    ) {

        const activeChat =
            ChatGVTLState.getActiveChat();


        const isActive =
            activeChat ===
            conversation.id;


        const item =
            document.createElement(
                "div"
            );


        item.className =
            "chat-history-item";


        if (isActive) {

            item.classList.add(
                "is-active"
            );

        }


        item.dataset.chatId =
            conversation.id;


        item.innerHTML = `

            <button
                type="button"
                class="chat-history-main"
                data-chat-select
                data-chat-id="${escapeHTML(
                    conversation.id
                )}"
            >

                <span
                    class="chat-history-title"
                >
                    ${escapeHTML(
                        conversation.title ||
                        "New chat"
                    )}
                </span>

                <span
                    class="chat-history-date"
                >
                    ${formatDate(
                        conversation.updatedAt
                    )}
                </span>

            </button>


            <div
                class="chat-history-actions"
            >

                <button
                    type="button"
                    class="chat-history-action"
                    data-chat-rename
                    data-chat-id="${escapeHTML(
                        conversation.id
                    )}"
                    aria-label="Rename chat"
                    title="Rename"
                >
                    ✎
                </button>


                <button
                    type="button"
                    class="chat-history-action"
                    data-chat-delete
                    data-chat-id="${escapeHTML(
                        conversation.id
                    )}"
                    aria-label="Delete chat"
                    title="Delete"
                >
                    ×
                </button>

            </div>

        `;


        return item;

    }


    /* =====================================================
       RENDER EMPTY STATE
       ===================================================== */

    function renderEmpty() {

        if (!elements.history) {
            return;
        }


        elements.history.innerHTML = `

            <div
                class="chat-history-empty"
            >

                <div
                    class="chat-history-empty-icon"
                >
                    💬
                </div>

                <p>
                    ${
                        searchQuery
                            ? "No chats found."
                            : "No conversations yet."
                    }
                </p>

                ${
                    searchQuery
                        ? ""
                        : `
                            <span>
                                Start a new chat
                                to begin.
                            </span>
                        `
                }

            </div>

        `;

    }


    /* =====================================================
       RENDER HISTORY
       ===================================================== */

    function render() {

        if (!elements.history) {
            return;
        }


        const conversations =
            getDisplayedHistory();


        elements.history.innerHTML =
            "";


        if (
            conversations.length === 0
        ) {

            renderEmpty();

            return;

        }


        const fragment =
            document.createDocumentFragment();


        conversations.forEach(
            conversation => {

                fragment.appendChild(
                    createChatItem(
                        conversation
                    )
                );

            }
        );


        elements.history.appendChild(
            fragment
        );

    }


    /* =====================================================
       EVENT HANDLERS
       ===================================================== */

    function bindEvents() {

        elements.toggle
            ?.addEventListener(
                "click",
                toggle
            );


        elements.close
            ?.addEventListener(
                "click",
                close
            );


        elements.newChat
            ?.addEventListener(
                "click",
                createNewChat
            );


        elements.search
            ?.addEventListener(
                "input",
                event => {

                    search(
                        event.target.value
                    );

                }
            );


        elements.history
            ?.addEventListener(
                "click",
                event => {

                    const selectButton =
                        event.target.closest(
                            "[data-chat-select]"
                        );


                    const renameButton =
                        event.target.closest(
                            "[data-chat-rename]"
                        );


                    const deleteButton =
                        event.target.closest(
                            "[data-chat-delete]"
                        );


                    if (
                        selectButton
                    ) {

                        selectChat(
                            selectButton.dataset
                                .chatId
                        );

                        return;

                    }


                    if (
                        renameButton
                    ) {

                        renameChat(
                            renameButton.dataset
                                .chatId
                        );

                        return;

                    }


                    if (
                        deleteButton
                    ) {

                        deleteChat(
                            deleteButton.dataset
                                .chatId
                        );

                    }

                }
            );


        /*
         * Keyboard shortcut:
         *
         * Ctrl/Cmd + Shift + O
         *
         * untuk membuka / menutup sidebar.
         */

        document.addEventListener(
            "keydown",
            event => {

                const modifier =
                    event.ctrlKey ||
                    event.metaKey;


                if (
                    modifier &&
                    event.shiftKey &&
                    event.key.toLowerCase() ===
                    "o"
                ) {

                    event.preventDefault();

                    toggle();

                }

            }
        );

    }


    /* =====================================================
       EVENT BUS LISTENERS
       ===================================================== */

    function bindInternalEvents() {

        ChatGVTLEvents.on(
            "chat:created",
            render
        );


        ChatGVTLEvents.on(
            "chat:selected",
            render
        );


        ChatGVTLEvents.on(
            "chat:deleted",
            render
        );


        ChatGVTLEvents.on(
            "chat:message",
            render
        );


        ChatGVTLEvents.on(
            "chat:message:updated",
            render
        );


        ChatGVTLEvents.on(
            "chat:cleared",
            render
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


        cacheElements();

        bindEvents();

        bindInternalEvents();

        render();


        /*
         * Sinkronkan kondisi sidebar
         * dengan state aplikasi.
         */

        const sidebarOpen =
            ChatGVTLState.get(
                "sidebarOpen"
            );


        if (sidebarOpen) {

            open();

        } else {

            close();

        }


        initialized = true;


        ChatGVTLEvents.emit(
            "sidebar:ready"
        );


        return true;

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        initialize,

        open,

        close,

        toggle,

        createNewChat,

        selectChat,

        deleteChat,

        renameChat,

        search,

        clearSearch,

        render,

        getDisplayedHistory

    };

})();