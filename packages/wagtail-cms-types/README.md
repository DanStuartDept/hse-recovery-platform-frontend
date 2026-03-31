# Introduction

A comprehensive TypeScript type definitions package for Wagtail CMS integration, providing strongly-typed interfaces for all CMS content structures, API responses, blocks, page models, and field types.

## Overview

This package contains TypeScript type definitions that enable type-safe development when working with Wagtail CMS data. It covers all aspects of CMS content including:

- **Blocks**: Content block components with their props and value types
- **Core**: Client configuration, API queries, and response structures  
- **Page Models**: Specific page types and their content structures
- **Fields**: Common field types like images, CTAs, and media
- **Settings & Snippets**: Site configuration and reusable content

## Installation

This package is part of a monorepo workspace and is typically installed as a dependency:

```bash
pnpm add @repo/wagtail-cms-types
```

## Module Exports

The package provides modular exports for different CMS type categories:

```typescript
// Block types and interfaces
import { CMSBlockType, CMSBlockComponentsKeys } from '@repo/wagtail-cms-types/blocks'

// Core CMS types (queries, responses, content)
import { CMSQueries, CMSPageContent, ClientOptions } from '@repo/wagtail-cms-types/core'

// Page model types
import { CMSPageProps, CMSPageType } from '@repo/wagtail-cms-types/page-models'

// Field types (images, CTAs, etc.)
import { FieldTypeImage, FieldTypeCta } from '@repo/wagtail-cms-types/fields'
```

## Key Type Categories

### Block Types

The blocks module provides types for all CMS content blocks including:

- **Layout Blocks**: `group`, `row`, `section_listing`
- **Content Blocks**: `text`, `text_picture`, `quote`, `accordion`
- **Media Blocks**: `picture`, `youtube`, `hero_image_banner`
- **Interactive Blocks**: `cta`, `cta_panel`, `card`, `alert`
- **Specialized Blocks**: `team_member`, `timeline`, `demo_ui_banner`

Each block has corresponding `Props` and `ValuesProps` interfaces for component rendering and data structure.

### Core Types

Essential CMS integration types:

- `ClientOptions`: Configuration for CMS API client
- `CMSQueries`: Query parameters for CMS API requests
- `CMSPageContent`: Base page content structure
- `CMSContents`: Paginated content responses
- `CMSPageMeta`: Page metadata (SEO, URLs, publishing info)

### Page Models

Specific page type definitions:

- **App Base Pages**: `HomePage`, `LandingPage`, `ContentPage`, `SearchPage`
- **News Pages**: `NewsListingPage`, `NewsContentPage`
- Base interface `CMSPageWithBlocks` for pages with header/body block structure

### Field Types

Common CMS field definitions:

- `FieldTypeImage`: Responsive image with multiple breakpoint sizes
- `FieldTypeCta`: Call-to-action with title and URL
- `FieldTypeVideo`: Video content structure
- `FieldTypeHeadingLevel`: Heading level enumeration (1-6)

## Development

### Available Scripts

- `pnpm lint` - Run ESLint on source files
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run test suite
- `pnpm test:ci` - Run tests with coverage
- `pnpm generate-docs` - Generate TypeDoc documentation

### Documentation Generation

The package uses TypeDoc to generate comprehensive API documentation:

```bash
pnpm generate-docs
```

This generates documentation in the `public/` directory covering all exported types and interfaces.

## Architecture

The type system is organized hierarchically:

```
src/types/
├── blocks/          # Content block definitions
├── core/            # Core CMS types and API structures  
├── fields/          # Common field type definitions
├── page-models/     # Specific page type models
├── settings/        # Site settings types
├── snippets/        # Reusable content snippet types
```

Each module provides focused type definitions for its domain, with clear separation of concerns and minimal cross-dependencies.

## Contributing

When adding new types:

1. Place them in the appropriate module directory
2. Export them from the module's `index.ts`
3. Add comprehensive JSDoc comments for complex types
4. Update this README if adding new major type categories
5. Run `pnpm generate-docs` to update API documentation

## Related Packages

- `@repo/wagtail-api-client` - API client implementation using these types
- `@repo/wagtail-render-blocks` - Block rendering components using these types
- `@repo/ui` - UI components that work with CMS content types

