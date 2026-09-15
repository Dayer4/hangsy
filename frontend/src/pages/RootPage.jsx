import HomePage from './HomePage.jsx'
import DraftHangoutPage from './DraftHangoutPage.jsx'
import { isAuthenticated } from '../lib/auth.js'

// "/" shows different things depending on whether you're logged in:
// the real dashboard if you are, a save-less draft page if you're not.
export default function RootPage() {
  return isAuthenticated() ? <HomePage /> : <DraftHangoutPage />
}
