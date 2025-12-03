// apps.js (Pinia store)

import { defineStore } from 'pinia';
import { useIsMobile } from '@/components/utilities/useIsMobile';

function getIsMobile() {
  const { isMobile } = useIsMobile();
  return isMobile;
}

export const useAppsStore = defineStore('apps', {
  state: () => ({
    
    // All apps (shared and unique)
    allApps: [
      { id: 'terminal', name: 'Terminal', image: 'terminal', shared: true, minWidth: getIsMobile().value ? 400 : 495},
      { id: 'file_manager', name: 'File Manager', image: 'directory', shared: true},
      { id: 'browser', name: 'Browser', image: 'browser', shared: true},
      { id: 'blog', name: 'Blog', image: 'browser', shared: true, defaultArgs: { url: '/blog' }},
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
    
    minimizedFiles: (state) => state.openFiles.filter(f => f.minimized),
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
    openApp(id, args=null) {
      const existingApp = this.openApps.find(app => app.id === id);

      if (!existingApp) {
        const minWidth = this.allApps.find(app => app.id === id).minWidth;
        this.openApps.push({ id, args, zIndex: ++this.zIndexCounter, maximized: false, minimized: false, ...(minWidth ? { minWidth } : {})});
        return;
      }

      existingApp.args = args;
      existingApp.minimized = false;
      this.bringAppToFront(id);
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
      return this.openFiles.some(file => file.item.object.$$.ptr === item.object.$$.ptr);
    },
    
    isFileMaximized(item) {
      return this.openFiles.find(file => file.item === item).maximized;
    },
    isFileMinimized(item) {
      return this.openFiles.find(file => file.item === item).minimized;
    },
    openFile(item) {
      if (!this.isFileOpen(item)) {
        this.openFiles.push({ item, zIndex: ++this.zIndexCounter, maximized: false, minimized: false});
      }
      
    },
    setFileMaximize(item, bool) {
      this.openFiles.find(file => file.item === item).maximized = bool; 
    },
    setFileMinimize(item, bool) {
      this.openFiles.find(file => file.item === item).minimized = bool; 
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
