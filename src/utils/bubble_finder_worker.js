 import {MessageTypes} from "./bubble_finder_common";

 function waitForFinish(callback, timeoutMs = 10000, timeoutCheckMs = 100) {
  if (cv.Mat) callback(true)
  let timeSpentMs = 0
  const interval = setInterval(() => {
    const limitReached = timeSpentMs > timeoutMs
    if (cv.Mat || limitReached) {
      clearInterval(interval)
      return callback(!limitReached)
    } else {
      timeSpentMs += timeoutCheckMs
    }
  }, timeoutCheckMs)
}

function debug(msg, ...args) {
  postMessage({ type: MessageTypes.LogDebug, for: msg.id, args: ["bubble_finder_worker"] + args})
}

function error(msg, ...args) {
  portMessage({ name: MessageTypes.LogError, for: msg.id, args: ["bubble_finder_worker"] + args})
}

function init(msg) {
}

function findBubble(msg) {
  
}

function dispatchMessage(msg) {
  switch(msg.type) {
    case MessageTypes.Init: init(msg)
    case MessageTypes.Run: 
  }
}


onmessage = function (e) {
  let msg = e.data
  let timeoutMs = (msg.timeoutMs) ? msg.timeoutMs : 10000
  let timeoutCheckMs = (msg.timeoutCheckMs) ? msg.timeoutCheckMs : 100
  try {
    if (dispatchMessage(msg)) {
      waitForFinish(function (success) {
        if (success) {
          postMessage({ type: MessageTypes.Success, for: msg.id })
        } else {
          error(msg, "processing timeout", msg, timeoutMs, timeoutCheckMs)
          postMessage({type: MessageTypes.Failure, for: msg.id})
        } 
      }, timeoutMs, timeoutCheckMs);
    } else {
      error(msg, "failed to dispatch", msg, timeoutMs, timeoutCheckMs)
      postMessage({type: MessageTypes.Failure, for: msg.id})
    }
  } catch (e) {
    error(msg, "exception caught", msg, e)
    postMessage({type: MessageTypes.Failure, for: msg.id})
  }
}
