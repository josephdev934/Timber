import { EventEmitter2 } from 'eventemitter2';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - EVENT BUS
 * ==========================================
 * This represents the Event Bus implementation. 
 * Allows decoupling between modules. Instead of modules directly calling each other,
 * they emit events and interested handlers subscribe to them.
 * 
 * Uses EventEmitter2 for wildcard support.
 * ==========================================
 */

// Singleton instance of the EventBus
class EventBus {
  private emitter: EventEmitter2;

  constructor() {
    this.emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.', 
      newListener: false,
      removeListener: false,
      maxListeners: 20,
    });
  }

  /**
   * Register a new handler for a specific event
   * @param event The event namespace (e.g. "user.created")
   * @param handler The function to execute
   */
  public subscribe(event: string, handler: (...args: any[]) => void) {
    this.emitter.on(event, handler);
  }

  /**
   * Emit an event to the bus
   * @param event The event namespace
   * @param payload The data to carry with the event
   */
  public publish(event: string, payload: any) {
    this.emitter.emit(event, payload);
  }
}

// Export singleton
export const eventBus = new EventBus();
