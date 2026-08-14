"use strict";

/**
 * =========================================================
 * ChatGVTL Modal Manager
 * =========================================================
 *
 * Modal global untuk:
 *
 * - Confirmation
 * - Information
 * - Warning
 * - Custom content
 * - Close dengan tombol
 * - Close dengan ESC
 * - Close ketika klik backdrop
 *
 * =========================================================
 */

const ChatGVTLModal = (() => {

    let initialized = false;

    let elements = {};

    let resolver = null;


    /* =====================================================
       CACHE ELEMENTS
       ===================================================== */

    function cacheElements() {

        elements = {

            root:
                document.querySelector(
                    "[data-modal]"
                ),

            backdrop:
                document.querySelector(
                    "[data-modal-backdrop]"
                ),

            dialog:
                document.querySelector(
                    "[data-modal-dialog]"
                ),

            title:
                document.querySelector(
                    "[data-modal-title]"
                ),

            content:
                document.querySelector(
                    "[data-modal-content]"
                ),

            close:
                document.querySelector(
                    "[data-modal-close]"
                ),

            cancel:
                document.querySelector(
                    "[data-modal-cancel]"
                ),

            confirm:
                document.querySelector(
                    "[data-modal-confirm]"
                )

        };

    }


    /* =====================================================
       DEPENDENCY CHECK
       ===================================================== */

    function dependenciesReady() {

        if (
            typeof ChatGVTLEvents ===
            "undefined"
        ) {

            console.warn(
                "[ChatGVTL Modal] ChatGVTLEvents unavailable."
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
       OPEN
       ===================================================== */

    function open({
        title = "ChatGVTL",
        content = "",
        confirmText = "Confirm",
        cancelText = "Cancel",
        showCancel = true,
        showConfirm = true,
        closeOnBackdrop = true
    } = {}) {

        if (!elements.root) {

            console.warn(
                "[ChatGVTL Modal] Modal element not found."
            );

            return false;

        }


        elements.title.textContent =
            title;


        /*
         * Content bisa berupa HTML.
         *
         * Untuk content yang berasal dari
         * user, gunakan escapeHTML().
         */

        elements.content.innerHTML =
            content;


        if (elements.confirm) {

            elements.confirm.textContent =
                confirmText;

            elements.confirm.hidden =
                !showConfirm;

        }


        if (elements.cancel) {

            elements.cancel.textContent =
                cancelText;

            elements.cancel.hidden =
                !showCancel;

        }


        elements.root.dataset
            .closeOnBackdrop =
                closeOnBackdrop
                    ? "true"
                    : "false";


        elements.root.hidden =
            false;


        document.body.classList.add(
            "modal-open"
        );


        requestAnimationFrame(
            () => {

                elements.root.classList.add(
                    "is-open"
                );

            }
        );


        ChatGVTLEvents.emit(
            "modal:opened",
            {
                title
            }
        );


        return true;

    }


    /* =====================================================
       CLOSE
       ===================================================== */

    function close(
        result = null
    ) {

        if (
            !elements.root
        ) {

            return;

        }


        elements.root.classList.remove(
            "is-open"
        );


        document.body.classList.remove(
            "modal-open"
        );


        setTimeout(
            () => {

                if (
                    !elements.root.classList.contains(
                        "is-open"
                    )
                ) {

                    elements.root.hidden =
                        true;

                }

            },
            180
        );


        if (
            typeof resolver ===
            "function"
        ) {

            const callback =
                resolver;


            resolver =
                null;


            callback(
                result
            );

        }


        ChatGVTLEvents.emit(
            "modal:closed",
            result
        );

    }


    /* =====================================================
       CONFIRM
       ===================================================== */

    function confirm({
        title = "Confirm action",
        message = "Are you sure?",
        confirmText = "Confirm",
        cancelText = "Cancel",
        closeOnBackdrop = true
    } = {}) {

        return new Promise(
            resolve => {

                resolver =
                    resolve;


                open({

                    title,

                    content:
                        `
                        <p class="modal-message">
                            ${escapeHTML(
                                message
                            )}
                        </p>
                        `,

                    confirmText,

                    cancelText,

                    showCancel:
                        true,

                    showConfirm:
                        true,

                    closeOnBackdrop

                });

            }
        );

    }


    /* =====================================================
       ALERT
       ===================================================== */

    function alert({
        title = "ChatGVTL",
        message = "Done",
        buttonText = "OK"
    } = {}) {

        return new Promise(
            resolve => {

                resolver =
                    resolve;


                open({

                    title,

                    content:
                        `
                        <p class="modal-message">
                            ${escapeHTML(
                                message
                            )}
                        </p>
                        `,

                    confirmText:
                        buttonText,

                    showCancel:
                        false,

                    showConfirm:
                        true,

                    closeOnBackdrop:
                        true

                });

            }
        );

    }


    /* =====================================================
       SET CONTENT
       ===================================================== */

    function setContent(
        content
    ) {

        if (
            !elements.content
        ) {

            return;

        }


        elements.content.innerHTML =
            content;

    }


    /* =====================================================
       SET TITLE
       ===================================================== */

    function setTitle(
        title
    ) {

        if (
            !elements.title
        ) {

            return;

        }


        elements.title.textContent =
            title;

    }


    /* =====================================================
       HANDLE CONFIRM
       ===================================================== */

    function handleConfirm() {

        close(true);

    }


    /* =====================================================
       HANDLE CANCEL
       ===================================================== */

    function handleCancel() {

        close(false);

    }


    /* =====================================================
       HANDLE BACKDROP
       ===================================================== */

    function handleBackdrop(
        event
    ) {

        if (
            event.target !==
            elements.root
        ) {

            return;

        }


        if (
            elements.root.dataset
                .closeOnBackdrop !==
            "true"
        ) {

            return;

        }


        close(false);

    }


    /* =====================================================
       HANDLE KEYBOARD
       ===================================================== */

    function handleKeyboard(
        event
    ) {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            !elements.root ||
            elements.root.hidden
        ) {

            return;

        }


        close(false);

    }


    /* =====================================================
       BIND EVENTS
       ===================================================== */

    function bindEvents() {

        elements.close
            ?.addEventListener(
                "click",
                () => {

                    close(false);

                }
            );


        elements.cancel
            ?.addEventListener(
                "click",
                handleCancel
            );


        elements.confirm
            ?.addEventListener(
                "click",
                handleConfirm
            );


        elements.root
            ?.addEventListener(
                "click",
                handleBackdrop
            );


        document.addEventListener(
            "keydown",
            handleKeyboard
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


        if (elements.root) {

            elements.root.hidden =
                true;

        }


        initialized =
            true;


        ChatGVTLEvents.emit(
            "modal:ready"
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

        confirm,

        alert,

        setContent,

        setTitle

    };

})();