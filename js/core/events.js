"use strict";

/**
 * =========================================================
 * ChatGVTL Event Manager
 * =========================================================
 *
 * Sistem event internal ChatGVTL.
 *
 * Digunakan agar module:
 *
 * - chat
 * - UI
 * - composer
 * - sidebar
 * - model selector
 * - router
 *
 * dapat berkomunikasi tanpa saling bergantung langsung.
 *
 * =========================================================
 */

const ChatGVTLEvents = (() => {

    /* =====================================================
       INTERNAL EVENT STORAGE
       ===================================================== */

    const listeners = {};


    /* =====================================================
       SUBSCRIBE
       ===================================================== */

    function on(eventName, callback) {

        if (
            typeof eventName !== "string" ||
            !eventName
        ) {

            console.warn(
                "[ChatGVTL Events] Invalid event name."
            );

            return () => {};

        }


        if (
            typeof callback !== "function"
        ) {

            console.warn(
                "[ChatGVTL Events] Callback must be a function."
            );

            return () => {};

        }


        if (!listeners[eventName]) {

            listeners[eventName] = [];

        }


        listeners[eventName].push(
            callback
        );


        /*
         * Return unsubscribe function.
         */

        return () => {

            off(
                eventName,
                callback
            );

        };

    }


    /* =====================================================
       UNSUBSCRIBE
       ===================================================== */

    function off(eventName, callback) {

        if (
            !listeners[eventName]
        ) {

            return false;

        }


        const index =
            listeners[eventName].indexOf(
                callback
            );


        if (index === -1) {

            return false;

        }


        listeners[eventName].splice(
            index,
            1
        );


        return true;

    }


    /* =====================================================
       EMIT EVENT
       ===================================================== */

    function emit(
        eventName,
        payload = null
    ) {

        if (
            !listeners[eventName]
        ) {

            return false;

        }


        /*
         * Copy listener array first.
         *
         * Ini mencegah masalah apabila
         * sebuah callback menghapus dirinya
         * sendiri ketika event sedang berjalan.
         */

        const callbacks = [
            ...listeners[eventName]
        ];


        callbacks.forEach(
            callback => {

                try {

                    callback(
                        payload
                    );

                } catch (error) {

                    console.error(
                        `[ChatGVTL Events] Error in "${eventName}":`,
                        error
                    );

                }

            }
        );


        return true;

    }


    /* =====================================================
       ONCE
       ===================================================== */

    function once(
        eventName,
        callback
    ) {

        if (
            typeof callback !== "function"
        ) {

            return () => {};

        }


        const wrapper =
            payload => {

                off(
                    eventName,
                    wrapper
                );


                callback(
                    payload
                );

            };


        return on(
            eventName,
            wrapper
        );

    }


    /* =====================================================
       CLEAR EVENT
       ===================================================== */

    function clear(eventName) {

        if (
            typeof eventName === "undefined"
        ) {

            Object.keys(
                listeners
            ).forEach(
                key => {

                    delete listeners[key];

                }
            );


            return true;

        }


        if (
            !listeners[eventName]
        ) {

            return false;

        }


        delete listeners[eventName];

        return true;

    }


    /* =====================================================
       CHECK LISTENER
       ===================================================== */

    function has(eventName) {

        return Boolean(
            listeners[eventName] &&
            listeners[eventName].length
        );

    }


    /* =====================================================
       GET LISTENER COUNT
       ===================================================== */

    function count(eventName) {

        if (
            !listeners[eventName]
        ) {

            return 0;

        }


        return listeners[eventName].length;

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        on,

        off,

        emit,

        once,

        clear,

        has,

        count

    };

})();