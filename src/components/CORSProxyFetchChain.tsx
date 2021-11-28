import logging from "../config/logging";

/**
 * Attempts to get the title of URLs by using CORS proxys.
 */
 function CORSProxyFetchChain(url:string) {
  logging.info("Trying api.allorigins.win...")
    return fetch(`https://api.allorigins.win/get?url=${url}`)
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelectorAll('title')[0].text;
        logging.info(title)
        return title
      })
      .catch(error => {
        logging.warn("api.allorigins.win FAILED!!! See the error below.")
        logging.warn(error)
        logging.info("Trying thingproxy.freeboard.io...")
        return fetch(`https://thingproxy.freeboard.io/fetch/${url}`)
          .then((response) => response.text())
          .then((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const title = doc.querySelectorAll('title')[0].text;
            logging.info(title)
            return title
          })
          .catch(error => {
            logging.warn("thingproxy.freeboard.io FAILED!!! See the error below.")
            logging.warn(error)
            return "ALL_FAILED"
            //if we got to here a new CORS proxy is needed
            //https://github.com/Bozhidar-A/allOrigins
          });
      });
}
export default CORSProxyFetchChain;