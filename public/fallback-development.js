/******/ (() => { // webpackBootstrap
/******/ 	"use strict";


self.fallback = async request => {
  // https://developer.mozilla.org/en-US/docs/Web/API/RequestDestination
  switch (request.destination) {
    case 'document':
      if (true) return caches.match("/offline.html", {
        ignoreSearch: true
      });
    case 'image':
      if (false) {}
    case 'audio':
      if (false) {}
    case 'video':
      if (false) {}
    case 'font':
      if (false) {}
    case '':
      if (false) {}
    default:
      return Response.error();
  }
};
/******/ })()
;