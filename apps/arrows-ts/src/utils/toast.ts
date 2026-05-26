/**
 * Toast notification utility for displaying temporary messages
 * Uses Semantic UI React Message component styled as a toast
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number; // Duration in milliseconds (default: 3000)
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

let toastContainer: HTMLDivElement | null = null;

const createToastContainer = () => {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.position = 'fixed';
  toastContainer.style.top = '1rem';
  toastContainer.style.right = '1rem';
  toastContainer.style.zIndex = '10000';
  toastContainer.style.pointerEvents = 'none';
  document.body.appendChild(toastContainer);
  return toastContainer;
};

const getToastClasses = (type: ToastType): string => {
  const baseClasses = 'ui message';
  const typeClasses = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  return `${baseClasses} ${typeClasses[type]}`;
};

const getToastIcon = (type: ToastType): string => {
  const icons = {
    success: 'check circle',
    error: 'times circle',
    warning: 'exclamation triangle',
    info: 'info circle',
  };
  return icons[type];
};

export const showToast = (
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
) => {
  const { duration = 3000, position = 'top-right' } = options;
  const container = createToastContainer();

  // Update container position
  const positionStyles: Record<string, Partial<CSSStyleDeclaration>> = {
    'top-right': { top: '1rem', right: '1rem', left: 'auto', bottom: 'auto' },
    'top-left': { top: '1rem', left: '1rem', right: 'auto', bottom: 'auto' },
    'bottom-right': { bottom: '1rem', right: '1rem', left: 'auto', top: 'auto' },
    'bottom-left': { bottom: '1rem', left: '1rem', right: 'auto', top: 'auto' },
  };

  Object.assign(container.style, positionStyles[position]);
  container.style.pointerEvents = 'auto';

  // Create toast element
  const toast = document.createElement('div');
  toast.className = getToastClasses(type);
  toast.style.cssText = `
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    border-radius: 6px;
    margin-bottom: 0.5rem;
    opacity: 0;
    transform: translateX(100%);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: auto;
    cursor: pointer;
    padding: 1em 1.5em !important;
    display: flex !important;
    align-items: center !important;
  `;

  const icon = getToastIcon(type);
  toast.innerHTML = `
    <i class="${icon} icon" style="flex-shrink: 0; margin: 0 !important; padding: 0 !important; line-height: 1em; align-self: center;"></i>
    <div style="flex: 1; margin: 0 0.75rem; padding: 0; line-height: 1.4em; align-self: center;">${message}</div>
    <i class="close icon" style="cursor: pointer; flex-shrink: 0; margin: 0 !important; padding: 0 !important; line-height: 1em; align-self: center;"></i>
  `;

  // Add close handler
  const closeBtn = toast.querySelector('.close.icon');
  const removeToast = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', removeToast);
  }
  toast.addEventListener('click', removeToast);

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove
  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
};

// Convenience functions
export const showSuccess = (message: string, options?: ToastOptions) => {
  showToast(message, 'success', options);
};

export const showError = (message: string, options?: ToastOptions) => {
  showToast(message, 'error', { duration: 5000, ...options });
};

export const showWarning = (message: string, options?: ToastOptions) => {
  showToast(message, 'warning', { duration: 4000, ...options });
};

export const showInfo = (message: string, options?: ToastOptions) => {
  showToast(message, 'info', options);
};

