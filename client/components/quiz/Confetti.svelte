<script lang="ts">
    /**
     * @brief Confetti animation component
     * @description Animates confetti particles falling from bottom-left corner at 45° to center
     */
    import { onMount } from 'svelte';

    interface Particle {
        id: number;
        left: number;
        top: number;
        delay: number;
        duration: number;
        rotation: number;
        size: number;
        color: string;
    }

    let particles: Particle[] = [];
    let particleId = 0;

    // Pokémon color palette
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#FFE66D', // Yellow
        '#95E1D3', // Mint
        '#F38181', // Pink
        '#AA96DA', // Purple
        '#FCBAD3', // Light Pink
        '#A8D8EA', // Light Blue
        '#FF9999', // Coral
        '#C7CEEA', // Lavender
    ];

    function createParticle(fromSide: 'left' | 'right'): Particle {
        const randomColors = colors.sort(() => Math.random() - 0.5);
        const isLeft = fromSide === 'left';
        // Left side: -10% to 10%, Right side: 90% to 110%
        const left = isLeft ? Math.random() * 20 - 10 : 90 + Math.random() * 20;
        return {
            id: particleId++,
            left: left,
            top: 100, // Start at bottom
            delay: Math.random() * 0.2, // Stagger start times
            duration: 2 + Math.random() * 1, // 2-3 seconds duration
            rotation: Math.random() * 360,
            size: 8 + Math.random() * 12, // 8-20px
            color: randomColors[0],
        };
    }

    onMount(() => {
        // Create initial burst of confetti from both sides
        const particleCount = 30;
        const newParticles: Particle[] = [];

        for (let i = 0; i < particleCount / 2; i++) {
            newParticles.push(createParticle('left'));
            newParticles.push(createParticle('right'));
        }

        particles = newParticles;

        // Add more confetti in waves
        const wave1 = setTimeout(() => {
            const moreParticles: Particle[] = [];
            for (let i = 0; i < 10; i++) {
                moreParticles.push(createParticle('left'));
                moreParticles.push(createParticle('right'));
            }
            particles = [...particles, ...moreParticles];
        }, 200);

        const wave2 = setTimeout(() => {
            const finalParticles: Particle[] = [];
            for (let i = 0; i < 7; i++) {
                finalParticles.push(createParticle('left'));
                finalParticles.push(createParticle('right'));
            }
            particles = [...particles, ...finalParticles];
        }, 400);

        return () => {
            clearTimeout(wave1);
            clearTimeout(wave2);
        };
    });
</script>

<div class="confetti-container" aria-hidden="true">
    {#each particles as particle (particle.id)}
        <div
            class="confetti-particle"
            style="
                left: {particle.left}%;
                top: {particle.top}%;
                --delay: {particle.delay}s;
                --duration: {particle.duration}s;
                --rotation: {particle.rotation}deg;
                --size: {particle.size}px;
                --color: {particle.color};
            "
        />
    {/each}
</div>

<style lang="postcss">
    .confetti-container {
        @apply fixed inset-0 pointer-events-none overflow-hidden;
        z-index: 40;
    }

    .confetti-particle {
        @apply absolute rounded-full;
        width: var(--size);
        height: var(--size);
        background-color: var(--color);
        animation: fall var(--duration) linear var(--delay) forwards;
    }

    @keyframes fall {
        0% {
            opacity: 1;
            transform: translate(0, 0) rotateZ(0deg);
        }
        100% {
            opacity: 0;
            transform: translate(calc(var(--size) * 1.5), -120vh) rotateZ(var(--rotation));
        }
    }
</style>
