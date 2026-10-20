import HomePage from './HomePage.jsx'
import MarketingPage from './MarketingPage.jsx'
import { isAuthenticated } from '../lib/auth.js'

// "/" shows different things depending on whether you're logged in: the
// real dashboard if you are, the marketing/story page if you're not. The
// old "try it without an account" draft builder still exists — it's just
// not the front door anymore — see /try.
export default function RootPage() {
  return isAuthenticated() ? <HomePage /> : <MarketingPage />
}
