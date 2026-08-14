"use strict";

/**
 * =========================================================
 * ChatGVTL Message Manager
 * =========================================================
 *
 * Mengatur struktur dan operasi dasar pesan ChatGVTL.
 *
 * Role yang digunakan:
 *
 * user       → pesan pengguna
 * assistant  → jawaban AI
 * system     → pesan internal sistem
 * tool       → hasil dari tool / service
 *
 * =========================================================
 */

const ChatGVTLMessages = (() => {

    /* =====================================================
       CONSTANTS
       ===================================================== */

    const ROLES = {
        USER: "user",
        ASSISTANT: "assistant",
        SYSTEM: "system",
        TOOL: "tool"
    };


    const STATUS = {
        COMPLETE: "complete",
        GENERATING: "generating",
        ERROR: "error",
        CANCELLED: "cancelled"
    };


    /* =====================================================
       ID GENERATOR
       ===================================================== */

    function generateId(prefix = "msg") {

        const random =
            Math.random()
                .toString(36)
                .substring(2, 10);


        const timestamp =
            Date.now();


        return `${prefix}_${timestamp}_${random}`;

    }


    /* =====================================================
       TIMESTAMP
       ===================================================== */

    function timestamp() {

        return new Date().toISOString();

    }


    /* =====================================================
       VALIDATE ROLE
       ===================================================== */

    function isValidRole(role) {

        return Object.values(
            ROLES
        ).includes(role);

    }


    /* =====================================================
       NORMALIZE CONTENT
       ===================================================== */

    function normalizeContent(content) {

        if (
            content === null ||
            typeof content === "undefined"
        ) {

            return "";

        }


        if (
            typeof content === "string"
        ) {

            return content;

        }


        /*
         * Untuk object atau array,
         * ubah menjadi string JSON.
         */

        try {

            return JSON.stringify(
                content
            );

        } catch (error) {

            console.warn(
                "[ChatGVTL Messages] Unable to normalize content.",
                error
            );

            return String(
                content
            );

        }

    }


    /* =====================================================
       CREATE MESSAGE
       ===================================================== */

    function create({
        role = ROLES.USER,
        content = "",
        status = STATUS.COMPLETE,
        model = null,
        metadata = {},
        id = null,
        createdAt = null
    } = {}) {

        /*
         * Jika role tidak dikenal,
         * gunakan user sebagai fallback.
         */

        if (
            !isValidRole(role)
        ) {

            console.warn(
                `[ChatGVTL Messages] Unknown role: ${role}`
            );

            role =
                ROLES.USER;

        }


        return {

            id:
                id || generateId("msg"),

            role:

                role,

            content:

                normalizeContent(
                    content
                ),

            status:

                status,

            model:

                model || null,

            metadata:

                metadata &&
                typeof metadata === "object"
                    ? metadata
                    : {},

            createdAt:

                createdAt ||
                timestamp(),

            updatedAt:

                timestamp()

        };

    }


    /* =====================================================
       USER MESSAGE
       ===================================================== */

    function user(
        content,
        options = {}
    ) {

        return create({

            ...options,

            role:
                ROLES.USER,

            content:

                content,

            status:

                STATUS.COMPLETE

        });

    }


    /* =====================================================
       ASSISTANT MESSAGE
       ===================================================== */

    function assistant(
        content = "",
        options = {}
    ) {

        return create({

            ...options,

            role:
                ROLES.ASSISTANT,

            content:

                content,

            status:

                options.status ||
                STATUS.COMPLETE

        });

    }


    /* =====================================================
       SYSTEM MESSAGE
       ===================================================== */

    function system(
        content,
        options = {}
    ) {

        return create({

            ...options,

            role:
                ROLES.SYSTEM,

            content:

                content,

            status:

                STATUS.COMPLETE

        });

    }


    /* =====================================================
       TOOL MESSAGE
       ===================================================== */

    function tool(
        content,
        options = {}
    ) {

        return create({

            ...options,

            role:
                ROLES.TOOL,

            content:

                content,

            status:

                options.status ||
                STATUS.COMPLETE

        });

    }


    /* =====================================================
       GENERATING MESSAGE
       ===================================================== */

    function generating(
        options = {}
    ) {

        return create({

            ...options,

            role:
                ROLES.ASSISTANT,

            content:
                options.content || "",

            status:
                STATUS.GENERATING

        });

    }


    /* =====================================================
       UPDATE MESSAGE
       ===================================================== */

    function update(
        message,
        changes = {}
    ) {

        if (
            !message ||
            typeof message !== "object"
        ) {

            return null;

        }


        const updated = {

            ...message,

            ...changes,

            content:

                typeof changes.content !==
                "undefined"

                    ? normalizeContent(
                        changes.content
                    )

                    : message.content,

            updatedAt:
                timestamp()

        };


        return updated;

    }


    /* =====================================================
       COMPLETE MESSAGE
       ===================================================== */

    function complete(
        message,
        content = null
    ) {

        return update(

            message,

            {

                ...(content !== null
                    ? {
                        content:
                            content
                    }
                    : {}),

                status:
                    STATUS.COMPLETE

            }

        );

    }


    /* =====================================================
       ERROR MESSAGE
       ===================================================== */

    function error(
        message,
        errorContent = ""
    ) {

        return update(

            message,

            {

                ...(errorContent
                    ? {
                        content:
                            errorContent
                    }
                    : {}),

                status:
                    STATUS.ERROR

            }

        );

    }


    /* =====================================================
       CANCEL MESSAGE
       ===================================================== */

    function cancel(message) {

        return update(

            message,

            {

                status:
                    STATUS.CANCELLED

            }

        );

    }


    /* =====================================================
       FIND MESSAGE
       ===================================================== */

    function find(
        messages,
        messageId
    ) {

        if (
            !Array.isArray(messages)
        ) {

            return null;

        }


        return (
            messages.find(
                message =>
                    message.id ===
                    messageId
            ) || null
        );

    }


    /* =====================================================
       REMOVE MESSAGE
       ===================================================== */

    function remove(
        messages,
        messageId
    ) {

        if (
            !Array.isArray(messages)
        ) {

            return [];

        }


        return messages.filter(
            message =>
                message.id !==
                messageId
        );

    }


    /* =====================================================
       UPDATE BY ID
       ===================================================== */

    function updateById(
        messages,
        messageId,
        changes = {}
    ) {

        if (
            !Array.isArray(messages)
        ) {

            return [];

        }


        return messages.map(
            message => {

                if (
                    message.id !==
                    messageId
                ) {

                    return message;

                }


                return update(
                    message,
                    changes
                );

            }
        );

    }


    /* =====================================================
       APPEND MESSAGE
       ===================================================== */

    function append(
        messages,
        message
    ) {

        const list =
            Array.isArray(messages)
                ? [...messages]
                : [];


        if (!message) {

            return list;

        }


        list.push(
            message
        );


        return list;

    }


    /* =====================================================
       GET LAST MESSAGE
       ===================================================== */

    function last(messages) {

        if (
            !Array.isArray(messages) ||
            messages.length === 0
        ) {

            return null;

        }


        return messages[
            messages.length - 1
        ];

    }


    /* =====================================================
       GET LAST ASSISTANT MESSAGE
       ===================================================== */

    function lastAssistant(messages) {

        if (
            !Array.isArray(messages)
        ) {

            return null;

        }


        for (
            let index =
                messages.length - 1;

            index >= 0;

            index--
        ) {

            if (
                messages[index].role ===
                ROLES.ASSISTANT
            ) {

                return messages[index];

            }

        }


        return null;

    }


    /* =====================================================
       GET LAST USER MESSAGE
       ===================================================== */

    function lastUser(messages) {

        if (
            !Array.isArray(messages)
        ) {

            return null;

        }


        for (
            let index =
                messages.length - 1;

            index >= 0;

            index--
        ) {

            if (
                messages[index].role ===
                ROLES.USER
            ) {

                return messages[index];

            }

        }


        return null;

    }


    /* =====================================================
       SERIALIZE
       ===================================================== */

    function serialize(messages) {

        if (
            !Array.isArray(messages)
        ) {

            return [];

        }


        return messages.map(
            message => ({

                id:
                    message.id,

                role:
                    message.role,

                content:
                    message.content,

                status:
                    message.status,

                model:
                    message.model,

                metadata:
                    message.metadata,

                createdAt:
                    message.createdAt,

                updatedAt:
                    message.updatedAt

            })
        );

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        ROLES,

        STATUS,

        generateId,

        timestamp,

        isValidRole,

        create,

        user,

        assistant,

        system,

        tool,

        generating,

        update,

        complete,

        error,

        cancel,

        find,

        remove,

        updateById,

        append,

        last,

        lastAssistant,

        lastUser,

        serialize

    };

})();