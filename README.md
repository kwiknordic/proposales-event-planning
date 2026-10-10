# Handoff: Event planning for Proposales

This folder is the full brief for building the project from scratch. It is written for a coding agent (start at `AGENTS.md`) and for the humans who will present the result.

## How to start (human)

1. Create an empty project folder, e.g. `~/proposales-planner`, and copy **the contents** of this folder into it (including `public/` and `fixtures/`).
2. Put a filled `.env` in that folder yourself, using `.env.example` for the names. The agent never reads it.
3. Open Claude Code in that folder with **Opus 5.5** as the model and say: "Read AGENTS.md and build the project."
4. The agent works slice by slice, with one git commit per slice, and stops for your review where `docs/SLICES.md` says so. It commits locally only; you push to GitHub and connect Vercel yourself.

## What is in here

| File | What it is |
|---|---|
| `AGENTS.md` | Instructions for the coding agent: mission, workflow, rules |
| `CLAUDE.md` | Points Claude Code to `AGENTS.md` |
| `DESIGN.md` | Design system (close to proposales.com) |
| `docs/PRODUCT.md` | What we build and how it behaves |
| `docs/ARCHITECTURE.md` | Folder structure, data flow, coding style |
| `docs/SLICES.md` | The build plan: vertical slices, tests, commits, parallel work |
| `docs/PROPOSALES_API.md` | Verified facts about the Proposales API |
| `docs/JEV.md` | How the Jev model is used (urgency flag) |
| `docs/LANDING.md` | Content of the landing page |
| `.env.example` | Environment variable names |
| `public/review.png` | The customer review that started the idea |
| `fixtures/` | Sample plan and a real-shaped API response for tests |

## Deploying (human, after the build)

Push to a GitHub repo, import it in Vercel (root directory = repo root), and set the variables from `.env.example`. Never commit `.env`.
