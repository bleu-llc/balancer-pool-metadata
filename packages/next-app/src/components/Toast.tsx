import * as ToastPrimitive from "@radix-ui/react-toast";
import cn from "classnames";
import React, { Dispatch } from "react";

import { ProgressBar } from "./ProgressBar";

interface IToast {
  content: React.ReactElement;
  isOpen: boolean;
  setIsOpen: Dispatch<boolean>;
  variant?: "notification" | "pending" | "alert" | "success";
}

export function Toast({
  content,
  isOpen,
  setIsOpen,
  variant = "notification",
}: IToast) {
  let bgColor;
  switch (variant) {
    case "notification":
      bgColor = "bg-blue-100";
      break;
    case "pending":
      bgColor = "bg-yellow-100";
      break;
    case "alert":
      bgColor = "bg-red-100";
      break;
    case "success":
      bgColor = "bg-green-100";
      break;
  }

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Root
        duration={30000}
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          "data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=end]:animate-swipeOut mb-2 grid grid-cols-[auto_max-content] items-center shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] [grid-template-areas:_'title_action'_'description_action'] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out]",
          bgColor
        )}
      >
        <div className="relative w-full">
          <div className="absolute w-full">
            <ProgressBar variant={variant} />
          </div>
          {React.cloneElement(React.Children.only(content), {
            close: () => setIsOpen(false),
          })}
        </div>
      </ToastPrimitive.Root>

      <ToastPrimitive.Viewport className="fixed right-[-32rem] bottom-[-14rem] z-[2147483647] m-0 flex w-[350px] max-w-[100vw] list-none flex-col gap-[10px] p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]" />
    </ToastPrimitive.Provider>
  );
}
