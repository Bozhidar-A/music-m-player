import firebase from 'firebase';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import IPageProps from '../interfaces/page';
import { List, arrayMove } from 'react-movable';
import { auth } from '../config/firebase';
import IAllPlaylists from '../interfaces/IAllPlaylists';
import ProfileDropdown from '../components/ProfileDropdown';


const PlaylistPicker: React.FunctionComponent<IPageProps> = props => {
    const [playlists, setPlaylists] = useState<IAllPlaylists[]>([])

    var db = firebase.firestore()

    useEffect(() => {
        db.collection("playlists").doc(auth.currentUser?.uid).get().then(doc => {
            if(doc.exists)
            {
                setPlaylists(doc.data()!.arr)
            }
        }).catch(err => console.log(err))
    }, [])

    function EachPlaylist(props:any)
    {
        return(<div>
            <p>{props.data.name}</p>
            <Link to={{pathname:`/playlist/${props.data.doc}`, state: { docID: props.data.doc} }}>View Playlist</Link>
            <button onClick={() => DeletePlaylist(props.data)}>DeletePlaylist</button>
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
                db.collection("playlistsData").doc(obj.doc).delete().catch(err => {
                    console.error("Failed to delete playlistsData doc on playlist delete")
                    console.error(err)
                })
            }).catch(err => {
                alert("Failed to delete playlist!");
                console.error(err);
            })
        }
    }

    function CreatePlaylist()
    {
        var name = prompt();
        
        if(name !== null)
        {
            db.collection("playlistsData").add({songs:[]}).then(doc => {

                setPlaylists(arr => [{name:name!, docID:doc.id}, ...arr]);

                db.collection("playlists").doc(auth.currentUser?.uid).update({
                    arr: firebase.firestore.FieldValue.arrayUnion({name:name, doc:doc.id})
                }).catch(err => {
                    console.error("Failed to add playlist to user playlists");
                    console.error(err);
                })
            }).catch(err => {
                alert("There was an error createing your playlist!");
                console.error(err);
            })
        }
    }

    return (
        <div>
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
                    renderItem={({ value, props }) => <li {...props}><EachPlaylist key={value.docID} data={value}/></li>}
            /> }
        </div>
    );
}

export default PlaylistPicker;

