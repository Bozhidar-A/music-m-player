import firebase from 'firebase';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import IPageProps from '../interfaces/page';
import { List, arrayMove } from 'react-movable';
import { auth } from '../config/firebase';
import IAllPlaylists from '../interfaces/IAllPlaylists';
import ProfileDropdown from '../components/ProfileDropdown';
import logging from '../config/logging';
import styles from "../styles/Components.module.css"


const PlaylistPicker: React.FunctionComponent<IPageProps> = props => {
    const [playlists, setPlaylists] = useState<IAllPlaylists[]>([])

    var db = firebase.firestore()

    useEffect(() => {
        db.collection("playlists").doc(auth.currentUser?.uid).get().then(doc => {
            if(doc.exists)
            {
                setPlaylists(doc.data()!.arr)
            }
            else
            {
                doc.ref.set({arr:playlists}).then(() => logging.info("Array of playlists didn't exist. Created."));
            }
        }).catch(err => logging.error(err))
    }, [])

    useEffect(() => {
        logging.info(playlists)
    },[playlists]) 

    function EachPlaylist(props:any)
    {
        return(<div className={styles.PlaylistPickerEach}>
            <p>{props.data.name}</p>
            <Link to={{pathname:`/playlist/${props.data.docID}`}}><button type='button'>View Playlist</button></Link>
            <button onClick={() => DeletePlaylist(props.data)}>DeletePlaylist</button>
            <button onClick={() => SwitchPublicPrivate(props.data)}>Playlist is {props.data.public ? "Public" : "Private"} - Click to change that</button>
        </div>)
    }

    function DeletePlaylist(obj:any)
    {
        if(window.confirm("Are you sure you want to delete this playlist?"))
        {
            db.collection("playlists").doc(auth.currentUser?.uid).update({
                arr: firebase.firestore.FieldValue.arrayRemove(obj)
            }).then(() =>{

                //delete obj from state
                setPlaylists(arr => arr.filter(el => el !== obj))

                //firebase update
                db.collection("playlistsData").doc(obj.docID).delete().catch(err => {
                    logging.error("Failed to delete playlistsData doc on playlist delete")
                    logging.error(err)
                })
            }).catch(err => {
                alert("Failed to delete playlist!");
                logging.error(err);
            })
        }
    }

    function CreatePlaylist()
    {
        var name = prompt();
        
        if(name !== null)
        {
            db.collection("playlistsData").add({songs:[], uid:auth.currentUser?.uid, public:false}).then(doc => {

                setPlaylists(arr => [{name:name!, docID:doc.id, public:false, uid:auth.currentUser?.uid }, ...arr]);

                db.collection("playlists").doc(auth.currentUser?.uid).update({
                    arr: firebase.firestore.FieldValue.arrayUnion({name:name, docID:doc.id, public:false, uid:auth.currentUser?.uid})
                }).catch(err => {
                    logging.error("Failed to add playlist to user playlists");
                    logging.error(err);
                })

            }).catch(err => {
                alert("There was an error createing your playlist!");
                logging.error(err);
            })
        }
    }

    function SwitchPublicPrivate(obj:IAllPlaylists){
        var tmp = playlists;
        var tmpIndex = tmp.indexOf(obj)
        tmp[tmpIndex].public = !tmp[tmpIndex].public;
        setPlaylists(arr => [...tmp]);

        db.collection("playlists").doc(auth.currentUser?.uid).update({
            arr: tmp
        }).then(() => {
            logging.info("Updated playlists with new public state");

            db.collection("playlistsData").doc(obj.docID).update({public:tmp[tmpIndex].public}).then(() => {
                logging.info("Updated playlistsData with new public state");
            }).catch((err) => {
                logging.error(err)
            })

        }).catch((err) => {
            logging.error(err)
        })
    }

    return (
        <div className={styles.PlaylistPicker}>
            <ProfileDropdown></ProfileDropdown>
            <button onClick={CreatePlaylist}>Create Playlist</button>
            {playlists && <List
                    values={playlists}
                    onChange={({ oldIndex, newIndex }) =>
                        {
                            var temp:any = arrayMove(playlists, oldIndex, newIndex);
                            setPlaylists(temp);
                            
                            //I don't like this. I am rewriting the whole array instead of changing the order.
                            //TODO fix this
                            db.collection("playlists").doc(auth.currentUser?.uid).set({
                                arr: temp
                            })
                        } 
                    }
                    renderList={({ children, props }) => <ul {...props}>{children}</ul>}
                    renderItem={({ value, props }) => <div {...props}><EachPlaylist key={value.docID} data={value}/></div>}
            /> }
        </div>
    );
}

export default PlaylistPicker;

