# STR - Strategy Investment Tracker

A strategy-first investment tracking web app for advanced investors who manage multiple independent trading strategies.

## Quick Start

```bash
npm install
./run.sh
```

The frontend dev server starts at **http://localhost:5173**.

## Project Structure

```
Str/
├── apps/
│   └── web/             # Vite + React + TypeScript frontend
├── packages/
│   └── shared/          # Shared types, enums, constants
├── run.sh               # Start all dev servers
└── package.json         # npm workspaces root
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4, Zustand
- **Backend**: NestJS (coming soon)
- **Database**: MongoDB Atlas (coming soon)
