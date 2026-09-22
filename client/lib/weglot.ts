declare global {
  interface Window {
    Weglot?: {
      initialize: (options: { api_key: string }) => void;
      switchTo: (code: string) => void;
      getCurrentLang: () => string;
    };
  }
}

export function loadWeglot() {
  return new Promise<void>((resolve, reject) => {
    if (window.Weglot) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.weglot.com/weglot.min.js";
    script.async = true;

    script.onload = () => {
      const apiKey = import.meta.env.VITE_WEGLOT_API_KEY;

      if (!apiKey) {
        reject(new Error("VITE_WEGLOT_API_KEY is not defined"));
        return;
      }

      window.Weglot?.initialize({
        api_key: apiKey,
      });

      resolve();
    };

    script.onerror = () => {
      reject(new Error("Failed to load Weglot"));
    };

    document.head.appendChild(script);
  });
}
