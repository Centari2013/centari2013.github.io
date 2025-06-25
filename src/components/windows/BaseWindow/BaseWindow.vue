<template>
    <div
    @mouseover="forwardMouseOver" @mouseout="forwardMouseOut"
  v-if="isMini"
  ref="restoreOverlay"
    @mousedown="restore"
    class="cursor-pointer fixed"
    :style="{
      zIndex: `${overlayZ}`,
      top: `${state.currentDimensions.position.top}px`,
      left: `${state.currentDimensions.position.left}px`,
      width: `${state.currentDimensions.size.width}px`,
      height: `${state.currentDimensions.size.height}px`,
      minWidth: `${state.minSize.width}px`,
      minHeight: `${state.minSize.height}px`,
    }"
  ></div>
  <div
    v-bind="$attrs"
    @mousedown="handleClick"
    data-augmented-ui="tl-clip tr-clip bl-scoop-x both"
    class="base-window"
    :class="{'opacity-75': opaque}"
    :style="{
      zIndex: `${windowZ}`,
      top: `${state.currentDimensions.position.top}px`,
      left: `${state.currentDimensions.position.left}px`,
      width: `${state.currentDimensions.size.width}px`,
      height: `${state.currentDimensions.size.height}px`,
      minWidth: `${state.minSize.width}px`,
      minHeight: `${state.minSize.height}px`,
    }"
    ref="resizableWindow"
  >
    <ResizeHandles :zIndex="zIndex" @startResize="handleStartResize"/>

    <!-- Vertical Title Bar -->
    <TitleBar
      v-bind="titlebarProps"
      @close="closeWindow"
      @minimize="minimizeWindow"
      @maximize="maximizeWindow"
      @export="$emit('export')"
      @opaque="opaque = !opaque"
      @startDrag="handleStartDrag"
    />

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <div ref="windowContent" class="window-content w-full h-full">
        <slot/>
      </div>
    </div>
  </div>
 
  
</template>

<script setup>
// Components
import ResizeHandles from "@/components/windows/BaseWindow/ResizeHandles.vue";
import TitleBar from "@/components/windows/BaseWindow/TitleBar.vue";


// Core Vue
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
} from "vue";




// App logic
import { startResize, startDrag } from "@/components/utilities/dragAndResize.js";
import { useWindowAnimations } from '@/components/windows/BaseWindow/useWindowAnimations'
import { clampPositionToViewport } from '@/components/windows/BaseWindow/dragAndResizeContext.js'
import { useAppsStore } from "@/components/stores/apps";
import { storeToRefs } from "pinia";


defineOptions({ inheritAttrs: false });
defineEmits(["export"]);

const props = defineProps([
  "initialPosition",
  "minWidth",
  "minHeight",
  "showMinimizeButton",
  "title",
  "getMaximized",
  "getMinimized",
  "getzIndex",
  "getMiniPos",
  "handleClose",
  "handleMinimize",
  "handleMaximize",
  "showExportButton",
  "isFileWin",
]);



// Refs
const resizableWindow = useTemplateRef("resizableWindow");
const restoreOverlay = useTemplateRef("restoreOverlay");
const resizableWindowObserver = ref(null);
const isMini = ref(false);
const opaque = ref(false);
const zIndex = ref(0);


const state = reactive({
  isRestoring: false,
  resizeDirection: null,
  startDimensions: null,
  currentDimensions: {
    position: { ...props.initialPosition },
    size: { width: 400, height: 300 },
  },
  previousDimensions: {
    position: { ...props.initialPosition },
    size: { width: 400, height: 300 },
  },
  minSize: {
    width: props.minWidth,
    height: props.minHeight,
  },
});

const {
  animateSnapToMinimized,
  animateRestore,
  animateMaximize,
  animateClose,
  moveMinimizedWindow,
  killWindowTween
} = useWindowAnimations(props.getMiniPos, state, resizableWindow, restoreOverlay)


const titlebarProps = {
  showMinimizeButton: props.showMinimizeButton,
  showExportButton: props.showExportButton,
  isFileWin: props.isFileWin,
  title: props.title,
  opaque
}

// External state
const appsStore = useAppsStore();
const { minimizedFiles } = storeToRefs(appsStore);

// Element references
const filebar = document.getElementById("filebar");

// Z-index computations
const windowZ = computed(() =>
  props.isFileWin && isMini.value
    ? appsStore.zIndexCounter + 1
    : zIndex.value
);
const overlayZ = computed(() => windowZ.value + 1);

// State tracking
let cancelWatchPosition = null;




// Core event forwarding
function forwardMouseEvent(type, originalEvent) {
  const targetEl = document.getElementById('filebar');
  if (!targetEl) return;

  const simulatedEvent = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: originalEvent.clientX,
    clientY: originalEvent.clientY,
    relatedTarget: originalEvent.relatedTarget,
  });

  targetEl.dispatchEvent(simulatedEvent);
}

