const readyCallbacks = [];
let readyPromiseResolve;
let readyPromise;
let isReady = false;
let isHookInstalled = false;
const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 16);

const getOrCreatePromise = () => {
  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      readyPromiseResolve = resolve;
    });
  }
  return readyPromise;
};

const markReady = () => {
  if (isReady) {
    return;
  }
  if (typeof SystemModule === 'undefined') {
    return;
  }
  isReady = true;
  const resolve = readyPromiseResolve;
  if (resolve) {
    resolve(SystemModule);
  }
  readyCallbacks.splice(0).forEach((cb) => {
    try {
      cb(SystemModule);
    } catch (error) {
      console.error('[systemModuleReady] callback failed', error);
    }
  });
};

const installHook = () => {
  if (isHookInstalled || typeof window === 'undefined') {
    return;
  }
  isHookInstalled = true;

  const waitForModule = () => {
    if (typeof SystemModule === 'undefined') {
      schedule(waitForModule);
      return;
    }

    if (SystemModule.calledRun) {
      markReady();
      return;
    }

    const previousHandler = SystemModule.onRuntimeInitialized;
    SystemModule.onRuntimeInitialized = () => {
      previousHandler?.();
      markReady();
    };
  };

  waitForModule();
};

export const whenSystemModuleReady = async () => {
  installHook();
  if (typeof SystemModule !== 'undefined' && SystemModule.calledRun) {
    markReady();
  }
  return getOrCreatePromise();
};

export const onSystemModuleReady = (callback) => {
  installHook();
  if (isReady && typeof SystemModule !== 'undefined') {
    callback(SystemModule);
    return;
  }
  readyCallbacks.push(callback);
};
