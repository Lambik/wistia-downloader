// ==UserScript==
// @name         Teachable video downloader
// @downloadURL  https://github.com/Lambik/teachable-downloader/raw/master/teachable-downloader.user.js
// @namespace    https://github.com/Lambik/
// @version      0.3
// @description  Make all wistia videos downloadable on teachable courses
// @author       You
// @match        *://*.teachable.com/*
// @match        *://courses.coursecreatorpro.com/*
// @match        *://courses.fulltimefilmmaker.com/*
// @match        *://courses.52kards.com/*
// @match        *://howtofreedive.com/*
// @connect      fast.wistia.net
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function parseVideos() {
        let viddivs = document.getElementsByClassName('attachment-wistia-player');

        for (let viddiv of viddivs) {
            let wistiaId = viddiv.dataset.wistiaId;

            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://fast.wistia.net/embed/iframe/' + wistiaId,
                onerror: function(result) {
                    console.error('xmlrequest error', result);
                },
                onabort: function(result) {
                    console.error('xmlrequest abort', result);
                },
                onload: function(result) {
                    let body = result.responseText;
                    let assets = body.match(/"assets":(\[.*?\])/);
                    if (assets.length) {
                        let allvids = JSON.parse(assets[1]);
                        console.log(allvids);
                        var newNode = document.createElement('div');
                        let str = "<h4>Download options:</h4><ul>";
                        for (let vid of allvids) {
                            if (vid.type != 'hls_video' && vid.public) {
                                str += '<li>' + vid.display_name + ' (' + vid.width + 'x' + vid.height + ', ' + vid.ext + '): <a href="' + vid.url + '" target="_blank">' + formatBytes(vid.size) + '</a></li>';
                            }
                        }
                        str += "</ul>";
                        newNode.innerHTML = str;
                        viddiv.parentNode.parentNode.parentNode.appendChild(newNode)
                    }
                    else {
                        console.error('wista returned invalid data', body);
                    }
                }
            });
        }
    }

    // thanks to https://stackoverflow.com/a/18650828/102720
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    parseVideos();

    window.addEventListener('lecture:ajax_success', parseVideos);
})();
