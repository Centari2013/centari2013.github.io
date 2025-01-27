export function startResize (obj, event, direction){
      obj.$el.classList.add("resizing");
      obj.isResizing = true;
      obj.resizeDirection = direction;
      obj.startDimensions = {
        width: obj.current_dimensions.size.width,
        height: obj.current_dimensions.size.height,
        top: obj.current_dimensions.position.top,
        left: obj.current_dimensions.position.left,
      };

      const eventXY = normalizeEvent(event);
      obj.startMousePosition = {
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
  obj.$el.classList.remove("resizing");
      if (!obj.isResizing) return;

      const eventXY = normalizeEvent(event);
      const dx = eventXY.clientX - obj.startMousePosition.x;
      const dy = eventXY.clientY - obj.startMousePosition.y;
      let newDimensions = { ...obj.startDimensions };

      switch (obj.resizeDirection) {
        case "n":
          newDimensions.height = Math.max(obj.startDimensions.height - dy, obj.minSize.height);
          newDimensions.top = obj.startDimensions.top + dy;
          break;
        case "s":
          newDimensions.height = Math.max(obj.startDimensions.height + dy, obj.minSize.height);
          break;
        case "e":
          newDimensions.width = Math.max(obj.startDimensions.width + dx, obj.minSize.width);
          break;
        case "w":
          newDimensions.width = Math.max(obj.startDimensions.width - dx, obj.minSize.width);
          newDimensions.left = obj.startDimensions.left + dx;
          break;
        case "ne":
          newDimensions.height = Math.max(obj.startDimensions.height - dy, obj.minSize.height);
          newDimensions.top = obj.startDimensions.top + dy;
          newDimensions.width = Math.max(obj.startDimensions.width + dx, obj.minSize.width);
          break;
        case "nw":
          newDimensions.height = Math.max(obj.startDimensions.height - dy, obj.minSize.height);
          newDimensions.top = obj.startDimensions.top + dy;
          newDimensions.width = Math.max(obj.startDimensions.width - dx, obj.minSize.width);
          newDimensions.left = obj.startDimensions.left + dx;
          break;
        case "se":
          newDimensions.height = Math.max(obj.startDimensions.height + dy, obj.minSize.height);
          newDimensions.width = Math.max(obj.startDimensions.width + dx, obj.minSize.width);
          break;
        case "sw":
          newDimensions.height = Math.max(obj.startDimensions.height + dy, obj.minSize.height);
          newDimensions.width = Math.max(obj.startDimensions.width - dx, obj.minSize.width);
          newDimensions.left = obj.startDimensions.left + dx;
          break;
      }

      obj.current_dimensions.size = {
        width: newDimensions.width,
        height: newDimensions.height,
      };

      obj.current_dimensions.position = {
        top: newDimensions.top,
        left: newDimensions.left,
      };
}

function stopResize(obj, _event) {
  obj.isResizing = false;

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
  if (obj.disableMovement) return;
  obj.isDragging = true;

  const eventXY = normalizeEvent(event);

  obj.dragStart = {
    x: eventXY.clientX - obj.current_dimensions.position.left,
    y: eventXY.clientY - obj.current_dimensions.position.top,
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
  if (obj.isDragging) {
    const eventXY = normalizeEvent(event);
    obj.current_dimensions.position.top = eventXY.clientY - obj.dragStart.y;
    obj.current_dimensions.position.left = eventXY.clientX - obj.dragStart.x;
  }
}

function stopDrag(obj, _event) {
  obj.isDragging = false;
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