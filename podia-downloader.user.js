// ==UserScript==
// @name         Podia.com video downloader
// @downloadURL  https://github.com/Lambik/wistia-downloader/raw/master/audioguy-downloader.user.js
// @namespace    https://github.com/Lambik/
// @version      0.1
// @description  Make all wistia videos downloadable on podia courses
// @author       You
// @match        *://*.podia.com/*
// @connect      fast.wistia.net
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function () {
	'use strict';

	function parseVideos() {
		let filename = [...document.getElementById('user-site-course-content-container').getElementsByClassName('text-muted')]
			.filter((a) => !a.classList.contains('comment-created-at'))
			.map((a) => a.text);
		filename.push(document.title);
		filename = filename
			.join(' - ')
			.replace(/[\/\\]/g, '-') // replace slashes (to not create a path)
			.replace(/"/g, "'") // replace double apostrophe to single
			.replace(/'/g, `'\\''`) // the replace makes it bash-friendly in case there are apostrophes
			.replace(/:/g, ' -') // replace colon (for windows)
		;

		let viddivs = document.getElementsByClassName('wistia_embed');
		console.log('Found ' + viddivs.length + ' wista video divs');

		for (let viddiv of viddivs) {
			let wistiaId = viddiv.id.split('-')[1];
			console.log('Getting info on wistia video ' + wistiaId);

			GM_xmlhttpRequest(
				{
					method : 'GET',
					url    : 'https://fast.wistia.net/embed/iframe/' + wistiaId,
					onerror: function (result) {
						console.error('xmlrequest error', result);
					},
					onabort: function (result) {
						console.error('xmlrequest abort', result);
					},
					onload : function (result) {
						let body = result.responseText;
						let assets = body.match(/"assets":(\[.*?\])/);
						if (assets.length) {
							console.log('Got wistia metadata');
							let allvids = JSON.parse(assets[1]);
							// console.log(allvids);
							let newNode = document.createElement('div');
							let str = "<h4>Download options:</h4><ul>";
							for (let vid of allvids) {
								if (vid.type != 'hls_video' && vid.public) {
									str += '<li style="font-size: 1.5rem;">' + vid.display_name + ' (' + vid.width + 'x' + vid.height + ', ' + vid.ext + '): <a href="' + vid.url + '" target="_blank">' + formatBytes(vid.size) + '</a> <input type="text" value="wget -O \''+filename+'.mp4\' ' + vid.url + '" onfocus="this.select()"></li>';
								}
							}
							str += "</ul>";
							newNode.innerHTML = str;
							newNode.style.fontSize = 'auto';
							viddiv.parentNode.parentNode.parentNode.appendChild(newNode)
						}
						else {
							console.error('wista returned invalid data', body);
						}
					}
				}
			);
		}

		let vimeoiframes = [...document.getElementsByTagName('iframe')].filter((ifr) => ifr.src.includes('vimeo'));
		console.log('Found ' + vimeoiframes.length + ' vimeo video iframes');

		for (let vimeoiframe of vimeoiframes) {
			let newNode = document.createElement('div');
			let str = "<h4>Download options:</h4>";
			str += '<input type="text" value="youtube-dl -o \''+filename+'.%(ext)s\' ' + vimeoiframe.src + ' --referer ' + vimeoiframe.baseURI + '" onfocus="this.select()">';
			newNode.innerHTML = str;
			newNode.style.fontSize = 'auto';
			vimeoiframe.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.appendChild(newNode)
		}
	}

	function cleanNavigation() {
		[...document.getElementsByTagName('a')]
			.filter((a) => a.dataset.remote == 'true')
			.forEach((a) => {
				a.dataset.remote = 'false';
				a.dataset.action = '';
			});
	}

	// thanks to https://stackoverflow.com/a/18650828/102720
	function formatBytes(bytes, decimals = 2) {
		if (bytes === 0) {
			return '0 Bytes';
		}

		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}

	parseVideos();
	cleanNavigation();
})();
