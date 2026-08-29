import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

function getLoadingLabel(children: React.ReactNode, explicitLoadingText?: string): string {
  if (explicitLoadingText) return explicitLoadingText;
  let text = "";
  if (typeof children === "string") {
    text = children.trim();
  } else if (Array.isArray(children)) {
    text = children.map((c) => (typeof c === "string" ? c : "")).join(" ").trim();
  }
  if (!text) return "Processing...";

  const lower = text.toLowerCase();
  if (lower.startsWith("delete")) {
    return text.replace(/^delete/i, "Deleting") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("add")) {
    return text.replace(/^add/i, "Adding") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("save")) {
    return text.replace(/^save/i, "Saving") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("create")) {
    return text.replace(/^create/i, "Creating") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("approve")) {
    return text.replace(/^approve/i, "Approving") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("reject")) {
    return text.replace(/^reject/i, "Rejecting") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("export")) {
    return text.replace(/^export/i, "Exporting") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.includes("login") || lower.includes("log in")) {
    return "Logging in...";
  }
  if (lower.startsWith("submit")) {
    return text.replace(/^submit/i, "Submitting") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("resend")) {
    return text.replace(/^resend/i, "Sending") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("send")) {
    return text.replace(/^send/i, "Sending") + (text.endsWith("...") ? "" : "...");
  }
  if (lower.startsWith("update")) {
    return text.replace(/^update/i, "Updating") + (text.endsWith("...") ? "" : "...");
  }
  return `${text}...`;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const isLoading = Boolean(loading);

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin shrink-0" />
            <span>{getLoadingLabel(children, loadingText)}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
