
---

# FarmFlow

FarmFlow is a decentralized agricultural supply chain platform built on Solana using [Next.js](https://nextjs.org). This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It enables farmers to log harvests, retailers to fund payments, and transporters to track produce, all secured by blockchain transparency.

**Note**: This is a prototype with ongoing modifications. Governance is a basic proposal/voting system, QR codes are temporary links, and images are currently stored on Firebase with plans to migrate to IPFS.

## Getting Started

To run the development server locally:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

Start editing by modifying `app/page.tsx`—the page auto-updates as you make changes.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to optimize and load [Geist](https://vercel.com/font), a font family from Vercel.

## Project Structure

- **`app/`**: Contains the Next.js pages and components (e.g., `page.tsx` for the homepage).
- **`program/`**: Includes the Solana smart contract reference, written in Rust and built/deployed using [Anchor](https://www.anchor-lang.com/). This folder serves as a reference for the contract logic.

## Learn More

To dive deeper into Next.js and Anchor:

- [Next.js Documentation](https://nextjs.org/docs) - Explore Next.js features and APIs.
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial.
- [Anchor Documentation](https://www.anchor-lang.com/docs/introduction) - Learn about building Solana programs with Anchor.

Check out the [Next.js GitHub repository](https://github.com/vercel/next.js) and [Anchor GitHub repository](https://github.com/coral-xyz/anchor)—feedback and contributions are welcome!

## Deploy on Vercel

The simplest way to deploy FarmFlow is via the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). Visit the live deployment at [https://farm-flow-fawn.vercel.app/](https://farm-flow-fawn.vercel.app/).

For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---