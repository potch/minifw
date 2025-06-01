import { describe } from "vitest";
import {
  assign,
  event,
  signal,
  computed,
  effect,
  dom,
  onEffect,
} from "../src/fw.js";

describe("fw", () => {
  describe("assign", () => {
    it("shallow", () => {
      const o = assign({ a: 1 }, { b: 2 });
      expect(o).toStrictEqual({ a: 1, b: 2 });
      expect(assign({ a: 1 }, null)).toStrictEqual({ a: 1 });
    });
    it("deep", () => {
      const o = assign({ a: { deep: 1 } }, { b: 2, a: { deeper: 2 } });
      expect(o).toStrictEqual({ a: { deep: 1, deeper: 2 }, b: 2 });
    });
  });

  describe("event", () => {
    let watch, emit;

    beforeEach(() => {
      [emit, watch] = event();
    });

    it("emits", () => {
      const fn = vi.fn();
      watch(fn);
      emit(1);
      expect(fn).toHaveBeenCalledWith(1);
    });

    it("maps emit", () => {
      const fn = vi.fn();
      watch((a) => a + 1);
      watch((a) => a + 2);
      const result = emit(1);
      expect(result).toStrictEqual([2, 3]);
    });

    it("unwatches", () => {
      const fn = vi.fn();
      const unwatch = watch(fn);
      emit(1);
      expect(fn).toHaveBeenCalled();
      unwatch();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("signal", () => {
    let s;

    beforeEach(() => {
      s = signal(1);
    });

    it("can get value", () => {
      expect(s.value).toBe(1);
    });
    it("can update value", () => {
      expect(s.value).toBe(1);
      s.value = 2;
      expect(s.value).toBe(2);
    });
    it("watches", () => {
      const fn = vi.fn();
      s.watch(fn);
      s.value = 2;
      expect(fn).toHaveBeenCalled();
    });
    it("peeks", () => {
      expect(s.peek()).toBe(1);
    });
    it("un-watches", () => {
      const fn = vi.fn();
      const unwatch = s.watch(fn);
      unwatch();
      s.value = 2;
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("effect", () => {
    let s1, s2;
    beforeEach(() => {
      s1 = signal(1);
      s2 = signal(2);
    });
    it("runs once", () => {
      const fn = vi.fn();
      effect(() => fn(s1.value + s2.value));
      expect(fn).toHaveBeenCalledWith(3);
    });
    it("runs on change", () => {
      const fn = vi.fn();
      effect(() => fn(s1.value + s2.value));
      expect(fn).toHaveBeenCalledWith(3);
      s1.value = 3;
      expect(fn).toHaveBeenCalledWith(5);
    });
    it("peeks", () => {
      const fn = vi.fn();
      effect(() => fn(s1.peek() + s2.value));
      expect(fn).toHaveBeenCalledWith(3);
      s1.value = 3;
      expect(fn).toHaveBeenCalledTimes(1);
      s2.value = 3;
      expect(fn).toHaveBeenCalledTimes(2);
    });
    it("un-watches", () => {
      const fn = vi.fn();
      const unwatch = effect(() => fn(s1.value + s2.value));
      expect(fn).toHaveBeenCalledWith(3);
      s1.value = 3;
      expect(fn).toHaveBeenCalledWith(5);
      unwatch();
      s1.value = 6;
      expect(fn).toHaveBeenCalledTimes(2);
    });
    it("cycle protects", () => {
      const fn = vi.fn();
      effect(() => {
        s1.value++;
        fn(s1.value + s2.value);
      });
      s2.value++;
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("computed", () => {
    let s1, s2, c;
    beforeEach(() => {
      s1 = signal(1);
      s2 = signal(2);
      c = computed(() => s1.value + s2.value);
    });
    it("has value", () => {
      expect(c.value).toBe(3);
    });
    it("updates value", () => {
      s1.value = 3;
      expect(c.value).toBe(5);
    });
    it("works with effects", () => {
      const fn = vi.fn();
      const s3 = signal(4);
      effect(() => {
        fn(c.value + s3.value);
      });
      expect(fn).toHaveBeenCalledWith(7);
    });
    it("watches", () => {
      const fn = vi.fn();
      c.watch(fn);
      s1.value = 2;
      expect(fn).toHaveBeenCalled();
    });
    it("peeks", () => {
      expect(c.peek()).toBe(3);
    });
    it("un-watches", () => {
      const fn = vi.fn();
      const unwatch = c.watch(fn);
      unwatch();
      s1.value = 2;
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("dom", () => {
    it("creates", () => {
      const el = dom("div", {}, 2, 3, 4);
      expect(document.createElement).toHaveBeenCalledWith("div");
      expect(el.append).toHaveBeenCalledWith(2, 3, 4);
    });
    it("sets attributes", () => {
      const fn = vi.fn();
      const s = signal();
      const el = dom("test", { "data-test": 1, a: fn, ref: s, o: { a: 1 } });
      expect(document.createElement).toHaveBeenCalledWith("test");
      expect(el.setAttribute).toHaveBeenCalledTimes(1);
      expect(el.setAttribute).toHaveBeenCalledWith("data-test", 1);
      expect(el.a).toBe(fn);
      expect(s.value).toBe(el);
      expect(el.o).toStrictEqual({ a: 1 });
    });
    it("binds signals", () => {
      const s = signal("foo");
      const el = dom("test", { id: s });
      expect(document.createElement).toHaveBeenCalledWith("test");
      expect(el.setAttribute).toHaveBeenCalledTimes(1);
      expect(el.setAttribute).toHaveBeenCalledWith("id", "foo");
      s.value = "bar";
      expect(el.setAttribute).toHaveBeenCalledTimes(2);
      expect(el.setAttribute).toHaveBeenCalledWith("id", "bar");
      s.value = false;
      expect(el.removeAttribute).toHaveBeenCalledTimes(1);
      expect(el.removeAttribute).toHaveBeenCalledWith("id");
    });
    it("captures effects", () => {
      const fn = vi.fn();
      const s = signal("foo");
      const s2 = signal("bar");
      onEffect(fn);
      const el = dom("test", { id: s, name: s2 });
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
