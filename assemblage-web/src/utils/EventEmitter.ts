/**
 * Simple EventEmitter implementation for browser environments
 */
export class EventEmitter {
  private listeners: { [key: string]: Function[] };

  constructor() {
    this.listeners = {};
  }

  /**
   * Add an event listener
   * @param event Event name
   * @param fn Callback function
   */
  on(event: string, fn: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(fn);
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param fn Callback function to remove
   */
  off(event: string, fn: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(f => f !== fn);
  }

  /**
   * Emit an event
   * @param event Event name
   * @param data Data to pass to listeners
   */
  emit(event: string, data?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(fn => fn(data));
  }

  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  removeAllListeners(event?: string) {
    if (event) {
      this.listeners[event] = [];
    } else {
      this.listeners = {};
    }
  }
} 