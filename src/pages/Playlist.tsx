import firebase from 'firebase';
import { useEffect, useRef, useState } from 'react';
import { List, arrayMove } from 'react-movable';
import ReactPlayer from 'react-player'
import IPlaylistItem from '../interfaces/IPlaylistItem';
import CORSProxyFetchChain from '../components/CORSProxyFetchChain';
import ProfileDropdown from '../components/ProfileDropdown';
import "../styles/Playlist.css"

function Playlist(props:any) {

  const [playlist, setPlaylist] = useState<IPlaylistItem[]>([])

  const [reactPlayerRender, setReactPlayerRender] = useState(false);
  const [reactPlayerPlaying, setReactPlayerPlaying] = useState(true);
  const [reactPlayerVolume, setReactPlayerVolume] = useState(0.5);
  const [reactPlayerDuration, setReactPlayerDuration] = useState(0);
  const [reactPlayerProgress, setReactPlayerProgress] = useState(0);
  const [currPlayingURL, setCurrPlayingURL] = useState("");
  const [showReactPlayer, setShowReactPlayer] = useState(false);
  const [elementToUpdate, setElementToUpdate] = useState<IPlaylistItem>();
  const [action, setAction] = useState<string|null>(null);
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

  function HandleAction()
  {
    switch (action) {
      case "new":
        return <AddSongDialog></AddSongDialog>
      case "update":
          return <UpdateSongDialog elementToUpdate={elementToUpdate!}></UpdateSongDialog>
      default:
        return <button onClick={() => setAction("new")}>Add new song</button>;
    }
  }


  //react-player
  function HandleOnError(error:any) {
    console.log(error)
  }

  function HandleSeek(seekToVal: string)
  {
    setReactPlayerProgress(parseInt(seekToVal)); 
    reactPlayerRef.current.seekTo(seekToVal);
  }

  function AddSongDialog()
  {
    const [inputURL, setInputURL] = useState<string>("");
    const [titleCORSProxy, setTitleCORSProxy] = useState("");
    const [CORSProxStatus, setCORSProxStatus] = useState("");
    const [titleUserInput, setTitleUserInput] = useState("");
    

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
      if (!ReactPlayer.canPlay(inputURL) || GetSongByURL(inputURL) !== -1) {
        alert("The URL cannot be played or it already exists in this playlist")
        return
      }
  
      //If the CORS title get failed add the url to the playlist with user specified title.
      let titleToSet: string = "";
      if (titleCORSProxy !== "" && titleUserInput === "") {
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

    return(<>
        <p>URL</p>
        <input value={inputURL} onChange={(e) => AttempGetURL(e.target.value)} ></input>
        <br></br>
        <p>Title</p>
        {inputURL === "" ? null : (inputURL !== "" && CORSProxStatus !== "ALL_FAILED" ? <p>Trying to resolve title...</p> : <p>We failed to resolve the title.</p>)}
        <input defaultValue={titleUserInput} onChange={(e) => setTitleUserInput(e.target.value)} placeholder={titleCORSProxy}></input>
        <button type="button" onClick={() => {AddToPlaylist(); setAction(null)}} disabled={(titleUserInput || titleCORSProxy) === "" ? true : false}>Add to playlist</button>
        <button type="button" onClick={() => setAction(null)}>Cancel</button>
        <br></br>
    </>)
  }

  function UpdateSongDialog({elementToUpdate}:{elementToUpdate:IPlaylistItem})
  {
    const [updatedURL, setUpdatedURL] = useState(elementToUpdate?.url);
    const [updatedTitle, setUpdatedTitle] = useState(elementToUpdate?.title);

    if(elementToUpdate === undefined)
    {
      return(<p>Something has gone terrbly worng. Please refresh the page.</p>)
    }

    function UpdateSong()
    {
      var tmp = playlist;
      tmp[GetSongByURL(elementToUpdate!.url)] = {url:updatedURL!,title:updatedTitle!};
      setPlaylist(arr => [...tmp]);

      db.collection("playlistsData").doc(props.location.state.docID).update({
        songs:tmp
      }).catch(() => {
        console.error(`Failed to update playlist ${props.location.state.docID} with song url - ${updatedURL} and title - ${updatedTitle} from url - ${elementToUpdate?.url} and title - ${elementToUpdate?.title}`)
      }).then(() => {
        console.log(`Updated playlist ${props.location.state.docID} with song url - ${updatedURL} and title - ${updatedTitle} from url - ${elementToUpdate?.url} and title - ${elementToUpdate?.title}`)
      })
    }

    return(<>
      <p>URL</p>
      <input value={updatedURL} onChange={(e) => setUpdatedURL(e.target.value)} ></input>
      <br></br>
      <p>Title</p>
      <input defaultValue={updatedTitle} onChange={(e) => setUpdatedTitle(e.target.value)}></input>
      <button type="button" onClick={() => {UpdateSong(); setAction(null)}}>Update</button>
      <button type="button" onClick={() => setAction(null)}>Cancel</button>
      <br></br>
  </>)
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

  function GetSongByURL(url:string)
  {
    return playlist.findIndex(e => e.url === url);
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
      setReactPlayerPlaying(true);
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
      setReactPlayerPlaying(true);
    }
  }

  function FormatTime(seconds:number)
  {
    //if less then an hour display MM:SS
    if(seconds < 3600)
    {
      return new Date(seconds * 1000).toISOString().substr(14, 5)
    }
    else//else display HH:MM:SS
    {
      return new Date(seconds * 1000).toISOString().substr(11, 8);
    }
  }

  return (
    <div>
      <ProfileDropdown></ProfileDropdown>
      <div id="Player">
        {/* <AddSongDialog></AddSongDialog> */}
        <div id="action">
          <HandleAction></HandleAction>
        </div>
        
        <div id="dnd">
          <p>start dnd</p>
          <List
            values={playlist}
            onChange={({ oldIndex, newIndex }) =>
            {console.log(playlist); setPlaylist(arrayMove(playlist, oldIndex, newIndex))}
            }
            renderList={({ children, props }) => <ul {...props}>{children}</ul>}
            renderItem={({ value, props }) => <li {...props}>{value.title} | {value.url} 
            <button onClick={() => PlayURL(value.url)}>Play</button> 
            <button onClick={() => {setElementToUpdate(value); setAction("update")}}>Update</button>
            </li>}
          />
          <p>end dnd</p>
          <br></br>
          <div className={showReactPlayer ? "block" : "hidden"} id="ReactPlayer">{reactPlayerRender && <ReactPlayer 
            ref={reactPlayerRef} 
            url={currPlayingURL} 
            volume={reactPlayerVolume} 
            onError={(e) => { HandleOnError(e) }} 
            controls={true} playing={reactPlayerPlaying} 
            onEnded={() => PlayNextURL()} 
            onProgress={(e) => setReactPlayerProgress(Math.floor(e.playedSeconds))} 
            onDuration={(e) => setReactPlayerDuration(e)}></ReactPlayer>}
          </div>
          {reactPlayerRender && <footer id="controls">
            <p>Volume</p>
            <input type="range" min="0" max="1" step="0.1" value={reactPlayerVolume} onChange={(e) => setReactPlayerVolume(parseFloat(e.target.value))}/>
            <p>Seek</p>
            <input type="range" min="0" max={reactPlayerDuration} step="any" value={reactPlayerProgress} onChange={(e) => HandleSeek(e.target.value)}/>
            <p>{FormatTime(reactPlayerProgress)}/{FormatTime(reactPlayerDuration)}</p>
            <button onClick={() => PlayPrevURL()} disabled={GetPlayingIndex() === 0 ? true : false}>Prev</button>
            <button onClick={() => PlayNextURL()} disabled={GetPlayingIndex() === playlist.length - 1 ? true : false}>Next</button>
            <button onClick={() => setReactPlayerPlaying(!reactPlayerPlaying)} >{reactPlayerPlaying ? "Pause" : "Play"}</button>
            <button onClick={() => setShowReactPlayer(!showReactPlayer)} >{showReactPlayer ? "Hide Player" : "Show Player"}</button>
          </footer>}
        </div>
      </div>
    </div>
  );
}

export default Playlist;
