import React, { ReactNode } from "react";
import styled from "styled-components";
import Head from "next/head";
import Link from "next/link";
import Header from "components/header/Header";
import { useRouter } from "next/router";

interface LayoutProps {
  children?: ReactNode;
}

const Wrapper = styled.div`
  display: flex;
`;
const Contents = styled.div`
  width: 85vw;
`;

type Props = {
  children?: ReactNode;
};

const Layout = ({ children }: Props) => {
  const router = useRouter();

  return (
    <Wrapper>
      <Head>
        <title> NFT STAKING</title>
        <meta
          name="description"
          content="cuteastros is a unique collection of cute astronauts"
        />
      </Head>
      <Header />

      {/* <div className="w-full min-h-screen">
        <div className="min-w-[60vh] stats shadow flex justify-center"></div>
        <main className="min-h-[90vh] flex justify-center">{children}</main>
      </div> */}
      <Contents>{children}</Contents>
    </Wrapper>
  );
};

export default Layout;
