import { gsap } from "gsap";
import { nextTick } from "vue";

export function useWindowAnimations(
  getMiniPos,
  state,
  resizableWindow,
  restoreOverlay
) {
  let windowTween = null;
  const scale = 0.2;

  function killWindowTween() {
    if (windowTween) {
      windowTween.kill();
      windowTween = null;
    }
  }

  async function animateSnapToMinimized(
    origin = "center",
    duration = 0.5
  ) {
    let mini_pos = null;
    await nextTick(() => {
      mini_pos = getMiniPos();
    });

    const min_size = state.minSize;
    const offset_x = min_size.width / 2;
    const offset_y = min_size.height / 2;
    const el = resizableWindow.value;
    const el2 = restoreOverlay.value;
    const targetLeft = mini_pos.x - offset_x;
    const targetTop = mini_pos.y - offset_y;

    return gsap.to([el, el2], {
      width: `${min_size.width}`,
      height: `${min_size.height}`,
      transformOrigin: origin,
      duration: 0.1,
      ease: "power1.out",
    }).then(() => {
      return gsap.to([el, el2], {
        left: `${targetLeft}`,
        top: `${targetTop}`,
        duration,
        ease: "power1.out",
        scale,
        transformOrigin: origin,
        onComplete: () => {
          state.currentDimensions.position.left = targetLeft;
          state.currentDimensions.position.top = targetTop;
        },
      });
    });
  }

  function animateRestore(reverse = false) {
    killWindowTween();

    const el = resizableWindow.value;
    const el2 = restoreOverlay.value;

    if (reverse) {
      return gsap.to([el, el2], {
        width: `${state.previousDimensions.size.width}`,
        height: `${state.previousDimensions.size.height}`,
        duration: 0.1,
        ease: "power1.out",
      }).then(() => {
        return gsap.to([el, el2], {
          left: `${state.previousDimensions.position.left}`,
          top: `${state.previousDimensions.position.top}`,
          scale: 1,
          duration: 0.5,
          ease: "power1.out",
          onComplete: () => {
            state.currentDimensions = state.previousDimensions;
          },
        });
      });
    }

    return gsap.to([el, el2], {
      left: `${state.previousDimensions.position.left}`,
      top: `${state.previousDimensions.position.top}`,
      scale: 1,
      duration: 0.5,
      ease: "power1.out",
    }).then(() => {
      return gsap.to([el, el2], {
        width: `${state.previousDimensions.size.width}`,
        height: `${state.previousDimensions.size.height}`,
        duration: 0.1,
        ease: "power1.out",
        onComplete: () => {
          state.currentDimensions = state.previousDimensions;
        },
      });
    });
  }

  function animateMaximize() {
    return gsap
      .to(state.currentDimensions.position, {
        left: "0",
        top: "0",
        duration: 0.5,
        ease: "power1.out",
        onComplete: () => {
          state.currentDimensions.position = { top: 0, left: 0 };
        },
      })
      .then(() => {
        return gsap.to(state.currentDimensions.size, {
          height: window.innerHeight,
          width: window.innerWidth,
          duration: 0.1,
          ease: "power1.out",
          onComplete: () => {
            state.currentDimensions.size = {
              width: window.innerWidth,
              height: window.innerHeight,
            };
          },
        });
      });
  }

  function animateClose() {
    const el = resizableWindow.value;
    const el2 = restoreOverlay.value;
    return gsap.to([el, el2], {
      scale: 0.1,
      duration: 0.1,
      ease: "power1.out",
    });
  }

  function moveMinimizedWindow() {
    if (state.isRestoring) return;
    killWindowTween();

    const min_size = state.minSize;
    const offset_x = min_size.width / 2;
    const offset_y = min_size.height / 2;

    const mini_pos = getMiniPos?.() ?? { x: 0, y: 0 };

    windowTween = gsap.to(state.currentDimensions.position, {
      left: `${mini_pos.x - offset_x}px`,
      top: `${mini_pos.y - offset_y}px`,
      duration: 0.5,
      ease: "power1.out",
    });
  }

  return {
    animateSnapToMinimized,
    animateRestore,
    animateMaximize,
    animateClose,
    moveMinimizedWindow,
    killWindowTween,
  };
}
