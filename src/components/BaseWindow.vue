<template>
  <div
  v-if="isMini"
    @mousedown="restore"
    class="bg-green-500/50 fixed"
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
    <div id="n-resize" @mousedown="handleStartResize($event, 'n')" @touchstart="handleStartResize($event, 'n')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="nw-resize" @mousedown="handleStartResize($event, 'nw')" @touchstart="handleStartResize($event, 'nw')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="ne-resize" @mousedown="handleStartResize($event, 'ne')" @touchstart="handleStartResize($event, 'ne')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="sw-resize" @mousedown="handleStartResize($event, 'sw')" @touchstart="handleStartResize($event, 'sw')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="se-resize" @mousedown="handleStartResize($event, 'se')" @touchstart="handleStartResize($event, 'se')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="e-resize" @mousedown="handleStartResize($event, 'e')" @touchstart="handleStartResize($event, 'e')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="w-resize" @mousedown="handleStartResize($event, 'w')" @touchstart="handleStartResize($event, 'w')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="s-resize" @mousedown="handleStartResize($event, 's')" @touchstart="handleStartResize($event, 's')" :style="{ zIndex: `${zIndex + 1}`}"></div>

    <!-- Vertical Title Bar -->
    <div class="titlebar" @mousedown="handleStartDrag" @touchstart="handleStartDrag">
      <!-- Buttons Container -->
      <div class="button-container">
        <button class="titlebar-button" @click="closeWindow">
          <CloseIcon class="title-icon" width="100%" height="100%"/>
        </button>
        <button class="titlebar-button" @click="minimizeWindow" v-if="showMinimizeButton && !isMobile">
          <MinimizeIcon class="title-icon rotate-90" width="100%" height="100%"/>
        </button>
        <button class="titlebar-button" @click="maximizeWindow">
          <MaximizeIcon class="title-icon" width="100%" height="100%"/>
        </button>
        <button @click="$emit('export')" class="titlebar-button" v-if="showExportButton">
          <ExportIcon class="title-icon export -rotate-90"/>
        </button>

        <button @click="opaque = !opaque" class="titlebar-button">
          <EyeClose  class=" rotate-90 title-icon" v-if="opaque"/>
          <EyeOpen class="rotate-90 title-icon" v-else/>
        </button>
        
        
      </div>
      <!-- Title -->
      <span class="h-1/3"></span>
      <div class="title">{{ title }}</div>
      <span class="h-1/2"></span>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <div ref="windowContent" class="window-content w-full h-full">
        <slot/>
      </div>
    </div>
  </div>
</template>

<script setup>
import CloseIcon from "@/assets/icons/close.svg";
import MinimizeIcon from "@/assets/icons/minimize.svg";
import MaximizeIcon from "@/assets/icons/maximize.svg";
import ExportIcon from "@/assets/icons/export.svg"
import EyeClose from "@/assets/icons/eyeClose.svg"
import EyeOpen from "@/assets/icons/eyeOpen.svg"

import { ref, reactive, onMounted, useTemplateRef, onBeforeUnmount, nextTick, watch, computed } from "vue";
import { gsap } from "gsap";
import { startResize, startDrag } from '@/components/utilities/dragAndResize.js'

import { useIsMobile } from "@/components/utilities/useIsMobile";
import { useAppsStore } from '@/components/stores/apps';
import { storeToRefs } from "pinia";

defineOptions({ inheritAttrs: false });
const appsStore = useAppsStore()
const { minimizedFiles } = storeToRefs(appsStore);

// the window’s z-index
const windowZ = computed(() =>
  props.isFileWin && isMini.value
    ? appsStore.zIndexCounter + 1
    : zIndex.value
);

// the overlay’s z-index must be 1 higher
const overlayZ = computed(() => windowZ.value + 1);


