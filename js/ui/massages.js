"use strict";

/**
 * =========================================================
 * ChatGVTL Message UI
 * =========================================================
 *
 * Mengatur tampilan pesan pada halaman ChatGVTL.
 *
 * Tanggung jawab:
 *
 * - Render user message
 * - Render assistant message
 * - Render system message
 * - Render tool message
 * - Loading / generating state
 * - Error state
 * - Auto scroll
 * - Escape HTML
 * - Refresh message list
 *
 * =========================================================
 */

const ChatGVTLMessageUI = (() => {

    let initialized = false;

    let elements = {};

    let autoScroll = true;


    /* =====================================================
       CACHE ELEMENTS
       ===================================================== */

    function cacheElements() {

        elements = {

            container:
                document.querySelector(
                    "[data-chat-messages]"
                ),

            scrollArea:
                document.querySelector(
                    "[data-chat-scroll]"
                )

        };

        /*
         * Kalau scroll container tidak tersedia,
         * gunakan container pesan.
         */

        if (
            !elements.scrollArea
        ) {

            elements.scrollArea =
                elements.container;

        }

    }


    /* =====================================================
       DEPENDENCY CHECK
       ===================================================== */

    function dependenciesReady() {

        const required = [

            "ChatGVTLEvents",

            "ChatGVTLChat",

            "ChatGVTLMessages"

        ];


        const missing =
            required.filter(
                name =>
                    typeof window[name] ===
                    "undefined"
            );


        if (
            missing.length > 0
        ) {

            console.warn(
                "[ChatGVTL Message UI] Missing dependencies:",
                missing
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
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
       FORMAT CONTENT
       ===================================================== */

    function formatContent(
        content
    ) {

        const text =
            String(
                content ?? ""
            );


        /*
         * Untuk sekarang kita tidak
         * menjalankan HTML dari pesan.
         *
         * Ini penting untuk keamanan.
         */

        return escapeHTML(
            text
        )
        .replace(
            /\n/g,
            "<br>"
        );

    }


    /* =====================================================
       FORMAT TIME
       ===================================================== */

    function formatTime(
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


    /* =====================================================
       ROLE CLASS
       ===================================================== */

    function roleClass(
        role
    ) {

        switch (role) {

            case "user":

                return "message-user";


            case "assistant":

                return "message-assistant";


            case "system":

                return "message-system";


            case "tool":

                return "message-tool";


            default:

                return "message-unknown";

        }

    }


    /* =====================================================
       ROLE LABEL
       ===================================================== */

    function roleLabel(
        role
    ) {

        switch (role) {

            case "user":

                return "You";


            case "assistant":

                return "ChatGVTL";


            case "system":

                return "System";


            case "tool":

                return "Tool";


            default:

                return "ChatGVTL";

        }

    }


    /* =====================================================
       STATUS CLASS
       ===================================================== */

    function statusClass(
        status
    ) {

        switch (status) {

            case "generating":

                return "is-generating";


            case "error":

                return "is-error";


            case "cancelled":

                return "is-cancelled";


            case "complete":

                return "is-complete";


            default:

                return "";

        }

    }


    /* =====================================================
       GENERATING INDICATOR
       ===================================================== */

    function generatingIndicator() {

        return `

            <div
                class="message-generating"
                aria-label="Generating"
            >

                <span></span>
                <span></span>
                <span></span>

            </div>

        `;

    }


    /* =====================================================
       MESSAGE ICON
       ===================================================== */

    function messageIcon(
        role
    ) {

        if (
            role === "assistant"
        ) {

            return `

                <div
                    class="message-avatar
                           message-avatar-ai"
                    aria-hidden="true"
                >
                    GV
                </div>

            `;

        }


        if (
            role === "user"
        ) {

            return `

                <div
                    class="message-avatar
                           message-avatar-user"
                    aria-hidden="true"
                >
                    U
                </div>

            `;

        }


        return `

            <div
                class="message-avatar"
                aria-hidden="true"
            >
                •
            </div>

        `;

    }


    /* =====================================================
       CREATE MESSAGE ELEMENT
       ===================================================== */

    function createMessageElement(
        message
    ) {

        if (!message) {

            return null;

        }


        const wrapper =
            document.createElement(
                "article"
            );


        wrapper.className =
            `chat-message
             ${roleClass(message.role)}
             ${statusClass(message.status)}`;


        wrapper.dataset.messageId =
            message.id;


        wrapper.dataset.role =
            message.role;


        wrapper.dataset.status =
            message.status;


        const isGenerating =
            message.status ===
            "generating";


        const content =
            isGenerating &&
            !message.content

                ? generatingIndicator()

                : formatContent(
                    message.content
                );


        wrapper.innerHTML = `

            <div
                class="message-avatar-wrap"
            >

                ${messageIcon(
                    message.role
                )}

            </div>


            <div
                class="message-body"
            >

                <div
                    class="message-header"
                >

                    <span
                        class="message-role"
                    >
                        ${roleLabel(
                            message.role
                        )}
                    </span>


                    <time
                        class="message-time"
                        datetime="${escapeHTML(
                            message.createdAt ||
                            ""
                        )}"
                    >
                        ${formatTime(
                            message.createdAt
                        )}
                    </time>

                </div>


                <div
                    class="message-content"
                >
                    ${content}
                </div>


                ${
                    message.status ===
                    "error"

                        ? `
                            <div
                                class="message-status"
                            >
                                Failed to generate
                                response.
                            </div>
                          `

                        : ""
                }


                ${
                    message.status ===
                    "cancelled"

                        ? `
                            <div
                                class="message-status"
                            >
                                Generation cancelled.
                            </div>
                          `

                        : ""
                }

            </div>

        `;


        return wrapper;

    }


    /* =====================================================
       APPEND MESSAGE
       ===================================================== */

    function append(
        message,
        shouldScroll = true
    ) {

        if (
            !elements.container ||
            !message
        ) {

            return null;

        }


        const element =
            createMessageElement(
                message
            );


        if (!element) {

            return null;

        }


        elements.container.appendChild(
            element
        );


        if (
            shouldScroll &&
            autoScroll
        ) {

            scrollToBottom();

        }


        return element;

    }


    /* =====================================================
       UPDATE MESSAGE
       ===================================================== */

    function update(
        message
    ) {

        if (
            !message ||
            !elements.container
        ) {

            return null;

        }


        const existing =
            elements.container.querySelector(
                `[data-message-id="${CSS.escape(
                    message.id
                )}"]`
            );


        const replacement =
            createMessageElement(
                message
            );


        if (!replacement) {

            return null;

        }


        if (existing) {

            existing.replaceWith(
                replacement
            );

        } else {

            elements.container.appendChild(
                replacement
            );

        }


        if (autoScroll) {

            scrollToBottom();

        }


        return replacement;

    }


    /* =====================================================
       REMOVE MESSAGE
       ===================================================== */

    function remove(
        messageId
    ) {

        if (
            !elements.container ||
            !messageId
        ) {

            return false;

        }


        const element =
            elements.container.querySelector(
                `[data-message-id="${CSS.escape(
                    messageId
                )}"]`
            );


        if (!element) {

            return false;

        }


        element.remove();

        return true;

    }


    /* =====================================================
       CLEAR
       ===================================================== */

    function clear() {

        if (
            !elements.container
        ) {

            return;

        }


        elements.container.innerHTML =
            "";

    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function render(
        messages = []
    ) {

        if (
            !elements.container
        ) {

            return;

        }


        clear();


        if (
            !Array.isArray(
                messages
            ) ||
            messages.length === 0
        ) {

            renderEmpty();

            return;

        }


        const fragment =
            document.createDocumentFragment();


        messages.forEach(
            message => {

                const element =
                    createMessageElement(
                        message
                    );


                if (element) {

                    fragment.appendChild(
                        element
                    );

                }

            }
        );


        elements.container.appendChild(
            fragment
        );


        scrollToBottom();

    }


    /* =====================================================
       EMPTY STATE
       ===================================================== */

    function renderEmpty() {

        if (
            !elements.container
        ) {

            return;

        }


        elements.container.innerHTML = `

            <div
                class="chat-empty-state"
            >

                <div
                    class="chat-empty-icon"
                >
                    GV
                </div>


                <h2>
                    How can I help you?
                </h2>


                <p>
                    Start a conversation
                    with ChatGVTL.
                </p>

            </div>

        `;

    }


    /* =====================================================
       SCROLL TO BOTTOM
       ===================================================== */

    function scrollToBottom(
        smooth = true
    ) {

        const target =
            elements.scrollArea;


        if (!target) {

            return;

        }


        target.scrollTo({

            top:
                target.scrollHeight,

            behavior:
                smooth
                    ? "smooth"
                    : "auto"

        });

    }


    /* =====================================================
       DETECT USER SCROLL
       ===================================================== */

    function handleScroll() {

        const target =
            elements.scrollArea;


        if (!target) {

            return;

        }


        const distance =
            target.scrollHeight -
            target.scrollTop -
            target.clientHeight;


        /*
         * Kalau user berada dekat bagian bawah,
         * auto-scroll tetap aktif.
         *
         * Kalau user scroll ke atas,
         * jangan paksa kembali ke bawah.
         */

        autoScroll =
            distance < 120;

    }


    /* =====================================================
       BIND SCROLL
       ===================================================== */

    function bindScroll() {

        elements.scrollArea
            ?.addEventListener(
                "scroll",
                handleScroll,
                {
                    passive:
                        true
                }
            );

    }


    /* =====================================================
       EVENT BUS
       ===================================================== */

    function bindInternalEvents() {

        /*
         * Pesan baru.
         */

        ChatGVTLEvents.on(
            "chat:message",
            message => {

                /*
                 * Kalau UI sedang kosong,
                 * hilangkan empty state.
                 */

                const empty =
                    elements.container
                        ?.querySelector(
                            ".chat-empty-state"
                        );


                if (empty) {

                    empty.remove();

                }


                append(
                    message
                );

            }
        );


        /*
         * Pesan diperbarui.
         *
         * Digunakan ketika AI sedang
         * streaming / generating.
         */

        ChatGVTLEvents.on(
            "chat:message:updated",
            message => {

                update(
                    message
                );

            }
        );


        /*
         * Chat baru / chat dipilih.
         */

        ChatGVTLEvents.on(
            "chat:selected",
            () => {

                render(
                    ChatGVTLChat.getMessages()
                );

            }
        );


        ChatGVTLEvents.on(
            "chat:created",
            () => {

                render(
                    []
                );

            }
        );


        /*
         * History dibersihkan.
         */

        ChatGVTLEvents.on(
            "chat:cleared",
            () => {

                render(
                    []
                );

            }
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

        bindScroll();

        bindInternalEvents();

        render(
            ChatGVTLChat.getMessages()
        );


        initialized = true;


        ChatGVTLEvents.emit(
            "messages:ready"
        );


        return true;

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        initialize,

        append,

        update,

        remove,

        clear,

        render,

        renderEmpty,

        scrollToBottom,

        createMessageElement

    };

})();