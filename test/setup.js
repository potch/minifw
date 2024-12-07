import { vi } from "vitest";

const mockDoc = {
  createElement: vi.fn((tagName) => ({
    append: vi.fn(),
    setAttribute: vi.fn(),
    nodeType: 1,
    tagName,
  })),
};

vi.stubGlobal("document", mockDoc);
