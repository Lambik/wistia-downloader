// ==UserScript==
// @name         Audioguy.co video downloader
// @downloadURL  https://github.com/Lambik/wistia-downloader/raw/master/audioguy-downloader.user.js
// @namespace    https://github.com/Lambik/
// @version      0.1
// @description  Make all wistia videos downloadable on audioguy courses
// @author       You
// @match        *://*.audioguy.co/*
// @connect      fast.wistia.net
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function parseVideos() {
        let viddivs = document.getElementsByClassName('wistia_embed');

        for (let viddiv of viddivs) {
            let wistiaId = viddiv.id.split('_')[1];

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
                                          // console.log(allvids);
                                          let newNode = document.createElement('div');
                                          let str = "<h4>Download options:</h4><ul>";
                                          for (let vid of allvids) {
                                              if (vid.type != 'hls_video' && vid.public) {
                                                  str += '<li style="font-size: 1rem;">' + vid.display_name + ' (' + vid.width + 'x' + vid.height + ', ' + vid.ext + '): <a href="' + vid.url + '" target="_blank">' + formatBytes(vid.size) + '</a></li>';
                                              }
                                          }
                                          str += "</ul>";
                                          newNode.innerHTML = str;
                                          newNode.style.color = 'white';
                                          newNode.style.fontSize = 'auto';
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
})();
