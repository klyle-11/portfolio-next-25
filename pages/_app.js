import '../styles/globals.css'
import '../styles/code-theme.css'
import AdminBridge from '../components/AdminBridge'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <AdminBridge />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
