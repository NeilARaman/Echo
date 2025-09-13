# Echo 🎙️

## Simulations for Journalists

Echo is a sophisticated journalism platform that leverages AI agents and simulated communities to help journalists create fact-checked, well-balanced, and impactful articles. Built for modern newsrooms, Echo ensures factual accuracy while maintaining journalistic integrity through advanced AI-powered analysis and community simulation.

![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC)
![MIT License](https://img.shields.io/badge/License-MIT-green.svg)

## 🌟 Overview

In today's fast-paced media landscape, maintaining factual accuracy and balanced reporting is crucial for publication credibility. Echo addresses these challenges by providing:

- **Real-time Fact Verification**: AI agents swarm the web for instant information verification
- **Bias Detection & Analysis**: Continuous analysis for hedging and balanced reporting
- **Community Reception Simulation**: Test how different demographics will receive your articles
- **Collaborative Editorial Workflow**: Streamlined tools for modern newsroom collaboration
- **Quality Assurance**: Automated flagging of inconsistencies and editorial suggestions

## ✨ Key Features

### 🤖 AI Agent Swarms

- Real-time web scraping for the latest information
- Cross-reference multiple sources for comprehensive fact verification
- Automated detection and flagging of inconsistent information
- Integration with major news APIs (NYT, Guardian, Reuters)

### 📊 Advanced Analytics & Simulation

- Real-time bias analysis and hedging recommendations
- Multi-demographic perspective consideration
- Community reception simulation before publication
- Confidence scoring for publication readiness

### 🎯 Journalist-Focused Interface

- Clean, intuitive dashboard designed for editorial workflows
- Real-time collaboration tools for newsroom teams
- Integrated fact-checking and editing interface
- Mobile-responsive design for on-the-go reporting

### 🔍 Echo Dashboard

- Target community management for content testing
- Draft article analysis and reception simulation
- Comprehensive reporting with actionable insights
- Historical performance tracking

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or later
- **npm**, **yarn**, **pnpm**, or **bun**
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/echo.git
   cd echo
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables** (optional):

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables in `.env.local` if needed.

4. **Run the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to see Echo in action.

## 🛠️ Technology Stack

### Frontend Framework

- **[Next.js 15.4.5](https://nextjs.org/)** - React framework with App Router and Turbopack
- **[React 19.1.1](https://reactjs.org/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience

### Styling & UI

- **[Tailwind CSS 4.x](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Shadcn/ui](https://ui.shadcn.com/)** - Pre-built component library
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### 3D Graphics & Animation

- **[Three.js](https://threejs.org/)** - 3D graphics library for interactive visualizations
- **[Motion](https://motion.dev/)** - Advanced animation library
- **[React Rough Notation](https://roughnotation.com/)** - Animated annotations

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting and quality assurance
- **[Turbopack](https://turbo.build/pack)** - Fast bundler for development
- **[React Hook Form](https://react-hook-form.com/)** - Performant form handling
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

## 📁 Project Structure

```bash
echo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── echo/              # Echo dashboard page
│   │   ├── api/               # API routes for community management
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles and design system
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components (Shadcn/ui)
│   │   ├── HeroSection.tsx   # Landing page hero with 3D galaxy
│   │   ├── FeatureSection.tsx # Features showcase
│   │   ├── Navbar.tsx        # Navigation component
│   │   ├── NetworkAnimation.tsx # Community simulation animation
│   │   ├── ResultDisplay.tsx # Analysis results component
│   │   └── ...               # Other specialized components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and helpers
│   └── visual-edits/         # Visual editing system
├── backend/                  # Backend data storage
│   └── data/                # Community and artifact storage
├── public/                   # Static assets
├── components.json           # Shadcn/ui configuration
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── package.json             # Dependencies and scripts
└── LICENSE                  # MIT License
```

## 🎯 Usage

### For Journalists

1. **Landing Page**: Start at the main Echo website to learn about features
2. **Access Dashboard**: Navigate to `/echo` for the main application
3. **Create Communities**: Define target demographics for content testing
4. **Draft Analysis**: Submit articles for AI-powered analysis and simulation
5. **Review Results**: Get comprehensive feedback on content readiness
6. **Iterate & Improve**: Refine content based on simulation results

### Key Features Available

- **Community Management**: Create and manage target audience profiles
- **Content Testing**: Simulate how different demographics will receive articles
- **AI Analysis**: Get detailed feedback on bias, accuracy, and engagement
- **Real-time Collaboration**: Work with editorial teams in shared workspaces

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack for fast refresh
- `npm run build` - Build production-optimized application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality and consistency

### Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Code Quality**: Follow TypeScript strict mode and ESLint guidelines
3. **Component Design**: Use Shadcn/ui components and Tailwind CSS patterns
4. **Performance**: Optimize for Core Web Vitals and fast loading
5. **Accessibility**: Ensure WCAG 2.1 AA compliance across all features

### API Routes

The application includes several API endpoints for data management:

- `/api/save-community` - Save community definitions
- `/api/get-communities` - Retrieve community profiles
- `/api/save-artifact` - Save article drafts for analysis
- `/api/get-response` - Retrieve analysis results

## 🤝 Contributing

We welcome contributions to Echo! This project represents the cutting edge of AI-powered journalism tools.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**: Use TypeScript, ESLint rules, and existing patterns
4. **Test thoroughly**: Ensure your changes work across different browsers
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**: Submit your changes for review

### Development Guidelines

- Use functional components with React hooks
- Follow the existing component structure and naming conventions
- Ensure responsive design works on all screen sizes
- Maintain accessibility standards
- Write clean, documented TypeScript code

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
