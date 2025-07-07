/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./service-worker.js":
/*!***************************!*\
  !*** ./service-worker.js ***!
  \***************************/
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* service-worker.js */ /* global self, clients */ importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');\nworkbox.precaching.precacheAndRoute([]);\n// プッシュ受信時のハンドラ\nself.addEventListener('push', (event)=>{\n    const payload = event.data.json();\n    console.log('[SW] push payload:', payload);\n    const { type, chatId, title, body } = payload;\n    event.waitUntil(clients.matchAll({\n        type: 'window',\n        includeUncontrolled: true\n    }).then((winClients)=>{\n        // チャット通知の場合、該当チャット画面が開いていれば抑制\n        const inChat = winClients.some((c)=>type === 'message' && c.url.includes(\"/chat/\".concat(chatId)) && c.visibilityState === 'visible');\n        if (inChat) return; // 開いていれば通知しない\n        // 通知を表示\n        return self.registration.showNotification(title, {\n            body,\n            tag: type + (chatId || ''),\n            data: payload\n        });\n    }));\n});\n// 通知クリック時のハンドラ\nself.addEventListener('notificationclick', (event)=>{\n    event.notification.close();\n    const { type, chatId } = event.notification.data;\n    const targetUrl = type === 'match' ? '/notifications' : \"/chat/\".concat(chatId);\n    event.waitUntil(clients.matchAll({\n        type: 'window',\n        includeUncontrolled: true\n    }).then((winClients)=>{\n        // すでに開いているタブがあればフォーカス\n        for (const client of winClients){\n            if (client.url.includes(targetUrl)) {\n                return client.focus();\n            }\n        }\n        // なければ新規ウィンドウを開く\n        return clients.openWindow(targetUrl);\n    }));\n});\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = __webpack_module__.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = __webpack_module__.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, __webpack_module__.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                __webpack_module__.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                /* unsupported import.meta.webpackHot */ undefined.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        __webpack_module__.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    __webpack_module__.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zZXJ2aWNlLXdvcmtlci5qcyIsIm1hcHBpbmdzIjoiO0FBQUEscUJBQXFCLEdBQ3JCLHdCQUF3QixHQUN4QkEsY0FBYztBQUNkQyxRQUFRQyxVQUFVLENBQUNDLGdCQUFnQixDQUFDQyxLQUFLQyxhQUFhO0FBRXRELGVBQWU7QUFDZkQsS0FBS0UsZ0JBQWdCLENBQUMsUUFBUUMsQ0FBQUE7SUFDNUIsTUFBTUMsVUFBVUQsTUFBTUUsSUFBSSxDQUFDQyxJQUFJO0lBQy9CQyxRQUFRQyxHQUFHLENBQUMsc0JBQXNCSjtJQUNsQyxNQUFNLEVBQUVLLElBQUksRUFBRUMsTUFBTSxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRSxHQUFHUjtJQUV0Q0QsTUFBTVUsU0FBUyxDQUNiQyxRQUFRQyxRQUFRLENBQUM7UUFBRU4sTUFBTTtRQUFVTyxxQkFBcUI7SUFBSyxHQUFHQyxJQUFJLENBQUNDLENBQUFBO1FBQ25FLDhCQUE4QjtRQUM5QixNQUFNQyxTQUFTRCxXQUFXRSxJQUFJLENBQUNDLENBQUFBLElBQzdCWixTQUFTLGFBQ1RZLEVBQUVDLEdBQUcsQ0FBQ0MsUUFBUSxDQUFDLFNBQWdCLE9BQVBiLFlBQ3hCVyxFQUFFRyxlQUFlLEtBQUs7UUFFeEIsSUFBSUwsUUFBUSxRQUFVLGNBQWM7UUFFcEMsUUFBUTtRQUNSLE9BQU9uQixLQUFLeUIsWUFBWSxDQUFDQyxnQkFBZ0IsQ0FBQ2YsT0FBTztZQUMvQ0M7WUFDQWUsS0FBS2xCLE9BQVFDLENBQUFBLFVBQVUsRUFBQztZQUN4QkwsTUFBTUQ7UUFDUjtJQUNGO0FBRUo7QUFFQSxlQUFlO0FBQ2ZKLEtBQUtFLGdCQUFnQixDQUFDLHFCQUFxQkMsQ0FBQUE7SUFDekNBLE1BQU15QixZQUFZLENBQUNDLEtBQUs7SUFDeEIsTUFBTSxFQUFFcEIsSUFBSSxFQUFFQyxNQUFNLEVBQUUsR0FBR1AsTUFBTXlCLFlBQVksQ0FBQ3ZCLElBQUk7SUFDaEQsTUFBTXlCLFlBQVlyQixTQUFTLFVBQVUsbUJBQW1CLFNBQWdCLE9BQVBDO0lBRWpFUCxNQUFNVSxTQUFTLENBQ2JDLFFBQVFDLFFBQVEsQ0FBQztRQUFFTixNQUFNO1FBQVVPLHFCQUFxQjtJQUFLLEdBQUdDLElBQUksQ0FBQ0MsQ0FBQUE7UUFDbkUsc0JBQXNCO1FBQ3RCLEtBQUssTUFBTWEsVUFBVWIsV0FBWTtZQUMvQixJQUFJYSxPQUFPVCxHQUFHLENBQUNDLFFBQVEsQ0FBQ08sWUFBWTtnQkFDbEMsT0FBT0MsT0FBT0MsS0FBSztZQUNyQjtRQUNGO1FBQ0EsaUJBQWlCO1FBQ2pCLE9BQU9sQixRQUFRbUIsVUFBVSxDQUFDSDtJQUM1QjtBQUVKIiwic291cmNlcyI6WyIvVXNlcnMvdGFrdW1pa2l5YW1hL0RvY3VtZW50cy9HaXRIdWIvY2hhdC1hcHAvc2VydmljZS13b3JrZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogc2VydmljZS13b3JrZXIuanMgKi9cbi8qIGdsb2JhbCBzZWxmLCBjbGllbnRzICovXG5pbXBvcnRTY3JpcHRzKCdodHRwczovL3N0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vd29ya2JveC1jZG4vcmVsZWFzZXMvNi41LjQvd29ya2JveC1zdy5qcycpO1xud29ya2JveC5wcmVjYWNoaW5nLnByZWNhY2hlQW5kUm91dGUoc2VsZi5fX1dCX01BTklGRVNUKTtcblxuLy8g44OX44OD44K344Ol5Y+X5L+h5pmC44Gu44OP44Oz44OJ44OpXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ3B1c2gnLCBldmVudCA9PiB7XG4gIGNvbnN0IHBheWxvYWQgPSBldmVudC5kYXRhLmpzb24oKTtcbiAgY29uc29sZS5sb2coJ1tTV10gcHVzaCBwYXlsb2FkOicsIHBheWxvYWQpO1xuICBjb25zdCB7IHR5cGUsIGNoYXRJZCwgdGl0bGUsIGJvZHkgfSA9IHBheWxvYWQ7XG5cbiAgZXZlbnQud2FpdFVudGlsKFxuICAgIGNsaWVudHMubWF0Y2hBbGwoeyB0eXBlOiAnd2luZG93JywgaW5jbHVkZVVuY29udHJvbGxlZDogdHJ1ZSB9KS50aGVuKHdpbkNsaWVudHMgPT4ge1xuICAgICAgLy8g44OB44Oj44OD44OI6YCa55+l44Gu5aC05ZCI44CB6Kmy5b2T44OB44Oj44OD44OI55S76Z2i44GM6ZaL44GE44Gm44GE44KM44Gw5oqR5Yi2XG4gICAgICBjb25zdCBpbkNoYXQgPSB3aW5DbGllbnRzLnNvbWUoYyA9PlxuICAgICAgICB0eXBlID09PSAnbWVzc2FnZScgJiZcbiAgICAgICAgYy51cmwuaW5jbHVkZXMoYC9jaGF0LyR7Y2hhdElkfWApICYmXG4gICAgICAgIGMudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZSdcbiAgICAgICk7XG4gICAgICBpZiAoaW5DaGF0KSByZXR1cm47ICAgLy8g6ZaL44GE44Gm44GE44KM44Gw6YCa55+l44GX44Gq44GEXG5cbiAgICAgIC8vIOmAmuefpeOCkuihqOekulxuICAgICAgcmV0dXJuIHNlbGYucmVnaXN0cmF0aW9uLnNob3dOb3RpZmljYXRpb24odGl0bGUsIHtcbiAgICAgICAgYm9keSxcbiAgICAgICAgdGFnOiB0eXBlICsgKGNoYXRJZCB8fCAnJyksXG4gICAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgICB9KTtcbiAgICB9KVxuICApO1xufSk7XG5cbi8vIOmAmuefpeOCr+ODquODg+OCr+aZguOBruODj+ODs+ODieODqVxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdub3RpZmljYXRpb25jbGljaycsIGV2ZW50ID0+IHtcbiAgZXZlbnQubm90aWZpY2F0aW9uLmNsb3NlKCk7XG4gIGNvbnN0IHsgdHlwZSwgY2hhdElkIH0gPSBldmVudC5ub3RpZmljYXRpb24uZGF0YTtcbiAgY29uc3QgdGFyZ2V0VXJsID0gdHlwZSA9PT0gJ21hdGNoJyA/ICcvbm90aWZpY2F0aW9ucycgOiBgL2NoYXQvJHtjaGF0SWR9YDtcblxuICBldmVudC53YWl0VW50aWwoXG4gICAgY2xpZW50cy5tYXRjaEFsbCh7IHR5cGU6ICd3aW5kb3cnLCBpbmNsdWRlVW5jb250cm9sbGVkOiB0cnVlIH0pLnRoZW4od2luQ2xpZW50cyA9PiB7XG4gICAgICAvLyDjgZnjgafjgavplovjgYTjgabjgYTjgovjgr/jg5bjgYzjgYLjgozjgbDjg5Xjgqnjg7zjgqvjgrlcbiAgICAgIGZvciAoY29uc3QgY2xpZW50IG9mIHdpbkNsaWVudHMpIHtcbiAgICAgICAgaWYgKGNsaWVudC51cmwuaW5jbHVkZXModGFyZ2V0VXJsKSkge1xuICAgICAgICAgIHJldHVybiBjbGllbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8g44Gq44GR44KM44Gw5paw6KaP44Km44Kj44Oz44OJ44Km44KS6ZaL44GPXG4gICAgICByZXR1cm4gY2xpZW50cy5vcGVuV2luZG93KHRhcmdldFVybCk7XG4gICAgfSlcbiAgKTtcbn0pOyJdLCJuYW1lcyI6WyJpbXBvcnRTY3JpcHRzIiwid29ya2JveCIsInByZWNhY2hpbmciLCJwcmVjYWNoZUFuZFJvdXRlIiwic2VsZiIsIl9fV0JfTUFOSUZFU1QiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJwYXlsb2FkIiwiZGF0YSIsImpzb24iLCJjb25zb2xlIiwibG9nIiwidHlwZSIsImNoYXRJZCIsInRpdGxlIiwiYm9keSIsIndhaXRVbnRpbCIsImNsaWVudHMiLCJtYXRjaEFsbCIsImluY2x1ZGVVbmNvbnRyb2xsZWQiLCJ0aGVuIiwid2luQ2xpZW50cyIsImluQ2hhdCIsInNvbWUiLCJjIiwidXJsIiwiaW5jbHVkZXMiLCJ2aXNpYmlsaXR5U3RhdGUiLCJyZWdpc3RyYXRpb24iLCJzaG93Tm90aWZpY2F0aW9uIiwidGFnIiwibm90aWZpY2F0aW9uIiwiY2xvc2UiLCJ0YXJnZXRVcmwiLCJjbGllbnQiLCJmb2N1cyIsIm9wZW5XaW5kb3ciXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./service-worker.js\n"));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	(() => {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = () => {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScript: (script) => (script)
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script */
/******/ 	(() => {
/******/ 		__webpack_require__.ts = (script) => (__webpack_require__.tt().createScript(script));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/react refresh */
/******/ 	(() => {
/******/ 		if (__webpack_require__.i) {
/******/ 		__webpack_require__.i.push((options) => {
/******/ 			const originalFactory = options.factory;
/******/ 			options.factory = (moduleObject, moduleExports, webpackRequire) => {
/******/ 				const hasRefresh = typeof self !== "undefined" && !!self.$RefreshInterceptModuleExecution$;
/******/ 				const cleanup = hasRefresh ? self.$RefreshInterceptModuleExecution$(moduleObject.id) : () => {};
/******/ 				try {
/******/ 					originalFactory.call(this, moduleObject, moduleExports, webpackRequire);
/******/ 				} finally {
/******/ 					cleanup();
/******/ 				}
/******/ 			}
/******/ 		})
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	
/******/ 	// noop fns to prevent runtime errors during initialization
/******/ 	if (typeof self !== "undefined") {
/******/ 		self.$RefreshReg$ = function () {};
/******/ 		self.$RefreshSig$ = function () {
/******/ 			return function (type) {
/******/ 				return type;
/******/ 			};
/******/ 		};
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./service-worker.js");
/******/ 	
/******/ })()
;