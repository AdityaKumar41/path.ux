import { expect, test } from "vitest";
import { toLockedImpl } from "../scripts/path-controller/controller/contextNew";

test("default property codecs resolve replaced library blocks during repeated redo", () => {
  let current = { id: 1, count: 2 };
  const ctx = {
    get scene() {
      return current;
    },
    saveProperty(ctx: any, key: string) {
      return key === "scene" ? current.id : ctx[key];
    },
    loadProperty(_ctx: unknown, key: string, saved: unknown) {
      return key === "scene" ? current : saved;
    },
    toLocked: toLockedImpl,
  };
  const locked = ctx.toLocked();
  current = { id: 1, count: 3 };
  expect(locked.scene).toBe(current);
  current = { id: 1, count: 4 };
  expect(locked.scene).toBe(current);
});
