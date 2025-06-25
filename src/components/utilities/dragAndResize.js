export function startResize (obj, event, direction){
      const {el, state} = obj;
      el.classList.add("resizing");
      state.isResizing = true;
      state.resizeDirection = direction;
      state.startDimensions = {
        width: state.currentDimensions.size.width,
        height: state.currentDimensions.size.height,
        top: state.currentDimensions.position.top,
        left: state.currentDimensions.position.left,
      };

      const eventXY = normalizeEvent(event);
      state.startMousePosition = {
        x: eventXY.clientX,
        y: eventXY.clientY,
      };
      const handleResize = (e) => resize(obj, e);
      const handleStopResize = (e) => stopResize(obj, e);

      obj._resizeListener = handleResize; 
      obj._stopResizeListener = handleStopResize; 

      window.addEventListener("mousemove", handleResize);
      window.addEventListener("touchmove", handleResize);
      window.addEventListener("mouseup", handleStopResize);
      window.addEventListener("touchend", handleStopResize);
}

function resize(obj, event){
  const {el, state} = obj;
  el.classList.remove("resizing");
      if (!state.isResizing) return;

      const eventXY = normalizeEvent(event);
      const dx = eventXY.clientX - state.startMousePosition.x;
      const dy = eventXY.clientY - state.startMousePosition.y;
      let newDimensions = { ...state.startDimensions };

      switch (state.resizeDirection) {
        case "n":
          newDimensions.height = Math.max(state.startDimensions.height - dy, state.minSize.height);
          newDimensions.top = state.startDimensions.top + dy;
          break;
        case "s":
          newDimensions.height = Math.max(state.startDimensions.height + dy, state.minSize.height);
          break;
        case "e":
          newDimensions.width = Math.max(state.startDimensions.width + dx, state.minSize.width);
          break;
        case "w":
          newDimensions.width = Math.max(state.startDimensions.width - dx, state.minSize.width);
          newDimensions.left = state.startDimensions.left + dx;
          break;
        case "ne":
          newDimensions.height = Math.max(state.startDimensions.height - dy, state.minSize.height);
          newDimensions.top = state.startDimensions.top + dy;
          newDimensions.width = Math.max(state.startDimensions.width + dx, state.minSize.width);
          break;
        case "nw":
          newDimensions.height = Math.max(state.startDimensions.height - dy, state.minSize.height);
          newDimensions.top = state.startDimensions.top + dy;
          newDimensions.width = Math.max(state.startDimensions.width - dx, state.minSize.width);
          newDimensions.left = state.startDimensions.left + dx;
          break;
        case "se":
          newDimensions.height = Math.max(state.startDimensions.height + dy, state.minSize.height);
          newDimensions.width = Math.max(state.startDimensions.width + dx, state.minSize.width);
          break;
        case "sw":
          newDimensions.height = Math.max(state.startDimensions.height + dy, state.minSize.height);
          newDimensions.width = Math.max(state.startDimensions.width - dx, state.minSize.width);
          newDimensions.left = state.startDimensions.left + dx;
          break;
      }

      state.currentDimensions.size = {
        width: newDimensions.width,
        height: newDimensions.height,
      };

      state.currentDimensions.position = {
        top: newDimensions.top,
        left: newDimensions.left,
      };
}

function stopResize(obj, _event) {
  obj.state.isResizing = false;

  // Remove listeners using the stored references
  window.removeEventListener("mousemove", obj._resizeListener);
  window.removeEventListener("touchmove", obj._resizeListener);
  window.removeEventListener("mouseup", obj._stopResizeListener);
  window.removeEventListener("touchend", obj._stopResizeListener);

  // Clean up stored references
  obj._resizeListener = null;
  obj._stopResizeListener = null;
}


export function startDrag(obj, event) {
  const {state} = obj
  state.isDragging = true;

  const eventXY = normalizeEvent(event);

  state.dragStart = {
    x: eventXY.clientX - state.currentDimensions.position.left,
    y: eventXY.clientY - state.currentDimensions.position.top,
  };

  const handleDrag = (e) => drag(obj, e);
  const handleStopDrag = (e) => stopDrag(obj, e);

  obj._dragListener = handleDrag;
  obj._stopDragListener = handleStopDrag;
  
  window.addEventListener("mousemove", obj._dragListener);
  window.addEventListener("touchmove", obj._dragListener);
  window.addEventListener("mouseup", obj._stopDragListener);
  window.addEventListener("touchend", obj._stopDragListener);
}

function drag(obj, event) {
  const {state} = obj;
  if (state.isDragging) {
    const eventXY = normalizeEvent(event);
    state.currentDimensions.position.top = eventXY.clientY - state.dragStart.y;
    state.currentDimensions.position.left = eventXY.clientX - state.dragStart.x;
  }
}

function stopDrag(obj, _event) {
  obj.state.isDragging = false;
  window.removeEventListener("mousemove", obj._dragListener);
  window.removeEventListener("touchmove", obj._dragListener);
  window.removeEventListener("mouseup", obj._stopDragListener);
  window.removeEventListener("touchend", obj._stopDragListener);

  obj._dragListener = null;
  obj._stopDragListener = null;
}

function normalizeEvent(event) {
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
}