"use strict";

/**
 * =========================================================
 * ChatGVTL Composer
 * =========================================================
 *
 * Mengatur input pesan pengguna:
 *
 * - Textarea
 * - Send button
 * - Enter = kirim
 * - Shift + Enter = baris baru
 * - Auto resize textarea
 * - Disable / enable composer
 * - Clear input
 * - Emit event composer:submit
 *
 * =========================================================
 */

const ChatGVTLComposer = (() => {

    let initialized = false;

    let elements = {};

    let submitting = false;


    /* =====================================================
       CACHE ELEMENTS
       ===================================================== */

    function cacheElements() {

        elements = {

            form:
                document.querySelector(
                    "[data-chat-composer]"
                ),

            input:
                document.querySelector(
                    "[data-chat-input]"
                ),

            send:
                document.querySelector(
                    "[data-chat-send]"
                )

        };

    }


    /* =====================================================
       DEPENDENCY CHECK
       ===================================================== */

    function dependenciesReady() {

        const required = [
            "ChatGVTLEvents"
        ];


        const missing =
            required.filter(
                name =>
                    typeof window[name] ===
                    "undefined"
            );


        if (missing.length > 0) {

            console.warn(
                "[ChatGVTL Composer] Missing dependencies:",
                missing
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       GET VALUE
       ===================================================== */

    function getValue() {

        if (!elements.input) {

            return "";

        }


        return String(
            elements.input.value || ""
        );

    }


    /* =====================================================
       GET CLEAN VALUE
       ===================================================== */

    function getCleanValue() {

        return getValue().trim();

    }


    /* =====================================================
       SET VALUE
       ===================================================== */

    function setValue(
        value = ""
    ) {

        if (!elements.input) {

            return;

        }


        elements.input.value =
            String(value);


        autoResize();

        updateSendButton();

    }


    /* =====================================================
       CLEAR
       ===================================================== */

    function clear() {

        setValue("");

        focus();

    }


    /* =====================================================
       FOCUS
       ===================================================== */

    function focus() {

        if (!elements.input) {

            return;

        }


        elements.input.focus();

    }


    /* =====================================================
       AUTO RESIZE
       ===================================================== */

    function autoResize() {

        if (!elements.input) {

            return;

        }


        elements.input.style.height =
            "auto";


        const maxHeight =
            220;


        const height =
            Math.min(
                elements.input
                    .scrollHeight,
                maxHeight
            );


        elements.input.style.height =
            `${height}px`;


        if (
            elements.input.scrollHeight >
            maxHeight
        ) {

            elements.input.style.overflowY =
                "auto";

        } else {

            elements.input.style.overflowY =
                "hidden";

        }

    }


    /* =====================================================
       CAN SUBMIT
       ===================================================== */

    function canSubmit() {

        const value =
            getCleanValue();


        return (
            value.length > 0 &&
            !submitting
        );

    }


    /* =====================================================
       UPDATE SEND BUTTON
       ===================================================== */

    function updateSendButton() {

        if (!elements.send) {

            return;

        }


        const enabled =
            canSubmit();


        elements.send.disabled =
            !enabled;


        elements.send.classList.toggle(
            "is-active",
            enabled
        );

    }


    /* =====================================================
       SET SUBMITTING
       ===================================================== */

    function setSubmitting(
        value
    ) {

        submitting =
            Boolean(value);


        if (elements.input) {

            elements.input.disabled =
                submitting;

        }


        if (elements.send) {

            elements.send.disabled =
                submitting;

        }


        if (elements.form) {

            elements.form.classList.toggle(
                "is-submitting",
                submitting
            );

        }


        if (!submitting) {

            updateSendButton();

        }

    }


    /* =====================================================
       SUBMIT
       ===================================================== */

    function submit() {

        if (!canSubmit()) {

            return false;

        }


        const content =
            getCleanValue();


        if (!content) {

            return false;

        }


        ChatGVTLEvents.emit(
            "composer:submit",
            {

                content:
                    content

            }
        );


        clear();


        return true;

    }


    /* =====================================================
       HANDLE FORM SUBMIT
       ===================================================== */

    function handleSubmit(
        event
    ) {

        event.preventDefault();

        submit();

    }


    /* =====================================================
       HANDLE KEYDOWN
       ===================================================== */

    function handleKeyDown(
        event
    ) {

        /*
         * Enter tanpa Shift:
         * kirim pesan.
         */

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            submit();

            return;

        }


        /*
         * Shift + Enter:
         * biarkan browser membuat
         * baris baru.
         */

        if (
            event.key === "Enter" &&
            event.shiftKey
        ) {

            /*
             * Tidak perlu preventDefault.
             */

            return;

        }

    }


    /* =====================================================
       HANDLE INPUT
       ===================================================== */

    function handleInput() {

        autoResize();

        updateSendButton();


        ChatGVTLEvents.emit(
            "composer:input",
            {

                content:
                    getValue(),

                length:
                    getValue().length

            }
        );

    }


    /* =====================================================
       BIND EVENTS
       ===================================================== */

    function bindEvents() {

        elements.form
            ?.addEventListener(
                "submit",
                handleSubmit
            );


        elements.input
            ?.addEventListener(
                "keydown",
                handleKeyDown
            );


        elements.input
            ?.addEventListener(
                "input",
                handleInput
            );


        elements.send
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    submit();

                }
            );

    }


    /* =====================================================
       EVENT BUS
       ===================================================== */

    function bindInternalEvents() {

        /*
         * Saat AI mulai generating,
         * composer dikunci.
         */

        ChatGVTLEvents.on(
            "generation:start",
            () => {

                setSubmitting(
                    true
                );

            }
        );


        /*
         * Saat AI selesai,
         * composer dibuka lagi.
         */

        ChatGVTLEvents.on(
            "generation:complete",
            () => {

                setSubmitting(
                    false
                );

                focus();

            }
        );


        /*
         * Saat AI error,
         * composer tetap bisa digunakan.
         */

        ChatGVTLEvents.on(
            "generation:error",
            () => {

                setSubmitting(
                    false
                );

                focus();

            }
        );


        /*
         * Chat baru:
         * pastikan composer bersih.
         */

        ChatGVTLEvents.on(
            "chat:created",
            () => {

                clear();

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

        bindEvents();

        bindInternalEvents();

        autoResize();

        updateSendButton();


        initialized = true;


        ChatGVTLEvents.emit(
            "composer:ready"
        );


        return true;

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        initialize,

        getValue,

        getCleanValue,

        setValue,

        clear,

        focus,

        autoResize,

        canSubmit,

        submit,

        setSubmitting

    };

})();