import { useEffect, useState } from 'react';
import { List, arrayMove } from 'react-movable';
import ReactPlayer from 'react-player'
import CORSProxyFetchChain from './CORSProxyFetchChain'

function Playlist() {

  interface URLData {
    url: string,
    title: string
  }

  const [URLPlaylist, setURLPlaylist] = useState<URLData[]>([]);
  const [inputURL, setInputURL] = useState<string>("");
  const [reactPlayerRender, setReactPlayerRender] = useState(false);
  const [currPlayingURL, setCurrPlayingURL] = useState("");
  const [titleCORSProxy, setTitleCORSProxy] = useState("");
  const [CORSProxStatus, setCORSProxStatus] = useState("");
  const [titleUserInput, setTitleUserInput] = useState("");

  // useEffect(() => {
  //   console.log(URLPlaylist.findIndex(e => e.url === currPlayingURL))
  //   //playlist updated, console log the curr playing URL
  // }, [URLPlaylist])

  //react-player
  function HandleOnError(error:any) {
    console.log(error)
  }
  
  /**
 * Attempts to get the title using CORSProxyFetchChain. On fail make it an empty string, user inputs it.
 */
  function AttempGetURL(url:string) {
    console.log(url)
    setInputURL(url)
    setCORSProxStatus("");
    CORSProxyFetchChain(url).then(function (result:any) {
      console.log(result)
      if (result === "ALL_FAILED") {
        setTitleCORSProxy("");
        setCORSProxStatus("ALL_FAILED");
      }
      else {
        setTitleCORSProxy(result);
      }
    });
  }

  /**
 * Adds the title to the playlist
 */
  function AddToPlaylist() {

    //React player plays the urls. If it can't play it, don't add it
    if (!ReactPlayer.canPlay(inputURL)) {
      alert("can't play")
      return
    }

    //If the CORS title get failed add the url to the playlist with user specified title.
    if (titleCORSProxy !== "") {
      setURLPlaylist(arr => [{ url: inputURL, title: titleCORSProxy }, ...arr]);
      setInputURL("");
      setTitleCORSProxy("");
      setTitleUserInput("");
    }
    else {
      setURLPlaylist(arr => [{ url: inputURL, title: titleUserInput }, ...arr]);
      setInputURL("");
      setTitleCORSProxy("");
      setTitleUserInput("");
    }
  }

  /**
 * Makes the selected URL the currPlayingURL and makes the player render.
 */
  function PlayURL(url:string) {
    console.log(url)
    setCurrPlayingURL(url);
    setReactPlayerRender(true);
  }

  function PlayNextURL()
  {
    let currPlayingIndex = URLPlaylist.findIndex(e => e.url === currPlayingURL)
    if(currPlayingIndex === URLPlaylist.length-1)
    {
      //reached end of playlist, stop
      setReactPlayerRender(false);
      setCurrPlayingURL("");
    }
    else
    {
      //play next URL
      currPlayingIndex++;
      setCurrPlayingURL(URLPlaylist[currPlayingIndex].url);
    }
  }

  return (
    <div id="Player">
      <p>URL</p>
      <input value={inputURL} onChange={(e) => AttempGetURL(e.target.value)} ></input>
      <br></br>
      <p>Title</p>
      {inputURL === "" ? null : (inputURL !== "" && CORSProxStatus !== "ALL_FAILED" ? <p>Trying to resolve title...</p> : <p>We failed to resolve the title.</p>)}
      <input value={titleUserInput} onChange={(e) => setTitleUserInput(e.target.value)} placeholder={titleCORSProxy}></input>
      <button type="button" onClick={AddToPlaylist} disabled={(titleUserInput || titleCORSProxy) === "" ? true : false}>Add to playlist</button>
      <br></br>
      <div id="dnd">
        <a>start dnd</a>
        <List
          values={URLPlaylist}
          onChange={({ oldIndex, newIndex }) =>
            setURLPlaylist(arrayMove(URLPlaylist, oldIndex, newIndex))
          }
          renderList={({ children, props }) => <ul {...props}>{children}</ul>}
          renderItem={({ value, props }) => <li {...props}>{value.title} | {value.url} <button onClick={() => PlayURL(value.url)}>Play</button></li>}
        />
        <a>end dnd</a>
        <br></br>
        {reactPlayerRender && <ReactPlayer url={currPlayingURL} onError={(e) => { HandleOnError(e) }} controls={true} playing={true} onEnded={() => PlayNextURL()}></ReactPlayer>}
      </div>
    </div>
  );
}

export default Playlist;
