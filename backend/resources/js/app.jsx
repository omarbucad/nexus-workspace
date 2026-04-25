
import { createInertiaApp } from '@inertiajs/react'
import { PrimeReactProvider } from 'primereact/api'



const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

createInertiaApp({
    title: title => (title ? `${title} - ${appName}` : appName),

    progress: { color: '#4B5563' },

    // ✅ ONLY mount when DOM exists
    setup({ el, App, props }) {
        if (!el) return // <-- THIS FIXES YOUR ERROR

        import('react-dom/client').then(({ createRoot }) => {
            createRoot(el).render(
                <PrimeReactProvider value={{ ripple: true }}>
                    <App {...props} />
                </PrimeReactProvider>
            )
        })
    },
})
