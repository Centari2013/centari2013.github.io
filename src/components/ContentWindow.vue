<template>
  <div
    @mousedown="handleClick"
    data-augmented-ui="tl-clip tr-clip bl-scoop-x both"
    class="base-window"
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
    <div class="titlebar" @mousedown="startDrag" @touchstart="startDrag">
      <!-- Buttons Container -->
      <div class="button-container">
        <button class="titlebar-button" @click="closeApp">
          <CloseIcon class="task-icon" />
        </button>
        <button class="titlebar-button" @click="minimizeApp">
          <MinimizeIcon class="task-icon" />
        </button>
        <button class="titlebar-button" @click="maximizeApp">
          <MaximizeIcon class="task-icon" />
        </button>
        <!-- Title -->
        <span class="title-spacer"></span>
        <div class="title">{{ title }}</div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <div ref="windowContent" class="window-content w-full h-full">
        <component :is="contentComponent" :title="title" :contentType="id" />
      </div>
    </div>
  </div>
</template>

<script>
import TerminalView from "./views/TerminalView.vue";
import FileManagerView from "./views/FileManagerView.vue";
import CloseIcon from "../assets/icons/close.svg";
import MinimizeIcon from "../assets/icons/minimize.svg";
import MaximizeIcon from "../assets/icons/maximize.svg";
import { useAppsStore } from "./stores/apps";
import { ref } from "vue";
import { gsap } from "gsap";

