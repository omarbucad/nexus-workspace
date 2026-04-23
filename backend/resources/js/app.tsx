
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

// @ts-ignore
const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

// This tells Vite about your pages so they can be imported on demand.
// Adjust the glob if your folder name casing differs (Pages vs pages).
const pages = import.meta.glob('./pages/**/*.tsx')

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: async (name) => {
        const page = pages[`./pages/${name}.tsx`]
        if (!page) {
            throw new Error(`Inertia page not found: ./pages/${name}.tsx`)
        }
        return page()
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />)
    },

    progress: {
        color: '#4B5563',
    },
})
