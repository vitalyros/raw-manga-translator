import {MessageTypes} from './bubble_finder_common'
import {loggingForModule} from './logging'

const moduleName = "bubble_finder"
const logging = loggingForModule(moduleName)
const enabled = false;
const status;
const worker;

const Statuses = {
  Initial: "Initial",
  Running: "Running",
  Success: "Success",
  Failure: "Failure",
  Disabled: "Disabled",
}

function postMessageAndWaitForResult(msg) {
  status = Statuses.Running
  worker.postMessage(msg)
  return new Promise((res, err) => {
    let interval = setInterval(() => {
      const currentStatus = status
      switch (currentStatus) {
        case Statuses.Running:
          // still running, do nothing
          break;
        case Statuses.Success:
          res()
          break;
        case Statuses.Failure: 
          err()
          break;
        default:
          logging.debug("currentStatus")
          clearInterval(interval)
          break;
      }
    }, 50)
  })
}

function onMessage(e) {
  logging.debug("incoming message from worker:", e)
}

function onError(e) {
  logging.debug("incoming error from worker:", e)
  status = Statuses.Failure
}
  

export async function enable() {
  if (!enabled) {
    status = Initial;
    worker = new Worker('bubble_finder_worker.js') 
    worker.onmessage = onMessage
    worker.onerror = onError
    await postMessageAndWaitForResult(MessageTypes.Init)
    enabled = true;
    logging.debug("module enabled", moduleName)
  }
}

export async function disable() {
  if (!enabled) {
    status = Disabled
    worker.terminate()
    worker = null
    enabled = false;
    logging.debug("module enabled", moduleName)
  }
}