export default {
  setup() {
    const disableMovement = ref(false);
    return { disableMovement };
  },
  components: { CloseIcon, MinimizeIcon, MaximizeIcon },
  props: {
    id: {
      type: String,
      default: "terminal",
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
      title: "base_window",
      isDragging: false,
      isResizing: false,
      resizeDirection: null,
      startDimensions: null,
      dragStart: { x: 0, y: 0 },
      disableMovement: false,
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
    contentComponent() {
      if (this.id === "terminal") {
        this.title = "PyroShell";
        return TerminalView;
      } else if (this.id === "file_manager") {
        this.title = "File Manager";
        return FileManagerView;
      }
      return null;
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
      if (this.appsStore.isAppMaximized(this.id)) {
        this.current_dimensions.size.width = window.innerWidth;
        this.current_dimensions.size.height = window.innerHeight;
      } else if (this.appsStore.isAppMinimized(this.id)) {
        this.animateSnaptoIcon("center", 0.1);
      }
    },
    handleClick() {
      if (this.appsStore.isAppMinimized(this.id)) {
        this.maximizeApp().then(() => {
          this.getzIndex();
        });
      } else {
        this.getzIndex();
      }
    },
    getzIndex() {
      this.appsStore.bringAppToFront(this.id);
      this.zIndex = this.appsStore.getAppzIndex(this.id);
    },
    closeApp() {
      if (this.disableMovement) return;

      gsap.to(this.$el, {
          scale: 0.1,
          duration: 0.1,
          ease: "power1.out",
          onComplete: () => {
            this.appsStore.closeApp(this.id);
          }
        })
      
    },
    getMiniPos() {
      const taskbar_rect = this.$parent.$refs.taskbar.$el.getBoundingClientRect();
      const icon_rect = document.getElementById(this.id + "Icon").getBoundingClientRect();
      return {
        x: icon_rect.width / 2 + icon_rect.x,
        y: taskbar_rect.y,
      };
    },
    animateSnaptoIcon(origin = "center", duration = 0.5) {
      const mini_pos = this.getMiniPos();
      const min_size = this.minSize;
      const offset_x = min_size.width / 2;
      const offset_y = min_size.height / 2;

      gsap
        .to(this.$el, {
          width: `${min_size.width}px`,
          height: `${min_size.height}px`,
          transformOrigin: origin,
          duration: 0.1,
          ease: "power1.out",
        })
        .then(() => {
          gsap.to(this.$el, {
            left: `${mini_pos.x - offset_x}px`,
            top: `${mini_pos.y - offset_y}px`,
            scale: this.scale,
            transformOrigin: origin,
            duration: duration,
            ease: "power1.out",
          });
        });
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
                this.disableMovement = false;
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
              this.disableMovement = false;
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
    minimizeApp() {
      if (this.disableMovement) return;
      this.disableMovement = true;
      this.previous_dimensions = JSON.parse(JSON.stringify(this.current_dimensions));
      this.animateSnaptoIcon();
      this.appsStore.setAppMinimize(this.id, true);
    },
    maximizeApp() {
      if (this.appsStore.isAppMinimized(this.id)) {
        this.animateRestore();
        this.appsStore.setAppMinimize(this.id, false);
      } else if (this.appsStore.isAppMaximized(this.id)) {
        this.animateRestore(true);
        this.appsStore.setAppMaximize(this.id, false);
      } else if (!this.appsStore.isAppMaximized(this.id)) {
        this.previous_dimensions = JSON.parse(JSON.stringify(this.current_dimensions));
        this.animateMaximize();
        this.appsStore.setAppMaximize(this.id, true);
      }
    },
    normalizeEvent(event) {
      if (event.type.startsWith("touch")) {
        return {
          clientX: event.touches[0].clientX,
          clientY: event.touches[0].clientY,
        };
      }
      return {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    },
    startDrag(event) {
      if (this.disableMovement) return;
      this.isDragging = true;

      const eventXY = this.normalizeEvent(event);

      this.dragStart = {
        x: eventXY.clientX - this.current_dimensions.position.left,
        y: eventXY.clientY - this.current_dimensions.position.top,
      };
      
      window.addEventListener("mousemove", this.drag);
      window.addEventListener("touchmove", this.drag);
      window.addEventListener("mouseup", this.stopDrag);
      window.addEventListener("touchend", this.stopDrag);
    },
    stopDrag() {
      this.isDragging = false;
      window.removeEventListener("mousemove", this.drag);
      window.removeEventListener("touchmove", this.drag);
      window.removeEventListener("mouseup", this.stopDrag);
      window.removeEventListener("touchend", this.stopDrag);
    },
    drag(event) {
      if (this.isDragging) {
        const eventXY = this.normalizeEvent(event);
        this.current_dimensions.position.top = eventXY.clientY - this.dragStart.y;
        this.current_dimensions.position.left = eventXY.clientX - this.dragStart.x;
      }
    },
    startResize(event, direction) {
      this.$el.classList.add("resizing");
      this.isResizing = true;
      this.resizeDirection = direction;
      this.startDimensions = {
        width: this.current_dimensions.size.width,
        height: this.current_dimensions.size.height,
        top: this.current_dimensions.position.top,
        left: this.current_dimensions.position.left,
      };

      const eventXY = this.normalizeEvent(event);
      this.startMousePosition = {
        x: eventXY.clientX,
        y: eventXY.clientY,
      };
      window.addEventListener("mousemove", this.drag);
      window.addEventListener("touchmove", this.drag);
      window.addEventListener("mouseup", this.stopDrag);
      window.addEventListener("touchend", this.stopDrag);
    },
    stopResize() {
      this.isResizing = false;
      window.removeEventListener("mousemove", this.drag);
      window.removeEventListener("touchmove", this.drag);
      window.removeEventListener("mouseup", this.stopDrag);
      window.removeEventListener("touchend", this.stopDrag);
    },
    resize(event) {
      this.$el.classList.remove("resizing");
      if (!this.isResizing) return;
      this.appsStore.setAppMaximize(this.id, false);

      const eventXY = this.normalizeEvent(event);
      const dx = eventXY.clientX - this.startMousePosition.x;
      const dy = eventXY.clientY - this.startMousePosition.y;
      let newDimensions = { ...this.startDimensions };

      switch (this.resizeDirection) {
        case "n":
          newDimensions.height = Math.max(this.startDimensions.height - dy, this.minSize.height);
          newDimensions.top = this.startDimensions.top + dy;
          break;
        case "s":
          newDimensions.height = Math.max(this.startDimensions.height + dy, this.minSize.height);
          break;
        case "e":
          newDimensions.width = Math.max(this.startDimensions.width + dx, this.minSize.width);
          break;
        case "w":
          newDimensions.width = Math.max(this.startDimensions.width - dx, this.minSize.width);
          newDimensions.left = this.startDimensions.left + dx;
          break;
        case "ne":
          newDimensions.height = Math.max(this.startDimensions.height - dy, this.minSize.height);
          newDimensions.top = this.startDimensions.top + dy;
          newDimensions.width = Math.max(this.startDimensions.width + dx, this.minSize.width);
          break;
        case "nw":
          newDimensions.height = Math.max(this.startDimensions.height - dy, this.minSize.height);
          newDimensions.top = this.startDimensions.top + dy;
          newDimensions.width = Math.max(this.startDimensions.width - dx, this.minSize.width);
          newDimensions.left = this.startDimensions.left + dx;
          break;
        case "se":
          newDimensions.height = Math.max(this.startDimensions.height + dy, this.minSize.height);
          newDimensions.width = Math.max(this.startDimensions.width + dx, this.minSize.width);
          break;
        case "sw":
          newDimensions.height = Math.max(this.startDimensions.height + dy, this.minSize.height);
          newDimensions.width = Math.max(this.startDimensions.width - dx, this.minSize.width);
          newDimensions.left = this.startDimensions.left + dx;
          break;
      }

      this.current_dimensions.size = {
        width: newDimensions.width,
        height: newDimensions.height,
      };

      this.current_dimensions.position = {
        top: newDimensions.top,
        left: newDimensions.left,
      };
    },
  },
};
</script>

<style>
.base-window {
  @apply flex overflow-hidden opacity-75 max-h-full max-w-full;
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
  @apply flex flex-col pl-4 pr-3 pt-5 text-sm font-bold cursor-move select-none h-full w-20;
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
