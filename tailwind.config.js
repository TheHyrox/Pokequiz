/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./client/src/**/*.{html,js,svelte,ts}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
