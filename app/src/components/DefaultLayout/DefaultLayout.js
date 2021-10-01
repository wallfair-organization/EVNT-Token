import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import styled from "styled-components";

const DefaultLayout = ({ children }) => {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default DefaultLayout;
