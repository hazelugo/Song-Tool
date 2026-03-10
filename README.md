This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Delete

Point it at these files:

02-01-PLAN.md
02-02-PLAN.md
02-03-PLAN.md
02-RESEARCH.md (for context on pitfalls)
CLAUDE.md (project conventions)
Starter prompt for Gemini:

I have a Next.js 15 project with Drizzle ORM and shadcn (base-nova/base-ui style). I need you to execute Phase 2 by following the PLAN.md files in order: 02-01 → 02-02 → 02-03. Each plan has tasks with <action> (what to write), <verify> (command to run), and <done> (acceptance criteria). Execute each task, run the verify command, confirm it passes, then move to the next. Stop and report if any verify fails. Read 02-RESEARCH.md first — it documents critical pitfalls (Next.js 15 async params, Zod v4 error API, BPM coercion, tag Enter-key, Drizzle relations).
