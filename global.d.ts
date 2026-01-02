/**
 * Global type declarations for browser APIs and custom window properties
 */

// Google Analytics / Tag Manager
declare global {
    var dataLayer: any[] | undefined;
    var trackEvent: ((...args: any[]) => void) | undefined;
}

// Custom window properties
interface Window {
    dataLayer?: any[];
    trackEvent?: (...args: any[]) => void;
    InfoPanel?: any;
    infoPanel?: any;
}

export { };
