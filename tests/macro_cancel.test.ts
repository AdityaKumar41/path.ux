import { expect, test } from "vitest";
import { ToolOp } from "../scripts/path-controller/toolsys/toolop";
import { ToolMacro } from "../scripts/path-controller/toolsys/toolmacro";
import { ToolStack } from "../scripts/path-controller/toolsys/toolstack";

class Add extends ToolOp {
  static tooldef() {
    return { toolpath: "test.macro_add", inputs: {}, outputs: {} };
  }
  undoPre() {}
  exec(ctx: any) {
    ctx.state.value++;
  }
  undo(ctx: any) {
    ctx.state.value--;
  }
}
class Drag extends Add {
  ready = false;
  end?: () => void;
  static tooldef() {
    return { toolpath: "test.macro_drag", inputs: {}, outputs: {}, is_modal: true };
  }
  modalStart(): Promise<unknown> {
    this.ready = true;
    return new Promise((resolve) => {
      this.end = () => resolve(undefined);
    });
  }
  modalEnd(cancelled?: boolean) {
    if (cancelled) this._on_cancel?.(this);
    this.end?.();
  }
  undo() {}
}
test("cancelling a macro child reverses completed steps and leaves unstarted steps alone", async () => {
  const ctx: any = {
    state: { value: 0 },
    api: {},
    screen: {},
    toLocked() {
      return this;
    },
  };
  const stack = new ToolStack(ctx);
  ctx.toolstack = stack;
  const macro = new ToolMacro(),
    drag = new Drag();
  macro.add(new Add());
  macro.add(drag);
  macro.add(new Add());
  await stack.execTool(ctx, macro);
  await expect.poll(() => drag.ready).toBe(true);
  expect(ctx.state.value).toBe(1);
  drag.modalEnd(true);
  await stack.idle();
  expect(ctx.state.value).toBe(0);
  expect(stack.length).toBe(0);
});
