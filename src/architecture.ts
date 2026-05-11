/**
 * ==========================================
 * PRESENTATION LAYER - (app & components)
 * ==========================================
 * /src/app: Contains Next.js App Router specific files (pages, layouts, API routes).
 *   - The presentation logic and routing resides here.
 * /src/components: Contains isolated React components (UI).
 *   - Separated into ui (base elements), layout (containers), features (specific modules).
 * /src/hooks: Shared custom React hooks for the UI layer.
 * 
 * ==========================================
 * APPLICATION LAYER - (services & modules)
 * ==========================================
 * /src/services: Defines individual core use cases orchestrating everything.
 *   - Calls repositories/infrastructure.
 * /src/modules: Feature-based architecture containing specific slices.
 *   - e.g. /modules/messaging contains its own API handlers, local services, etc.
 * 
 * ==========================================
 * DOMAIN LAYER - (domain)
 * ==========================================
 * /src/domain: Contains pure enterprise business logic and data structures.
 *   - Models schema definitions.
 *   - Should NOT contain framework logic.
 * 
 * ==========================================
 * INFRASTRUCTURE LAYER - (infrastructure & lib)
 * ==========================================
 * /src/infrastructure: Deals with out-of-process calls, external libs.
 *   - DB connections, Redis, event bus implementations, Sockets, and encryption utilities.
 * /src/lib: Helper utilities and generalized pure function helpers.
 */
export const ARCHITECTURE_INFO = "Clean Architecture Foundation";
