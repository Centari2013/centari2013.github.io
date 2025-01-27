// apps.js (Pinia store)

import { defineStore } from 'pinia';
import { toRaw } from 'vue';

export const useAppsStore = defineStore('apps', {
  state: () => ({
    // All apps (shared and unique)
    allApps: [
      { id: 'terminal', name: 'Terminal', image: 'terminal', shared: true, minWidth: isMobile() ? 400 : 495},
      { id: 'file_manager', name: 'File Manager', image: 'directory', shared: true}
    ],

    openApps: [], // [{ id: 'terminal', zIndex: 1, ... }]
    openFiles: [], // [{id: 'adadada', zIndex: 10, ... }]
    zIndexCounter: 1,
  }),
  getters: {
    // Get shared apps
    sharedApps: (state) => state.allApps.filter(app => app.shared),
    
    // Get apps unique to the desktop (shared apps + apps with specific ids for the desktop)
    desktopApps: (state) => state.allApps.filter(app => app.shared || app.id === 'terminal'), // Example logic for desktop apps

    // Get apps unique to the taskbar (shared apps + apps with specific ids for the taskbar)
    taskbarApps: (state) => state.allApps.filter(app => app.shared || app.id === 'browser'), // Example logic for taskbar apps
  },
  actions: {
    getAppzIndex(id) {
      return this.openApps.find(app => app.id === id).zIndex;
    },
    isAppOpen(id) {
      return this.openApps.some(app => app.id === id);
    },
    isAppMinimized(id) {
      return this.openApps.find(app => app.id === id).minimized;
    },
    isAppMaximized(id) {
      return this.openApps.find(app => app.id === id).maximized;
    },
    openApp(id) {
      if (!this.openApps.find(app => app.id === id)) {
        const minWidth = this.allApps.find(app => app.id === id).minWidth;
        this.openApps.push({ id, zIndex: ++this.zIndexCounter, maximized: false, minimized: false, ...(minWidth ? { minWidth } : {})});
      }
    },
    setAppMinimize(id, bool) {
      this.openApps.find(app => app.id === id).minimized = bool; 
    },
    setAppMaximize(id, bool) {
      this.openApps.find(app => app.id === id).maximized = bool; 
    },
    bringAppToFront(id) {
      const app = this.openApps.find(app => app.id === id);
      if (app) app.zIndex = ++this.zIndexCounter;
    },
    closeApp(id) {
      const appIndex = this.openApps.findIndex(app => app.id == id);
      this.openApps.splice(appIndex, 1);
    },

    // Files
    getFilezIndex(item) {
      return this.openFiles.find(file => file.item === item).zIndex;
    },
    isFileOpen(item) {
      return this.openFiles.some(file => file.item === item);
    },
    
    isFileMaximized(item) {
      return this.openFiles.find(file => file.item === item).maximized;
    },
    openFile(item) {
      if (!this.openFiles.find(file => toRaw(file.item.object) === toRaw(item.object))) {

        this.openFiles.push({ item, zIndex: ++this.zIndexCounter, maximized: false});
      }
      
    },
    setFileMaximize(item, bool) {
      this.openFiles.find(file => file.item === item).maximized = bool; 
    },
    bringFileToFront(item) {
      const file = this.openFiles.find(file => file.item === item);
      if (file) file.zIndex = ++this.zIndexCounter;
    },
    closeFile(item) {
      const fileIndex = this.openFiles.findIndex(file => file.item === item);
      this.openFiles.splice(fileIndex, 1);
    }, 
  },
});
