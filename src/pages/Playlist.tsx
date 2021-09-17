import firebase from 'firebase';
import { useEffect, useRef, useState } from 'react';
import { List, arrayMove } from 'react-movable';
import ReactPlayer from 'react-player'
import IPlaylist from '../interfaces/IPlaylist';
import CORSProxyFetchChain from '../components/CORSProxyFetchChain';
import ProfileDropdown from '../components/ProfileDropdown';

function Playlist(props:any) {

  const [playlist, setPlaylist] = useState<IPlaylist[]>([])

  const [inputURL, setInputURL] = useState<string>("");
  const [reactPlayerRender, setReactPlayerRender] = useState(false);
  const [reactPlayerPlaying, setReactPlayerPlaying] = useState(true);
  const [reactPlayerVolume, setReactPlayerVolume] = useState(0.5);
  const [reactPlayerSeek, setReactPlayerSeek] = useState(0);
  const [currPlayingURL, setCurrPlayingURL] = useState("");
  const [titleCORSProxy, setTitleCORSProxy] = useState("");
  const [CORSProxStatus, setCORSProxStatus] = useState("");
  const [titleUserInput, setTitleUserInput] = useState("");
  const reactPlayerRef = useRef<any>(null);

  //firebase
  var db = firebase.firestore()

  useEffect(() => {
    db.collection("playlistsData").doc(props.location.state.docID).get().then(doc => {
      if(doc.exists)
      {
        setPlaylist(doc.data()!.songs)
      }
    }).catch(err => console.log(err))
  }, [])


  //react-player
  function HandleOnError(error:any) {
    console.log(error)
  }

  function HandleSeek(seekToVal: string)
  {
    setReactPlayerSeek(parseFloat(seekToVal)); 
    reactPlayerRef.current.seekTo(seekToVal);
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
    let titleToSet: string = "";
    if (titleCORSProxy !== "") {
      titleToSet = titleCORSProxy;
      // setPlaylist(arr => [{ url: inputURL, title: titleCORSProxy }, ...arr]);
    }
    else {
      titleToSet = titleUserInput;
      // setPlaylist(arr => [{ url: inputURL, title: titleUserInput }, ...arr]);
    }

    setPlaylist(arr => [{ url: inputURL, title: titleToSet }, ...arr]);

    setInputURL("");
    setTitleCORSProxy("");
    setTitleUserInput("");

    //update db
    db.collection("playlistsData").doc(props.location.state.docID).update({
      songs:firebase.firestore.FieldValue.arrayUnion({ url: inputURL, title: titleToSet })
    }).catch(() => {
      console.error(`Failed to updated playlist ${props.location.state.docID} with song url - ${inputURL} and title - ${titleToSet}`)
    }).then(() => {
      console.log(`Updated playlist ${props.location.state.docID} with song url - ${inputURL} and title - ${titleToSet}`)
    })
  }

  /**
 * Makes the selected URL the currPlayingURL and makes the player render.
 */
  function PlayURL(url:string) {
    console.log(`Playing url - ${url}`)
    setCurrPlayingURL(url);
    setReactPlayerRender(true);
  }

  function StopPlayingURL()
  {
    //reached end of playlist, stop
    setReactPlayerRender(false);
    setCurrPlayingURL("");
  }

  function GetPlayingIndex()
  {
    return playlist.findIndex(e => e.url === currPlayingURL);
  }

  function PlayNextURL()
  {
    let i = GetPlayingIndex();
    i++;
    
    if(i >= playlist.length)
    {
      StopPlayingURL()
    }
    else
    {
      //play next URL
      setCurrPlayingURL(playlist[i].url);
    }

  }

  function PlayPrevURL()
  {
    let i = GetPlayingIndex();
    i--;
    
    if(i <= -1)
    {
      StopPlayingURL()
    }
    else
    {
      //play prev URL
      setCurrPlayingURL(playlist[i].url);
    }
  }

  return (
    <div>
      <ProfileDropdown></ProfileDropdown>
      <div id="Player">
        <p>URL</p>
        <input value={inputURL} onChange={(e) => AttempGetURL(e.target.value)} ></input>
        <br></br>
        <p>Title</p>
        {inputURL === "" ? null : (inputURL !== "" && CORSProxStatus !== "ALL_FAILED" ? <p>Trying to resolve title...</p> : <p>We failed to resolve the title.</p>)}
        <input defaultValue={titleUserInput} onChange={(e) => setTitleUserInput(e.target.value)} placeholder={titleCORSProxy}></input>
        <button type="button" onClick={AddToPlaylist} disabled={(titleUserInput || titleCORSProxy) === "" ? true : false}>Add to playlist</button>
        <br></br>
        <div id="dnd">
          <p>start dnd</p>
          <List
            values={playlist}
            onChange={({ oldIndex, newIndex }) =>
            {console.log(playlist); setPlaylist(arrayMove(playlist, oldIndex, newIndex))}
            }
            renderList={({ children, props }) => <ul {...props}>{children}</ul>}
            renderItem={({ value, props }) => <li {...props}>{value.title} | {value.url} <button onClick={() => PlayURL(value.url)}>Play</button></li>}
          />
          <p>end dnd</p>
          <br></br>
          <div className="reactplayer">{reactPlayerRender && <ReactPlayer ref={reactPlayerRef} url={currPlayingURL} volume={reactPlayerVolume} onError={(e) => { HandleOnError(e) }} controls={true} playing={reactPlayerPlaying} onEnded={() => PlayNextURL()} onProgress={(e) => setReactPlayerSeek(e.played)}></ReactPlayer>}</div>
          {reactPlayerRender && <footer>
            <p>Volume</p>
            <input type="range" min="0" max="1" step="0.1" value={reactPlayerVolume} onChange={(e) => setReactPlayerVolume(parseFloat(e.target.value))}/>
            <p>Seek</p>
            <input type="range" min="0" max="1" step="any" value={reactPlayerSeek} onChange={(e) => HandleSeek(e.target.value)}/>
            <button onClick={() => PlayPrevURL()}>Prev</button>
            <button onClick={() => PlayNextURL()}>Next</button>
            <button onClick={() => setReactPlayerPlaying(!reactPlayerPlaying)} >{reactPlayerPlaying ? "Pause" : "Play"}</button>
          </footer>}
        </div>
      </div>
    </div>
  );
}

export default Playlist;
