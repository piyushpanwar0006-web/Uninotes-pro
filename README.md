# Uninotes Pro - Next.js & Tailwind Upgrade

This is the modernized, scalable version of the Uninotes platform, rebuilt with **Next.js 14 (App Router)** and **Tailwind CSS**.

## Modern Architecture Features
- **Component-Based**: UI fragmented into reusable React components (`Navbar`, `Footer`, `BranchCard`, etc.).
- **Dynamic Routing**: Uses Next.js file-based routing for branches (`/branches/[branchName]`).
- **Utility-First CSS**: Scalable styling using Tailwind CSS, removing the need for a massive monolithic CSS file.
- **Server Component Ready**: Optimized for performance and fast initial loads.

## Getting Started

First, ensure you have Node.js installed. Then, from this directory (`uninotes-pro`):

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open the app**:
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
- `src/app`: Contains the pages and routing logic.
- `src/components`: Reusable UI components.
- `src/data`: Centralized data modules (e.g., `branches.js`).
- `src/styles`: Global CSS and Tailwind directives.
- `public`: Static assets like images and logos.

## Contributing
As a senior developer would suggest: keep your components small, use Tailwind utility classes for styling, and always verify your dynamic routes.