function watchPosition(el, callback) {
  let lastRect = el.getBoundingClientRect();

  function check() {
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
}
const snapToMin = () => {
  if (props.getMinimized() && !isRestoring.value) {
    animateSnapToMinimized("center", 0.1);
  }
}

watch(minimizedFiles, (_new, _old) => {
  // Only animate if we're already minimized
  if (props.getMinimized()) {
    moveMinimizedWindow(); // light movement only
  }
});

const isRestoring = ref(false);
let windowTween = null

function moveMinimizedWindow() {
  if (isRestoring.value) return;
  killWindowTween()

  const el = resizableWindow.value;
  const min_size = state.minSize;
  const offset_x = min_size.width / 2;
  const offset_y = min_size.height / 2;

  const mini_pos = props.getMiniPos?.() ?? { x: 0, y: 0 };

  windowTween = gsap.to(el, {
    left: `${mini_pos.x - offset_x}px`,
    top: `${mini_pos.y - offset_y}px`,
    duration: 0.5,
    ease: "power1.out",
  });
}


const filebar = document.getElementById("filebar");

const props = defineProps([
  'initialPosition',
  'minWidth',
  'minHeight',
  'showMinimizeButton',
  'title',
  'getMaximized',
  'getMinimized',
  'getzIndex',
  'getMiniPos',
  'handleClose',
  'handleMinimize',
  'handleMaximize',
  'showExportButton',
  'isFileWin'
])

if (props.isFileWin) watchPosition(filebar, snapToMin);


const {isMobile} = useIsMobile();

const opaque = ref(false)

const isMini = ref(false)

const zIndex = ref(0);
defineEmits(['export']);

let previousDimensions = {
  position: { ...props.initialPosition },
  size: { width: 400, height: 300 },
}


const scale = 0.2
const resizableWindow = useTemplateRef('resizableWindow');

function minimizeWindow() {
  if (state.disableMovement) return;
  new Promise((resolve) => {
    props.handleMinimize(true);
  })//.then(() => isMini.value = true)
  isMini.value = true

  state.disableMovement = true;
  previousDimensions = JSON.parse(JSON.stringify(state.currentDimensions));
  animateSnapToMinimized();
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
      animateRestore(true).then(() => {
        props.handleMaximize(false);
        resolve();
      });
    } else {
      previousDimensions = JSON.parse(JSON.stringify(state.currentDimensions));
      animateMaximize(); // if this is not async, we resolve immediately
      props.handleMaximize(true);
      resolve();
    }
  });
}


const state = reactive({
  isDragging: false,
  isResizing: false,
  resizeDirection: null,
  startDimensions: null,
  disableMovement: false,
  currentDimensions: {
    position: { ...props.initialPosition },
    size: { width: 400, height: 300 },
  },
  minSize: {
    width: props.minWidth,
    height: props.minHeight,
  }
});


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

function killWindowTween() {
  if (windowTween) {
      windowTween.kill();
      windowTween = null;
  }
}

watch(isRestoring, (newValue, _old) => {
  if(newValue){
    killWindowTween()
  }
});

function restore() {
  isRestoring.value = true;
    killWindowTween()
    maximizeWindow().then(() => {
      zIndex.value = props.getzIndex();
      isRestoring.value = false;
    });
}

function handleClick() {
  zIndex.value = props.getzIndex();
};


function closeWindow() {
  if (state.disableMovement) return;
  const el = resizableWindow.value;
  gsap.to(el, {
      scale: 0.1,
      duration: 0.1,
      ease: "power1.out",
      onComplete: () => {
        props.handleClose();
      }
    })
  
};

function animateMaximize() {
  const el = resizableWindow.value
  gsap
    .to(el, {
      left: "0px",
      top: "0px",
      duration: 0.5,
      ease: "power1.out",
      onComplete: () => {
        state.currentDimensions.position = { top: 0, left: 0 };
      },
    })
    .then(() => {
      gsap.to(el, {
        height: window.innerHeight,
        width: window.innerWidth,
        duration: 0.1,
        ease: "power1.out",
        onComplete: () => {
          state.currentDimensions.size = { width: window.innerWidth, height: window.innerHeight };
        },
      });
    });
};

function animateSnapToMinimized(origin = "center", duration = 0.5) {
  let mini_pos = null;
  nextTick(() => {
    mini_pos = props.getMiniPos();
  })
  
  const min_size = state.minSize;
  const offset_x = min_size.width / 2;
  const offset_y = min_size.height / 2;
  const el = resizableWindow.value;

  return gsap
    .to(el, {
      width: `${min_size.width}px`,
      height: `${min_size.height}px`,
      transformOrigin: origin,
      duration: 0.1,
      ease: "power1.out",
    })
    .then(() => {
      gsap.to(el, {
        left: `${mini_pos.x - offset_x}px`,
        top: `${mini_pos.y - offset_y}px`,
        scale,
        transformOrigin: origin,
        duration,
        ease: "power1.out",
      });
    });
};



