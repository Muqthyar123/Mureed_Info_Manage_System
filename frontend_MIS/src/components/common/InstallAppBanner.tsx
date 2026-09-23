import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already running as an installed standalone PWA app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return; // Do not show install prompt inside already installed app
    }

    // Check if user dismissed install banner recently (within 3 days)
    const dismissedTime = localStorage.getItem("gulaaman_install_dismissed");
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    if (isIPhoneOrIPad) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Catch Android / Chrome / Edge beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("gulaaman_install_dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install App Popup Banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="surface-card relative flex items-center justify-between gap-3 rounded-xl border border-primary/20 p-4 shadow-xl backdrop-blur-md bg-card/95">
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src="/apple-touch-icon.png"
              alt="Gulaaman e Askari Logo"
              className="size-12 rounded-xl border border-border/50 object-cover shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/favicon.png";
              }}
            />
            <div className="pr-2">
              <h4 className="text-sm font-bold text-foreground">Gulaaman e Askari</h4>
              <p className="text-xs text-muted-foreground">
                Install app on your phone for quick 1-tap access
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleInstallClick}
            className="shrink-0 font-medium shadow-md gap-1.5"
          >
            <Download className="size-4" />
            Install App
          </Button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="surface-card max-w-sm rounded-xl p-5 shadow-2xl text-center space-y-4 border border-border">
            <img
              src="/apple-touch-icon.png"
              alt="Gulaaman e Askari"
              className="mx-auto size-14 rounded-2xl shadow-md"
            />
            <h3 className="text-lg font-bold">Install Gulaaman e Askari</h3>
            <p className="text-xs text-muted-foreground">
              To install this app on your iPhone or iPad:
            </p>
            <ol className="text-left text-xs space-y-2.5 bg-muted/60 p-3 rounded-lg border border-border/50">
              <li className="flex items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button <Share className="inline size-4 text-primary" /> in Safari menu.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen ➕</strong>.
                </span>
              </li>
            </ol>
            <Button className="w-full" onClick={() => setShowIOSGuide(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
