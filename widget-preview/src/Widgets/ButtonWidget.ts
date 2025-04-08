import type {WidgetProps} from "./Widget.ts";
import {type BoolString, Color} from "../Common.ts";
import {CanvasWidgetClass} from "./CanvasWidget.ts";
import {ref} from "vue";
import {AttributeType} from "../Components/Inspector.ts";

export interface ButtonWidgetProps extends WidgetProps {
    IsClicked?: BoolString | boolean;
    IsChecked?: BoolString | boolean;
    IsPressed?: BoolString | boolean;
    IsAutoCheckingEnabled?: BoolString | boolean;
    Text?: string;
    Font?: string;
    Color?: string | Color;
}

export class ButtonWidgetClass<T extends ButtonWidgetProps = ButtonWidgetProps> extends CanvasWidgetClass<T> {
    isClicked = ref(false);
    isChecked = ref(false);
    isPressed = ref(false);
    isAutoCheckingEnabled = ref(false);
    text = ref("");
    font?: string;
    color = ref(new Color(255, 255, 255));

    updateFromProps(props: T) {
        super.updateFromProps(props);
        if (props.IsClicked === "true" || props.IsClicked === true) {
            this.isClicked.value = true;
        }
        if (props.IsChecked === "true" || props.IsChecked === true) {
            this.isChecked.value = true;
        }
        if (props.IsPressed === "true" || props.IsPressed === true) {
            this.isPressed.value = true;
        }
        if (props.IsAutoCheckingEnabled === "true" || props.IsAutoCheckingEnabled === true) {
            this.isAutoCheckingEnabled.value = true;
        }
        if (props.Text !== undefined && props.Text.length > 0) {
            this.text.value = props.Text;
        }
        if (props.Font !== undefined) {
            this.font = props.Font;
        }
        if (props.Color !== undefined) {
            this.color.value.update(props.Color);
        }
    }

    initInspectorProvider() {
        super.initInspectorProvider();
        this.inspectorProvider.addAttribute<string>("Text",
            AttributeType.String,
            () => this.text.value,
            value => this.text.value = value);
        this.inspectorProvider.addAttribute<string>("Font",
            AttributeType.String,
            () => this.font ?? "",
            value => this.font = value);
        this.inspectorProvider.addAttribute<Color>("Color",
            AttributeType.Color,
            () => this.color.value,
            value => this.color.value = new Color(value));
    }
}
