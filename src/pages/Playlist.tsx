import firebase from 'firebase';
import { useEffect, useRef, useState } from 'react';
import { List, arrayMove } from 'react-movable';
import ReactPlayer from 'react-player'
import IPlaylistItem from '../interfaces/IPlaylistItem';
import CORSProxyFetchChain from '../components/CORSProxyFetchChain';
import ProfileDropdown from '../components/ProfileDropdown';
import styles from "../styles/Components.module.css"
import logging from '../config/logging';
import { auth } from '../config/firebase';

function Playlist(props:any) {

  const [playlist, setPlaylist] = useState<IPlaylistItem[]>([])

  const [reactPlayerRender, setReactPlayerRender] = useState(false);
  const [reactPlayerPlaying, setReactPlayerPlaying] = useState(true);
  const [reactPlayerVolume, setReactPlayerVolume] = useState(0.5);
  const [reactPlayerDuration, setReactPlayerDuration] = useState(0);
  const [reactPlayerProgress, setReactPlayerProgress] = useState(0);
  const [currPlayingElement, setCurrPlayingElement] = useState<IPlaylistItem|null>();
  const [showReactPlayer, setShowReactPlayer] = useState(false);
  const [elementToUpdate, setElementToUpdate] = useState<IPlaylistItem>();
  const [action, setAction] = useState<string|null>(null);
  const reactPlayerRef = useRef<any>(null);
  const [firebaseError, setFirebaseError] = useState(false)
  const [playlistOwner, setPlaylistOwner] = useState("")

  //firebase
  var db = firebase.firestore()

  useEffect(() => {
    db.collection("playlistsData").doc(new URL(window.location.href).pathname.split("/")[2]).get().then(doc => {
      console.log(doc.data())
      if(doc.exists)
      {
        setPlaylist(doc.data()!.songs)
        console.log(doc.data()!.uid)
        setPlaylistOwner(doc.data()!.uid)
      }
    }).catch(err => {
      console.log(err)
      logging.error(err);
      setFirebaseError(true);
    })
  }, [])

  function HandleAction()
  {
    switch (action) {
      case "new":
        return <AddSongDialog></AddSongDialog>
      case "update":
          return <UpdateSongDialog elementToUpdate={elementToUpdate!}></UpdateSongDialog>
      default:
        return <button onClick={() => setAction("new")} className={`${styles.AddBtn} ${styles.AddBtnBlack}`}>Add new song</button>;
    }
  }


  //react-player
  function HandleOnError(error:any) {
    logging.error(error)
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
      logging.info(url)
      setInputURL(url)
      setCORSProxStatus("");
      CORSProxyFetchChain(url).then(function (result:any) {
        logging.info(result)
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
      db.collection("playlistsData").doc(new URL(window.location.href).pathname.split("/")[2]).update({
        songs:firebase.firestore.FieldValue.arrayUnion({ url: inputURL, title: titleToSet })
      }).catch(() => {
        logging.error(`Failed to updated playlist ${new URL(window.location.href).pathname.split("/")[2]} with song url - ${inputURL} and title - ${titleToSet}`)
      }).then(() => {
        logging.info(`Updated playlist ${new URL(window.location.href).pathname.split("/")[2]} with song url - ${inputURL} and title - ${titleToSet}`)
      })
    }

    return(<>
        <p>URL</p>
        <input value={inputURL} onChange={(e) => AttempGetURL(e.target.value)} ></input>
        <br></br>
        <p>Title</p>
        {inputURL === "" || titleCORSProxy !== "" ? null : (inputURL !== "" && CORSProxStatus !== "ALL_FAILED" ? <p>Trying to resolve title...</p> : <p>We failed to resolve the title.</p>)}
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

      db.collection("playlistsData").doc(new URL(window.location.href).pathname.split("/")[2]).update({
        songs:tmp
      }).catch(() => {
        logging.error(`Failed to update playlist ${new URL(window.location.href).pathname.split("/")[2]} with song url - ${updatedURL} and title - ${updatedTitle} from url - ${elementToUpdate?.url} and title - ${elementToUpdate?.title}`)
      }).then(() => {
        logging.info(`Updated playlist ${new URL(window.location.href).pathname.split("/")[2]} with song url - ${updatedURL} and title - ${updatedTitle} from url - ${elementToUpdate?.url} and title - ${elementToUpdate?.title}`)
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
  function PlayURL(element:IPlaylistItem) {
    logging.info(`Playing url - ${element.url}`)
    setCurrPlayingElement(element);
    setReactPlayerRender(true);
  }

  function StopPlayingURL()
  {
    //reached end of playlist, stop
    setReactPlayerRender(false);
    setCurrPlayingElement(null);
  }

  function GetPlayingIndex()
  {
    return playlist.findIndex(e => e.url === currPlayingElement?.url);
  }

  function GetSongByURL(url:string)
  {
    return playlist.findIndex(e => e.url === url);
  }

  function GetPlayingName()
  {
    let i = GetPlayingIndex();
    i++;

    return playlist[i].title;
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
      setCurrPlayingElement(playlist[i]);
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
      setCurrPlayingElement(playlist[i]);
      setReactPlayerPlaying(true);
    }
  }

  function DeleteSong(song:IPlaylistItem)
  {
    if(window.confirm(`Are you sure you want to delete the song - ${song.title}`))
    {
      var tmp = playlist;
      tmp.splice(GetSongByURL(song.url), 1)
      setPlaylist(arr => [...tmp]);

      db.collection("playlistsData").doc(new URL(window.location.href).pathname.split("/")[2]).update({
        songs:tmp
      }).catch(() => {
        logging.error(`Failed to update playlist ${new URL(window.location.href).pathname.split("/")[2]} with deleteion of song url - ${song.url} and title - ${song.title}`)
      }).then(() => {
        logging.info(`Updated playlist ${new URL(window.location.href).pathname.split("/")[2]} with deleteion of song url - ${song.url} and title - ${song.title}`)
      })
    }
  }

  function HandleSongUpdateRequest(value:IPlaylistItem)
  {
    setElementToUpdate(value); 
    setAction("update");
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

  function FormatVolume(volume:number)
  {
    return Math.floor(volume*100);
  }

  function CheckLoggedinOwner(){
    if(auth.currentUser == null || auth.currentUser.uid !== playlistOwner){
      return true;
    }

    return false;
  }

  return (
    <>
    {firebaseError ? <p className={styles.WhiteCenteredText}>An error has occured. Please check the url you used and try again.</p>: <div className={styles.MainDivFlex}>
      <ProfileDropdown></ProfileDropdown>
      <div id="Player">
        {CheckLoggedinOwner() ? null : 
        <div id="action" className={styles.MainActionBtn}>
          <HandleAction></HandleAction>
        </div>}
        
        <div>
          {/* <p>start dnd</p> */}
          <List
              values={playlist}
              onChange={({ oldIndex, newIndex }) =>
                {
                  var temp:any = arrayMove(playlist, oldIndex, newIndex);
                  setPlaylist(temp);
                  
                  //I don't like this. I am rewriting the whole array instead of changing the order.
                  //TODO fix this
                  if(!CheckLoggedinOwner()){
                    db.collection("playlistsData").doc(new URL(window.location.href).pathname.split("/")[2]).update({
                      songs: temp
                      
                    }).catch(e => logging.error(e))
                  } 
                  
                } 
              // {setPlaylist(arrayMove(playlist, oldIndex, newIndex))}
              }
              renderList={({ children, props }) => <ul {...props}>{children}</ul>}
              renderItem={({ value, props }) => <li {...props}>{value.title}
              <button onClick={() => PlayURL(value)}>Play</button> 
              {auth.currentUser == null || auth.currentUser.uid !== playlistOwner ? null : <>
              <button onClick={() => HandleSongUpdateRequest(value)}>Update</button>
              <button onClick={() => DeleteSong(value)}>Delete</button> </>}
              {/* <DropdownBuilder value={value} PlayURL={PlayURL} HandleSongUpdateRequest={HandleSongUpdateRequest} DeleteSong={DeleteSong} className={styles.DropdownElement}></DropdownBuilder> */}
              </li>}
            />
          {/* <p>end dnd</p> */}
          <br></br>
          <div style={showReactPlayer ? undefined : {display:'none'}} id="ReactPlayer">{reactPlayerRender && <ReactPlayer 
            ref={reactPlayerRef} 
            url={currPlayingElement?.url} 
            volume={reactPlayerVolume} 
            onError={(e) => { HandleOnError(e) }} 
            controls={true} playing={reactPlayerPlaying} 
            onEnded={() => PlayNextURL()} 
            onProgress={(e) => setReactPlayerProgress(Math.floor(e.playedSeconds))} 
            onDuration={(e) => setReactPlayerDuration(e)}></ReactPlayer>}
          </div>
          {reactPlayerRender && <div id="controls" className={styles.PlaylistFooter}>
            <div className={styles.PlaylistFooterTitle}>
              <p>Playing - {currPlayingElement?.title}</p>
            </div>
            
            <div className={styles.PlaylistFooterSeek}>
              <p>Seek</p>
              <input type="range" min="0" max={reactPlayerDuration} step="any" value={reactPlayerProgress} onChange={(e) => HandleSeek(e.target.value)}/>
              <p>{FormatTime(reactPlayerProgress)}/{FormatTime(reactPlayerDuration)}</p>
            </div>

            <div className={styles.PlaylistFooterVolume}>
              <p>Volume</p>
              <input type="range" min="0" max="1" step="0.01" value={reactPlayerVolume} onChange={(e) => setReactPlayerVolume(parseFloat(e.target.value))}/>
              <p>{FormatVolume(reactPlayerVolume)}%</p>
            </div>

            <div className={styles.PlaylistFooterButtons}>
              <button onClick={() => PlayPrevURL()} disabled={GetPlayingIndex() === 0 ? true : false}>Prev</button>
              <button onClick={() => PlayNextURL()} disabled={GetPlayingIndex() === playlist.length - 1 ? true : false}>Next</button>
              <button onClick={() => setReactPlayerPlaying(!reactPlayerPlaying)} >{reactPlayerPlaying ? "Pause" : "Play"}</button>
              <button onClick={() => setShowReactPlayer(!showReactPlayer)} >{showReactPlayer ? "Hide Player" : "Show Player"}</button>
            </div>
          </div>}
        </div>
      </div>
    </div>}</>
  );
}

export default Playlist;
