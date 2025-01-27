<template>
  <div
    @mousedown="handleClick"
    data-augmented-ui="tl-clip tr-clip bl-scoop-x both"
    class="file-window"
    :style="{
      zIndex: `${zIndex}`,
      top: `${current_dimensions.position.top}px`,
      left: `${current_dimensions.position.left}px`,
      width: `${current_dimensions.size.width}px`,
      height: `${current_dimensions.size.height}px`,
      minWidth: `${minSize.width}px`,
      minHeight: `${minSize.height}px`,
    }"
    ref="resizableWindow"
  >
  <div id="n-resize" @mousedown="startResize($event, 'n')" @touchstart="startResize($event, 'n')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="nw-resize" @mousedown="startResize($event, 'nw')" @touchstart="startResize($event, 'nw')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="ne-resize" @mousedown="startResize($event, 'ne')" @touchstart="startResize($event, 'ne')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="sw-resize" @mousedown="startResize($event, 'sw')" @touchstart="startResize($event, 'sw')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="se-resize" @mousedown="startResize($event, 'se')" @touchstart="startResize($event, 'se')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="e-resize" @mousedown="startResize($event, 'e')" @touchstart="startResize($event, 'e')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="w-resize" @mousedown="startResize($event, 'w')" @touchstart="startResize($event, 'w')" :style="{ zIndex: `${zIndex + 1}`}"></div>
    <div id="s-resize" @mousedown="startResize($event, 's')" @touchstart="startResize($event, 's')" :style="{ zIndex: `${zIndex + 1}`}"></div>

    <!-- Vertical Title Bar -->
    <div class="file_titlebar" @mousedown="startDrag" @touchstart="startDrag">
      <!-- Buttons Container -->
      <div class="button-container">
        <button class="titlebar-button" @click="closeApp">
          <CloseIcon class="task-icon" height="100%" width="100%"/>
        </button>
        <button class="titlebar-button" @click="maximizeApp">
          <MaximizeIcon class="task-icon" height="100%" width="100%"/>
        </button>
        <!-- Title -->
        <span class="title-spacer"></span>
        <div class="title">{{ title }}</div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <div ref="windowContent" class="window-content w-full h-full">
        <FileViewerView 
        :content="this.item.content"
        :file_ext="this.item.exten"
        :name="this.item.name"
        />
      </div>
    </div>
  </div>
</template>

<script>
import CloseIcon from "../assets/icons/close.svg";
import MaximizeIcon from "../assets/icons/maximize.svg";
import FileViewerView from "./views/FileViewerView.vue";
import { useAppsStore } from "./stores/apps";
import { gsap } from "gsap";
import { startDrag, startResize } from "./utilities/dragAndResize";

