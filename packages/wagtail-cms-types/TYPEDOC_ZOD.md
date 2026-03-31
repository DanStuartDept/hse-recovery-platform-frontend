# TypeDoc with Zod Plugin

This package uses [typedoc-plugin-zod](https://www.npmjs.com/package/typedoc-plugin-zod) to generate enhanced documentation for Zod schemas.

## Features

The plugin enhances TypeDoc output by:
-  Displaying Zod schema structures in the documentation
-  Showing ZodObject properties with their types
-  Documenting ZodOptional, ZodEnum, and other Zod types
-  Preserving JSDoc comments from schemas

## Configuration

### typedoc.json
```json
{
  "entryPoints": ["src/types"],
  "entryPointStrategy": "expand",
  "out": "public",
  "plugin": ["typedoc-plugin-zod"],
  "excludeExternals": true,
  "excludePrivate": true,
  "readme": "none"
}
```

## Commands

```bash
# Build documentation
pnpm build

# Watch mode with live reload
pnpm dev

# Build and watch documentation only
pnpm build:watch

# Serve documentation (runs automatically with dev)
pnpm serve:live
```

## Generated Documentation

The plugin generates documentation for:

### Schemas
All Zod schemas are documented with their structure:
- `BaseCMSBlockTypeSchema` - Base block schema
- `BlockDisplaySettingsTypeSchema` - Display settings
- `CMSBlockComponentsKeysEnum` - Block type enum
- All block-specific schemas (e.g., `BlockCardPropsSchema`)

### Types
TypeScript types inferred from schemas:
- `BlockCardProps` - Inferred from `BlockCardPropsSchema`
- `CMSBlockType` - Base block type
- All component-specific types

## Viewing Documentation

Documentation is generated to `public/` directory:
- Open `public/index.html` in a browser
- Or run `pnpm dev` for live-reloading server at `http://localhost:3002`

## Example Output

For a schema like:
```typescript
export const BlockCardPropsSchema = BaseCMSBlockTypeSchema.extend({
  value: BlockCardValuesPropsSchema,
});
```

The plugin generates documentation showing:
- The schema structure
- Property types (ZodObject, ZodString, etc.)
- Optional vs required fields
- JSDoc comments

## Benefits

1. **Schema Validation Documentation** - Developers can see exactly what validation rules apply
2. **Type Safety** - Both schema and type information in one place
3. **Runtime + Compile-time** - Documents both TypeScript types and Zod runtime validation
4. **Auto-generated** - Stays in sync with code changes

## Links

- [typedoc-plugin-zod on npm](https://www.npmjs.com/package/typedoc-plugin-zod)
- [TypeDoc Documentation](https://typedoc.org/)
- [Zod Documentation](https://zod.dev/)