function animateRestore(reverse = false) {
  killWindowTween()

  const el = resizableWindow.value;
  if (reverse) {
    return gsap
      .to(el, {
        width: `${previousDimensions.size.width}px`,
        height: `${previousDimensions.size.height}px`,
        duration: 0.1,
        ease: "power1.out",
      })
      .then(() => {
        gsap.to(el, {
          left: `${previousDimensions.position.left}px`,
          top: `${previousDimensions.position.top}px`,
          scale: 1,
          duration: 0.5,
          ease: "power1.out",
          onComplete: () => {
            state.currentDimensions = previousDimensions;
            state.disableMovement = false;
          },
        });
      });
    
  }
  return gsap
    .to(el, {
      left: `${previousDimensions.position.left}px`,
      top: `${previousDimensions.position.top}px`,
      scale: 1,
      duration: 0.5,
      ease: "power1.out",
    })
    .then(() => {
      gsap.to(el, {
        width: `${previousDimensions.size.width}px`,
        height: `${previousDimensions.size.height}px`,
        duration: 0.1,
        ease: "power1.out",
        onComplete: () => {
          state.currentDimensions = previousDimensions;
          state.disableMovement = false;
        },
      });
    });
};
function handleViewportResize() {
  if (props.getMaximized()) {
    state.currentDimensions.size.width = window.innerWidth;
    state.currentDimensions.size.height = window.innerHeight;
  } else if (props.getMinimized()) {
    animateSnapToMinimized("center", 0.1);
  }
}

const resizableWindowObserver = ref(null);

onMounted(() => {
  zIndex.value = props.getzIndex();
  const observer = new ResizeObserver(() => {
    state.currentDimensions.size.width = resizableWindow.value.offsetWidth;
    state.currentDimensions.size.height = resizableWindow.value.offsetHeight;
  });

  observer.observe(resizableWindow.value);
  resizableWindowObserver.value = observer;
  window.addEventListener("resize", handleViewportResize);
})

onBeforeUnmount(() => {
  // Disconnect observer if still active
  if (resizableWindowObserver.value) {
    resizableWindowObserver.value.disconnect();
    resizableWindowObserver.value = null;
  }
  window.removeEventListener("resize", handleViewportResize);
})

defineExpose({
  minimizeWindow,
  maximizeWindow,
  resizableWindow,
})

</script>

<style>
@reference '../style.css';

.base-window {
  @apply flex overflow-hidden max-h-full max-w-full fixed;
  --aug-border-bg: #ff0546;
  --aug-border-opacity: 0.25;
}

.resizing * {
  @apply select-none;
}

#n-resize {
  @apply absolute top-0 w-full h-1 cursor-ns-resize;
}

#nw-resize {
  @apply absolute top-0 left-0 w-4 aspect-square cursor-nwse-resize;
}

#ne-resize {
  @apply absolute top-0 right-0 w-4 aspect-square cursor-nesw-resize;
}

#sw-resize {
  @apply absolute bottom-0 left-0 w-12 h-5 aspect-square cursor-nesw-resize;
}

#se-resize {
  @apply absolute bottom-0 right-0 w-4 aspect-square cursor-nwse-resize;
}

#w-resize {
  @apply absolute left-0 h-full w-1 cursor-ew-resize;
}

#e-resize {
  @apply absolute right-0 h-full w-1 cursor-ew-resize;
}

#s-resize {
  @apply absolute bottom-0 w-full h-1 cursor-ns-resize;
}

.titlebar {
  @apply flex flex-col pl-4 pr-3 pt-5 text-sm font-bold cursor-move select-none h-full w-15;
  @apply bg-primary-dark-base;
}

.button-container {
  @apply flex flex-col gap-5;
}

.titlebar-button {
  @apply w-1/3 p-0 aspect-square bg-transparent flex items-center justify-center rounded-none rotate-90 border-none;
}

.titlebar-button:hover {
  @apply border-none;
}

.title {
  @apply -rotate-90 aspect-square text-accent-yellow-base;
  white-space: nowrap;
}

.title-icon path,
.title-icon circle,
.title-icon line,
.title-icon polyline,
.title-icon polygon {
  @apply stroke-primary-accent-light;
}

.title-icon path {
  @apply fill-primary-accent-light;
}

.title-icon {
  filter: drop-shadow(0 0 1px #ff0546) drop-shadow(0 0 5px #ff0546);
}


.title-icon:hover {
  filter: drop-shadow(0 0 5px #0098db) drop-shadow(0 0 10px #0098db);
}
.title-icon:hover circle,
.title-icon:hover line,
.title-icon:hover polyline,
.title-icon:hover polygon,
.title-icon:hover path {
  @apply fill-alerts-base;
}
.title-icon:hover circle,
.title-icon:hover line,
.title-icon:hover polyline,
.title-icon:hover polygon,
.title-icon:hover path {
  @apply stroke-alerts-base;
}

.export path,
.export:hover path {
  @apply fill-none;
}

.resize {
  animation: enter 0.4s ease-in-out;
}
</style>
