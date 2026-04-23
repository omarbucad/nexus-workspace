
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

// Support both conventions: ./pages and ./Pages
const pages = {
    ...import.meta.glob('./pages/**/*.tsx'),
    ...import.meta.glob('./Pages/**/*.tsx'),
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: async (name) => {
        // Try exact match first
        const exact =
            pages[`./pages/${name}.tsx`] ||
            pages[`./Pages/${name}.tsx`]

        if (exact) return exact()

        // Try common "Welcome" vs "welcome" normalization
        const pascal = name.charAt(0).toUpperCase() + name.slice(1)

        const normalized =
            pages[`./pages/${pascal}.tsx`] ||
            pages[`./Pages/${pascal}.tsx`]

        if (normalized) return normalized()

        throw new Error(`Page not found: ${name}`)
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />)
    },

    progress: { color: '#4B5563' },
})
