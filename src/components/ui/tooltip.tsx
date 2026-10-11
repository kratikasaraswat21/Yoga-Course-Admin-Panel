import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/utils/helper/helper";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({ className, children, side = "top", sideOffset = 6, ...props }: TooltipPrimitive.Popup.Props & { side?: TooltipPrimitive.Positioner.Props["side"]; sideOffset?: number }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset}>
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-[110] whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md",
            className,
          )}
          {...props}>
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