export default {
  components: { CloseIcon, MaximizeIcon, FileViewerView },
  props: {
    item: {
      type: Object,
    },
    initialPosition: {
      type: Object,
      default: () => ({ top: 100, left: 100 }),
    },
    minWidth: {
      type: Number,
      default: window.innerWidth * 0.3,
    },
    minHeight: {
      type: Number,
      default: window.innerHeight * 0.4,
    },
    title: {
      type: String,
      default: 'file_name'
    }
  },
  data() {
    return {
      appsStore: useAppsStore(),
      zIndex: 0,
      current_dimensions: {
        position: { ...this.initialPosition },
        size: { width: 400, height: 300 },
      },
      minContentSize: { width: this.minWidth, height: this.minHeight },
      previous_dimensions: {
        position: { ...this.initialPosition },
        size: { width: 400, height: 300 },
      },
      isDragging: false,
      isResizing: false,
      resizeDirection: null,
      startDimensions: null,
      dragStart: { x: 0, y: 0 },
      scale: 0.2,
    };
  },
  computed: {
    minSize() {
      return {
        width: this.minContentSize.width,
        height: this.minContentSize.height,
      };
    },
  
  },
  mounted() {
    this.getzIndex();
    const resizableWindow = this.$refs.resizableWindow;
    const resizableWindowObserver = new ResizeObserver(() => {
      this.current_dimensions.size.width = resizableWindow.offsetWidth;
      this.current_dimensions.size.height = resizableWindow.offsetHeight;
    });
    resizableWindowObserver.observe(resizableWindow);

    window.addEventListener("resize", this.handleViewportResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleViewportResize);
  },
  methods: {
    handleViewportResize() {
      if (this.appsStore.isFileMaximized(this.item)) {
        this.current_dimensions.size.width = window.innerWidth;
        this.current_dimensions.size.height = window.innerHeight;
      } 
    },
    handleClick() {
      this.getzIndex();
    },
    getzIndex() {
      this.appsStore.bringFileToFront(this.item);
      this.zIndex = this.appsStore.getFilezIndex(this.item);
    },
    closeApp() {

      gsap.to(this.$el, {
          scale: 0.1,
          duration: 0.1,
          ease: "power1.out",
          onComplete: () => {
            this.appsStore.closeFile(this.item);
          }
        })
      
    },
    
    animateRestore(reverse = false) {
      if (reverse) {
        gsap
          .to(this.$el, {
            width: `${this.previous_dimensions.size.width}px`,
            height: `${this.previous_dimensions.size.height}px`,
            duration: 0.1,
            ease: "power1.out",
          })
          .then(() => {
            gsap.to(this.$el, {
              left: `${this.previous_dimensions.position.left}px`,
              top: `${this.previous_dimensions.position.top}px`,
              scale: 1,
              duration: 0.5,
              ease: "power1.out",
              onComplete: () => {
                this.current_dimensions = this.previous_dimensions;
              },
            });
          });
        return;
      }
      gsap
        .to(this.$el, {
          left: `${this.previous_dimensions.position.left}px`,
          top: `${this.previous_dimensions.position.top}px`,
          scale: 1,
          duration: 0.5,
          ease: "power1.out",
        })
        .then(() => {
          gsap.to(this.$el, {
            width: `${this.previous_dimensions.size.width}px`,
            height: `${this.previous_dimensions.size.height}px`,
            duration: 0.1,
            ease: "power1.out",
            onComplete: () => {
              this.current_dimensions = this.previous_dimensions;
            },
          });
        });
    },
    animateMaximize() {
      gsap
        .to(this.$el, {
          left: "0px",
          top: "0px",
          duration: 0.5,
          ease: "power1.out",
          onComplete: () => {
            this.current_dimensions.position = { top: 0, left: 0 };
          },
        })
        .then(() => {
          gsap.to(this.$el, {
            height: window.innerHeight,
            width: window.innerWidth,
            duration: 0.1,
            ease: "power1.out",
            onComplete: () => {
              this.current_dimensions.size = { width: window.innerWidth, height: window.innerHeight };
            },
          });
        });
    },
    maximizeApp() {
      if (this.appsStore.isFileMaximized(this.item)) {
        this.animateRestore(true);
        this.appsStore.setFileMaximize(this.item, false);
      } else if (!this.appsStore.isFileMaximized(this.item)) {
        this.previous_dimensions = JSON.parse(JSON.stringify(this.current_dimensions));
        this.animateMaximize();
        this.appsStore.setFileMaximize(this.item, true);
      }
    },
    startDrag(event) {
      startDrag(this, event);
    },
    startResize(event, direction) {
      this.appsStore.setFileMaximize(obj.id, false);
      startResize(this, event, direction);
    },
  
    
  },
};
</script>

<style>
.file-window {
  @apply flex overflow-hidden max-h-full max-w-full;
  --aug-border-bg: #ff0546;
  --aug-border-opacity: 0.25;
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

.file_titlebar {
  @apply flex flex-col pl-4 pr-3 pt-5 text-sm font-bold cursor-move select-none h-full w-20 ;
  @apply bg-primary-dark-base;
}

.button-container {
  @apply flex flex-col gap-6;
}

.titlebar-button {
  @apply w-1/5 p-0 aspect-square bg-transparent flex items-center justify-center rounded-none rotate-90 border-none;
}

.titlebar-button:hover {
  @apply border-none;
}

.title-spacer {
  @apply h-8;
}

.title {
  @apply -rotate-90 aspect-square text-accent-yellow-base;
  white-space: nowrap;
}

.task-icon path {
  @apply fill-primary-accent-light;
}

.task-icon {
  filter: drop-shadow(0 0 1px #ff0546) drop-shadow(0 0 5px #ff0546);
}

.task-icon:hover {
  filter: drop-shadow(0 0 5px #0098db) drop-shadow(0 0 10px #0098db);
}

.task-icon:hover path {
  @apply fill-alerts-base;
}

.resize {
  animation: enter 0.4s ease-in-out;
}
</style>