function forwardMouseOver(e) {
  forwardMouseEvent("mouseover", e);
}

function forwardMouseOut(e) {
  forwardMouseEvent("mouseout", e);
}

// Drag and resize handling
function getDragResizeContext() {
  return {
    el: resizableWindow.value,
    state
  };
}

function handleStartDrag(event) {
  startDrag(getDragResizeContext(), event);
}

function handleStartResize(event, direction) {
  startResize(getDragResizeContext(), event, direction);
}

// Filebar tracking
function watchPosition(el, callback) {
  let isCancelled = false;
  let lastRect = el.getBoundingClientRect();

  function check() {
    if (isCancelled) return;
    const newRect = el.getBoundingClientRect();
    if (
      newRect.top !== lastRect.top ||
      newRect.left !== lastRect.left
    ) {
      callback(newRect, lastRect);
      lastRect = newRect;
    }
    requestAnimationFrame(check);
  }

  requestAnimationFrame(check);

  // return cleanup function
  return () => {
    isCancelled = true;
  };
}

const snapToMin = async () => {
  if (props.getMinimized() && !state.isRestoring) {
    await animateSnapToMinimized("center", 0.1);
  }
}


// Lifecycle
onMounted(() => {
  if (props.isFileWin) {
    cancelWatchPosition = watchPosition(filebar, snapToMin);
  }

  zIndex.value = props.getzIndex();
  const observer = new ResizeObserver(() => {
    state.currentDimensions.size.width = resizableWindow.value.offsetWidth;
    state.currentDimensions.size.height = resizableWindow.value.offsetHeight;
  });

  observer.observe(resizableWindow.value);
  resizableWindowObserver.value = observer;
  window.addEventListener("resize", handleViewportResize);
});

onBeforeUnmount(() => {
  if (cancelWatchPosition) cancelWatchPosition();
  // Disconnect observer if still active
  if (resizableWindowObserver.value) {
    resizableWindowObserver.value.disconnect();
    resizableWindowObserver.value = null;
  }
  window.removeEventListener("resize", handleViewportResize);
});



// Minimize / Maximize / Restore
async function minimizeWindow() {
  props.handleMinimize(true);
  isMini.value = true

  
  state.previousDimensions = JSON.parse(JSON.stringify(state.currentDimensions));
  await animateSnapToMinimized();
};

function maximizeWindow() {
  return new Promise((resolve) => {
    if (props.getMinimized()) {
      animateRestore().then(() => {
        new Promise((resolve) => {
          props.handleMinimize(false);
        })//.then(() => isMini.value = false)
        //props.handleMinimize(false);
        isMini.value =false
        resolve();
      });
    } else if (props.getMaximized()) {
      state.previousDimensions = {
        position: { ...props.initialPosition },
        size: { width: 400, height: 300 },
      }
      state.previousDimensions.position = clampPositionToViewport(
        state.previousDimensions.position,
        state.previousDimensions.size
      );
      animateRestore(true).then(() => {
        props.handleMaximize(false);
        resolve();
      });
    } else {
      state.previousDimensions = JSON.parse(JSON.stringify(state.currentDimensions));
      animateMaximize(); // if this is not async, we resolve immediately
      props.handleMaximize(true);
      resolve();
    }
  });
}

function restore() {
  state.isRestoring = true;
    killWindowTween()
    maximizeWindow().then(() => {
      zIndex.value = props.getzIndex();
      state.isRestoring = false;
    });
}

// Resize handling
async function handleViewportResize() {
  if (props.getMaximized()) {
    state.currentDimensions.size.width = window.innerWidth;
    state.currentDimensions.size.height = window.innerHeight;
  } else if (props.getMinimized()) {
    // clamp before restore
    state.previousDimensions.position = clampPositionToViewport(
      state.previousDimensions.position,
      state.previousDimensions.size
    );
    await animateSnapToMinimized("center", 0.1);
  }
}


// Clicks and window close
function handleClick() {
  zIndex.value = props.getzIndex();
};

function closeWindow() {
  animateClose().then(() => props.handleClose())
};

// Watchers
watch(() => state.isRestoring, (newValue, _old) => {
  if(newValue){
    killWindowTween()
  }
});

watch(minimizedFiles, (_new, _old) => {
  // Only animate if we're already minimized
  if (props.getMinimized()) {
    moveMinimizedWindow(); // light movement only
  }
});


// Expose methods
defineExpose({
  minimizeWindow,
  maximizeWindow,
  resizableWindow,
})

</script>

<style>
@reference '../../../style.css';

.base-window {
  @apply flex overflow-hidden max-h-full max-w-full fixed;
  --aug-border-bg: #ff0546;
  --aug-border-opacity: 0.25;
}

.resizing * {
  @apply select-none;
}

</style>
