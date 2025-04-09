import {StackPanelWidgetClass} from "./StackPanelWidget.ts";
import {LayoutDirection} from "../../Common.ts";

export class UniformSpacingPanelWidgetClass extends StackPanelWidgetClass {
    get width(): number {
        return this.direction.value === LayoutDirection.Horizontal ?
            Infinity :
            this.realWidth.value;
    }

    set width(_value: number) {
        return;
    }

    get height(): number {
        return this.direction.value === LayoutDirection.Vertical ? Infinity : this.realHeight.value;
    }

    set height(_value: number) {
        return;
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.removeAttribute("Is\u200BInverted");
    }
}
