# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

91Writing (91 写作) is an AI-powered novel writing tool built with Vue 3. It provides a complete创作 workflow from outline generation to chapter writing, with AI assistance for content generation, polishing, and analysis.

**Demo**: https://xiezuo.91hub.vip

## Commands

```bash
# Install dependencies
pnpm install

# Development server (port 7520)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Docker development (requires Docker)
./scripts/deploy-dev.sh

# Docker production
docker-compose --profile prod up -d
```

## Architecture

### Tech Stack
- **Vue 3.3.8** with Composition API
- **Vite 4.5.0** for bundling
- **Pinia 2.1.7** for state management
- **Vue Router 4.2.5** for routing
- **Element Plus 2.4.2** for UI components
- **WangEditor 5.1.23** for rich text editing

### Project Structure

```
src/
├── main.js              # App entry point (Vue, Pinia, Router, ElementPlus setup)
├── App.vue              # Root component
├── router/index.js      # Route definitions
├── stores/novel.js      # Central Pinia store (API config, novel data, characters, world settings)
├── services/
│   ├── api.js           # API client for AI model calls (OpenAI-compatible format)
│   └── billing.js       # Token usage tracking and billing
├── components/
│   ├── writer/          # Writer module components (Editor, Tabs, Character/World/Event panels)
│   └── *.vue            # Feature components (ChapterManager, TemplateManager, etc.)
├── views/               # Page-level components (Dashboard, NovelManagement, ShortStory, etc.)
└── config/
    └── api.json         # Default API configuration
```

### Key Modules

**Novel Management** (`src/views/NovelManagement.vue`)
- Novel CRUD with metadata (title, cover, intro, tags, status)
- Outline generation with AI
- Chapter management with draft/completed/published states

**Writer Module** (`src/views/Writer.vue` + `src/components/writer/`)
- Rich text editor with WangEditor
- AI continuation (streaming output, 200-5000 words)
- AI polishing (grammar, style, emotion, logic)
- Character and world setting management
- Event timeline

**Short Story** (`src/views/ShortStory.vue`)
- Template-based story generation (6 genres)
- Prompt library with variable substitution
- Real-time word count and stats

**Book Analysis** (`src/views/BookAnalysis.vue`)
- Import TXT/DOCX files
- AI-powered analysis (structure, characters, language, plot)

**Tools Library** (`src/views/ToolsLibrary.vue`)
- 10 AI tools: outline, character, brainstorm, title, genre, worldview, golden-finger, opening, intro, conflict generators

**Prompts Library** (`src/views/PromptsLibrary.vue`)
- Categorized prompt templates (outline, content, polishing, dialogue, etc.)
- Custom prompt management with variables

**Settings** (`src/views/Settings.vue`)
- API configuration (official 91 Writing API or custom OpenAI-compatible API)
- Data import/export (novels, prompts, genres, corpus)
- Backup and restore

### State Management

All state is managed in `src/stores/novel.js` using Pinia:
- `currentNovel`, `outline`, `chapters` - Novel content
- `characters`, `worldSettings` - Story elements
- `officialApiConfig`, `customApiConfig` - Dual API configuration system
- `corpus` - Writing corpus for style reference
- `articleStats` - Writing statistics

The store persists configuration to localStorage and handles all API interactions via `apiService`.

### API Integration

`src/services/api.js` provides the API client:
- Supports any OpenAI-compatible API endpoint
- Streaming generation for all content types
- Token usage tracking via `billingService`
- Configurable model selection and parameters

Default models in config:
- Official: `claude-4-sonnet` (91 Writing API)
- Custom: `gpt-3.5-turbo` (user-defined endpoint)

### Routing

All routes are nested under `Dashboard`:
- `/` - HomePage (dashboard with stats)
- `/novels` - Novel management
- `/writer` - Writing interface
- `/short-story` - Short story creation
- `/book-analysis` - Book analysis
- `/prompts` - Prompt library
- `/tools` - Tools library
- `/goals` - Writing goals
- `/billing` - Token billing
- `/config` - API configuration
- `/settings` - Data management
- `/genres` - Genre management

### Build Configuration

`vite.config.js`:
- Base path: `./` (relative)
- Port: 7520
- Auto-imports for Vue, Vue Router, Pinia
- Element Plus component auto-import
- Alias: `@` → `src`

### Docker Deployment

Multi-stage build (`Dockerfile`):
1. **development**: Node 18, pnpm, hot reload on port 3000
2. **builder**: Production build
3. **production**: Nginx serving dist on port 80

`docker-compose.yml` provides dev/prod profiles with separate containers.
