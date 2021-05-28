/**
 * Attempts to get the title of URLs by using CORS proxys.
 */
 function CORSProxyFetchChain(url:string) {
  console.log("Trying api.allorigins.win...")
    return fetch(`https://api.allorigins.win/get?url=${url}`)
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelectorAll('title')[0].text;
        console.log(title)
        return title
      })
      .catch(error => {
        console.warn("api.allorigins.win FAILED!!! See the error below.")
        console.warn(error)
        console.log("Trying thingproxy.freeboard.io...")
        return fetch(`https://thingproxy.freeboard.io/fetch/${url}`)
          .then((response) => response.text())
          .then((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const title = doc.querySelectorAll('title')[0].text;
            console.log(title)
            return title
          })
          .catch(error => {
            console.warn("thingproxy.freeboard.io FAILED!!! See the error below.")
            console.warn(error)
            return "ALL_FAILED"
            //if we got to here a new CORS proxy is needed
            //https://github.com/Bozhidar-A/allOrigins
          });
      });
}
export default CORSProxyFetchChain;