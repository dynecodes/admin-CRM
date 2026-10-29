import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const mainContainer = document.getElementById("main-scroll-container");

    if (mainContainer) {
      mainContainer.scrollTo(0, 0);
    }
    setTimeout(() => {
      if (mainContainer) {
        mainContainer.scrollTo(0, 0);
      }
    }, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;