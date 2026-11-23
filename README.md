# Pokequiz

Test your Pokémon knowledge with multiple quiz modes and customizable difficulty levels.

---

## Table of Contents

- [Stack](#stack)
- [Features](#features)
- [How to Build and Play](#how-to-build-and-play)
- [Testing & Verification](#testing--verification)
- [Contributing](#contributing)
- [License](#license)
- [Special Thanks](#special-thanks)

---

## Stack

**Frontend:**
- [Svelte 5](https://svelte.dev/) - Reactive UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Lightning-fast build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS (with Dark Mode support)

**Backend:**
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express.js](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

## Features

- **📝 Description Quiz** - Guess the Pokémon from its Pokédex description (with word truncation & scrambling)
- **ℹ️ Information Quiz** - Guess the Pokémon from its characteristics (types, abilities, weight, height, habitat, egg group, color, shape, category, generation) with progressive hints and optional fake hints
- **🎮 Sprites Quiz** - Guess the Pokémon from its sprite image (Default, Home, Official Artwork; front/back views; blur, pixelate, silhouette, and random rotation effects)
- **🟩 Quiz Pokedle** - Wordle-style deduction game with color-coded attribute feedback and higher/lower indicators
- **🔢 Number Quiz** - Guess the National Pokédex number (1–1025) from the sprite in Normal mode (Higher/Lower hints) or 10-round Points mode (0–1,000 pts per round based on accuracy)
- **🎯 Multiple Game Modes**
  - Score / Easy / Normal Modes - 10 rounds, earn more points for fewer errors
  - Infinite Mode - Quiz without limits, keep your streak alive
  - Challenge Mode - 10 rounds with final exam-style review screen
  - Hardcore Mode - 3 lives, autocomplete input or timed progressive hints
  - Points Mode (Number Quiz) - 10 rounds, up to 10,000 points total based on distance
- **🌍 Multi-language Support** - English, French, Spanish, German, Italian, Japanese (Kanji & Hiragana), Korean, Chinese (Simplified & Traditional) with automatic English fallback
- **🌙 Dark Mode** - Toggle between light and dark themes, persisted in `localStorage`
- **🔗 URL Hash Routing** - Browser Back/Forward navigation across the hub, quiz settings, and active quizzes

![](./screenshots/Main_Page.png)
<details> <summary><b>More screenshots</b></summary>

![](./screenshots/Quiz_Settings_Description.png)
![](./screenshots/Quiz_Description_Simple.png)
![](./screenshots/Quiz_Truncated_Description.png)

</details>

---

## How to Build and Play

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/TheHyrox/Pokequiz.git
cd Pokequiz

# Install dependencies
npm install
```

### Development

Run both client and server in development mode with hot-reload:

```bash
npm run dev
```

This will start:
- **Client**: http://localhost:5173 (Vite dev server, you must go on this one)
- **Server**: http://localhost:3000 (Express server)

### Production Build

```bash
npm run build
npm start
```

---

## Testing & Verification

```bash
# Type-check the codebase
npm run check

# Run the automated end-to-end test suite
npm test

# Re-run the Pokémon data enrichment script (base stats, cries, evolution chains)
npm run enrich
```

---

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

Found a bug or have a feature request?
- [Open an issue](https://github.com/TheHyrox/Pokequiz/issues/new) with a clear description
- Include steps to reproduce bugs
- Suggest improvements and new features

### Submitting Pull Requests

Want to contribute code?
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/newquiz`)
3. Register new quizzes in `client/src/lib/quizRegistry.ts`
4. Commit your work (`git commit -m 'Add new quiz mode'`)
5. Push to your branch (`git push origin feature/newquiz`)
6. [Open a Pull Request](https://github.com/TheHyrox/Pokequiz/pulls) with a description of your changes

### Development Guidelines

- Write TypeScript
- Follow existing code structure and naming conventions
- Test your changes before submitting (`npm run check && npm test`)

---

## License

This project is licensed under the [Apache License 2.0](LICENSE) - see the LICENSE file for details.

---

## Special Thanks

- [PokéAPI](https://pokeapi.co/) for providing the Pokémon data
- [Sneaze](https://www.youtube.com/@Sneaze) for his "Starter à l'aveugle" (or "Blind pick a starter") series, which inspired the idea of these quiz
