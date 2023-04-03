// ==UserScript==
// @name         Focus Shepherd
// @version      1.0
// @description  A TamperMonkey script to help you focus when you need it.
// @author       Kenneth-LJS
// @match        *://*/*
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    const KEY_IS_FOCUSED_MODE = 'isFocusedMode';
    const KEY_BLOCKED_SITES_LIST = 'blockedSitesList';
    const KEY_BLOCKED_YOUTUBE_CHANNELS_LIST = 'blockedYoutubeChannelsList';

    const siteScripts = [
        {
            // YouTube
            match: location => location.hostname === 'www.youtube.com' && location.pathname === '/watch',
            enterFocus: () => {
                Array.from(document.querySelectorAll('video'))
                    .forEach(videoElem => {
                        videoElem.pause();
                    });
            },
            exitFocus: () => undefined,
        }
    ];

    function getRandomString() {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const randomCharacters = new Array(20).fill(0)
            .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
            .join('');
        const timestamp = (new Date()).getTime();
        return `focus-now__${randomCharacters}__${timestamp}`;
    }

    const shieldClass = getRandomString();
    const configClass = getRandomString();

    function createElementFromHtml(html) {
        const templateElem = document.createElement('template');
        templateElem.innerHTML = html;
        return templateElem.content.cloneNode(true).children[0];
    }

    const resetCss = `
        html, body, div, span, applet, object, iframe,
        h1, h2, h3, h4, h5, h6, p, blockquote, pre,
        a, abbr, acronym, address, big, cite, code,
        del, dfn, em, img, ins, kbd, q, s, samp,
        small, strike, strong, sub, sup, tt, var,
        b, u, i, center,
        dl, dt, dd, ol, ul, li,
        fieldset, form, label, legend,
        table, caption, tbody, tfoot, thead, tr, th, td,
        article, aside, canvas, details, embed,
        figure, figcaption, footer, header, hgroup,
        menu, nav, output, ruby, section, summary,
        time, mark, audio, video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline;
        }

        /* make sure to set some focus styles for accessibility */
        :focus {
            outline: 0;
        }

        /* HTML5 display-role reset for older browsers */
        article, aside, details, figcaption, figure,
        footer, header, hgroup, menu, nav, section {
            display: block;
        }

        body {
            line-height: 1;
        }

        ol, ul {
            list-style: none;
        }

        blockquote, q {
            quotes: none;
        }

        blockquote:before, blockquote:after,
        q:before, q:after {
            content: '';
            content: none;
        }

        table {
            border-collapse: collapse;
            border-spacing: 0;
        }

        input[type=search]::-webkit-search-cancel-button,
        input[type=search]::-webkit-search-decoration,
        input[type=search]::-webkit-search-results-button,
        input[type=search]::-webkit-search-results-decoration {
            -webkit-appearance: none;
            -moz-appearance: none;
        }

        input[type=search] {
            -webkit-appearance: none;
            -moz-appearance: none;
            -webkit-box-sizing: content-box;
            -moz-box-sizing: content-box;
            box-sizing: content-box;
        }

        textarea {
            overflow: auto;
            vertical-align: top;
            resize: vertical;
        }

        /**
         * Correct 'inline-block' display not defined in IE 6/7/8/9 and Firefox 3.
         */

        audio,
        canvas,
        video {
            display: inline-block;
            *display: inline;
            *zoom: 1;
            max-width: 100%;
        }

        /**
         * Prevent modern browsers from displaying 'audio' without controls.
         * Remove excess height in iOS 5 devices.
         */

        audio:not([controls]) {
            display: none;
            height: 0;
        }

        /**
         * Address styling not present in IE 7/8/9, Firefox 3, and Safari 4.
         * Known issue: no IE 6 support.
         */

        [hidden] {
            display: none;
        }

        /**
         * 1. Correct text resizing oddly in IE 6/7 when body 'font-size' is set using
         *    'em' units.
         * 2. Prevent iOS text size adjust after orientation change, without disabling
         *    user zoom.
         */

        html {
            font-size: 100%; /* 1 */
            -webkit-text-size-adjust: 100%; /* 2 */
            -ms-text-size-adjust: 100%; /* 2 */
        }

        /**
         * Address 'outline' inconsistency between Chrome and other browsers.
         */

        a:focus {
            outline: thin dotted;
        }

        /**
         * Improve readability when focused and also mouse hovered in all browsers.
         */

        a:active,
        a:hover {
            outline: 0;
        }

        /**
         * 1. Remove border when inside 'a' element in IE 6/7/8/9 and Firefox 3.
         * 2. Improve image quality when scaled in IE 7.
         */

        img {
            border: 0; /* 1 */
            -ms-interpolation-mode: bicubic; /* 2 */
        }

        /**
         * Address margin not present in IE 6/7/8/9, Safari 5, and Opera 11.
         */

        figure {
            margin: 0;
        }

        /**
         * Correct margin displayed oddly in IE 6/7.
         */

        form {
            margin: 0;
        }

        /**
         * Define consistent border, margin, and padding.
         */

        fieldset {
            border: 1px solid #c0c0c0;
            margin: 0 2px;
            padding: 0.35em 0.625em 0.75em;
        }

        /**
         * 1. Correct color not being inherited in IE 6/7/8/9.
         * 2. Correct text not wrapping in Firefox 3.
         * 3. Correct alignment displayed oddly in IE 6/7.
         */

        legend {
            border: 0; /* 1 */
            padding: 0;
            white-space: normal; /* 2 */
            *margin-left: -7px; /* 3 */
        }

        /**
         * 1. Correct font size not being inherited in all browsers.
         * 2. Address margins set differently in IE 6/7, Firefox 3+, Safari 5,
         *    and Chrome.
         * 3. Improve appearance and consistency in all browsers.
         */

        button,
        input,
        select,
        textarea {
            font-size: 100%; /* 1 */
            margin: 0; /* 2 */
            vertical-align: baseline; /* 3 */
            *vertical-align: middle; /* 3 */
        }

        /**
         * Address Firefox 3+ setting 'line-height' on 'input' using '!important' in
         * the UA stylesheet.
         */

        button,
        input {
            line-height: normal;
        }

        /**
         * Address inconsistent 'text-transform' inheritance for 'button' and 'select'.
         * All other form control elements do not inherit 'text-transform' values.
         * Correct 'button' style inheritance in Chrome, Safari 5+, and IE 6+.
         * Correct 'select' style inheritance in Firefox 4+ and Opera.
         */

        button,
        select {
            text-transform: none;
        }

        /**
         * 1. Avoid the WebKit bug in Android 4.0.* where (2) destroys native 'audio'
         *    and 'video' controls.
         * 2. Correct inability to style clickable 'input' types in iOS.
         * 3. Improve usability and consistency of cursor style between image-type
         *    'input' and others.
         * 4. Remove inner spacing in IE 7 without affecting normal text inputs.
         *    Known issue: inner spacing remains in IE 6.
         */

        button,
        html input[type="button"], /* 1 */
        input[type="reset"],
        input[type="submit"] {
            -webkit-appearance: button; /* 2 */
            cursor: pointer; /* 3 */
            *overflow: visible;  /* 4 */
        }

        /**
         * Re-set default cursor for disabled elements.
         */

        button[disabled],
        html input[disabled] {
            cursor: default;
        }

        /**
         * 1. Address box sizing set to content-box in IE 8/9.
         * 2. Remove excess padding in IE 8/9.
         * 3. Remove excess padding in IE 7.
         *    Known issue: excess padding remains in IE 6.
         */

        input[type="checkbox"],
        input[type="radio"] {
            box-sizing: border-box; /* 1 */
            padding: 0; /* 2 */
            *height: 13px; /* 3 */
            *width: 13px; /* 3 */
        }

        /**
         * 1. Address 'appearance' set to 'searchfield' in Safari 5 and Chrome.
         * 2. Address 'box-sizing' set to 'border-box' in Safari 5 and Chrome
         *    (include '-moz' to future-proof).
         */

        input[type="search"] {
            -webkit-appearance: textfield; /* 1 */
            -moz-box-sizing: content-box;
            -webkit-box-sizing: content-box; /* 2 */
            box-sizing: content-box;
        }

        /**
         * Remove inner padding and search cancel button in Safari 5 and Chrome
         * on OS X.
         */

        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-decoration {
            -webkit-appearance: none;
        }

        /**
         * Remove inner padding and border in Firefox 3+.
         */

        button::-moz-focus-inner,
        input::-moz-focus-inner {
            border: 0;
            padding: 0;
        }

        /**
         * 1. Remove default vertical scrollbar in IE 6/7/8/9.
         * 2. Improve readability and alignment in all browsers.
         */

        textarea {
            overflow: auto; /* 1 */
            vertical-align: top; /* 2 */
        }

        /**
         * Remove most spacing between table cells.
         */

        table {
            border-collapse: collapse;
            border-spacing: 0;
        }

        html,
        button,
        input,
        select,
        textarea {
            color: #222;
        }


        ::-moz-selection {
            background: #b3d4fc;
            text-shadow: none;
        }

        ::selection {
            background: #b3d4fc;
            text-shadow: none;
        }

        img {
            vertical-align: middle;
        }

        fieldset {
            border: 0;
            margin: 0;
            padding: 0;
        }

        textarea {
            resize: vertical;
        }

        .chromeframe {
            margin: 0.2em 0;
            background: #ccc;
            color: #000;
            padding: 0.2em 0;
        }

        a {
            color: inherit;
            text-decoration: none; /* no underline */
        }

        /**
         * Make all elements size by border
         */

        html {
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
        }

        *, *:before, *:after {
            -webkit-box-sizing: inherit;
            -moz-box-sizing: inherit;
            box-sizing: inherit;
        }
    `;

    function makeContainedUI(className, css, bodyHtml, initializeUI) {
        const iframeElem = document.createElement('iframe');
        if (className) {
            iframeElem.classList.add(className);
        }
        const html = `
            <html>
                ${css && `
                    <head>
                        <style>
                            ${resetCss}
                        </style>
                        <style>
                            body {
                                overflow: hidden;
                            }
                        </style>
                        <style>
                            ${css}
                        </style>
                    </head>
                `}
                <body>
                    ${bodyHtml}
                </body>
            </html>
        `;
        iframeElem.setAttribute('srcdoc', html);
        iframeElem.addEventListener('load', (event) => {
            iframeElem.style.height = iframeElem.contentWindow.document.body.scrollHeight + 'px';
            initializeUI && initializeUI(iframeElem.contentWindow, iframeElem);
        });
        return iframeElem;
    }

    const fontImportUrl = 'https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,400;0,700;1,400;1,700&display=swap';
    const primaryFont = `'Ubuntu', sans-serif`;
    GM_addStyle(`
        .${shieldClass} {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;

            z-index: 999999998;
        }

        .${shieldClass}-contentContainer,
        .${shieldClass}-content {
            width: 100%;
            height: 100vh;
        }

        .${shieldClass}-content {
            border: none;
        }

        .${configClass} {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100vh;
            box-sizing: border-box;

            z-index: 999999999;

            pointer-events: none;

            display: flex;
            justify-content: center;
            align-items: center;

            padding: 16px;
        }

        .${configClass}-modal {
            width: 400px;
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 32px);
            box-sizing: border-box;

            border-radius: 5px;
            filter: drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.3));

            overflow: hidden;
            pointer-events: auto;
        }

        .${configClass}-scrollContainer {
            overflow: auto;
            max-height: calc(100vh - 32px);
        }

        .${configClass}-content {
            width: 100%;

            margin: 0;
            padding: 0;
            border: none;
        }

        .${configClass}-content,
        .${configClass}-content * {
            margin: 0;
            padding: 0;
        }
    `);

    function makeShieldElement() {
        const shieldElem = createElementFromHtml(`
            <div class="${shieldClass}">
                <div class="${shieldClass}-contentContainer">
                </div>
            </div>
        `);

        const shieldContentElem = makeContainedUI(
            `${shieldClass}-content`,
            `
                @import url('${fontImportUrl}');

                body {
                    font-size: 24px;
                }

                .contentContainer {
                    width: 100%;
                    height: 100vh;

                    /* background-color: white; */
                    background: linear-gradient(to bottom, white, 90%, #1768AC);

                    padding: 16px 16px 42px 16px;

                    display: flex;
                    justify-content: center;
                    align-items: center;

                    font-family: ${primaryFont};
                }

                h1 {
                    font-size: 2em;
                }

                h2 {
                    font-size: 1.5em;
                }

                .content > * + * {
                    margin-top: 1rem;
                }

                .buttonContainer {
                    margin-top: 3rem;
                }

                .buttonContainer > * + * {
                    margin-top: 1rem;
                }

                .buttonContainer button {
                    width: 100%;

                    border: none;
                    border-radius: 5px;

                    padding: 12px 32px;

                    color: white;
                    background-color: hsl(221, 57%, 42%);

                    transition: background-color 0.3s;
                }

                .buttonContainer button:hover {
                    background-color: hsl(221, 57%, 22%);
                }

            `,
            `
                <div class="contentContainer">
                    <div class="content">
                        <h1>Wait a minute...</h1>
                        <h2>Don't you have something else to do?</h2>
                        <div class="buttonContainer">
                            <button class="disableShieldButton">Let me in just this once</button>
                            <button class="disableFocusModeButton">I'm done!</button>
                        </div>
                    </div>
                </div>
            `,
            async (window, iframeElem) => {
                const document = window.document;

                function disableShield() {
                    setIsShieldDisabled(true);
                }

                function disableFocusMode() {
                    setIsFocusedMode(false);
                }

                document.querySelector('.disableShieldButton').addEventListener('click', disableShield);
                document.querySelector('.disableFocusModeButton').addEventListener('click', disableFocusMode);

                iframeElem.style.height = '100vh';
            }
        );

        shieldElem.querySelector(`.${shieldClass}-contentContainer`).append(shieldContentElem);

        return shieldElem;
    }

    function makeConfigElement() {
        const configElem = createElementFromHtml(`
            <div class="${configClass}">
                <div class="${configClass}-modal">
                    <div class="${configClass}-scrollContainer">
                        <div class="${configClass}-contentContainer">
                        </div>
                    </div>
                </div>
            </div>
        `);

        const configContentElem = makeContainedUI(
            `${configClass}-content`,
            `
                @import url('${fontImportUrl}');

                .content {
                    background-color: white;

                    padding: 12px;

                    font-family: ${primaryFont};
                    font-size: 14px;
                    line-height: 1.4;

                    position: relative;
                }

                .exitButton {
                    position: absolute;
                    top: 0;
                    right: 0;

                    padding: 12px;

                    cursor: pointer;
                }

                .exitIcon {
                    width: 20px;
                    height: 20px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 22'%3E%3Cpath d='M11,9.58578644 L16.2928932,4.29289322 C16.6834175,3.90236893 17.3165825,3.90236893 17.7071068,4.29289322 C18.0976311,4.68341751 18.0976311,5.31658249 17.7071068,5.70710678 L12.4142136,11 L17.7071068,16.2928932 C18.0976311,16.6834175 18.0976311,17.3165825 17.7071068,17.7071068 C17.3165825,18.0976311 16.6834175,18.0976311 16.2928932,17.7071068 L11,12.4142136 L5.70710678,17.7071068 C5.31658249,18.0976311 4.68341751,18.0976311 4.29289322,17.7071068 C3.90236893,17.3165825 3.90236893,16.6834175 4.29289322,16.2928932 L9.58578644,11 L4.29289322,5.70710678 C3.90236893,5.31658249 3.90236893,4.68341751 4.29289322,4.29289322 C4.68341751,3.90236893 5.31658249,3.90236893 5.70710678,4.29289322 L11,9.58578644 L11,9.58578644 Z'/%3E%3C/svg%3E");
                }

                .content > *:not(.noFlow) + *:not(.noFlow) {
                    margin-top: 24px;
                }

                h1 {
                    font-size: 2em;
                    font-weight: bold;
                }

                .fields > * + * {
                    margin-top: 24px;
                }

                .field > * + * {
                    margin-top: 6px;
                }

                .fieldLabel {
                    font-weight: bold;
                }

                .fieldInput textarea {
                    padding: 4px;

                    font-family: ${primaryFont};
                    font-size: 14px;
                    line-height: 1.4;

                    width: 100%;
                    height: 200px;
                }

                .configButtons {
                    display: flex;
                    gap: 6px;
                    justify-content: flex-end;
                }

                .configButtons button {
                    width: 65px;

                    border: none;
                    border-radius: 3px;

                    padding: 3px;

                    color: black;

                    transition: background-color 0.3s;
                }

                .configButtons button.cancelButton {
                    background-color: hsl(0, 0%, 80%);
                }

                .configButtons button.cancelButton:hover {
                    background-color: hsl(0, 0%, 90%);
                }

                .configButtons button.saveButton {
                    background-color: hsl(214, 100%, 75%);
                }

                .configButtons button.saveButton:hover {
                    background-color: hsl(214, 100%, 85%);
                }
            `,
            `
                <div class="content">
                    <div class="exitButton noFlow"><div class="exitIcon"></div></div>
                    <h1>Configurations</h1>
                    <div class="fields">
                    </div>
                    <div class="configButtons">
                        <button class="saveButton">Save</button>
                        <!-- <button class="cancelButton">Cancel</button> -->
                    </div>
                </div>
            `,
            async (window, iframeElem) => {
                const document = window.document;
                const fieldsElem = document.querySelector('.fields');

                const getFieldValues = await Promise.all(
                    configFields.map(async (configField) => {
                        const fieldElem = createElementFromHtml(`
                            <div class="field">
                                <label>
                                    <div class="fieldLabel">
                                        ${configField.label}
                                    </div>
                                    <div class="fieldInput">
                                    </div>
                                </label>
                            </div>
                        `);

                        let fieldInputElem = undefined;
                        let fieldInputVal = await configField.get();
                        let getFieldValue = () => undefined;
                        if (configField.type == 'textarea') {
                            fieldInputElem = document.createElement('textarea');
                            fieldInputElem.value = fieldInputVal;
                            getFieldValue = () => fieldInputElem.value;
                        }

                        fieldElem.querySelector('.fieldInput').append(fieldInputElem);
                        fieldsElem.append(fieldElem);

                        return getFieldValue;
                    })
                );

                async function handleSave() {
                    configFields.forEach((configField, i) => {
                        const fieldValue = getFieldValues[i]();
                        configField.set(fieldValue);
                    });
                    configElem.remove();
                    setShouldPageBeBlocked(await checkShouldPageBeBlocked());
                }

                function handleExit() {
                    configElem.remove();
                }

                document.querySelector('.saveButton').addEventListener('click', (handleSave));
                document.querySelector('.exitButton').addEventListener('click', handleExit);

                iframeElem.style.height = iframeElem.contentWindow.document.body.scrollHeight + 'px';
            }
        );

        configElem.querySelector(`.${configClass}-contentContainer`).append(configContentElem);

        return configElem;
    }

    const [getBlockedSitesList, getBlockedSitesListStr, setBlockedSitesListStr]
        = makeListConfig(KEY_BLOCKED_SITES_LIST);

    const [getBlockedYoutubeChannelsList, getBlockedYoutubeChannelsListStr, setBlockedYoutubeChannelsListStr]
        = makeListConfig(KEY_BLOCKED_YOUTUBE_CHANNELS_LIST);

    const configFields = [
        {
            label: 'Blocked sites',
            type: 'textarea',
            get: getBlockedSitesListStr,
            set: setBlockedSitesListStr,
        },
        {
            label: 'Blocked Youtube channels',
            type: 'textarea',
            get: getBlockedYoutubeChannelsListStr,
            set: setBlockedYoutubeChannelsListStr,
        },
    ]

    function makeListConfig(key) {

        async function getList() {
            return (await getListStr())
                .split('\n')
                .filter(line => line.length > 0);
        }

        async function getListStr() {
            return GM_getValue(key, '');
        }

        async function setListStr(str) {
            return GM_setValue(key, str);
        }

        return [getList, getListStr, setListStr];
    }

    async function checkShouldPageBeBlocked() {
        const curHostname = window.location.hostname;
        const blockedSitesList = await getBlockedSitesList();
        if (blockedSitesList.includes(curHostname)) {
            return true;
        } else if (curHostname === 'www.youtube.com') {
            if (window.location.pathname === '/watch') {
                const blockedYoutubeChannelsList = await getBlockedYoutubeChannelsList();
                const channelName = document.querySelector('#meta #upload-info.ytd-video-owner-renderer a')?.innerText;
                if (blockedYoutubeChannelsList.includes(channelName)) {
                    return true;
                }
            }
        }
        return false;
    }

    function enterFocusMode() {
        setIsFocusedMode(true);
        setIsShieldDisabled(false);
    }

    function exitFocusMode() {
        setIsFocusedMode(false);
        setIsShieldDisabled(false);
    }

    function openConfig() {
        document.body.append(makeConfigElement());
    }

    let menuCommandId_enable = undefined;
    let menuCommandId_settings = undefined;
    async function updateContextMenu(isFocusedMode) {
        typeof menuCommandId_enable !== 'undefined' && GM_unregisterMenuCommand(menuCommandId_enable);
        typeof menuCommandId_settings !== 'undefined' && GM_unregisterMenuCommand(menuCommandId_settings);
        menuCommandId_enable = (isFocusedMode)
            ? GM_registerMenuCommand('Exit focus mode', exitFocusMode, 'E')
            : GM_registerMenuCommand('Enter focus mode', enterFocusMode, 'E');
        menuCommandId_settings = GM_registerMenuCommand('Settings', openConfig, 'S');
    }

    const { setIsFocusedMode, setShouldPageBeBlocked, setIsShieldDisabled } = (() => {

        let shouldPageBeBlocked = false;

        let isEnabledState = false;

        async function getIsFocusedMode() {
            return await GM_getValue(KEY_IS_FOCUSED_MODE, false);
        }

        async function setIsFocusedMode(newIsFocusedMode) {
            const isFocusedMode = await getIsFocusedMode();
            if (isFocusedMode === newIsFocusedMode) {
                return;
            }
            await GM_setValue(KEY_IS_FOCUSED_MODE, newIsFocusedMode);
            updateContextMenu(newIsFocusedMode);
            triggerStateCheck();
        }

        GM_addValueChangeListener(
            KEY_IS_FOCUSED_MODE,
            (name, oldValue, newValue, isRemote) => {
                setIsShieldDisabled(false);
                updateContextMenu(newValue);
                triggerStateCheck();
            }
        );

        function setShouldPageBeBlocked(newShouldPageBeBlocked) {
            if (shouldPageBeBlocked === newShouldPageBeBlocked) {
                return;
            }
            shouldPageBeBlocked = newShouldPageBeBlocked;
            triggerStateCheck();
        }

        async function getIsShieldDisabled() {
            let storageIsShieldDisabled = window.sessionStorage.getItem('focusShieldDisabled');
            if (typeof storageIsShieldDisabled === 'undefined') {
                storageIsShieldDisabled = fa;se
            } else if (typeof storageIsShieldDisabled === 'string') {
                storageIsShieldDisabled = storageIsShieldDisabled === 'true';
            }
            return storageIsShieldDisabled;
        }

        async function setIsShieldDisabled(newIsShieldDisabled) {
            const isShieldDisabled = await getIsShieldDisabled();
            if (isShieldDisabled === newIsShieldDisabled) {
                return;
            }
            window.sessionStorage.setItem('focusShieldDisabled', newIsShieldDisabled);
            triggerStateCheck();
        }

        async function triggerStateCheck() {
            const isFocusedMode = await getIsFocusedMode();
            const isShieldDisabled = await getIsShieldDisabled();

            // console.log('triggerStateCheck', isFocusedMode, shouldPageBeBlocked, isShieldDisabled);

            const newIsEnabledState = isFocusedMode && shouldPageBeBlocked && !isShieldDisabled;
            if (isEnabledState === newIsEnabledState) {
                return;
            }
            isEnabledState = newIsEnabledState;
            updateShieldElement(isEnabledState);
        }

        (async () => {
            updateContextMenu(await getIsFocusedMode());
        })();

        triggerStateCheck();

        return {
            setIsFocusedMode,
            setShouldPageBeBlocked,
            setIsShieldDisabled,
        }
    })();

    function updateShieldElement(isEnabled) {
        Array.from(document.querySelectorAll(`.${shieldClass}`))
            .forEach(shieldElem => shieldElem.remove());

        siteScripts.forEach(siteScript => {
            if (!siteScript.match(window.location)) {
                return;
            }
            const siteScriptFunc = isEnabled ? siteScript.enterFocus : siteScript.exitFocus;
            siteScriptFunc && siteScriptFunc();
        });

        if (isEnabled) {
            const shieldElem = makeShieldElement();

            document.body.append(shieldElem);
        }
    }

    async function handleUrlChange() {
        setShouldPageBeBlocked(await checkShouldPageBeBlocked());
    }

    async function handleOnLoad() {
        setShouldPageBeBlocked(await checkShouldPageBeBlocked());
    }

    const onUrlChange = (() => {

        const allCallbacks = [];
        function callAllCallbacks(curLocationHref) {
            allCallbacks.forEach(callback => callback(curLocationHref));
        }

        let prevLocationHref = window.location.href;
        const observer = new MutationObserver(() => {
            const curLocationHref = window.location.href;
            if (curLocationHref === prevLocationHref) {
                return;
            }
            prevLocationHref = curLocationHref;
            callAllCallbacks(curLocationHref);
        });
        observer.observe(document.body, { subtree: true, childList: true });

        function onUrlChange(callback) {
            allCallbacks.push(callback);
        }

        return onUrlChange;
    })();

    [KEY_BLOCKED_SITES_LIST, KEY_BLOCKED_YOUTUBE_CHANNELS_LIST].forEach(key => {
        GM_addValueChangeListener(key, async () => {
            setShouldPageBeBlocked(await checkShouldPageBeBlocked());
        });
    });

    document.addEventListener('DOMContentLoaded', handleOnLoad);
    onUrlChange(handleUrlChange);

    if (document.body) {
        handleOnLoad();
    }
})();
