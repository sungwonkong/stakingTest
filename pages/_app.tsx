import "../styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "../components/Layout";
import { ThemeProvider } from "styled-components";
import { defaultTheme } from "styles/theme";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={defaultTheme}>
      <Layout>
        <Component {...pageProps} />
        <ToastContainer
          style={{ zIndex: 20 }}
          hideProgressBar={true}
          position="bottom-right"
        />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;
