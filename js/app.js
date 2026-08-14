/* =========================================================
   ChatGVTL — Application Controller
   ========================================================= */

"use strict";


class ChatGVTLApp {

    constructor() {

        this.config = window.ChatGVTLConfig;
        this.router = window.ChatGVTLRouter;

        this.elements = {};

        this.state = {
            activeChatId: null,
            chats: [],
            isGenerating: false,
            sidebarOpen: false
        };

        this.init();
    }


    /* =====================================================
       INITIALIZATION
       ====================================================== */

    init() {

        this.cacheElements();

        this.loadChats();

        this.bindEvents();

        this.updateModelDisplay();

        this.updateRouterStatus();

        this.autoResizeTextarea();

    }


    /* =====================================================
       CACHE DOM ELEMENTS
       ====================================================== */

    cacheElements() {

        this.elements.app =
            document.getElementById("app");

        this.elements.sidebar =
            document.getElementById("sidebar");

        this.elements.mobileMenuButton =
            document.getElementById("mobileMenuButton");

        this.elements.newChatButton =
            document.getElementById("newChatButton");

        this.elements.chatSearchInput =
            document.getElementById("chatSearchInput");

        this.elements.chatForm =
            document.getElementById("chatForm");

        this.elements.messageInput =
            document.getElementById("messageInput");

        this.elements.sendButton =
            document.getElementById("sendButton");

        this.elements.welcomeScreen =
            document.getElementById("welcomeScreen");

        this.elements.messagesContainer =
            document.getElementById("messagesContainer");

        this.elements.modelSelector =
            document.getElementById("modelSelector");

        this.elements.profileButton =
            document.getElementById("profileButton");

        this.elements.chatArea =
            document.getElementById("chatArea");

    }


    /* =====================================================
       EVENT BINDINGS
       ====================================================== */

