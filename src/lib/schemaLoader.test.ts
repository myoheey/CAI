import { describe, expect, it } from "vitest";

import { sanitizeSchemaForOpenAI } from "./schemaLoader";

describe("sanitizeSchemaForOpenAI", () => {
  it("removes $id, $schema and title recursively", () => {
    const schema = {
      $id: "x",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "Root",
      type: "object",
      properties: {
        child: {
          title: "Child",
          type: "object",
          properties: {
            value: {
              type: "string",
              $id: "nested"
            }
          }
        }
      }
    };

    const sanitized = sanitizeSchemaForOpenAI(schema) as {
      properties: {
        child: {
          properties: {
            value: Record<string, unknown>;
          };
        };
      };
    } & Record<string, unknown>;

    expect(sanitized.$id).toBeUndefined();
    expect(sanitized.$schema).toBeUndefined();
    expect(sanitized.title).toBeUndefined();

    const child = sanitized.properties.child as Record<string, unknown>;
    expect(child.title).toBeUndefined();
    expect(sanitized.properties.child.properties.value.$id).toBeUndefined();
  });

  it("preserves 'title' when it is a data property name inside properties", () => {
    const schema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description"],
            properties: {
              title: { type: "string" },
              description: { type: "string" }
            }
          }
        }
      }
    };

    const sanitized = sanitizeSchemaForOpenAI(schema) as Record<string, unknown>;
    const items = (sanitized as { properties: { items: { items: Record<string, unknown> } } }).properties.items.items;
    const props = items.properties as Record<string, unknown>;

    expect(props.title).toBeDefined();
    expect(props.description).toBeDefined();
    expect((items.required as string[]).includes("title")).toBe(true);
  });
});
