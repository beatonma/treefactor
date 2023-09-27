import { describe, expect, test } from "bun:test";
import { isDescendant } from "./path";

describe("Path", () => {
  test("isDescendant", () => {
    expect(isDescendant("/root/", "/root/subdir/")).toBeTrue();
    expect(isDescendant("/root/", "/root/subdir/file.mp3")).toBeTrue();
    expect(isDescendant("/root/sub/", "/root/sub/file.mp3")).toBeTrue();
    expect(isDescendant("/root/", "/root/file.mp3")).toBeTrue();

    expect(isDescendant("/root/", "/root/")).toBeFalse();
    expect(isDescendant("/root/subdir/file.mp3", "/root/")).toBeFalse();
    expect(isDescendant("/root/subdir/file.mp3", "/root/")).toBeFalse();
  });
});