    bindEvents() {

        /* New Chat */
        this.elements.newChatButton
            ?.addEventListener(
                "click",
                () => this.createNewChat()
            );


        /* Send message */
        this.elements.chatForm
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    this.sendMessage();

                }
            );


        /* Textarea */
        this.elements.messageInput
            ?.addEventListener(
                "input",
                () => this.autoResizeTextarea()
            );


        this.elements.messageInput
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        this.sendMessage();

                    }

                }
            );


        /* Mobile menu */
        this.elements.mobileMenuButton
            ?.addEventListener(
                "click",
                () => this.toggleSidebar()
            );


        /* Model selector */
        this.elements.modelSelector
            ?.addEventListener(
                "click",
                () => this.openModelSelector()
            );


        /* Quick actions */
        document
            .querySelectorAll(".quick-action")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const prompt =
                            button.dataset.prompt;

                        if (!prompt) {
                            return;
                        }

                        this.handleQuickAction(prompt);

                    }
                );

            });


        /* History */
        document
            .querySelectorAll(".history-item")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const chatId =
                            button.dataset.chat;

                        this.openChat(chatId);

                    }
                );

            });


        /* Explore */
        document
            .querySelectorAll(".explore-item")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            button.dataset.page;

                        this.handleExplore(page);

                    }
                );

            });


        /* Search */
        this.elements.chatSearchInput
            ?.addEventListener(
                "input",
                event => {

                    this.searchChats(
                        event.target.value
                    );

                }
            );


        /* Close mobile sidebar when clicking main */
        this.elements.chatArea
            ?.addEventListener(
                "click",
                () => {

                    if (this.state.sidebarOpen) {
                        this.closeSidebar();
                    }

                }
            );


        /* Keyboard shortcut */
        document.addEventListener(
            "keydown",
            event => {

                if (
                    (event.ctrlKey || event.metaKey) &&
                    event.key.toLowerCase() === "k"
                ) {

                    event.preventDefault();

                    this.elements.chatSearchInput?.focus();

                }

            }
        );

    }


    /* =====================================================
       CHAT STORAGE
       ====================================================== */

    loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    this.config.storage.chatHistoryKey
                );


            if (saved) {

                this.state.chats =
                    JSON.parse(saved);

            }

        } catch (error) {

            console.warn(
                "Unable to load chat history:",
                error
            );

            this.state.chats = [];

        }


        if (!this.state.chats.length) {

            this.state.chats = [
                {
                    id: "welcome",
                    title: "Welcome to ChatGVTL",
                    messages: []
                },
                {
                    id: "router",
                    title: "RenAI Router",
                    messages: []
                },
                {
                    id: "discussion",
                    title: "AI Model Discussion",
                    messages: []
                }
            ];

            this.saveChats();

        }

    }


    saveChats() {

        try {

            localStorage.setItem(
                this.config.storage.chatHistoryKey,
                JSON.stringify(this.state.chats)
            );

        } catch (error) {

            console.warn(
                "Unable to save chat history:",
                error
            );

        }

    }


    /* =====================================================
       CREATE NEW CHAT
       ====================================================== */

    createNewChat() {

        const chat = {

            id:
                `chat-${Date.now()}`,

            title:
                "New Chat",

            messages: []

        };


        this.state.chats.unshift(chat);

        this.state.activeChatId = chat.id;

        this.saveChats();

        this.clearMessages();

        this.showWelcome();

        this.refreshHistory();

        this.closeSidebar();

        this.elements.messageInput?.focus();

    }


    /* =====================================================
       OPEN CHAT
       ====================================================== */

    openChat(chatId) {

        const chat =
            this.state.chats.find(
                item => item.id === chatId
            );


        if (!chat) {
            return;
        }


        this.state.activeChatId = chat.id;

        this.renderChat(chat);

        this.setActiveHistoryItem(chat.id);

        this.saveActiveChat();

        this.closeSidebar();

    }


    /* =====================================================
       RENDER CHAT
       ====================================================== */

    renderChat(chat) {

        this.clearMessages();

        if (!chat.messages.length) {

            this.showWelcome();

            return;

        }


        this.hideWelcome();


        chat.messages.forEach(message => {

            this.renderMessage(
                message.role,
                message.content
            );

        });


        this.scrollToBottom();

    }


    /* =====================================================
       SEND MESSAGE
       ====================================================== */

    async sendMessage() {

        if (this.state.isGenerating) {
            return;
        }


        const input =
            this.elements.messageInput;

        if (!input) {
            return;
        }


        const message =
            input.value.trim();


        if (!message) {
            return;
        }


        if (
            message.length >
            this.config.chat.maxInputLength
        ) {

            this.showTemporaryNotice(
                "Message is too long."
            );

            return;

        }


        const chat =
            this.getActiveChat();


        if (!chat) {

            this.createNewChat();

        }


        const activeChat =
            this.getActiveChat();


        if (!activeChat) {
            return;
        }


        this.hideWelcome();

        this.renderMessage(
            "user",
            message
        );


        activeChat.messages.push({
            role: "user",
            content: message,
            timestamp: Date.now()
        });


        this.updateChatTitle(
            activeChat,
            message
        );


        input.value = "";

        this.autoResizeTextarea();

        this.setGenerating(true);

        this.saveChats();

        this.refreshHistory();


        try {

            const response =
                await this.router.routeMessage(
                    message,
                    {
                        conversationId:
                            activeChat.id
                    }
                );


            const responseText =
                response?.message ||
                "No response received.";


            this.renderMessage(
                "assistant",
                responseText
            );


            activeChat.messages.push({
                role: "assistant",
                content: responseText,
                timestamp: Date.now()
            });


            this.saveChats();

        } catch (error) {

            console.error(
                "Chat error:",
                error
            );


            const errorMessage =
                "Sorry, something went wrong while processing your message.";


            this.renderMessage(
                "assistant",
                errorMessage
            );


            activeChat.messages.push({
                role: "assistant",
                content: errorMessage,
                timestamp: Date.now()
            });


            this.saveChats();

        } finally {

            this.setGenerating(false);

        }

    }


    /* =====================================================
       RENDER MESSAGE
       ====================================================== */

    renderMessage(role, content) {

        const container =
            this.elements.messagesContainer;

        if (!container) {
            return;
        }


        const message =
            document.createElement("div");

        message.className =
            `message ${role}`;


        const contentElement =
            document.createElement("div");

        contentElement.className =
            "message-content";


        /*
         * textContent digunakan supaya input user
         * tidak dianggap sebagai HTML.
         */

        contentElement.textContent =
            content;


        message.appendChild(
            contentElement
        );


        container.appendChild(
            message
        );


        this.scrollToBottom();

    }


    /* =====================================================
       ACTIVE CHAT
       ====================================================== */

    getActiveChat() {

        if (!this.state.activeChatId) {

            return null;

        }


        return this.state.chats.find(
            chat =>
                chat.id ===
                this.state.activeChatId
        ) || null;

    }


    /* =====================================================
       CHAT TITLE
       ====================================================== */

    updateChatTitle(chat, message) {

        if (
            !chat ||
            chat.title !== "New Chat"
        ) {
            return;
        }


        const cleanTitle =
            message
                .replace(/\s+/g, " ")
                .trim();


        if (!cleanTitle) {
            return;
        }


        chat.title =
            cleanTitle.length > 32
                ? cleanTitle.slice(0, 32) + "..."
                : cleanTitle;

    }


    /* =====================================================
       REFRESH HISTORY
       ====================================================== */

    refreshHistory() {

        const history =
            document.querySelector(
                ".chat-history"
            );


        if (!history) {
            return;
        }


        history.innerHTML = "";


        this.state.chats
            .slice(0, 8)
            .forEach(chat => {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "history-item";


                if (
                    chat.id ===
                    this.state.activeChatId
                ) {

                    button.classList.add(
                        "active"
                    );

                }


                button.dataset.chat =
                    chat.id;


                button.innerHTML = `
                    <span class="history-dot"></span>
                    <span class="history-title"></span>
                `;


                button
                    .querySelector(
                        ".history-title"
                    )
                    .textContent =
                        chat.title;


                button.addEventListener(
                    "click",
                    () => {

                        this.openChat(
                            chat.id
                        );

                    }
                );


                history.appendChild(
                    button
                );

            });

    }


    /* =====================================================
       ACTIVE HISTORY ITEM
       ====================================================== */

    setActiveHistoryItem(chatId) {

        document
            .querySelectorAll(
                ".history-item"
            )
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item.dataset.chat === chatId
                );

            });

    }


    /* =====================================================
       SEARCH CHATS
       ====================================================== */

    searchChats(query) {

        const search =
            query.trim().toLowerCase();


        document
            .querySelectorAll(
                ".history-item"
            )
            .forEach(item => {

                const title =
                    item
                        .querySelector(
                            ".history-title"
                        )
                        ?.textContent
                        ?.toLowerCase() || "";


                item.style.display =
                    !search ||
                    title.includes(search)
                        ? ""
                        : "none";

            });

    }


    /* =====================================================
       QUICK ACTION
       ====================================================== */

    handleQuickAction(prompt) {

        const input =
            this.elements.messageInput;


        if (!input) {
            return;
        }


        const prompts = {

            "Explain something":
                "Explain something to me clearly.",

            "Write code":
                "Help me write and debug code.",

            "Create content":
                "Help me create some content.",

            "Analyze information":
                "Help me analyze this information."

        };


        input.value =
            prompts[prompt] ||
            prompt;


        this.autoResizeTextarea();

        input.focus();

    }


    /* =====================================================
       EXPLORE
       ====================================================== */

    handleExplore(page) {

        switch (page) {

            case "settings":

                window.location.href =
                    "settings.html";

                break;


            case "models":

                this.showTemporaryNotice(
                    "Model explorer is coming soon."
                );

                break;


            case "images":

                this.showTemporaryNotice(
                    "Image generation is coming soon."
                );

                break;


            case "explore":

                this.showTemporaryNotice(
                    "Explore is coming soon."
                );

                break;


            default:

                break;

        }

    }


    /* =====================================================
       MODEL SELECTOR
       ====================================================== */

    openModelSelector() {

        const models = [
            "RenAI Auto",
            "RenAI Lite",
            "RenAI Pro",
            "RenAI Flash"
        ];


        const current =
            this.router.getModel();


        const currentIndex =
            models.indexOf(current);


        const nextIndex =
            currentIndex >= 0
                ? (currentIndex + 1) % models.length
                : 0;


        this.router.setModel(
            models[nextIndex]
        );


        this.updateModelDisplay();

        this.showTemporaryNotice(
            `Model: ${models[nextIndex]}`
        );

    }


    updateModelDisplay() {

        const selector =
            this.elements.modelSelector;


        if (!selector) {
            return;
        }


        const name =
            selector.querySelector(
                ".model-name"
            );


        if (name) {

            name.textContent =
                this.router.getModel();

        }

    }


    /* =====================================================
       ROUTER STATUS
       ====================================================== */

    updateRouterStatus() {

        const status =
            this.router.getStatus();


        const dot =
            document.querySelector(
                ".router-status-dot"
            );


        const statusText =
            document.querySelector(
                ".router-status"
            );


        if (
            dot &&
            status === "online"
        ) {

            dot.style.background =
                "var(--status-online)";

        }


        if (statusText) {

            statusText.lastChild.textContent =
                ` ${this.router.config.router.name}`;

        }

    }


    /* =====================================================
       GENERATING STATE
       ====================================================== */

    setGenerating(value) {

        this.state.isGenerating =
            value;


        const input =
            this.elements.messageInput;

        const button =
            this.elements.sendButton;


        if (input) {

            input.disabled =
                value;

        }


        if (button) {

            button.disabled =
                value;

            button.textContent =
                value
                    ? "…"
                    : "➤";

        }

    }


    /* =====================================================
       TEXTAREA AUTO RESIZE
       ====================================================== */

    autoResizeTextarea() {

        const textarea =
            this.elements.messageInput;


        if (!textarea) {
            return;
        }


        textarea.style.height =
            "auto";


        const maxHeight =
            this.config.ui.composer.maxHeight;


        textarea.style.height =
            Math.min(
                textarea.scrollHeight,
                maxHeight
            ) + "px";

    }


    /* =====================================================
       CLEAR MESSAGES
       ====================================================== */

    clearMessages() {

        if (
            this.elements.messagesContainer
        ) {

            this.elements.messagesContainer
                .innerHTML = "";

        }

    }


    /* =====================================================
       WELCOME
       ====================================================== */

    showWelcome() {

        if (
            this.elements.welcomeScreen
        ) {

            this.elements.welcomeScreen
                .classList.remove(
                    "hidden"
                );

        }

    }


    hideWelcome() {

        if (
            this.elements.welcomeScreen
        ) {

            this.elements.welcomeScreen
                .classList.add(
                    "hidden"
                );

        }

    }


    /* =====================================================
       SCROLL
       ====================================================== */

    scrollToBottom() {

        requestAnimationFrame(() => {

            if (
                this.elements.chatArea
            ) {

                this.elements.chatArea.scrollTop =
                    this.elements.chatArea.scrollHeight;

            }

        });

    }


    /* =====================================================
       MOBILE SIDEBAR
       ====================================================== */

    toggleSidebar() {

        if (
            this.state.sidebarOpen
        ) {

            this.closeSidebar();

        } else {

            this.openSidebar();

        }

    }


    openSidebar() {

        this.state.sidebarOpen =
            true;


        this.elements.sidebar
            ?.classList.add("open");

    }


    closeSidebar() {

        this.state.sidebarOpen =
            false;


        this.elements.sidebar
            ?.classList.remove("open");

    }


    /* =====================================================
       ACTIVE CHAT STORAGE
       ====================================================== */

    saveActiveChat() {

        if (!this.state.activeChatId) {
            return;
        }


        try {

            localStorage.setItem(
                this.config.storage.activeChatKey,
                this.state.activeChatId
            );

        } catch (error) {

            console.warn(
                "Unable to save active chat:",
                error
            );

        }

    }


    /* =====================================================
       TEMPORARY NOTICE
       ====================================================== */

    showTemporaryNotice(message) {

        let notice =
            document.getElementById(
                "chatgvtlNotice"
            );


        if (!notice) {

            notice =
                document.createElement(
                    "div"
                );

            notice.id =
                "chatgvtlNotice";


            Object.assign(
                notice.style,
                {
                    position: "fixed",
                    left: "50%",
                    bottom: "105px",
                    transform:
                        "translateX(-50%)",
                    zIndex: "999",
                    padding:
                        "9px 14px",
                    color:
                        "#dcecff",
                    fontSize:
                        "11px",
                    border:
                        "1px solid rgba(40,190,255,.18)",
                    borderRadius:
                        "9px",
                    background:
                        "rgba(8,20,32,.95)",
                    boxShadow:
                        "0 8px 30px rgba(0,0,0,.3)",
                    pointerEvents:
                        "none"
                }
            );


            document.body.appendChild(
                notice
            );

        }


        notice.textContent =
            message;


        notice.style.opacity =
            "1";


        clearTimeout(
            this.noticeTimer
        );


        this.noticeTimer =
            setTimeout(() => {

                notice.style.opacity =
                    "0";

            }, 1800);

    }

}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        window.ChatGVTLApp =
            new ChatGVTLApp();

    }
);