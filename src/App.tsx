import { useEffect } from 'react'
import { Icon } from '@iconify-icon/react'
import cn from './App.module.css'
import { useThemeStore } from './state'
import { Palette } from './Palette'

const VERSION = '0.0.0'

function App() {
  const { theme, toggleTheme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
  }, [theme])

  const getThemeIcon = () => {
    return theme === 'light' ? 'tabler:sun-filled' : 'tabler:moon-filled'
  }

  return (
    <>
      <div className={cn['app']}>
        <div className={cn['app-header']}>
          <div className={cn['app-title']}>Mujigae 🌈</div>
          <div className={cn['app-header-right']}>
            <button
              className={cn['theme-toggle']}
              onClick={toggleTheme}
              aria-label={`Current theme: ${theme}. Click to change.`}
              title={`Current theme: ${theme}`}
            >
              <Icon icon={getThemeIcon()} width="24" height="24" />
            </button>
            <a
              className={cn['github-link']}
              href="https://github.com/dalmaki/mujigae"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
            >
              <span className={cn['app-version']}>v{VERSION}</span>
              <Icon
                className={cn['github-icon']}
                icon="tabler:brand-github-filled"
                width="24"
                height="24"
              />
            </a>
          </div>
        </div>
        <div className={cn['app-content']}>
          <Palette className={cn['app-palette']} />
          <div className={cn['app-separator']} />
          <div className={cn['app-details']}>
            <h2>About Mujigae</h2>
            <p>
              Mujigae is a simple and intuitive color palette manager designed
              to help designers and developers organize and manage their color
              schemes efficiently. Whether you're working on a web design
              project or creating graphics, Mujigae provides an easy way to
              store, edit, and visualize your color palettes.
            </p>
            <h3>Features</h3>
            <ul>
              <li>Create and manage multiple color palettes.</li>
              <li>Edit color names and descriptions inline.</li>
              <li>Drag and drop to reorder colors and palettes.</li>
              <li>
                Light and dark theme support for comfortable usage in any
                environment.
              </li>
            </ul>
            <h3>Get Involved</h3>
            <p>
              Mujigae is an open-source project. If you'd like to contribute,
              report issues, or suggest new features, please visit our GitHub
              repository linked in the header.
            </p>
            <h3>License</h3>
            <p>This project is licensed under the MIT License.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
